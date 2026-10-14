import requests
import io
import cv2
import numpy as np

# create a dummy image
img = np.zeros((100, 200, 3), dtype=np.uint8)
cv2.putText(img, "TEST", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
is_success, buffer = cv2.imencode(".jpg", img)
io_buf = io.BytesIO(buffer)

try:
    res = requests.post("http://localhost:8000/api/v1/recognize", files={"file": ("test.jpg", io_buf, "image/jpeg")})
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
