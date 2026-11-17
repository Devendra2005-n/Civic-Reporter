"""
Run this ONCE locally to convert civic_model.pth -> civic_model.onnx
Uses the legacy TorchScript-based exporter (dynamo=False) for compatibility.

Usage:
    python convert_to_onnx.py
"""

import json
import os
import sys

# Force UTF-8 output on Windows to avoid emoji encoding errors
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import torch
import torch.nn as nn
from torchvision import models

MODEL_SAVE_PATH = "civic_model.pth"
ONNX_SAVE_PATH  = "civic_model.onnx"
CLASSES_SAVE_PATH = "classes.json"

# Load class names
NUM_CLASSES = 4
CLASS_NAMES = ["pothole", "garbage", "streetlight", "other"]

if os.path.exists(CLASSES_SAVE_PATH):
    with open(CLASSES_SAVE_PATH, "r") as f:
        CLASS_NAMES = json.load(f)
        NUM_CLASSES = len(CLASS_NAMES)
        print(f"Loaded {NUM_CLASSES} classes: {CLASS_NAMES}")

# Recreate model structure and load weights
print("Loading PyTorch model...")
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, NUM_CLASSES)
model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location="cpu"))
model.eval()

# Dummy input — same shape as training (batch=1, 3ch, 224x224)
dummy_input = torch.randn(1, 3, 224, 224)

print(f"Exporting to ONNX (legacy exporter): {ONNX_SAVE_PATH} ...")

# Use dynamo=False for the stable legacy TorchScript-based exporter
torch.onnx.export(
    model,
    dummy_input,
    ONNX_SAVE_PATH,
    dynamo=False,           # legacy exporter — no onnxscript needed
    export_params=True,
    opset_version=17,
    do_constant_folding=True,
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={
        "input":  {0: "batch_size"},
        "output": {0: "batch_size"},
    },
)

size_mb = os.path.getsize(ONNX_SAVE_PATH) / 1024 / 1024
print(f"[OK] Exported to {ONNX_SAVE_PATH}")
print(f"     File size: {size_mb:.1f} MB")
print("")
print("Next steps:")
print("  git add ml_service/civic_model.onnx ml_service/app.py ml_service/requirements.txt")
print("  git commit -m 'fix: switch ML service to ONNX runtime to fix OOM on Render free tier'")
print("  git push")
