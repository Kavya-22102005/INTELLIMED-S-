"""
IntelliMed AI - Real YOLO-based Pill Detection Backend Service
FastAPI service to run genuine YOLO object detection on pill images using trained weights (e.g. best.pt).
"""

import os
import io
import time
import argparse
from typing import Dict, Any, List, Optional
from PIL import Image

try:
    from fastapi import FastAPI, File, UploadFile, Form, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
except ImportError:
    FastAPI = None
    CORSMiddleware = None
    HTTPException = Exception

# Initialize FastAPI app
app = FastAPI(
    title="IntelliMed YOLO Pill Detection Inference API",
    description="Real YOLO inference service for pharmaceutical pill, tablet, and packaging detection.",
    version="1.0.0",
)

if CORSMiddleware and app:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Model configuration
DEFAULT_WEIGHTS_PATHS = [
    os.path.join(os.path.dirname(__file__), "best.pt"),
    os.path.join(os.path.dirname(__file__), "..", "best.pt"),
    "best.pt",
    "yolov8n.pt",
]

MODEL = None
MODEL_PATH = None
MODEL_CLASSES: Dict[int, str] = {}
MODEL_DEVICE = "cpu"


def find_available_weights() -> Optional[str]:
    """Finds best.pt or any configured YOLO weights file."""
    for path in DEFAULT_WEIGHTS_PATHS:
        if os.path.isfile(path):
            return os.path.abspath(path)
    return None


def load_yolo_model(weights_path: Optional[str] = None) -> bool:
    """Attempts to load Ultralytics YOLO model from weights path."""
    global MODEL, MODEL_PATH, MODEL_CLASSES, MODEL_DEVICE
    
    target_path = weights_path or find_available_weights()
    if not target_path or not os.path.isfile(target_path):
        MODEL = None
        MODEL_PATH = target_path
        return False

    try:
        from ultralytics import YOLO
        import torch

        MODEL_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        MODEL = YOLO(target_path)
        MODEL_PATH = target_path
        
        # Preserve genuine model class names mapping
        if hasattr(MODEL, "names") and isinstance(MODEL.names, dict):
            MODEL_CLASSES = MODEL.names
        elif hasattr(MODEL, "names") and isinstance(MODEL.names, list):
            MODEL_CLASSES = {i: name for i, name in enumerate(MODEL.names)}
        else:
            MODEL_CLASSES = {}
            
        print(f"[IntelliMed YOLO] Successfully loaded model from {target_path} on {MODEL_DEVICE}")
        print(f"[IntelliMed YOLO] Model classes ({len(MODEL_CLASSES)}): {MODEL_CLASSES}")
        return True
    except ImportError:
        print("[IntelliMed YOLO] Error: 'ultralytics' package is not installed. Run: pip install ultralytics")
        MODEL = None
        return False
    except Exception as e:
        print(f"[IntelliMed YOLO] Failed to load model weights from {target_path}: {e}")
        MODEL = None
        return False


# Attempt automatic load on module load
load_yolo_model()


@app.get("/")
def root():
    return {
        "service": "IntelliMed AI - Real YOLO Pill Detection Service",
        "status": "online",
        "model_loaded": MODEL is not None,
        "model_path": MODEL_PATH,
    }


@app.get("/status")
@app.get("/health")
def health_status():
    """Returns model health, active weights file, device, and class mapping."""
    weights_found = find_available_weights()
    is_loaded = MODEL is not None
    
    return {
        "service": "IntelliMed AI YOLO Inference Service",
        "online": True,
        "model_loaded": is_loaded,
        "weights_file": MODEL_PATH or weights_found or "best.pt",
        "weights_found_on_disk": weights_found is not None,
        "device": MODEL_DEVICE,
        "classes_count": len(MODEL_CLASSES),
        "class_mapping": MODEL_CLASSES,
        "instructions": (
            "Model is active and ready for inference."
            if is_loaded
            else "Weights 'best.pt' not found. Place your trained weights file 'best.pt' in the 'backend/' directory and run 'pip install ultralytics' to activate genuine YOLO inference."
        ),
    }


@app.post("/predict")
async def predict_pill_image(
    file: Optional[UploadFile] = File(None),
    confidence_threshold: float = Form(0.25),
):
    """
    Runs genuine YOLO inference on the uploaded image.
    Returns real bounding boxes, detected class names, confidence scores, and instance counts.
    """
    if MODEL is None:
        # Check if weights file became available since start
        if not load_yolo_model():
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "YOLO model weights 'best.pt' not loaded.",
                    "missing_file": "best.pt",
                    "expected_location": os.path.abspath(DEFAULT_WEIGHTS_PATHS[0]),
                    "instructions": "Place your trained model weights 'best.pt' in the backend folder and restart backend server.",
                },
            )

    if not file:
        raise HTTPException(status_code=400, detail="No image file provided for inference.")

    try:
        # Read image bytes
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_width, img_height = pil_image.size

        start_time = time.time()
        
        # Run real inference with ultralytics YOLO
        results = MODEL.predict(
            source=pil_image,
            conf=confidence_threshold,
            device=MODEL_DEVICE,
            verbose=False,
        )
        
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        boxes_list: List[Dict[str, Any]] = []
        counts_per_class: Dict[str, int] = {}

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            
            if boxes is not None:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    
                    class_name = MODEL_CLASSES.get(cls_id, f"class_{cls_id}")
                    
                    # Update counts
                    counts_per_class[class_name] = counts_per_class.get(class_name, 0) + 1
                    
                    boxes_list.append({
                        "classId": cls_id,
                        "className": class_name,
                        "confidence": round(conf * 100, 1),
                        "confidenceRaw": round(conf, 4),
                        "bbox": [round(coord, 1) for coord in xyxy],
                        # Also normalized coords for easy responsive overlay
                        "normalizedBbox": [
                            round(xyxy[0] / img_width, 4),
                            round(xyxy[1] / img_height, 4),
                            round(xyxy[2] / img_width, 4),
                            round(xyxy[3] / img_height, 4),
                        ],
                    })

        return {
            "success": True,
            "model": f"YOLO ({os.path.basename(MODEL_PATH or 'best.pt')})",
            "inferenceTimeMs": elapsed_ms,
            "device": MODEL_DEVICE,
            "imageDimensions": {"width": img_width, "height": img_height},
            "totalPillsDetected": len(boxes_list),
            "countsPerClass": counts_per_class,
            "boxes": boxes_list,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error processing image with YOLO: {str(e)}",
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start IntelliMed YOLO Inference Service")
    parser.add_argument("--host", default="0.0.0.0", help="Host address (default 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port (default 8000)")
    parser.add_argument("--weights", default=None, help="Path to best.pt weights file")
    args = parser.parse_args()

    if args.weights:
        load_yolo_model(args.weights)

    try:
        import uvicorn
        print(f"[IntelliMed YOLO] Starting server at http://{args.host}:{args.port}")
        uvicorn.run(app, host=args.host, port=args.port)
    except ImportError:
        print("[IntelliMed YOLO] 'uvicorn' is required. Run: pip install uvicorn")
