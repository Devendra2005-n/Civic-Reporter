import sys
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json

MODEL_PATH = 'ml_service/civic_model.pth'
CLASSES_PATH = 'ml_service/classes.json'

with open(CLASSES_PATH, 'r') as f:
    class_names = json.load(f)
num_classes = len(class_names)

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, num_classes)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

image_path = sys.argv[1]
image = Image.open(image_path).convert('RGB')
input_tensor = preprocess(image)
input_batch = input_tensor.unsqueeze(0).to(device)

with torch.no_grad():
    output = model(input_batch)
    probabilities = torch.nn.functional.softmax(output[0], dim=0)
    top_prob, top_class = torch.max(probabilities, 0)
    print(f"Prediction: {class_names[top_class.item()]} ({top_prob.item():.2%})")
    for i, cls in enumerate(class_names):
        print(f" - {cls}: {probabilities[i].item():.2%}")
