import os
import sys
import json
import glob
import sqlite3
import cv2
from PIL import Image

VALID_EXTENSIONS = ('.mp4', '.mov', '.mkv', '.avi', '.webm')

def find_primary_video(base_dir):
    db_path = os.path.join(base_dir, "app", "server", "database", "showcase.db")
    video_dir = os.path.join(base_dir, "uploads", "videos")
    if not os.path.exists(video_dir):
        video_dir = os.path.join(base_dir, "uploads")

    # Query SQLite database specifically for active primary HERO construction video (is_primary = 1)
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path, timeout=10.0)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='media_videos'")
            if cursor.fetchone():
                cursor.execute("SELECT filepath, filename FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1 LIMIT 1")
                row = cursor.fetchone()
                
                # If no hero video is explicitly marked primary, auto-mark newest hero video as primary
                if not row:
                    cursor.execute("SELECT id, filepath, filename FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') ORDER BY id DESC LIMIT 1")
                    row = cursor.fetchone()
                    if row:
                        cursor.execute("UPDATE media_videos SET is_primary = 1 WHERE id = ?", (row[0],))
                        conn.commit()
                        row = (row[1], row[2])

                if row:
                    rel_path = row[0]
                    filename = row[1]
                    
                    full_path = os.path.join(base_dir, rel_path) if rel_path else None
                    if full_path and os.path.exists(full_path):
                        print(f"[INFO] Primary Hero Video in Database: '{filename}'")
                        conn.close()
                        return full_path

                    alt_path = os.path.join(video_dir, filename) if filename else None
                    if alt_path and os.path.exists(alt_path):
                        print(f"[INFO] Primary Hero Video in Database: '{filename}'")
                        conn.close()
                        return alt_path

                    # Database path or file is MISSING on disk
                    print(f"[WARN] Video '{filename}' path in database table 'media_videos' does NOT exist on disk!")
                    conn.close()
                    return None
            conn.close()
        except Exception as e:
            print(f"[WARN] Database query failed: {e}")
            pass

    # Fallback to uploads/videos if database doesn't have records
    if os.path.exists(video_dir):
        for f in os.listdir(video_dir):
            if f.lower().endswith(VALID_EXTENSIONS):
                return os.path.join(video_dir, f)

    return None

def purge_folder(folder_path):
    if os.path.exists(folder_path):
        for f in glob.glob(os.path.join(folder_path, "*.webp")):
            try:
                os.remove(f)
            except Exception:
                pass

def purge_all_frame_caches(base_dir):
    target_dirs = [
        os.path.join(base_dir, "frames", "desktop"),
        os.path.join(base_dir, "frames", "mobile"),
        os.path.join(base_dir, "app", "public", "frames", "desktop"),
        os.path.join(base_dir, "app", "public", "frames", "mobile"),
    ]
    for d in target_dirs:
        purge_folder(d)
    
    meta_paths = [
        os.path.join(base_dir, "frames", ".video_meta.json"),
        os.path.join(base_dir, "app", "public", "frames", ".video_meta.json"),
    ]
    for mp in meta_paths:
        if os.path.exists(mp):
            try:
                os.remove(mp)
            except Exception:
                pass

def print_progress(label, current, total):
    percent = int((current / total) * 100) if total > 0 else 100
    bar_len = 25
    filled_len = int(bar_len * current // total) if total > 0 else bar_len
    bar = '=' * filled_len + '.' * (bar_len - filled_len)
    formatted_label = f"{label:<18}"
    output = f"\r[{formatted_label}] [{bar}] {current}/{total} ({percent}%)"
    sys.stdout.write(output)
    sys.stdout.flush()
    if current == total:
        sys.stdout.write("\n")

def process_video(base_dir, desktop_target=120):
    force_mode = "--force" in sys.argv or "-f" in sys.argv
    video_dir = os.path.join(base_dir, "uploads", "videos")
    frames_dir = os.path.join(base_dir, "frames")
    desktop_dir = os.path.join(frames_dir, "desktop")
    mobile_dir = os.path.join(frames_dir, "mobile")
    public_desktop_dir = os.path.join(base_dir, "app", "public", "frames", "desktop")
    public_mobile_dir = os.path.join(base_dir, "app", "public", "frames", "mobile")
    meta_path = os.path.join(frames_dir, ".video_meta.json")

    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(mobile_dir, exist_ok=True)
    os.makedirs(public_desktop_dir, exist_ok=True)
    os.makedirs(public_mobile_dir, exist_ok=True)

    video_path = find_primary_video(base_dir)

    # 1. If database path is missing on disk or no primary video exists -> REMOVE ALL FRAMES
    if not video_path:
        print(f"[PURGE] Primary video missing or database path missing on disk. Removing all existing frames...")
        purge_all_frame_caches(base_dir)
        return

    video_filename = os.path.basename(video_path)
    stat = os.stat(video_path)
    video_mtime = stat.st_mtime
    video_size = stat.st_size

    desktop_files = glob.glob(os.path.join(desktop_dir, "frame_*.webp"))
    mobile_last_frame = os.path.join(mobile_dir, "frame_last.webp")

    desktop_ready = len(desktop_files) == (desktop_target + 1)
    mobile_ready = os.path.exists(mobile_last_frame)

    meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as mf:
                meta = json.load(mf)
        except Exception:
            pass

    video_changed = meta.get("video") != video_filename
    meta_valid = (
        not video_changed and
        meta.get("mtime") == video_mtime and
        meta.get("size") == video_size
    )

    desktop_need = force_mode or video_changed or not (meta_valid and desktop_ready and mobile_ready)

    if not desktop_need:
        print(f"[OK] Up-to-date: {len(desktop_files)} Desktop frames ready for '{video_filename}'.")
        return

    # 2. When changing primary video or re-extracting: FIRST REMOVE ALL EXISTING FRAMES
    print(f"[PURGE] First removing all existing frames before extraction...")
    purge_all_frame_caches(base_dir)

    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(mobile_dir, exist_ok=True)
    os.makedirs(public_desktop_dir, exist_ok=True)
    os.makedirs(public_mobile_dir, exist_ok=True)

    print(f"[EXTRACT] Processing primary video '{video_filename}'...")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[ERROR] Unable to open video file '{video_path}'.")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    if total_frames <= 0:
        print("[ERROR] Video contains no frames.")
        cap.release()
        return

    print(f"[INFO] Video Details: {total_frames} total frames @ {fps:.2f} FPS.")

    # 3. Extract fresh frames
    print(f"[EXTRACT] Generating Desktop HD Frames (1080p Quality) -> 'frames/desktop/'")

    desktop_indices = [int(i * (total_frames - 1) / desktop_target) for i in range(desktop_target + 1)]
    last_pil_img = None
    
    for idx, frame_idx in enumerate(desktop_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            desktop_filename = f"frame_{idx + 1:04d}.webp"
            
            # Save to root frames directory
            desktop_path = os.path.join(desktop_dir, desktop_filename)
            pil_img.save(desktop_path, "WEBP", quality=92, method=6)

            # Also save to public frames directory if it exists
            pub_desktop_path = os.path.join(public_desktop_dir, desktop_filename)
            try:
                pil_img.save(pub_desktop_path, "WEBP", quality=92, method=6)
            except Exception:
                pass

            last_pil_img = pil_img
        print_progress("Desktop Frames", idx + 1, desktop_target + 1)

    # Save final completed house image for Mobile hero display
    if last_pil_img:
        mobile_path = os.path.join(mobile_dir, "frame_last.webp")
        last_pil_img.save(mobile_path, "WEBP", quality=90, method=5)

        pub_mobile_path = os.path.join(public_mobile_dir, "frame_last.webp")
        try:
            last_pil_img.save(pub_mobile_path, "WEBP", quality=90, method=5)
        except Exception:
            pass

        print(f"[SUCCESS] Saved final completed house frame -> '{mobile_path}' for Mobile view.")

    cap.release()

    # Save updated metadata
    meta_content = {
        "video": video_filename,
        "mtime": video_mtime,
        "size": video_size,
        "desktop_frames": desktop_target + 1,
        "mobile_frames": 1
    }
    with open(meta_path, "w") as mf:
        json.dump(meta_content, mf, indent=2)

    pub_meta_path = os.path.join(base_dir, "app", "public", "frames", ".video_meta.json")
    try:
        with open(pub_meta_path, "w") as mf:
            json.dump(meta_content, mf, indent=2)
    except Exception:
        pass

    print(f"[SUCCESS] WebP frame extraction complete: {desktop_target + 1} Desktop frames & 1 Mobile static final frame for '{video_filename}'.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    process_video(project_root)
