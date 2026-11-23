import os
import json
import random
import urllib.request
import urllib.parse
from PIL import Image, ImageEnhance, ImageFilter

STREETLIGHT_DIR = 'ml_service/dataset/train/streetlight'
os.makedirs(STREETLIGHT_DIR, exist_ok=True)

USER_IMG_PATH = r'C:/Users/nimba/.gemini/antigravity/brain/8ab79401-f068-4f72-93c7-3eea9742967b/.user_uploaded/media_1795420054153_1933a9e8.webp'

SEARCH_QUERIES = [
    'broken streetlight',
    'damaged street light',
    'broken street lamp',
    'damaged lamp post',
    'streetlight',
    'street light fixture',
    'street lamp post',
    'lantern street light',
    'road lighting pole',
    'public lighting',
]

def fetch_wikimedia_images(query, max_images=20):
    url = f'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&srlimit={max_images}&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'CivicReporterML/1.0 (devendra@example.com)'})
    titles = []
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('query', {}).get('search', [])
            titles = [r['title'] for r in results if not r['title'].lower().endswith('.svg') and not r['title'].lower().endswith('.pdf') and not r['title'].lower().endswith('.tif')]
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
                        if thumb:
                            image_urls.append(thumb)
        except Exception:
            continue
    return image_urls

def download_images():
    count = len(os.listdir(STREETLIGHT_DIR))
    print(f"Current streetlight images: {count}")
    
    # Save user image first
    if os.path.exists(USER_IMG_PATH):
        try:
            img = Image.open(USER_IMG_PATH).convert('RGB')
            img.save(os.path.join(STREETLIGHT_DIR, 'user_broken_streetlight_base.jpg'), 'JPEG')
            print("Saved user uploaded broken streetlight image.")
        except Exception as e:
            print("Failed saving user image:", e)

    total_downloaded = 0
    for q in SEARCH_QUERIES:
        print(f"Searching Wikimedia for: '{q}'...")
        urls = fetch_wikimedia_images(q, max_images=15)
        print(f"  Found {len(urls)} candidates.")
        for u in urls:
            fname = f"wiki_streetlight_{total_downloaded:04d}.jpg"
            fpath = os.path.join(STREETLIGHT_DIR, fname)
            if os.path.exists(fpath):
                continue
            try:
                req = urllib.request.Request(u, headers={'User-Agent': 'CivicReporterML/1.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                    with open(fpath, 'wb') as f:
                        f.write(data)
                # Verify it's a valid image
                with Image.open(fpath) as im:
                    im.verify()
                total_downloaded += 1
                if total_downloaded % 10 == 0:
                    print(f"  Downloaded {total_downloaded} images...")
            except Exception:
                if os.path.exists(fpath):
                    try: os.remove(fpath)
                    except: pass
                continue
        if total_downloaded >= 70:
            break

    print(f"Total downloaded streetlight images: {total_downloaded}")

def augment_streetlights():
    """Create diverse augmentations for streetlight images, especially the user's broken streetlight."""
    print("Augmenting streetlight dataset...")
    files = [f for f in os.listdir(STREETLIGHT_DIR) if f.endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    print(f"Base streetlight images: {len(files)}")
    
    user_file = os.path.join(STREETLIGHT_DIR, 'user_broken_streetlight_base.jpg')
    if os.path.exists(user_file):
        base_img = Image.open(user_file).convert('RGB')
        for i in range(25):
            # Variety of crops, flips, brightness, contrast
            w, h = base_img.size
            crop_box = (
                random.randint(0, int(w * 0.15)),
                random.randint(0, int(h * 0.15)),
                random.randint(int(w * 0.85), w),
                random.randint(int(h * 0.85), h),
            )
            aug = base_img.crop(crop_box)
            if random.random() > 0.5:
                aug = aug.transpose(Image.FLIP_LEFT_RIGHT)
            if random.random() > 0.5:
                angle = random.uniform(-15, 15)
                aug = aug.rotate(angle, expand=True)
            enhancer = ImageEnhance.Brightness(aug)
            aug = enhancer.enhance(random.uniform(0.7, 1.3))
            enhancer = ImageEnhance.Contrast(aug)
            aug = enhancer.enhance(random.uniform(0.7, 1.3))
            aug.save(os.path.join(STREETLIGHT_DIR, f'user_broken_aug_{i}.jpg'), 'JPEG')

    # Also augment other streetlight images
    for f in files:
        if 'aug' in f:
            continue
        try:
            im = Image.open(os.path.join(STREETLIGHT_DIR, f)).convert('RGB')
            # Flip
            im_flip = im.transpose(Image.FLIP_LEFT_RIGHT)
            im_flip.save(os.path.join(STREETLIGHT_DIR, f'aug_flip_{f}'), 'JPEG')
            # Slight rotation
            im_rot = im.rotate(random.choice([-10, 10]), expand=True)
            im_rot.save(os.path.join(STREETLIGHT_DIR, f'aug_rot_{f}'), 'JPEG')
        except Exception:
            continue

    final_count = len(os.listdir(STREETLIGHT_DIR))
    print(f"Final streetlight image count: {final_count}")

if __name__ == '__main__':
    download_images()
    augment_streetlights()
