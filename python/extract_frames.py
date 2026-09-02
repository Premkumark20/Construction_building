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

    # 1. Query SQLite database specifically for active primary HERO construction video (video_type = 'hero' AND is_primary = 1)
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

    # 2. Fallback: find any valid video file in uploads/videos
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

def process_video(base_dir, desktop_target=120, mobile_target=60):
    force_mode = "--force" in sys.argv or "-f" in sys.argv
    video_dir = os.path.join(base_dir, "uploads", "videos")
    frames_dir = os.path.join(base_dir, "frames")
    desktop_dir = os.path.join(frames_dir, "desktop")
    mobile_dir = os.path.join(frames_dir, "mobile")
    meta_path = os.path.join(frames_dir, ".video_meta.json")

    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(mobile_dir, exist_ok=True)

    video_path = find_primary_video(base_dir)

    # If no video is present, log and return WITHOUT purging existing frame cache
    if not video_path:
        print(f"[INFO] No active video found in '{video_dir}'. Extraction skipped.")
        return

    video_filename = os.path.basename(video_path)
    stat = os.stat(video_path)
    video_mtime = stat.st_mtime
    video_size = stat.st_size

    desktop_files = glob.glob(os.path.join(desktop_dir, "frame_*.webp"))
    mobile_files = glob.glob(os.path.join(mobile_dir, "frame_*.webp"))

    desktop_ready = len(desktop_files) == (desktop_target + 1)
    mobile_ready = len(mobile_files) == (mobile_target + 1)

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

    desktop_need = force_mode or video_changed or not (meta_valid and desktop_ready)
    mobile_need = force_mode or video_changed or not (meta_valid and mobile_ready)

    if not desktop_need and not mobile_need:
        print(f"[OK] Up-to-date: {len(desktop_files)} Desktop & {len(mobile_files)} Mobile frames ready for '{video_filename}'.")
        return

    if video_changed:
        print(f"[NOTICE] Primary video changed to '{video_filename}'. Re-extracting all WebP frames...")

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

    # 1. Desktop Frames Extraction (121 frames - Full HD 1080p Quality)
    if desktop_need:
        print(f"[EXTRACT] Generating Desktop HD Frames (1080p Quality) -> 'frames/desktop/'")
        purge_folder(desktop_dir)
        desktop_indices = [int(i * (total_frames - 1) / desktop_target) for i in range(desktop_target + 1)]
        
        for idx, frame_idx in enumerate(desktop_indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                desktop_filename = f"frame_{idx + 1:04d}.webp"
                desktop_path = os.path.join(desktop_dir, desktop_filename)
                # 1080p High Definition WebP saving
                pil_img.save(desktop_path, "WEBP", quality=92, method=6)
            print_progress("Desktop Frames", idx + 1, desktop_target + 1)
    else:
        print(f"[SKIP] Desktop frames folder 'frames/desktop/' already up-to-date ({len(desktop_files)} frames).")

    # 2. Mobile Frames Extraction (61 frames - High Definition)
    if mobile_need:
        print(f"[EXTRACT] Generating Mobile HD Frames -> 'frames/mobile/'")
        purge_folder(mobile_dir)
        mobile_indices = [int(i * (total_frames - 1) / mobile_target) for i in range(mobile_target + 1)]

        for idx, frame_idx in enumerate(mobile_indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                mobile_filename = f"frame_{idx + 1:04d}.webp"
                mobile_path = os.path.join(mobile_dir, mobile_filename)
                # High Definition WebP saving for Mobile
                pil_img.save(mobile_path, "WEBP", quality=88, method=4)
            print_progress("Mobile Frames", idx + 1, mobile_target + 1)
    else:
        print(f"[SKIP] Mobile frames folder 'frames/mobile/' already up-to-date ({len(mobile_files)} frames).")

    cap.release()

    # Save updated metadata
    with open(meta_path, "w") as mf:
        json.dump({
            "video": video_filename,
            "mtime": video_mtime,
            "size": video_size,
            "desktop_frames": desktop_target + 1,
            "mobile_frames": mobile_target + 1
        }, mf, indent=2)

    print(f"[SUCCESS] WebP frame extraction complete: {desktop_target + 1} Desktop & {mobile_target + 1} Mobile frames for '{video_filename}'.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    process_video(project_root)
