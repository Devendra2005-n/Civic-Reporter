import os
import io
import json
import requests
import numpy as np
import onnxruntime as ort
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ONNX_MODEL_PATH = 'civic_model.onnx'
CLASSES_SAVE_PATH = 'classes.json'

# Default classes
CLASS_NAMES = ['pothole', 'garbage', 'streetlight', 'other']
NUM_CLASSES = 4

# Load custom class names if available
if os.path.exists(CLASSES_SAVE_PATH):
    try:
        with open(CLASSES_SAVE_PATH, 'r') as f:
            CLASS_NAMES = json.load(f)
            NUM_CLASSES = len(CLASS_NAMES)
            print(f"Loaded {NUM_CLASSES} classes from config: {CLASS_NAMES}")
    except Exception as e:
        print(f"Warning: Could not load {CLASSES_SAVE_PATH}: {e}")

# Load ONNX model
session = None
try:
    if os.path.exists(ONNX_MODEL_PATH):
        print(f"Loading ONNX model from {ONNX_MODEL_PATH}...")
        session = ort.InferenceSession(ONNX_MODEL_PATH, providers=['CPUExecutionProvider'])
        print("ONNX model loaded successfully!")
    else:
        print(f"WARNING: ONNX model '{ONNX_MODEL_PATH}' not found!")
except Exception as e:
    print(f"Error loading ONNX model: {e}")

# ImageNet normalization constants (must match training)
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def preprocess_image(image_bytes):
    """Resize, crop, normalize image — matches torchvision validation transforms."""
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    # Resize shortest side to 256
    w, h = image.size
    if h < w:
        new_h, new_w = 256, int(w * 256 / h)
    else:
        new_h, new_w = int(h * 256 / w), 256
    image = image.resize((new_w, new_h), Image.BILINEAR)

    # Center crop to 224x224
    left   = (new_w - 224) // 2
    top    = (new_h - 224) // 2
    image  = image.crop((left, top, left + 224, top + 224))

    # To float numpy array [0,1], shape (224, 224, 3)
    img_arr = np.array(image, dtype=np.float32) / 255.0

    # Normalize with ImageNet mean/std
    img_arr = (img_arr - MEAN) / STD

    # HWC -> CHW -> NCHW
    img_arr = img_arr.transpose(2, 0, 1)          # (3, 224, 224)
    img_arr = np.expand_dims(img_arr, axis=0)      # (1, 3, 224, 224)

    return img_arr

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def predict_image(image_bytes):
    try:
        input_arr = preprocess_image(image_bytes)

        # Run inference
        input_name = session.get_inputs()[0].name
        outputs    = session.run(None, {input_name: input_arr})
        logits     = outputs[0][0]  # shape: (NUM_CLASSES,)

        probs      = softmax(logits)
        top_class  = int(np.argmax(probs))
        top_prob   = float(probs[top_class])

        return {
            "problemType":       CLASS_NAMES[top_class],
            "confidence":        top_prob,
            "all_probabilities": {CLASS_NAMES[i]: float(probs[i]) for i in range(NUM_CLASSES)},
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return None


@app.route('/predict', methods=['POST'])
def predict_endpoint():
    data      = request.json
    image_url = data.get("imageUrl", "")

    if not image_url:
        return jsonify({"error": "No imageUrl provided"}), 400

    # Fix localhost URL for local testing
    if image_url.startswith("http://localhost:"):
        image_url = image_url.replace("http://localhost:", "http://127.0.0.1:")

    print(f"Analyzing image: {image_url}")

    try:
        response = requests.get(image_url, verify=False, timeout=15)
        response.raise_for_status()

        prediction = predict_image(response.content)

        if prediction:
            prediction["imageValidation"] = {
                "isValid":         prediction["problemType"] != "other",
                "reason":          f"ONNX Model predicted {prediction['problemType']} with {prediction['confidence']:.2%} confidence",
                "detectedContent": f"Custom ML Classification: {prediction['problemType']}",
            }
            prediction["severity"] = "High" if prediction["confidence"] > 0.8 else "Medium"

            print(f"Prediction: {prediction['problemType']} ({prediction['confidence']:.2%})")
            return jsonify(prediction)
        else:
            return jsonify({"error": "Failed to analyze image"}), 500

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status":       "running",
        "model_loaded": session is not None,
        "runtime":      "onnxruntime",
        "classes":      CLASS_NAMES,
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting ONNX Microservice on port {port}...")
    app.run(host='0.0.0.0', port=port)
