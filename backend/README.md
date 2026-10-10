# IntelliMed AI — Real YOLO Pill Detection Backend

This service provides genuine YOLO object detection inference for pharmaceutical pills, tablets, and prescription packaging.

## Setup Requirements

1. **Install Python Dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Place Model Weights (`best.pt`):**
   Place your trained YOLO model file `best.pt` inside this directory:
   ```
   backend/best.pt
   ```

3. **Start the Inference Server:**
   ```bash
   python backend/yolo_inference_service.py --port 8000
   ```
   Or using uvicorn:
   ```bash
   uvicorn backend.yolo_inference_service:app --host 0.0.0.0 --port 8000
   ```

4. **Verify Health:**
   ```bash
   curl http://localhost:8000/status
   ```

5. **API Endpoints:**
   - `GET /status`: Reports whether `best.pt` is loaded, class names mapping from model (`model.names`), and compute device (CPU/CUDA).
   - `POST /predict`: Accepts multipart form image file (`file`) and optional `confidence_threshold` (default 0.25). Returns real bounding boxes `[x1, y1, x2, y2]`, real class IDs and names, model confidence scores, and counted instances per class.
