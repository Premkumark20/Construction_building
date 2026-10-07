import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import db from '../database/database.js';
import { uploadFileToBlob, deleteFileFromBlob, deleteAllFrameBlobs } from '../utils/blobStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(projectRoot, 'uploads');
const imageUploadsDir = path.join(uploadsDir, 'images');
const videoUploadsDir = path.join(uploadsDir, 'videos');
const tempUploadsDir = path.join(videoUploadsDir, 'temp');
const rootVideosDir = path.join(projectRoot, 'videos');
const appPublicVideosDir = path.join(projectRoot, 'app/public/videos');
const bgVideosDir = process.env.VERCEL ? '/tmp/videos' : rootVideosDir;

try {
  fs.mkdirSync(imageUploadsDir, { recursive: true });
  fs.mkdirSync(videoUploadsDir, { recursive: true });
  fs.mkdirSync(tempUploadsDir, { recursive: true });
  fs.mkdirSync(rootVideosDir, { recursive: true });
  fs.mkdirSync(appPublicVideosDir, { recursive: true });
  fs.mkdirSync(bgVideosDir, { recursive: true });
} catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, tempUploadsDir);
    } else {
      const section = (req.query.section || req.body.section || '').toLowerCase();
      let targetDir = imageUploadsDir;
      if (section === 'gallery') {
        targetDir = path.join(imageUploadsDir, 'gallery');
      } else if (section === 'properties' || section === 'land') {
        targetDir = path.join(imageUploadsDir, 'properties');
      } else if (section === 'projects') {
        targetDir = path.join(imageUploadsDir, 'projects');
      }
      fs.mkdirSync(targetDir, { recursive: true });
      cb(null, targetDir);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });
const router = express.Router();

// Real-time frame extraction process & progress tracker
let currentExtraction = {
  isExtracting: false,
  videoId: null,
  videoFilename: '',
  progress: 0,
  total: 121,
  ready: 0,
  status: 'idle',
  activeProcess: null
};

export function triggerFrameExtraction(videoInfo) {
  if (currentExtraction.isExtracting && currentExtraction.activeProcess) {
    try {
      currentExtraction.activeProcess.kill();
    } catch (e) {}
  }

  currentExtraction = {
    isExtracting: true,
    videoId: videoInfo?.id || null,
    videoFilename: videoInfo?.filename || '',
    progress: 0,
    total: 121,
    ready: 0,
    status: 'extracting',
    activeProcess: null
  };

  console.log(`\n[Auto Frame Extraction] Starting frame extraction for '${currentExtraction.videoFilename}'...`);
  const pyProc = spawn('python', ['-u', 'python/extract_frames.py', '--force'], { cwd: projectRoot });
  currentExtraction.activeProcess = pyProc;

  pyProc.stdout.on('data', (data) => {
    const str = data.toString();
    process.stdout.write(str);
    const match = str.match(/(\d+)\/(\d+)\s*\((\d+)%\)/);
    if (match) {
      currentExtraction.ready = parseInt(match[1], 10);
      currentExtraction.total = parseInt(match[2], 10);
      currentExtraction.progress = parseInt(match[3], 10);
    }
  });

  pyProc.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  pyProc.on('close', async (code) => {
    console.log(`\n[Auto Frame Extraction] Extraction process exited with code ${code}.`);
    if (code === 0) {
      currentExtraction.ready = 121;
      currentExtraction.progress = 100;
      currentExtraction.status = 'syncing_blob';
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        console.log('[Auto Frame Extraction] Uploading frames to Vercel Blob Storage...');
        try {
          await syncFramesToBlobStorage();
          console.log('[Auto Frame Extraction] Uploaded frames to Blob Storage successfully.');
        } catch (blobErr) {
          console.error('[Auto Frame Extraction] Blob upload error:', blobErr);
        }
      }
      currentExtraction.status = 'completed';
    } else {
      currentExtraction.status = 'error';
    }
    currentExtraction.isExtracting = false;
    currentExtraction.activeProcess = null;
  });

  return pyProc;
}

// Helper to auto-sync background videos from videos folder and fallback paths
const syncBackgroundVideos = (callback) => {
  try {
    const candidateDirs = [
      path.join(projectRoot, 'videos'),
      path.join(projectRoot, 'app/public/videos'),
      path.join(projectRoot, 'uploads/videos')
    ];
    if (process.env.VERCEL) {
      candidateDirs.unshift('/tmp/videos');
    }

    let foundDir = candidateDirs.find(d => fs.existsSync(d));
    const activeDir = foundDir || bgVideosDir;

    let bgFiles = [];
    try {
      if (fs.existsSync(activeDir)) {
        bgFiles = fs.readdirSync(activeDir).filter(f => f.toLowerCase().endsWith('.mp4') || f.toLowerCase().endsWith('.webm'));
      }
    } catch (e) {}

    // Only purge records if NOT on Vercel
    if (!process.env.VERCEL) {
      db.all("SELECT id, filename FROM media_videos WHERE video_type = 'background'", [], (err, rows) => {
        if (!err && Array.isArray(rows)) {
          rows.forEach(r => {
            const existsAnywhere = candidateDirs.some(d => fs.existsSync(path.join(d, r.filename)));
            if (!existsAnywhere) {
              db.run("DELETE FROM media_videos WHERE id = ?", [r.id]);
            }
          });
        }
      });
    }

    // Ensure Background.mp4 is registered if no background videos exist in DB
    db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = 'background'", [], (err, countRow) => {
      if (!err && (!countRow || countRow.count === 0)) {
        db.run(
          "INSERT OR IGNORE INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'background', 1, ?)",
          ['Background.mp4', 'videos/Background.mp4', 15420212],
          () => {
            if (callback) callback();
          }
        );
        return;
      }

      if (bgFiles.length === 0) {
        return callback ? callback() : null;
      }

      let processed = 0;
      bgFiles.forEach(file => {
        const fullP = path.join(activeDir, file);
        let fileSize = 0;
        try { fileSize = fs.statSync(fullP).size; } catch (e) {}

        db.get("SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND video_type = 'background'", [file], (err, existing) => {
          if (!existing) {
            db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = 'background' AND is_primary = 1", [], (err, primRow) => {
              const isPrim = (!primRow || primRow.count === 0) ? 1 : 0;
              db.run(
                "INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'background', ?, ?)",
                [file, `videos/${file}`, isPrim, fileSize],
                () => {
                  processed++;
                  if (processed >= bgFiles.length && callback) callback();
                }
              );
            });
          } else {
            processed++;
            if (processed >= bgFiles.length && callback) callback();
          }
        });
      });
    });
  } catch (e) {
    console.error('Error syncing background videos:', e);
    if (callback) callback();
  }
};

// Helper to auto-sync hero construction videos from uploads/videos into database
const syncHeroVideos = (callback) => {
  try {
    const candidateDirs = [
      videoUploadsDir,
      path.join(projectRoot, 'app/public/videos'),
      path.join(projectRoot, 'videos')
    ];
    if (process.env.VERCEL) {
      candidateDirs.unshift('/tmp/videos');
      candidateDirs.unshift('/tmp/uploads/videos');
    }

    let videoFiles = [];
    try {
      if (fs.existsSync(videoUploadsDir)) {
        videoFiles = fs.readdirSync(videoUploadsDir).filter(f => f.toLowerCase().endsWith('.mp4') || f.toLowerCase().endsWith('.webm') || f.toLowerCase().endsWith('.mov') || f.toLowerCase().endsWith('.mkv') || f.toLowerCase().endsWith('.avi'));
      }
    } catch (e) {}

    // Only purge records if file doesn't exist in ANY candidate dir, isn't on Vercel, and isn't a URL
    if (!process.env.VERCEL) {
      db.all("SELECT id, filename, filepath FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '')", [], (err, rows) => {
        if (!err && Array.isArray(rows)) {
          rows.forEach(r => {
            if (r.filepath && (r.filepath.startsWith('http://') || r.filepath.startsWith('https://'))) {
              return; // Keep remote/external URLs
            }
            const existsAnywhere = candidateDirs.some(d => fs.existsSync(path.join(d, r.filename)));
            if (!existsAnywhere) {
              const altPath = path.join(projectRoot, r.filepath || '');
              if (!fs.existsSync(altPath)) {
                // Don't purge if it was just registered or if filename exists in candidateDirs
                // db.run("DELETE FROM media_videos WHERE id = ?", [r.id]);
              }
            }
          });
        }
      });
    }

    let processed = 0;
    if (videoFiles.length === 0) {
      return callback ? callback() : null;
    }

    videoFiles.forEach(file => {
      const fullP = path.join(videoUploadsDir, file);
      let stats = { size: 0 };
      try { stats = fs.statSync(fullP); } catch (e) {}
      db.get("SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND (video_type = 'hero' OR video_type IS NULL OR video_type = '')", [file], (err, existing) => {
        if (!existing) {
          db.get("SELECT COUNT(*) as count FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1", [], (err, primRow) => {
            const isPrim = (!primRow || primRow.count === 0) ? 1 : 0;
            db.run(
              "INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'hero', ?, ?)",
              [file, `uploads/videos/${file}`, isPrim, stats.size],
              () => {
                processed++;
                if (processed >= videoFiles.length && callback) callback();
              }
            );
          });
        } else {
          processed++;
          if (processed >= videoFiles.length && callback) callback();
        }
      });
    });
  } catch (e) {
    console.error('Error syncing hero videos:', e);
    if (callback) callback();
  }
};

// 1. Upload single image
router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  const section = (req.query.section || req.body.section || '').toLowerCase();
  let subPath = '';
  if (section === 'gallery') {
    subPath = 'gallery/';
  } else if (section === 'properties' || section === 'land') {
    subPath = 'properties/';
  } else if (section === 'projects') {
    subPath = 'projects/';
  }

  // If Vercel Blob is configured, upload directly to Vercel Blob CDN
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const blobPath = `${subPath || 'misc/'}${Date.now()}-${req.file.originalname}`;
      const blobUrl = await uploadFileToBlob(blobPath, fileBuffer, req.file.mimetype || 'image/jpeg');
      if (blobUrl) {
        return res.json({ imageUrl: blobUrl, filename: req.file.filename });
      }
    } catch (err) {
      console.error('[Blob upload error in /upload-image]:', err);
    }
  }

  const imageUrl = `/uploads/images/${subPath}${req.file.filename}`;
  res.json({ imageUrl, filename: req.file.filename });
});

// 1b. Delete single image (from Vercel Blob CDN or local filesystem)
router.post('/delete-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required.' });
  }

  if (imageUrl.includes('vercel-storage.com') || imageUrl.includes('blob.vercel-storage.com')) {
    await deleteFileFromBlob(imageUrl);
    return res.json({ success: true, message: 'Image deleted from Vercel Blob storage.' });
  }

  const rel = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  const p = path.join(projectRoot, rel);
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch (e) {}
  }
  res.json({ success: true, message: 'Image deleted from disk.' });
});

// 2. GET all video files in database (Syncs both background and hero videos)
router.get('/videos', (req, res) => {
  syncBackgroundVideos(() => {
    syncHeroVideos(() => {
      db.run("UPDATE media_videos SET video_type = 'hero' WHERE video_type IS NULL OR video_type = ''", [], () => {
        // Enforce that only primary hero video retains frame_urls
        db.run("UPDATE media_videos SET frame_urls = NULL WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 0", [], () => {
          db.all('SELECT * FROM media_videos ORDER BY video_type ASC, is_primary DESC, id DESC', [], (err, rows) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            const safeRows = Array.isArray(rows) ? rows : [];

          // Check if Hero has a primary
          const heroRows = safeRows.filter(r => r.video_type === 'hero');
          if (heroRows.length > 0 && !heroRows.some(r => Number(r.is_primary) === 1)) {
            db.run('UPDATE media_videos SET is_primary = 1 WHERE id = ?', [heroRows[0].id]);
            heroRows[0].is_primary = 1;
          }

          // Check if Background has a primary
          const bgRows = safeRows.filter(r => r.video_type === 'background');
          if (bgRows.length > 0 && !bgRows.some(r => Number(r.is_primary) === 1)) {
            db.run('UPDATE media_videos SET is_primary = 1 WHERE id = ?', [bgRows[0].id]);
            bgRows[0].is_primary = 1;
          }

            res.json(safeRows);
          });
        });
      });
    });
  });
});

// 2b. GET active primary background video
router.get('/background-video', (req, res) => {
  syncBackgroundVideos(() => {
    db.get("SELECT * FROM media_videos WHERE video_type = 'background' AND is_primary = 1 LIMIT 1", [], (err, row) => {
      if (!err && row) {
        const url = row.filepath && (row.filepath.startsWith('http://') || row.filepath.startsWith('https://'))
          ? row.filepath
          : `/videos/${row.filename}`;
        return res.json({ videoUrl: url, filename: row.filename, video: row });
      }
      db.get("SELECT * FROM media_videos WHERE video_type = 'background' LIMIT 1", [], (err, fallbackRow) => {
        if (!err && fallbackRow) {
          const url = fallbackRow.filepath && (fallbackRow.filepath.startsWith('http://') || fallbackRow.filepath.startsWith('https://'))
            ? fallbackRow.filepath
            : `/videos/${fallbackRow.filename}`;
          return res.json({ videoUrl: url, filename: fallbackRow.filename, video: fallbackRow });
        }
        res.json({ videoUrl: '/videos/Background.mp4', filename: 'Background.mp4', video: null });
      });
    });
  });
});

// 3. Upload new video file (Supports both 'hero' and 'background', persists to Vercel Blob)
router.post('/upload-video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  const videoType = (req.body.videoType || 'hero').toLowerCase() === 'background' ? 'background' : 'hero';
  let finalFilename = (req.body.customName || req.file.originalname).trim();
  if (!path.extname(finalFilename)) {
    finalFilename += path.extname(req.file.originalname) || '.mp4';
  }

  const tempPath = req.file.path;
  const targetDir = videoType === 'background' ? bgVideosDir : videoUploadsDir;
  const targetPath = path.join(targetDir, finalFilename);
  let relativePath = videoType === 'background' ? `videos/${finalFilename}` : `uploads/videos/${finalFilename}`;

  // If Vercel Blob is configured, upload video directly to Vercel Blob CDN
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const fileBuffer = fs.readFileSync(tempPath);
      const blobPath = `videos/${videoType}-${Date.now()}-${finalFilename}`;
      const blobUrl = await uploadFileToBlob(blobPath, fileBuffer, req.file.mimetype || 'video/mp4');
      if (blobUrl) {
        relativePath = blobUrl;
      }
    } catch (blobErr) {
      console.error('[Vercel Blob Video Upload Error]:', blobErr);
    }
  }

  db.get('SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND video_type = ?', [finalFilename, videoType], (err, row) => {
    if (row || (!relativePath.startsWith('http') && fs.existsSync(targetPath))) {
      try { fs.unlinkSync(tempPath); } catch (e) {}
      return res.status(409).json({
        error: 'FILE_EXISTS',
        filename: finalFilename,
        message: `File "${finalFilename}" already exists! Please enter a unique name.`
      });
    }

    try {
      fs.renameSync(tempPath, targetPath);
    } catch (e) {
      fs.copyFileSync(tempPath, targetPath);
      try { fs.unlinkSync(tempPath); } catch (err) {}
    }

    if (videoType === 'background') {
      try {
        fs.mkdirSync(appPublicVideosDir, { recursive: true });
        fs.copyFileSync(targetPath, path.join(appPublicVideosDir, finalFilename));
      } catch (copyErr) {}
    }

    db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = ?", [videoType], (err, countRow) => {
      const setPrimary = 1; // Newly uploaded video in Admin becomes the active primary video

      db.run("UPDATE media_videos SET is_primary = 0 WHERE video_type = ? OR (video_type IS NULL AND ? = 'hero')", [videoType, videoType], () => {
        const sql = `INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [finalFilename, relativePath, videoType, setPrimary, req.file.size], function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          const newId = this.lastID;
          res.json({ id: newId, filename: finalFilename, filepath: relativePath, video_type: videoType, is_primary: setPrimary });
        });
      });
    });
  });
});

// 3b. Register video by direct URL / Cloud link (ideal for Vercel > 4.5MB limitation)
router.post('/register-video-url', (req, res) => {
  const { videoUrl, filename, videoType = 'hero', isPrimary = false } = req.body;
  if (!videoUrl || !videoUrl.trim()) {
    return res.status(400).json({ error: 'Video URL is required.' });
  }
  const cleanUrl = videoUrl.trim();
  const cleanType = (videoType || 'hero').toLowerCase() === 'background' ? 'background' : 'hero';
  let cleanName = (filename || path.basename(cleanUrl.split('?')[0]) || `${cleanType}-video.mp4`).trim();
  if (!cleanName.includes('.')) cleanName += '.mp4';

  db.get('SELECT COUNT(*) as count FROM media_videos WHERE video_type = ?', [cleanType], (err, countRow) => {
    const setPrimary = (isPrimary || !countRow || countRow.count === 0) ? 1 : 0;
    const finishInsert = () => {
      db.run(
        'INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, ?, ?, 0)',
        [cleanName, cleanUrl, cleanType, setPrimary],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }
          res.json({
            id: this.lastID,
            filename: cleanName,
            filepath: cleanUrl,
            video_type: cleanType,
            is_primary: setPrimary
          });
        }
      );
    };

    if (setPrimary === 1) {
      db.run('UPDATE media_videos SET is_primary = 0 WHERE video_type = ?', [cleanType], () => finishInsert());
    } else {
      finishInsert();
    }
  });
});

// 4. Rename video file
router.put('/video/:id/rename', (req, res) => {
  const { newFilename } = req.body;
  if (!newFilename || !newFilename.trim()) {
    return res.status(400).json({ error: 'New filename is required.' });
  }

  db.get('SELECT * FROM media_videos WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Video not found.' });

    const videoType = row.video_type || 'hero';
    let finalName = newFilename.trim();
    const ext = path.extname(row.filename) || '.mp4';
    if (!path.extname(finalName)) {
      finalName += ext;
    }

    const baseDir = videoType === 'background' ? bgVideosDir : videoUploadsDir;
    const oldPath = path.join(baseDir, row.filename);
    const newRelativePath = videoType === 'background' ? `videos/${finalName}` : `uploads/videos/${finalName}`;
    const newPath = path.join(baseDir, finalName);

    if (oldPath !== newPath && fs.existsSync(newPath)) {
      return res.status(409).json({ error: 'FILE_EXISTS', message: `File "${finalName}" already exists.` });
    }

    if (fs.existsSync(oldPath)) {
      try {
        fs.renameSync(oldPath, newPath);
      } catch (e) {
        fs.copyFileSync(oldPath, newPath);
        try { fs.unlinkSync(oldPath); } catch (e) {}
      }
    }

    db.run('UPDATE media_videos SET filename = ?, filepath = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', [finalName, newRelativePath, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, filename: finalName, filepath: newRelativePath, video_type: videoType });

      if (videoType === 'hero' && Number(row.is_primary) === 1) {
        triggerFrameExtraction({ id: req.params.id, filename: finalName });
      }
    });
  });
});

// 5. Delete video file (Physical delete + DB delete)
router.delete('/video/:id', (req, res) => {
  db.get('SELECT * FROM media_videos WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Video not found.' });
    }
    const videoType = row.video_type || 'hero';
    const wasPrimary = Number(row.is_primary) === 1;

    const candidatePaths = [
      path.join(projectRoot, 'videos', row.filename),
      path.join(projectRoot, 'app/public/videos', row.filename),
      path.join(projectRoot, 'uploads/videos', row.filename),
      path.join(projectRoot, row.filepath || '')
    ];
    if (process.env.VERCEL) {
      candidatePaths.push(path.join('/tmp/videos', row.filename));
      candidatePaths.push(path.join('/tmp/uploads/videos', row.filename));
    }

    // Delete from Vercel Blob if stored on CDN
    if (row.filepath && (row.filepath.includes('vercel-storage.com') || row.filepath.includes('blob.'))) {
      deleteFileFromBlob(row.filepath);
    }
    if (row.filename && (row.filename.includes('vercel-storage.com') || row.filename.includes('blob.'))) {
      deleteFileFromBlob(row.filename);
    }

    candidatePaths.forEach(p => {
      if (p && fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) { console.error('Error physically removing video file:', p, e); }
      }
    });

    db.run('DELETE FROM media_videos WHERE id = ?', [req.params.id], () => {
      if (wasPrimary) {
        db.get('SELECT * FROM media_videos WHERE video_type = ? ORDER BY id DESC LIMIT 1', [videoType], (err, nextPrimary) => {
          if (!err && nextPrimary) {
            db.run('UPDATE media_videos SET is_primary = 1 WHERE id = ?', [nextPrimary.id], () => {
              res.json({ message: `Primary ${videoType} video deleted, new primary assigned.` });
              if (videoType === 'hero') {
                triggerFrameExtraction(nextPrimary);
              }
            });
          } else {
            res.json({ message: `Primary ${videoType} video deleted. No remaining videos.` });
            if (videoType === 'hero') {
              triggerFrameExtraction({ id: null, filename: '' });
            }
          }
        });
      } else {
        res.json({ message: 'Video deleted successfully.' });
      }
    });
  });
});

// Helper to clear all old frames from Vercel Blob, disk, and database
export async function clearAllFrames() {
  try {
    await deleteAllFrameBlobs();
  } catch (delErr) {
    console.warn('[clearAllFrames] Vercel Blob deletion warning:', delErr.message);
  }

  try {
    const desktopDir = path.join(projectRoot, 'frames/desktop');
    const mobileDir = path.join(projectRoot, 'frames/mobile');
    const metaPath = path.join(projectRoot, 'frames/.video_meta.json');
    if (fs.existsSync(desktopDir)) fs.rmSync(desktopDir, { recursive: true, force: true });
    if (fs.existsSync(mobileDir)) fs.rmSync(mobileDir, { recursive: true, force: true });
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  } catch (fsErr) {}

  await new Promise((resolve) => {
    db.run(
      "UPDATE media_videos SET frame_urls = NULL WHERE video_type = 'hero' OR video_type IS NULL OR video_type = ''",
      () => resolve()
    );
  });
}

// 6. Set Primary Video for Hero OR Background (Instant-deletes old frames when changing primary)
router.post('/set-primary-video', async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required.' });
  }

  db.get('SELECT * FROM media_videos WHERE id = ?', [videoId], async (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Target video not found.' });
    }

    const videoType = row.video_type || 'hero';

    if (videoType === 'hero') {
      // Instant delete entire old frames from Blob, disk, and DB before setting new primary
      await clearAllFrames();
    }

    db.run('UPDATE media_videos SET is_primary = 0 WHERE video_type = ?', [videoType], () => {
      db.run('UPDATE media_videos SET is_primary = 1 WHERE id = ?', [videoId], () => {
        res.json({
          message: `Primary ${videoType} video set successfully!`,
          video: row.filename,
          video_type: videoType
        });
      });
    });
  });
});

// 6b. Dedicated endpoint to instant clear all old frames
router.post('/clear-old-frames', async (req, res) => {
  try {
    await clearAllFrames();
    res.json({ success: true, message: 'All old frames deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET active primary background video (for all site sections)
const formatVideoUrl = (fp) => {
  if (!fp) return '/videos/Background.mp4';
  if (fp.startsWith('http://') || fp.startsWith('https://')) return fp;
  return fp.replace(/^app\/public\//, '/').replace(/^\/?/, '/');
};

router.get('/background-video', (req, res) => {
  db.get(
    "SELECT * FROM media_videos WHERE video_type = 'background' AND is_primary = 1 LIMIT 1",
    [],
    (err, row) => {
      if (!err && row && row.filepath) {
        return res.json({ videoUrl: formatVideoUrl(row.filepath), filename: row.filename });
      }
      // If no background video marked primary, check if any background video exists
      db.get(
        "SELECT * FROM media_videos WHERE video_type = 'background' LIMIT 1",
        [],
        (err2, row2) => {
          if (!err2 && row2 && row2.filepath) {
            return res.json({ videoUrl: formatVideoUrl(row2.filepath), filename: row2.filename });
          }
          // Default fallback to Background.mp4
          res.json({ videoUrl: '/videos/Background.mp4', filename: 'Background.mp4' });
        }
      );
    }
  );
});

// 8. GET active primary hero video status
router.get('/hero-video', (req, res) => {
  db.get(
    "SELECT * FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1 LIMIT 1",
    [],
    (err, row) => {
      if (!err && row && row.filepath) {
        const url = row.filepath.startsWith('http://') || row.filepath.startsWith('https://')
          ? row.filepath
          : (row.filepath.startsWith('/') ? row.filepath : `/${row.filepath}`);
        return res.json({ videoUrl: url, filename: row.filename, hasHeroVideo: true });
      }
      res.json({ videoUrl: null, filename: null, hasHeroVideo: false });
    }
  );
});

// 9. GET frame extraction progress status
router.get('/frame-progress', async (req, res) => {
  const target = 121;
  const desktopDir = path.join(projectRoot, 'frames/desktop');
  let frameCount = 0;
  try {
    if (fs.existsSync(desktopDir)) {
      frameCount = fs.readdirSync(desktopDir).filter(f => f.endsWith('.webp')).length;
    }
  } catch (e) {}

  const metaPath = path.join(projectRoot, 'frames/.video_meta.json');
  let meta = {};
  try {
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || {};
    }
  } catch (e) {}

  // Fetch active primary video from database to check stored frame_urls
  let dbFrameUrls = [];
  let primaryVideo = null;
  try {
    primaryVideo = await new Promise((resolve) => {
      db.get(
        "SELECT * FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1 LIMIT 1",
        [],
        (err, row) => resolve(err ? null : row)
      );
    });
    if (primaryVideo && primaryVideo.frame_urls) {
      const parsed = JSON.parse(primaryVideo.frame_urls);
      if (Array.isArray(parsed)) {
        dbFrameUrls = parsed;
      }
    }
  } catch (err) {}

  const effectiveCount = Math.max(frameCount, dbFrameUrls.length, (Array.isArray(meta.blobUrls) ? meta.blobUrls.length : 0));
  const isComplete = effectiveCount >= target || (dbFrameUrls.length > 0 && dbFrameUrls.length >= 60);

  if (currentExtraction.isExtracting) {
    const ready = currentExtraction.ready;
    const progress = Math.min(99, Math.max(1, currentExtraction.progress));
    return res.json({
      isExtracting: true,
      videoId: currentExtraction.videoId || primaryVideo?.id,
      videoFilename: currentExtraction.videoFilename || primaryVideo?.filename,
      total: target,
      ready,
      progress,
      status: currentExtraction.status || 'extracting',
      meta,
      hasFrames: isComplete
    });
  }

  res.json({
    isExtracting: false,
    videoId: primaryVideo?.id || currentExtraction.videoId || null,
    videoFilename: primaryVideo?.filename || meta.video || currentExtraction.videoFilename || '',
    total: target,
    ready: effectiveCount,
    progress: isComplete ? 100 : 0,
    status: isComplete ? 'completed' : 'idle',
    meta,
    hasFrames: isComplete
  });
});

// 9b. Batch upload client-extracted WebP frames directly to Vercel Blob Storage
router.post('/upload-frames-batch', async (req, res) => {
  const { videoId, videoPrefix = 'hero', frames = [], allFrameUrls = [] } = req.body;
  if (!Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: 'No frames provided in batch.' });
  }

  const cleanPrefix = String(videoPrefix).replace(/[^a-zA-Z0-9_-]/g, '_') || 'hero';
  const currentCount = Number(req.body.currentCount) || frames.length;
  const totalFrames = Number(req.body.totalFrames) || 121;
  const progressPct = Number(req.body.progress) || Math.min(100, Math.round((currentCount / totalFrames) * 100));
  const isComplete = progressPct >= 100 || currentCount >= totalFrames;

  // Only update in-memory state if the server-side Python process is NOT actively running.
  // If Python is running, its stdout already drives currentExtraction — don't overwrite with client batch data.
  const serverPyIsRunning = currentExtraction.isExtracting && currentExtraction.activeProcess;
  if (!serverPyIsRunning) {
    currentExtraction = {
      isExtracting: !isComplete,
      videoId: videoId || null,
      videoFilename: cleanPrefix,
      ready: currentCount,
      total: totalFrames,
      progress: progressPct,
      status: isComplete ? 'completed' : 'extracting',
      activeProcess: null
    };
  }

  // Live compiler / server console output matching frontend 1-to-1
  const barLen = 20;
  const filledLen = Math.round((barLen * Math.min(100, progressPct)) / 100);
  const bar = '='.repeat(filledLen) + '.'.repeat(Math.max(0, barLen - filledLen));
  console.log(`[Client Frame Extraction] [${bar}] ${currentCount}/${totalFrames} (${progressPct}%)`);

  const uploadedUrls = [];

  for (const item of frames) {
    if (!item.filename || !item.data) continue;
    try {
      const base64Data = item.data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const blobPath = `frames/${cleanPrefix}/${item.filename}`;
      let finalUrl = null;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        finalUrl = await uploadFileToBlob(blobPath, buffer, 'image/webp');
      }
      if (!finalUrl) {
        const localDest = path.join(projectRoot, 'frames/desktop', item.filename);
        try {
          fs.mkdirSync(path.dirname(localDest), { recursive: true });
          fs.writeFileSync(localDest, buffer);
          finalUrl = `/frames/desktop/${item.filename}`;
        } catch (localErr) {}
      }
      if (finalUrl) {
        uploadedUrls.push({ filename: item.filename, url: finalUrl });
      }
    } catch (e) {
      console.error(`[Upload Frame Batch Error] ${item.filename}:`, e.message);
    }
  }

  // If allFrameUrls is included, update DB row
  if (Array.isArray(allFrameUrls) && allFrameUrls.length > 0) {
    try {
      const urlsJson = JSON.stringify(allFrameUrls);
      if (videoId) {
        db.run("UPDATE media_videos SET frame_urls = ? WHERE id = ?", [urlsJson, videoId]);
      } else {
        db.run(
          "UPDATE media_videos SET frame_urls = ? WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1",
          [urlsJson]
        );
      }
    } catch (dbErr) {
      console.warn('Failed to save frame_urls to DB in upload-frames-batch:', dbErr.message);
    }
  }

  res.json({
    success: true,
    uploadedCount: uploadedUrls.length,
    uploadedUrls,
    progress: progressPct,
    currentCount,
    totalFrames
  });
});

// 9c. Save complete frame URLs array in database
router.post('/save-frame-urls', (req, res) => {
  const { videoId, frameUrls } = req.body;
  if (!Array.isArray(frameUrls) || frameUrls.length === 0) {
    return res.status(400).json({ error: 'frameUrls array is required.' });
  }

  currentExtraction = {
    isExtracting: false,
    videoId: videoId || null,
    videoFilename: '',
    ready: frameUrls.length,
    total: 121,
    progress: 100,
    status: 'completed'
  };
  console.log(`[Frame Extraction] [====================] ${frameUrls.length}/121 (100%) - Completed & Saved!`);

  const urlsJson = JSON.stringify(frameUrls);
  const cb = (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, count: frameUrls.length });
  };
  if (videoId) {
    db.run("UPDATE media_videos SET frame_urls = ? WHERE id = ?", [urlsJson, videoId], cb);
  } else {
    db.run(
      "UPDATE media_videos SET frame_urls = ? WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1",
      [urlsJson],
      cb
    );
  }
});

// Helper to sync local extracted WebP frames to Vercel Blob Storage if token exists
export async function syncFramesToBlobStorage() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  const metaPath = path.join(projectRoot, 'frames/.video_meta.json');
  const desktopDir = path.join(projectRoot, 'frames/desktop');
  if (!fs.existsSync(desktopDir)) return null;

  let meta = {};
  try {
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || {};
    }
  } catch (e) {}

  if (Array.isArray(meta.blobUrls) && meta.blobUrls.length === 121) {
    return meta.blobUrls;
  }

  const files = fs.readdirSync(desktopDir).filter(f => f.endsWith('.webp')).sort();
  if (files.length === 0) return null;

  console.log(`[Blob Storage] Uploading ${files.length} extracted WebP frames to Vercel Blob...`);
  const blobUrls = [];
  const videoPrefix = (meta.video || 'hero').replace(/[^a-zA-Z0-9_-]/g, '_');

  for (const file of files) {
    const filePath = path.join(desktopDir, file);
    try {
      const buffer = fs.readFileSync(filePath);
      const blobUrl = await uploadFileToBlob(`frames/${videoPrefix}/${file}`, buffer, 'image/webp');
      if (blobUrl) {
        blobUrls.push(blobUrl);
      } else {
        blobUrls.push(`/frames/desktop/${file}`);
      }
    } catch (e) {
      console.error(`[Blob Storage] Failed to upload ${file}:`, e);
      blobUrls.push(`/frames/desktop/${file}`);
    }
  }

  if (blobUrls.length > 0) {
    meta.blobUrls = blobUrls;
    try {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    } catch (e) {}

    // Persist blob URLs to active primary hero video row in database
    try {
      db.run(
        "UPDATE media_videos SET frame_urls = ? WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1",
        [JSON.stringify(blobUrls)]
      );
    } catch (dbErr) {
      console.warn('Could not update frame_urls in DB:', dbErr);
    }
  }

  return blobUrls;
}

// 10. GET frame URLs (fetches from Vercel Blob Storage CDN or local fallback)
router.get('/frame-urls', async (req, res) => {
  // 1. Check if active primary video row in DB has stored frame_urls
  try {
    const primaryVideo = await new Promise((resolve) => {
      db.get(
        "SELECT * FROM media_videos WHERE (video_type = 'hero' OR video_type IS NULL OR video_type = '') AND is_primary = 1 LIMIT 1",
        [],
        (err, row) => resolve(err ? null : row)
      );
    });

    if (primaryVideo && primaryVideo.frame_urls) {
      try {
        const parsed = JSON.parse(primaryVideo.frame_urls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ frameUrls: parsed, count: parsed.length, source: 'blob_db' });
        }
      } catch (e) {}
    }
  } catch (err) {}

  // 2. Check local frames/.video_meta.json
  const metaPath = path.join(projectRoot, 'frames/.video_meta.json');
  let meta = {};
  try {
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || {};
    }
  } catch (e) {}

  if (Array.isArray(meta.blobUrls) && meta.blobUrls.length > 0) {
    return res.json({ frameUrls: meta.blobUrls, count: meta.blobUrls.length, source: 'blob_meta' });
  }

  // 3. If token present and local frames exist, sync frames now and return blob URLs
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobUrls = await syncFramesToBlobStorage();
    if (Array.isArray(blobUrls) && blobUrls.length > 0) {
      return res.json({ frameUrls: blobUrls, count: blobUrls.length, source: 'blob_synced' });
    }
  }

  // 4. Fallback to local files ONLY if they actually exist on disk
  const desktopDir = path.join(projectRoot, 'frames/desktop');
  try {
    if (fs.existsSync(desktopDir)) {
      const localFiles = fs.readdirSync(desktopDir).filter(f => f.endsWith('.webp')).sort();
      if (localFiles.length > 0) {
        const localUrls = localFiles.map(f => `/frames/desktop/${f}`);
        return res.json({ frameUrls: localUrls, count: localUrls.length, source: 'local' });
      }
    }
  } catch (e) {}

  // 5. Clean empty response if no frames exist
  res.json({ frameUrls: [], count: 0, source: 'none' });
});

export default router;
