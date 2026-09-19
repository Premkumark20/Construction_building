import os
import sys
import json
import glob
import sqlite3
import cv2
from PIL import Image

VALID_EXTENSIONS = ('.mp4', '.mov', '.mkv', '.avi', '.webm')

def sync_hero_videos_db(base_dir):
    """
    Auto-sync video files on disk in uploads/videos with SQLite database media_videos table.
    If a video file exists on disk but path/info is missing in DB, auto-add path and info into DB.
    If a DB record's video file no longer exists on disk, auto-remove record from DB.
    """
    db_path = os.path.join(base_dir, "app", "server", "database", "showcase.db")
    video_dir = os.path.join(base_dir, "uploads", "videos")

    if not os.path.exists(db_path):
        return

    try:
        conn = sqlite3.connect(db_path, timeout=10.0)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='media_videos'")
        if not cursor.fetchone():
            conn.close()
            return

        disk_files = []
        if os.path.exists(video_dir):
            disk_files = [f for f in os.listdir(video_dir) if f.lower().endswith(VALID_EXTENSIONS)]

        # 1. Remove DB records for files no longer on disk
        cursor.execute("SELECT id, filename FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '')")
        db_hero_rows = cursor.fetchall()
        for r_id, r_file in db_hero_rows:
            full_p = os.path.join(video_dir, r_file)
            if not os.path.exists(full_p):
                cursor.execute("DELETE FROM media_videos WHERE id = ?", (r_id,))
        conn.commit()

        # 2. Add missing video files found on disk into DB
        for disk_f in disk_files:
            cursor.execute("SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND (video_type = 'hero' OR video_type IS NULL OR video_type = '')", (disk_f,))
            if not cursor.fetchone():
                full_p = os.path.join(video_dir, disk_f)
                file_size = os.path.getsize(full_p) if os.path.exists(full_p) else 0
                rel_path = f"uploads/videos/{disk_f}"

                cursor.execute("SELECT COUNT(*) FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1")
                has_primary = cursor.fetchone()[0] > 0
                is_prim = 0 if has_primary else 1

                cursor.execute(
                    "INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'hero', ?, ?)",
                    (disk_f, rel_path, is_prim, file_size)
                )
                print(f"[AUTO-SYNC DB] Added missing video file '{disk_f}' to database media_videos table.")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[WARN] Failed to auto-sync hero videos in database: {e}")

def find_primary_video(base_dir):
    # First, run DB auto-sync to ensure any disk video missing from DB is auto-added
    sync_hero_videos_db(base_dir)

    db_path = os.path.join(base_dir, "app", "server", "database", "showcase.db")
    video_dir = os.path.join(base_dir, "uploads", "videos")
    if not os.path.exists(video_dir):
        video_dir = os.path.join(base_dir, "uploads")

    # Query SQLite database specifically for active primary HERO construction video
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
                    full_path = os.path.join(base_dir, rel_path)
                    if os.path.exists(full_path):
                        print(f"[INFO] Primary Hero Video in Database: '{filename}'")
                        conn.close()
                        return full_path
                    alt_path = os.path.join(video_dir, filename)
                    if os.path.exists(alt_path):
                        print(f"[INFO] Primary Hero Video in Database: '{filename}'")
                        conn.close()
                        return alt_path
            conn.close()
        except Exception as e:
            print(f"[WARN] Database query failed: {e}")
            pass

    # Fallback: find any valid video file in uploads/videos
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
    meta_path = os.path.join(frames_dir, ".video_meta.json")

    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(mobile_dir, exist_ok=True)

    video_path = find_primary_video(base_dir)

    # 1. IF NO PRIMARY VIDEO IS PRESENT / PATH MISSING: Automatically remove all existing frames
    if not video_path:
        print(f"[NOTICE] No active primary video found in '{video_dir}'. Automatically purging all existing frame files...")
        purge_folder(desktop_dir)
        purge_folder(mobile_dir)
        if os.path.exists(meta_path):
            try:
                os.remove(meta_path)
            except Exception:
                pass
        print(f"[CLEARED] All existing frames successfully removed.")
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

    # Check if cached frames match the CURRENT active primary video filename, size, & mtime
    video_changed = meta.get("video") != video_filename
    meta_valid = (
        not video_changed and
        meta.get("mtime") == video_mtime and
        meta.get("size") == video_size
    )

    desktop_need = force_mode or video_changed or not (meta_valid and desktop_ready and mobile_ready)

    if not desktop_need:
        print(f"[OK] Up-to-date: {len(desktop_files)} Desktop frames ready for '{video_filename}'. Mobile using final completed frame.")
        return

    # 2. WHEN CHANGING PRIMARY VIDEO OR FORCE RE-EXTRACTING: First remove ALL existing frames before extracting new frames
    print(f"[NOTICE] Primary video changed to '{video_filename}' or update triggered. Purging old frame cache first...")
    purge_folder(desktop_dir)
    purge_folder(mobile_dir)
    if os.path.exists(meta_path):
        try:
            os.remove(meta_path)
        except Exception:
            pass
    print(f"[CLEARED] Old frames removed. Starting new frame extraction for '{video_filename}'...")

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

    # Desktop Frames Extraction (121 frames - Full HD 1080p Quality)
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
            desktop_path = os.path.join(desktop_dir, desktop_filename)
            pil_img.save(desktop_path, "WEBP", quality=92, method=6)
            last_pil_img = pil_img
        print_progress("Desktop Frames", idx + 1, desktop_target + 1)

    # Save final completed house image for Mobile hero display
    if last_pil_img:
        mobile_path = os.path.join(mobile_dir, "frame_last.webp")
        last_pil_img.save(mobile_path, "WEBP", quality=90, method=5)
        print(f"[SUCCESS] Saved final completed house frame -> '{mobile_path}' for Mobile view.")

    cap.release()

    # Save updated metadata
    with open(meta_path, "w") as mf:
        json.dump({
            "video": video_filename,
            "mtime": video_mtime,
            "size": video_size,
            "desktop_frames": desktop_target + 1,
            "mobile_frames": 1
        }, mf, indent=2)

    print(f"[SUCCESS] WebP frame extraction complete: {desktop_target + 1} Desktop frames & 1 Mobile static final frame for '{video_filename}'.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    process_video(project_root)
