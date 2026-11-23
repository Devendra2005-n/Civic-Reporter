import os
import json
import random
import shutil
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, Subset, random_split

DATA_DIR = 'ml_service/dataset/train'
MODEL_SAVE_PATH = 'ml_service/civic_model.pth'
CLASSES_SAVE_PATH = 'ml_service/classes.json'
ONNX_SAVE_PATH = 'ml_service/civic_model.onnx'
BACKEND_ML_DIR = 'backend/ml'

BATCH_SIZE = 32
NUM_EPOCHS = 6
MAX_PER_CLASS = 320  # Balances dataset so pothole (4300) doesn't drown out other classes

def train_and_export():
    print("=" * 60)
    print("Starting Enhanced Civic Issue ML Model Training...")
    print("=" * 60)

    # 1. Transforms
    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 2. Load dataset
    full_dataset = datasets.ImageFolder(DATA_DIR, transform=train_transform)
    class_names = full_dataset.classes
    num_classes = len(class_names)
    print(f"Discovered {num_classes} classes: {class_names}")

    # Build balanced subset indices
    targets = full_dataset.targets
    class_to_indices = {i: [] for i in range(num_classes)}
    for idx, target in enumerate(targets):
        class_to_indices[target].append(idx)

    selected_indices = []
    print("\nSamples per class (balanced subset):")
    for i, name in enumerate(class_names):
        indices = class_to_indices[i]
        sampled = random.sample(indices, min(len(indices), MAX_PER_CLASS))
        selected_indices.extend(sampled)
        print(f"  - {name}: {len(sampled)} / {len(indices)} images")

    random.shuffle(selected_indices)
    print(f"\nTotal balanced dataset size: {len(selected_indices)} images")

    # Split 80/20 train/val
    split_idx = int(0.8 * len(selected_indices))
    train_indices = selected_indices[:split_idx]
    val_indices = selected_indices[split_idx:]

    train_subset = Subset(datasets.ImageFolder(DATA_DIR, transform=train_transform), train_indices)
    val_subset = Subset(datasets.ImageFolder(DATA_DIR, transform=val_transform), val_indices)

    dataloaders = {
        'train': DataLoader(train_subset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0),
        'val': DataLoader(val_subset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    }
    dataset_sizes = {'train': len(train_subset), 'val': len(val_subset)}

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    # 3. Model Architecture: Pre-trained ResNet18
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.002, momentum=0.9, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    # 4. Training Loop
    for epoch in range(NUM_EPOCHS):
        print(f"\nEpoch {epoch + 1}/{NUM_EPOCHS}")
        print("-" * 25)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == 'train':
                scheduler.step()

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]
            print(f"{phase.upper()} Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f}")

    # 5. Save PyTorch model and classes
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"\n[OK] PyTorch weights saved to: {MODEL_SAVE_PATH}")

    with open(CLASSES_SAVE_PATH, 'w') as f:
        json.dump(class_names, f)
    print(f"[OK] Class labels saved to: {CLASSES_SAVE_PATH}")

    # 6. Export to ONNX
    print("\nExporting to ONNX format...")
    model.eval()
    dummy_input = torch.randn(1, 3, 224, 224, device=device)
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_SAVE_PATH,
        dynamo=False,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
    )
    onnx_size_mb = os.path.getsize(ONNX_SAVE_PATH) / (1024 * 1024)
    print(f"[OK] Exported ONNX model ({onnx_size_mb:.1f} MB) to: {ONNX_SAVE_PATH}")

    # 7. Sync to backend/ml
    os.makedirs(BACKEND_ML_DIR, exist_ok=True)
    shutil.copy(ONNX_SAVE_PATH, os.path.join(BACKEND_ML_DIR, 'civic_model.onnx'))
    shutil.copy(CLASSES_SAVE_PATH, os.path.join(BACKEND_ML_DIR, 'classes.json'))
    print(f"[OK] Synchronized model & classes to: {BACKEND_ML_DIR}")

if __name__ == '__main__':
    train_and_export()
