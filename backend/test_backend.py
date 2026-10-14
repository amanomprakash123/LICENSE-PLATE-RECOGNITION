import unittest
import os
import io
import cv2
import numpy as np
from fastapi.testclient import TestClient

from main import app
from config import settings

class TestLPRBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_check(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")

    def test_02_system_stats(self):
        response = self.client.get("/api/v1/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_processed", data)
        self.assertIn("high_confidence_rate", data)

    def test_03_vehicles_list(self):
        response = self.client.get("/api/v1/vehicles")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) >= 0)

    def test_04_plate_recognition(self):
        # Create a synthetic plate image
        img = np.full((200, 500, 3), (100, 100, 100), dtype=np.uint8)
        cv2.rectangle(img, (100, 50), (400, 150), (255, 255, 255), -1)
        cv2.putText(img, "ABC1234", (130, 120), cv2.FONT_HERSHEY_DUPLEX, 1.8, (0, 0, 0), 4)
        _, buffer = cv2.imencode(".jpg", img)
        
        response = self.client.post(
            "/api/v1/recognize",
            files={"file": ("test_plate.jpg", buffer.tobytes(), "image/jpeg")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("plate_text", data)
        self.assertIn("confidence", data)
        self.assertIn("original_image_url", data)
        self.assertIn("crop_image_url", data)
        self.assertIn("annotated_image_url", data)

    def test_05_history_and_csv(self):
        response = self.client.get("/api/v1/history")
        self.assertEqual(response.status_code, 200)
        records = response.json()
        self.assertTrue(len(records) > 0)
        
        # Test correction
        record_id = records[0]["id"]
        corr_res = self.client.put(
            f"/api/v1/history/{record_id}/correct",
            json={"corrected_text": "CORRECTED123"}
        )
        self.assertEqual(corr_res.status_code, 200)
        self.assertEqual(corr_res.json()["plate_text"], "CORRECTED123")

        # Test CSV Export
        csv_res = self.client.get("/api/v1/history/export/csv")
        self.assertEqual(csv_res.status_code, 200)
        self.assertIn("ID,Plate Text", csv_res.text)

if __name__ == "__main__":
    unittest.main()
