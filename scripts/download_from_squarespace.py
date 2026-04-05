"""
Download photos from Squarespace CSV export and upload to Supabase.

Usage:
  python3 ~/myca/scripts/download_from_squarespace.py
"""

import csv
import os
import json
import urllib.request
import urllib.error
import time
import ssl

CSV_PATH = os.path.expanduser("~/Downloads/sqaurespace_export_myca.csv")
PHOTOS_DIR = os.path.expanduser("~/Desktop/myca-photos")
SUPABASE_URL = "https://nxeadvobyctultjbkcon.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZWFkdm9ieWN0dWx0amJrY29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyNzY2NiwiZXhwIjoyMDkwNDAzNjY2fQ.nMd37iAJJXnBtiQvf8dusf5R0AbNFsZvsoNrAbXRhY4"
BUCKET = "photos"

COOKIE = "SS_ANALYTICS_ID=44795479-027c-45d5-99df-0bc08d8970a6; ss_i18n=%7B%22language%22%3A%22en-US%22%2C%22currency%22%3A%22USD%22%7D; _gcl_au=1.1.1040362541.1773623511; _fbp=fb.1.1773623510962.991825331988278869; _pin_unauth=dWlkPU1EYzBOVE13TURRdFpXVmlOUzAwTXpBNUxUazVOMlF0TjJNeFpUUmhNbUppTlRZdw; IR_PI=1d0c3ca7-20d5-11f1-a5a8-a3c47f3ca096%7C1773623510893; _ga=GA1.1.1591960876.1773623511; member-session=1|QzmVlHWYLM+3nwCkurquN4IEZqkO8L+zBVbHAxz++kjK|AI+xzavRjeUlOA064PH18BKlKScci+t4XnrXwWIvCZA=; __stripe_mid=87d7e437-01f7-410b-9b7e-2d97a9b67e6dfa05ba; crumb=kpomnRjMcigvaodRcKtIaoszbu/i/GyYiYzLIeitMaRY; SS_SESSION_ID=825de3ed-9f36-4c44-bfb6-4d8c3c56d493; notice_behavior=implied,us; IR_gbd=squarespace.com; _derived_epik=dj0yJnU9U1VHMU52aEY2a3dxbmQ5cGJJVC15WVlPZHdMUGpudC0mbj1tdmppYlN5aTVscXM3cG1tTGlwVVlRJm09MSZ0PUFBQUFBR25TejNjJnJtPTEmcnQ9QUFBQUFHblN6M2Mmc3A9Mg; _gcl_aw=GCL.1775423352.Cj0KCQjwkMjOBhC5ARIsADIdb3egNo7CZWYmdrgHylrGHcOZox5s3nKwLojZofaqKSNvlFAmFoF0sXkaAmBSEALw_wcB; _gcl_dc=GCL.1775423352.Cj0KCQjwkMjOBhC5ARIsADIdb3egNo7CZWYmdrgHylrGHcOZox5s3nKwLojZofaqKSNvlFAmFoF0sXkaAmBSEALw_wcB; _gcl_gs=2.1.k1$i1775423349$u46467109; SS_MID=07caabb6-7eae-4c5c-bc76-8acfd7b5bc79; notice_behavior=implied,us; seven_one_migration_preview_message_seen=; ss_lastid=eyJpZGVudGlmaWVyIjoiZ29sZGZpc2gtd2F0ZXJtZWxvbi05N21hIn0%3D; __stripe_sid=4eeb15a4-95de-4cc9-9442-7d9e9e729f90bfeccf; _pin_unauth=dWlkPU1EYzBOVE13TURRdFpXVmlOUzAwTXpBNUxUazVOMlF0TjJNeFpUUmhNbUppTlRZdw; cf_clearance=QJFnEwjNTu9NigX2wfXhcpFyrfiK_u490hpzvtZgzno-1775425538-1.2.1.1-nnpOXqnoM723kCjTgQl8.uvrhr.6T.Cb3rwvVOAigNLAB_VFg9dVT6UWVZLd1MxR4rwYalDleHjIBb4eCWq0AYRW7GMRZ181kcA4zkTONY62wehDrguKPO9JXiJb1Uz_OAkd25hXSi8Pt.y8GHP5caDJ5Pf1yxtK4gg0W_fyBwO76fawe8V3kozvZ1d0nxKYuYO4H2mWD.zHx93297171GrUIN7VtBCbfR5H1mCOvECu5nBqY0jRt5._MZwDXgFATiGfGj9cpDrIcgjGMbqS2mipqLSpSQl3xvZZrawvTCjpWvIzvFyiUj_ZIsKVvV2bYpKtnnkmDF.JVReDmrbYYg; TAsessionID=036d430e-c0ff-41fc-8787-52fa3da7f110|NEW; tfpsi=fa0dc55d-5f6c-4e6e-b814-831075d90a08; _ga_E5RVG86DKP=GS2.1.s1775425538$o1$g0$t1775425547$j60$l0$h0; _rdt_uuid=1773623510853.67d2b680-d6b6-45bd-b512-c814ef81289e; _derived_epik=dj0yJnU9SkZ5OFVYUWNqTGV2NEM3Y29fc2RiV0RCZWo3Z1dpYVcmbj1DTlJXUkxTNkFDM0NMdjJkNnpyVk9BJm09MSZ0PUFBQUFBR25TMlhJJnJtPTEmcnQ9QUFBQUFHblMyWEkmc3A9Mg; seven_frame_expanded=true; _uetsid=b18a8f00313311f1be4b1b76fe7eafc1; _uetvid=1cdd69b020d511f1a4406b85ba6a7a5c; IR_9084=1775426181248%7C1332152%7C1775426181248%7C%7C; _ga_1L8CXRNJCG=GS2.1.s1775423351$o2$g1$t1775426181$j59$l0$h0"

def slugify(name):
    import re
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def download_photo(url, dest, cookie):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url)
    req.add_header('Cookie', cookie)
    req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        data = resp.read()
        if len(data) < 500:
            print(f"    Too small ({len(data)} bytes), skipping")
            return False
        # Check magic bytes
        if data[:2] == b'\xff\xd8':
            ext = 'jpg'
        elif data[:4] == b'\x89PNG':
            ext = 'png'
        elif data[:4] == b'RIFF':
            ext = 'webp'
        elif data[:3] == b'GIF':
            ext = 'gif'
        else:
            print(f"    Not a valid image (first bytes: {data[:4]})")
            return False
        # Fix extension
        if not dest.endswith(f'.{ext}'):
            dest = dest.rsplit('.', 1)[0] + f'.{ext}'
        with open(dest, 'wb') as f:
            f.write(data)
        print(f"    OK ({len(data)//1024}KB, {ext}) -> {os.path.basename(dest)}")
        return True
    except Exception as e:
        print(f"    Error: {e}")
        return False

def upload_to_supabase(filepath, filename):
    with open(filepath, 'rb') as f:
        data = f.read()

    # Detect content type
    if data[:2] == b'\xff\xd8':
        ct = 'image/jpeg'
    elif data[:4] == b'\x89PNG':
        ct = 'image/png'
    elif data[:4] == b'RIFF':
        ct = 'image/webp'
    else:
        ct = 'image/jpeg'

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
    req.add_header('apikey', SUPABASE_KEY)
    req.add_header('Content-Type', ct)
    req.add_header('x-upsert', 'true')

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return True
    except urllib.error.HTTPError as e:
        print(f"    Upload error: {e.code} {e.read().decode()[:100]}")
        return False

def update_contact(email, photo_url):
    url = f"{SUPABASE_URL}/rest/v1/contacts?email=eq.{urllib.parse.quote(email)}"
    data = json.dumps({"photo_url": photo_url}).encode()
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
    req.add_header('apikey', SUPABASE_KEY)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Prefer', 'return=minimal')
    try:
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        print(f"    DB update error: {e}")
        return False

def main():
    import urllib.parse

    print("=== Myca Photo Sync (Squarespace -> Supabase) ===\n")

    os.makedirs(PHOTOS_DIR, exist_ok=True)
    print(f"Photos folder: {PHOTOS_DIR}\n")

    # Read CSV
    rows = []
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            rows.append(row)

    print(f"Found {len(rows)} submissions in CSV\n")

    downloaded = 0
    uploaded = 0
    skipped = 0
    failed = 0

    for row in rows:
        name = row.get('Name', '').strip()
        email = row.get('What is your email (so members can connect)', '').strip()
        photo_url = row.get('Please upload a photo of yourself!', '').strip()

        if not name or not photo_url:
            skipped += 1
            continue

        slug = slugify(name)
        dest = os.path.join(PHOTOS_DIR, f"{slug}.jpg")

        # Skip if already downloaded
        existing = [f for f in os.listdir(PHOTOS_DIR) if f.startswith(slug + '.')]
        if existing:
            print(f"  {name} — already downloaded")
            dest = os.path.join(PHOTOS_DIR, existing[0])
        else:
            print(f"  Downloading: {name}...")
            ok = download_photo(photo_url, dest, COOKIE)
            if not ok:
                failed += 1
                continue
            downloaded += 1
            time.sleep(0.3)

        # Find actual file (extension might have changed)
        actual_files = [f for f in os.listdir(PHOTOS_DIR) if f.startswith(slug + '.')]
        if not actual_files:
            failed += 1
            continue
        actual_file = actual_files[0]
        actual_path = os.path.join(PHOTOS_DIR, actual_file)

        # Upload to Supabase Storage
        print(f"  Uploading to Supabase...")
        ok = upload_to_supabase(actual_path, actual_file)
        if not ok:
            failed += 1
            continue

        # Update contact in DB
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{actual_file}"
        if email:
            update_contact(email, public_url)
            print(f"    Contact updated")

        uploaded += 1

    print(f"\n=== Done ===")
    print(f"  Downloaded: {downloaded}")
    print(f"  Uploaded:   {uploaded}")
    print(f"  Skipped:    {skipped}")
    print(f"  Failed:     {failed}")
    print(f"  Total:      {len(rows)}")

if __name__ == '__main__':
    main()
