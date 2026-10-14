import cv2
import pytesseract
import numpy as np
import os
import re
import uuid
import logging
import urllib.request
from ultralytics import YOLO
from config import settings

logger = logging.getLogger(__name__)

# Configure Tesseract path
if os.path.exists(settings.TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
    logger.info(f"Configured Tesseract OCR path: {settings.TESSERACT_CMD}")
else:
    logger.warning(f"Tesseract executable not found at {settings.TESSERACT_CMD}.")

YOLO_PLATE_WEIGHTS_URL = "https://raw.githubusercontent.com/MuhammadSafian/YOLO-License-plate-Detection-Model/main/best.pt"

class LPRPipeline:
    def __init__(self, model_name: str = "license_plate_yolov8.pt"):
        self.model = None
        self.haarcascade = None
        
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.SAMPLES_DIR, exist_ok=True)

        model_full_path = os.path.join(os.path.dirname(__file__), model_name)
        
        # 1. Automatically download trained license-plate detector weights if missing
        if not os.path.exists(model_full_path):
            try:
                logger.info(f"Downloading dedicated License Plate YOLO weights to {model_full_path}...")
                urllib.request.urlretrieve(YOLO_PLATE_WEIGHTS_URL, model_full_path)
                logger.info("Successfully downloaded license plate detector weights!")
            except Exception as e:
                logger.warning(f"Could not auto-download license plate weights: {e}")
                # Fallback to yolov8n.pt if present
                fallback = os.path.join(os.path.dirname(__file__), "yolov8n.pt")
                if os.path.exists(fallback):
                    model_full_path = fallback

        # Load YOLO Model
        try:
            if os.path.exists(model_full_path):
                self.model = YOLO(model_full_path)
                logger.info(f"Loaded YOLO Plate Model: {model_full_path}")
        except Exception as e:
            logger.warning(f"Could not initialize YOLO model: {e}")

        # Haar cascade fallback
        try:
            cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_russian_plate_number.xml")
            if not os.path.exists(cascade_path):
                cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_license_plate_rus_16stages.xml")
            if os.path.exists(cascade_path):
                self.haarcascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            pass

    def _clean_plate_text(self, text: str) -> str:
        """Removes symbols and returns alphanumeric plate characters."""
        return re.sub(r'[^A-Z0-9]', '', text.upper())

    def _perform_ocr_on_crop(self, plate_crop):
        """
        Runs multi-mode OCR on the plate crop:
        - Scaled for clear font definition
        - Grayscale, CLAHE contrast enhancement, Bilateral smoothing
        - Multiple PSM modes (6 for blocks/multi-line, 7 for single line, 8 for single word)
        """
        if plate_crop.size == 0:
            return "", 0.0

        h, w = plate_crop.shape[:2]
        if h < 50 or w < 100:
            scale = max(2.0, 70.0 / max(h, 1))
            plate_crop = cv2.resize(plate_crop, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        
        # Preprocessing variants
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(gray)
        smoothed = cv2.bilateralFilter(clahe, 9, 50, 50)
        
        _, otsu = cv2.threshold(smoothed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        adapt = cv2.adaptiveThreshold(smoothed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 3)

        variants = [smoothed, otsu, adapt]
        padded_variants = []
        for img_var in variants:
            # Invert if dark background
            if cv2.countNonZero(img_var) < (img_var.shape[0] * img_var.shape[1] / 2):
                img_var = cv2.bitwise_not(img_var)
            padded = cv2.copyMakeBorder(img_var, 8, 8, 8, 8, cv2.BORDER_CONSTANT, value=[255, 255, 255])
            padded_variants.append(padded)

        configs = ['--psm 6', '--psm 7', '--psm 8', '--psm 11']
        best_text = ""
        best_conf = 0.0

        for var_img in padded_variants:
            for psm in configs:
                try:
                    data = pytesseract.image_to_data(var_img, config=psm, output_type=pytesseract.Output.DICT)
                    words = []
                    confs = []
                    for i in range(len(data['text'])):
                        w_text = self._clean_plate_text(data['text'][i])
                        c_val = float(data['conf'][i])
                        if w_text and c_val > 0:
                            words.append(w_text)
                            confs.append(c_val)

                    cand = "".join(words)
                    avg_c = (sum(confs) / len(confs) / 100.0) if confs else 0.0

                    # Standard plate length is 4 to 10 characters
                    if 4 <= len(cand) <= 10 and avg_c > best_conf:
                        best_text = cand
                        best_conf = avg_c
                    elif len(cand) >= 3 and not best_text:
                        best_text = cand
                        best_conf = max(avg_c, 0.50)
                except Exception:
                    pass

        # Fallback raw string pass
        if not best_text:
            for psm in configs[:2]:
                try:
                    raw = pytesseract.image_to_string(padded_variants[0], config=psm)
                    clean = self._clean_plate_text(raw)
                    if 3 <= len(clean) <= 10:
                        best_text = clean
                        best_conf = 0.55
                        break
                except Exception:
                    pass

        return best_text, round(best_conf, 2)

    def process_image(self, image_bytes: bytes) -> dict:
        """Processes raw image bytes, runs dedicated plate detection + OCR, draws annotations."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image file format or corrupted image")

        h_img, w_img = img.shape[:2]
        candidates = []

        # 1. TOP PRIORITY: Dedicated License Plate YOLO Detection
        if self.model is not None:
            try:
                results = self.model(img, verbose=False)[0]
                for box in results.boxes:
                    det_conf = float(box.conf[0])
                    if det_conf >= 0.25:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                        w, h = x2 - x1, y2 - y1
                        if w > 20 and h > 10:
                            candidates.append((x1, y1, w, h, "yolo_plate", det_conf))
            except Exception as e:
                logger.warning(f"YOLO inference error: {e}")

        # 2. FALLBACK: Haar Cascade Plate Detector
        if not candidates and self.haarcascade is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            plates = self.haarcascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 20))
            for (x, y, w, h) in plates:
                aspect = float(w) / float(h)
                if 1.8 <= aspect <= 6.0:
                    candidates.append((x, y, w, h, "haar_plate", 0.6))

        # 3. FALLBACK: Morphological Contour Plate Detector
        if not candidates:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
            gradX = cv2.Sobel(clahe, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
            gradX = np.absolute(gradX)
            minV, maxV = np.min(gradX), np.max(gradX)
            if maxV > minV:
                gradX = (255 * ((gradX - minV) / (maxV - minV))).astype("uint8")
            
            gradX = cv2.GaussianBlur(gradX, (5, 5), 0)
            thresh = cv2.morphologyEx(gradX, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (21, 5)))
            _, thresh = cv2.threshold(thresh, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                x, y, w, h = cv2.boundingRect(c)
                aspect = float(w) / float(h)
                area = w * h
                if 2.0 <= aspect <= 6.0 and 800 <= area <= (h_img * w_img * 0.3):
                    candidates.append((x, y, w, h, "morph_plate", 0.5))

        # 4. FALLBACK: Full Image (for tight plate crops)
        if not candidates:
            margin_x, margin_y = int(w_img * 0.05), int(h_img * 0.05)
            candidates.append((margin_x, margin_y, w_img - 2*margin_x, h_img - 2*margin_y, "direct_image", 0.4))

        # Sort candidates: YOLO plate detections first, highest detector confidence
        candidates = sorted(candidates, key=lambda c: (1 if "yolo" in c[4] else 0, c[5]), reverse=True)

        best_detection = None
        for (x, y, w, h, source, det_conf) in candidates:
            # Clamp boundaries with small 5% margin around the plate
            pad_w = int(w * 0.05)
            pad_h = int(h * 0.05)
            cx1 = max(0, x - pad_w)
            cy1 = max(0, y - pad_h)
            cx2 = min(w_img, x + w + pad_w)
            cy2 = min(h_img, y + h + pad_h)

            crop = img[cy1:cy2, cx1:cx2]
            text, ocr_conf = self._perform_ocr_on_crop(crop)

            # Accept detection if plate text is reasonable
            if text and 3 <= len(text) <= 12:
                best_detection = {
                    "text": text,
                    "confidence": ocr_conf if ocr_conf > 0 else det_conf,
                    "bbox": [cx1, cy1, cx2, cy2],
                    "crop": crop,
                    "source": source
                }
                break

        # Fallback if text could not be read
        if not best_detection:
            x, y, w, h, src, c = candidates[0]
            crop = img[y:y+h, x:x+w]
            best_detection = {
                "text": "UNKNOWN",
                "confidence": 0.0,
                "bbox": [x, y, x + w, y + h],
                "crop": crop,
                "source": "fallback"
            }

        # Generate persistent files
        file_id = str(uuid.uuid4())[:8]
        orig_filename = f"original_{file_id}.jpg"
        crop_filename = f"crop_{file_id}.jpg"
        annotated_filename = f"annotated_{file_id}.jpg"

        orig_path = os.path.join(settings.UPLOAD_DIR, orig_filename)
        crop_path = os.path.join(settings.UPLOAD_DIR, crop_filename)
        annotated_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)

        cv2.imwrite(orig_path, img)
        cv2.imwrite(crop_path, best_detection["crop"])

        # Create annotated image
        annotated_img = img.copy()
        x1, y1, x2, y2 = best_detection["bbox"]
        plate_text = best_detection["text"]
        conf_pct = int(best_detection["confidence"] * 100)

        box_color = (0, 255, 0) if best_detection["confidence"] >= 0.5 else (0, 165, 255)
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), box_color, 3)

        label_text = f"{plate_text} ({conf_pct}%)"
        (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        cv2.rectangle(
            annotated_img, 
            (x1, max(0, y1 - text_h - 10)), 
            (x1 + text_w + 10, max(text_h + 10, y1)), 
            box_color, 
            -1
        )
        cv2.putText(
            annotated_img, 
            label_text, 
            (x1 + 5, max(text_h + 2, y1 - 5)), 
            cv2.FONT_HERSHEY_SIMPLEX, 
            0.7, 
            (0, 0, 0), 
            2
        )

        cv2.imwrite(annotated_path, annotated_img)

        return {
            "status": "success",
            "plate_text": plate_text,
            "confidence": best_detection["confidence"],
            "bbox": best_detection["bbox"],
            "original_image_url": f"/static/{orig_filename}",
            "crop_image_url": f"/static/{crop_filename}",
            "annotated_image_url": f"/static/{annotated_filename}"
        }

pipeline = LPRPipeline()
