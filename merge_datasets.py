import os
import shutil
import pandas as pd

def process_split(split):
    csv_path = f'ml_service/new_dataset/{split}/_classes.csv'
    img_dir = f'ml_service/new_dataset/{split}/'
    dest_base_dir = f'ml_service/dataset/train/' # Put all into train, we use random_split anyway
    
    if not os.path.exists(csv_path):
        return

    df = pd.read_csv(csv_path)
    classes = df.columns[1:].tolist()
    
    for cls in classes:
        os.makedirs(os.path.join(dest_base_dir, f'garbage_{cls}'), exist_ok=True)
        
    for index, row in df.iterrows():
        filename = row['filename']
        # Find the first class that is marked as 1
        labels = [cls for cls in classes if row[cls] == 1]
        if labels:
            first_label = labels[0]
            src = os.path.join(img_dir, filename)
            dst = os.path.join(dest_base_dir, f'garbage_{first_label}', filename)
            if os.path.exists(src):
                shutil.copy(src, dst)

print("Merging new garbage dataset into the main dataset folder...")
process_split('train')
process_split('valid')
process_split('test')

# Also delete the old general "garbage" folder to avoid confusion if it exists
old_garbage = 'ml_service/dataset/train/garbage'
if os.path.exists(old_garbage):
    print("Deleting old general 'garbage' folder...")
    shutil.rmtree(old_garbage)

print("Merge complete! Current classes in dataset:")
print(os.listdir('ml_service/dataset/train/'))
