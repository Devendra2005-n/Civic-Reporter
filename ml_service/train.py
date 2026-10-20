import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, random_split

# Configuration
DATA_DIR = 'dataset' # Only need to organize your data into: dataset/train/pothole, dataset/train/garbage, etc.
MODEL_SAVE_PATH = 'civic_model.pth'
CLASSES_SAVE_PATH = 'classes.json'
BATCH_SIZE = 32
NUM_EPOCHS = 5

def train_model():
    print("Initializing PyTorch Training Script...")
    
    train_dir = os.path.join(DATA_DIR, 'train')
    if not os.path.exists(train_dir):
        print(f"Error: Dataset directory '{train_dir}' not found.")
        print("Please create the dataset directory and organize images by class (e.g., dataset/train/pothole/).")
        return

    # Base transforms (we will apply train/val transforms dynamically or just use one for simplicity since we split randomly)
    # For a robust setup, you'd define custom datasets to apply different transforms, but random_split is easier for beginners
    data_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load dataset
    full_dataset = datasets.ImageFolder(train_dir, transform=data_transform)
    class_names = full_dataset.classes
    num_classes = len(class_names)
    print(f"Found {num_classes} classes: {class_names}")

    # Save classes to JSON so app.py knows the mapping
    with open(CLASSES_SAVE_PATH, 'w') as f:
        json.dump(class_names, f)

    # 80-20 Split
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    # The num_workers=0 is safer for Windows to avoid multiprocessing crashes
    dataloaders = {
        'train': DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0),
        'val': DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    }
    
    dataset_sizes = {'train': len(train_dataset), 'val': len(val_dataset)}
    print(f"Training on {dataset_sizes['train']} images, validating on {dataset_sizes['val']} images.")

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    # Load pre-trained ResNet18
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    
    # Modify the final layer
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    model = model.to(device)

    # Loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)

    # Training Loop
    for epoch in range(NUM_EPOCHS):
        print(f'Epoch {epoch}/{NUM_EPOCHS - 1}')
        print('-' * 10)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for i, (inputs, labels) in enumerate(dataloaders[phase]):
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

                if i % 10 == 0:
                    print(f'Batch {i}/{len(dataloaders[phase])} - Loss: {loss.item():.4f}')

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

    # Save the model
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")
    print(f"Classes saved to {CLASSES_SAVE_PATH}. You can now start app.py!")

if __name__ == '__main__':
    train_model()
