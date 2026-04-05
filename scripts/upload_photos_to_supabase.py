"""
Upload photos from ~/Desktop/myca-photos/ to Supabase Storage
and update the contacts table photo_url field.

Matches photos to contacts by name (filename -> contact name).

Usage:
  python3 ~/myca/scripts/upload_photos_to_supabase.py
"""

import os
import json
import urllib.request
import urllib.error
import urllib.parse
import re

PHOTOS_DIR = os.path.expanduser("~/Desktop/myca-photos")
SUPABASE_URL = "https://nxeadvobyctultjbkcon.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZWFkdm9ieWN0dWx0amJrY29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyNzY2NiwiZXhwIjoyMDkwNDAzNjY2fQ.nMd37iAJJXnBtiQvf8dusf5R0AbNFsZvsoNrAbXRhY4"
BUCKET = "photos"


def get_all_contacts():
    """Fetch all contacts from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/contacts?select=contact_id,name,email,photo_url&is_myca_member=eq.true&limit=500"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("apikey", SUPABASE_KEY)
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read().decode())


def upload_file(filepath, storage_name):
    """Upload a file to Supabase Storage."""
    with open(filepath, "rb") as f:
        data = f.read()

    # Detect content type
    if data[:2] == b"\xff\xd8":
        ct = "image/jpeg"
    elif data[:4] == b"\x89PNG":
        ct = "image/png"
    elif data[:4] == b"RIFF":
        ct = "image/webp"
    elif data[:3] == b"GIF":
        ct = "image/gif"
    else:
        ct = "image/jpeg"

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{urllib.parse.quote(storage_name)}"
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Content-Type", ct)
    req.add_header("x-upsert", "true")

    try:
        urllib.request.urlopen(req, timeout=60)
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        print(f"    Upload error: {e.code} {body}")
        return False


def update_contact_photo(contact_id, photo_url):
    """Update a contact's photo_url in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/contacts?contact_id=eq.{contact_id}"
    data = json.dumps({"photo_url": photo_url}).encode()
    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        print(f"    DB error: {e}")
        return False


def normalize(name):
    """Normalize a name for matching: lowercase, remove special chars."""
    return re.sub(r"[^a-z]", "", name.lower())


def main():
    print("=== Upload Photos to Supabase ===\n")

    # Get all photo files
    files = [
        f
        for f in os.listdir(PHOTOS_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))
        and not f.startswith("_")
        and not f.startswith(".")
    ]
    print(f"Found {len(files)} photos in {PHOTOS_DIR}")

    # Get all contacts
    print("Fetching contacts from Supabase...")
    contacts = get_all_contacts()
    print(f"Found {len(contacts)} Myca members in Supabase\n")

    # Build name lookup: normalized name -> contact
    contact_lookup = {}
    for c in contacts:
        if c.get("name"):
            key = normalize(c["name"])
            contact_lookup[key] = c

    uploaded = 0
    matched = 0
    unmatched = 0
    skipped = 0
    failed = 0

    for filename in sorted(files):
        filepath = os.path.join(PHOTOS_DIR, filename)

        # Extract name from filename (e.g. "Jane_Doe.jpg" -> "janedoe")
        name_part = os.path.splitext(filename)[0]
        name_normalized = normalize(name_part)

        # Try to match to a contact
        contact = contact_lookup.get(name_normalized)

        if not contact:
            # Try without underscores/hyphens in different ways
            for key, c in contact_lookup.items():
                if key == name_normalized:
                    contact = c
                    break
            if not contact:
                print(f"  {filename} — no matching contact found")
                unmatched += 1
                continue

        # Skip if contact already has a photo
        if contact.get("photo_url"):
            print(f"  {filename} -> {contact['name']} (already has photo, skipping)")
            skipped += 1
            continue

        print(f"  {filename} -> {contact['name']}...")

        # Upload to Supabase Storage
        storage_name = re.sub(r"[^a-z0-9._-]", "-", filename.lower())
        ok = upload_file(filepath, storage_name)
        if not ok:
            failed += 1
            continue

        # Update contact
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{urllib.parse.quote(storage_name)}"
        ok = update_contact_photo(contact["contact_id"], public_url)
        if ok:
            print(f"    OK -> {contact['name']}")
            uploaded += 1
            matched += 1
        else:
            failed += 1

    print(f"\n=== Done ===")
    print(f"  Uploaded & matched: {uploaded}")
    print(f"  Already had photo:  {skipped}")
    print(f"  No match found:     {unmatched}")
    print(f"  Failed:             {failed}")
    print(f"  Total files:        {len(files)}")


if __name__ == "__main__":
    main()
