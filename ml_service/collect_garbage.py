import os
import json
import random
import urllib.request
import urllib.parse
from PIL import Image, ImageEnhance, ImageFilter

GARBAGE_TRASH_DIR = 'ml_service/dataset/train/garbage_trash'
GARBAGE_PLASTIC_DIR = 'ml_service/dataset/train/garbage_plastic'
os.makedirs(GARBAGE_TRASH_DIR, exist_ok=True)
os.makedirs(GARBAGE_PLASTIC_DIR, exist_ok=True)

USER_GARBAGE_PATH = r'C:/Users/nimba/.gemini/antigravity/brain/8ab79401-f068-4f72-93c7-3eea9742967b/.user_uploaded/media_1795429928873_d5332acc.webp'

SEARCH_QUERIES = [
    ('street garbage dump', GARBAGE_TRASH_DIR),
    ('roadside trash pile', GARBAGE_TRASH_DIR),
    ('roadside garbage', GARBAGE_TRASH_DIR),
    ('overflowing garbage bin street', GARBAGE_TRASH_DIR),
    ('garbage heap street', GARBAGE_TRASH_DIR),
    ('waste dump roadside', GARBAGE_TRASH_DIR),
    ('litter street dump', GARBAGE_TRASH_DIR),
    ('municipal waste street', GARBAGE_TRASH_DIR),
    ('street plastic litter', GARBAGE_PLASTIC_DIR),
    ('plastic bottles roadside trash', GARBAGE_PLASTIC_DIR),
    ('plastic waste pile street', GARBAGE_PLASTIC_DIR),
    ('plastic debris road', GARBAGE_PLASTIC_DIR)
]

def fetch_wikimedia_images(query, max_images=25):
    url = f'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&srlimit={max_images}&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'CivicReporterML/1.0 (devendra@example.com)'})
    titles = []
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('query', {}).get('search', [])
            titles = [r['title'] for r in results if not r['title'].lower().endswith(('.svg', '.pdf', '.tif', '.webm', '.ogg'))]
    except Exception as e:
        print(f"Search failed for '{query}': {e}")
        return []

    image_urls = []
    for title in titles:
        info_url = f'https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json'
        req2 = urllib.request.Request(info_url, headers={'User-Agent': 'CivicReporterML/1.0 (devendra@example.com)'})
        try:
            with urllib.request.urlopen(req2, timeout=8) as r2:
                d2 = json.loads(r2.read().decode('utf-8'))
                pages = d2.get('query', {}).get('pages', {})
                for p in pages.values():
                    if 'imageinfo' in p and len(p['imageinfo']) > 0:
                        thumb = p['imageinfo'][0].get('thumburl') or p['imageinfo'][0].get('url')
                        if thumb and not thumb.lower().endswith(('.svg', '.pdf', '.tif')):
                            image_urls.append(thumb)
        except Exception:
            continue
    return image_urls

def augment_image(base_img, target_dir, prefix, num_variations=15):
    w, h = base_img.size
    for i in range(num_variations):
        aug = base_img.copy()
        
        # Random crop (70% - 95% of area)
        crop_w = int(w * random.uniform(0.7, 0.95))
        crop_h = int(h * random.uniform(0.7, 0.95))
        left = random.randint(0, w - crop_w)
        top = random.randint(0, h - crop_h)
        aug = aug.crop((left, top, left + crop_w, top + crop_h))
        
        # Horizontal flip
        if random.random() > 0.5:
            aug = aug.transpose(Image.FLIP_LEFT_RIGHT)
            
        # Slight rotation
        angle = random.uniform(-15, 15)
        aug = aug.rotate(angle, resample=Image.BICUBIC, expand=False)
        
        # Color adjustments
        enhancer = ImageEnhance.Brightness(aug)
        aug = enhancer.enhance(random.uniform(0.75, 1.25))
        
        enhancer = ImageEnhance.Contrast(aug)
        aug = enhancer.enhance(random.uniform(0.8, 1.25))
        
        enhancer = ImageEnhance.Color(aug)
        aug = enhancer.enhance(random.uniform(0.8, 1.2))
        
        aug = aug.resize((300, 300), Image.Resampling.LANCZOS)
        out_path = os.path.join(target_dir, f"{prefix}_aug_{i:03d}.jpg")
        aug.save(out_path, "JPEG", quality=90)

def main():
    print("Collecting and enriching garbage dataset...")
    
    # 1. Process User Uploaded Image
    if os.path.exists(USER_GARBAGE_PATH):
        try:
            user_img = Image.open(USER_GARBAGE_PATH).convert('RGB')
            base_trash = os.path.join(GARBAGE_TRASH_DIR, 'user_street_garbage_base.jpg')
            user_img.save(base_trash, 'JPEG', quality=95)
            print("Saved user uploaded street garbage base image.")
            
            # Augment into garbage_trash (40 variations)
            augment_image(user_img, GARBAGE_TRASH_DIR, 'user_garbage_trash', num_variations=40)
            print("Generated 40 augmentations in garbage_trash.")
            
            # Also augment into garbage_plastic (20 variations since pile has bags & bottles)
            augment_image(user_img, GARBAGE_PLASTIC_DIR, 'user_garbage_plastic', num_variations=20)
            print("Generated 20 augmentations in garbage_plastic.")
        except Exception as e:
            print(f"Error handling user image: {e}")
            
    # 2. Fetch images from Wikimedia Commons
    downloaded_files = []
    for query, target_dir in SEARCH_QUERIES:
        print(f"Searching Wikimedia for: '{query}'...")
        urls = fetch_wikimedia_images(query, max_images=20)
        print(f"  Found {len(urls)} image candidate URLs")
        
        idx = len(os.listdir(target_dir))
        success = 0
        for u in urls:
            try:
                req = urllib.request.Request(u, headers={'User-Agent': 'CivicReporterML/1.0 (devendra@example.com)'})
                with urllib.request.urlopen(req, timeout=8) as r:
                    content = r.read()
                    
                import io
                img = Image.open(io.BytesIO(content)).convert('RGB')
                if img.size[0] >= 150 and img.size[1] >= 150:
                    filename = f"wiki_{query.replace(' ', '_')}_{idx:04d}.jpg"
                    fpath = os.path.join(target_dir, filename)
                    img.save(fpath, 'JPEG', quality=88)
                    downloaded_files.append((fpath, target_dir))
                    idx += 1
                    success += 1
            except Exception:
                continue
        print(f"  Downloaded {success} valid images to {target_dir}")
        
    # 3. Augment some of the newly downloaded real-world images
    print("\nAugmenting downloaded real-world street garbage samples...")
    for fpath, target_dir in downloaded_files[:30]:
        try:
            img = Image.open(fpath).convert('RGB')
            base_name = os.path.splitext(os.path.basename(fpath))[0]
            augment_image(img, target_dir, f"aug_{base_name}", num_variations=4)
        except Exception:
            continue
            
    print("\nDataset update complete:")
    for d in [GARBAGE_TRASH_DIR, GARBAGE_PLASTIC_DIR]:
        print(f"  - {d}: {len(os.listdir(d))} images")

if __name__ == '__main__':
    main()
