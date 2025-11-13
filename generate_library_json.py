import os
import json

ALBUMS_ROOT = "albums"
BASE_S3_URL = "http://caprice.carstensen.s3-website-us-west-2.amazonaws.com/musicPlayer/albums/"

library = []

for album_name in sorted(os.listdir(ALBUMS_ROOT)):
    album_path = os.path.join(ALBUMS_ROOT, album_name)
    if not os.path.isdir(album_path):
        continue
    tracks = []
    for fname in sorted(os.listdir(album_path)):
        if fname.lower().endswith(".mp3"):
            track_url = f"{BASE_S3_URL}{album_name}/{fname}"
            tracks.append({
                "title": os.path.splitext(fname)[0],
                "url": track_url
            })
    if tracks:
        library.append({
            "name": album_name,
            "tracks": tracks
        })

# Output in the albums folder
output_path = os.path.join(ALBUMS_ROOT, "library.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(library, f, ensure_ascii=False, indent=2)

print(f"Library JSON generated at '{output_path}' with {len(library)} albums. Upload 'library.json' to your S3 bucket.")