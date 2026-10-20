import os
import io
import json
import requests
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_SAVE_PATH = 'civic_model.pth'
CLASSES_SAVE_PATH = 'classes.json'

# Default values if classes.json doesn't exist
NUM_CLASSES = 4
CLASS_NAMES = ['pothole', 'garbage', 'streetlight', 'other']

# Try to load custom classes if available
if os.path.exists(CLASSES_SAVE_PATH):
    try:
        with open(CLASSES_SAVE_PATH, 'r') as f:
            CLASS_NAMES = json.load(f)
            NUM_CLASSES = len(CLASS_NAMES)
            print(f"Loaded {NUM_CLASSES} classes from config: {CLASS_NAMES}")
    except Exception as e:
        print(f"Warning: Could not load {CLASSES_SAVE_PATH}: {e}")

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model = None

# Initialize the model structure
try:
    print("Loading PyTorch model structure...")
    model = models.resnet18(weights=None)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, NUM_CLASSES)
    
    if os.path.exists(MODEL_SAVE_PATH):
        # Allow loading weights even if original NUM_CLASSES doesn't match perfectly,
        # but it will crash if the saved model has a different final layer shape.
        model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location=device))
        print(f"Successfully loaded trained weights from {MODEL_SAVE_PATH}")
    else:
        print(f"Warning: Trained weights '{MODEL_SAVE_PATH}' not found!")
        print("Using random weights. Predictions will be inaccurate until you run train.py!")
        
    model = model.to(device)
    model.eval()
except Exception as e:
    print(f"Error initializing model: {e}")

# Define the image transformations (must match validation transforms in train.py)
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def predict_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0).to(device) # create a mini-batch as expected by the model

        with torch.no_grad():
            output = model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            
            # Get the top predicted class
            top_prob, top_class = torch.max(probabilities, 0)
            
            return {
                "problemType": CLASS_NAMES[top_class.item()],
                "confidence": top_prob.item(),
                "all_probabilities": {CLASS_NAMES[i]: probabilities[i].item() for i in range(NUM_CLASSES)}
            }
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

@app.route('/predict', methods=['POST'])
def predict_endpoint():
    data = request.json
    image_url = data.get("imageUrl")
    if image_url.startswith("http://localhost:"):
        image_url = image_url.replace("http://localhost:", "http://127.0.0.1:")
    
    if not image_url:
        return jsonify({"error": "No imageUrl provided"}), 400
        
    print(f"Analyzing image: {image_url}")
    
    try:
        # Download the image (disable SSL verify to avoid local cert issues)
        response = requests.get(image_url, verify=False)
        response.raise_for_status()
        
        # Run inference
        prediction = predict_image(response.content)
        
        if prediction:
            # Add imageValidation structure to match what Node.js expects
            prediction["imageValidation"] = {
                "isValid": True if prediction["problemType"] != "other" else False,
                "reason": f"PyTorch Model predicted {prediction['problemType']} with {prediction['confidence']:.2%} confidence",
                "detectedContent": f"Custom ML Classification: {prediction['problemType']}"
            }
            
            # Assign severity based on confidence as a simple heuristic
            prediction["severity"] = "High" if prediction["confidence"] > 0.8 else "Medium"
            
            print(f"Prediction result: {prediction['problemType']} ({prediction['confidence']:.2%})")
            return jsonify(prediction)
        else:
            return jsonify({"error": "Failed to analyze image"}), 500
            
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "running", "model_loaded": model is not None})

if __name__ == '__main__':
    print("Starting PyTorch Microservice on port 5001...")
    app.run(host='0.0.0.0', port=5001)
