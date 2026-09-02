import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');

const uploadsDir = path.join(projectRoot, 'uploads');
const imageUploadsDir = path.join(uploadsDir, 'images');
const videoUploadsDir = path.join(uploadsDir, 'videos');
const tempUploadsDir = path.join(videoUploadsDir, 'temp');
const bgVideosDir = path.join(projectRoot, 'app/public/videos');

fs.mkdirSync(imageUploadsDir, { recursive: true });
fs.mkdirSync(videoUploadsDir, { recursive: true });
fs.mkdirSync(tempUploadsDir, { recursive: true });
fs.mkdirSync(bgVideosDir, { recursive: true });

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

// Helper to auto-sync background videos from app/public/videos
const syncBackgroundVideos = (callback) => {
  try {
    const bgFiles = fs.readdirSync(bgVideosDir).filter(f => f.toLowerCase().endsWith('.mp4') || f.toLowerCase().endsWith('.webm'));
    
    // Purge records for missing background files
    db.all("SELECT id, filename FROM media_videos WHERE video_type = 'background'", [], (err, rows) => {
      if (!err && Array.isArray(rows)) {
        rows.forEach(r => {
          if (!fs.existsSync(path.join(bgVideosDir, r.filename))) {
            db.run("DELETE FROM media_videos WHERE id = ?", [r.id]);
          }
        });
      }

      // Add new files from folder into DB
      let processed = 0;
      if (bgFiles.length === 0) {
        return callback ? callback() : null;
      }

      bgFiles.forEach(file => {
        const fullP = path.join(bgVideosDir, file);
        const stats = fs.statSync(fullP);
        db.get("SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND video_type = 'background'", [file], (err, existing) => {
          if (!existing) {
            db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = 'background' AND is_primary = 1", [], (err, primRow) => {
              const isPrim = (!primRow || primRow.count === 0) ? 1 : 0;
              db.run(
                "INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'background', ?, ?)",
                [file, `app/public/videos/${file}`, isPrim, stats.size],
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

// 1. Upload single image
router.post('/upload-image', upload.single('image'), (req, res) => {
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
  const imageUrl = `/uploads/images/${subPath}${req.file.filename}`;
  res.json({ imageUrl, filename: req.file.filename });
});

// 2. GET all video files in database
router.get('/videos', (req, res) => {
  syncBackgroundVideos(() => {
    db.run("UPDATE media_videos SET video_type = 'hero' WHERE video_type IS NULL OR video_type = ''", [], () => {
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

// 2b. GET active primary background video
router.get('/background-video', (req, res) => {
  syncBackgroundVideos(() => {
    db.get("SELECT * FROM media_videos WHERE video_type = 'background' AND is_primary = 1 LIMIT 1", [], (err, row) => {
      if (!err && row) {
        return res.json({ videoUrl: `/videos/${row.filename}`, filename: row.filename, video: row });
      }
      // Fallback
      db.get("SELECT * FROM media_videos WHERE video_type = 'background' LIMIT 1", [], (err, fallbackRow) => {
        if (!err && fallbackRow) {
          return res.json({ videoUrl: `/videos/${fallbackRow.filename}`, filename: fallbackRow.filename, video: fallbackRow });
        }
        res.json({ videoUrl: '/videos/Background.mp4', filename: 'Background.mp4', video: null });
      });
    });
  });
});

// 3. Upload new video file (Supports both 'hero' and 'background')
router.post('/upload-video', upload.single('video'), (req, res) => {
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
  const relativePath = videoType === 'background' ? `app/public/videos/${finalFilename}` : `uploads/videos/${finalFilename}`;

  // Check if video file with finalFilename ALREADY EXISTS in database or on disk
  db.get('SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND video_type = ?', [finalFilename, videoType], (err, row) => {
    if (row || fs.existsSync(targetPath)) {
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

    db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = ?", [videoType], (err, countRow) => {
      const isFirstVideo = (!err && countRow.count === 0);
      const setPrimary = isFirstVideo ? 1 : 0;

      const sql = `INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, ?, ?, ?)`;
      db.run(sql, [finalFilename, relativePath, videoType, setPrimary, req.file.size], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const newId = this.lastID;
        res.json({ id: newId, filename: finalFilename, filepath: relativePath, video_type: videoType, is_primary: setPrimary });

        // If it's a hero video and set as primary, extract frames
        if (videoType === 'hero' && isFirstVideo) {
          const pyProc = spawn('python', ['-u', 'python/extract_frames.py'], { cwd: projectRoot });
          pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
          pyProc.stderr.on('data', data => process.stderr.write(data.toString()));
        }
      });
    });
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
    const newRelativePath = videoType === 'background' ? `app/public/videos/${finalName}` : `uploads/videos/${finalName}`;
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

      // Only extract frames if the renamed video IS the active primary HERO video
      if (videoType === 'hero' && Number(row.is_primary) === 1) {
        console.log(`\n[Auto Frame Extraction] Primary Hero video renamed to '${finalName}'. Processing frames...`);
        const pyProc = spawn('python', ['-u', 'python/extract_frames.py'], { cwd: projectRoot });
        pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
        pyProc.stderr.on('data', data => process.stderr.write(data.toString()));
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

    const baseDir = videoType === 'background' ? bgVideosDir : videoUploadsDir;
    const fullPath = path.join(baseDir, row.filename);
    const altPath = path.join(projectRoot, row.filepath);

    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) { console.error('Error removing video:', e); }
    } else if (fs.existsSync(altPath)) {
      try { fs.unlinkSync(altPath); } catch (e) { console.error('Error removing video:', e); }
    }

    db.run('DELETE FROM media_videos WHERE id = ?', [req.params.id], () => {
      if (wasPrimary) {
        // Re-assign new primary of SAME video_type
        db.get('SELECT * FROM media_videos WHERE video_type = ? ORDER BY id DESC LIMIT 1', [videoType], (err, nextPrimary) => {
          if (!err && nextPrimary) {
            db.run('UPDATE media_videos SET is_primary = 1 WHERE id = ?', [nextPrimary.id], () => {
              res.json({ message: `Primary ${videoType} video deleted, new primary assigned.` });
              if (videoType === 'hero') {
                console.log(`\n[Auto Frame Extraction] Primary hero video deleted. New primary is '${nextPrimary.filename}'. Processing frames...`);
                const pyProc = spawn('python', ['-u', 'python/extract_frames.py'], { cwd: projectRoot });
                pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
                pyProc.stderr.on('data', data => process.stderr.write(data.toString()));
              }
            });
          } else {
            res.json({ message: `Primary ${videoType} video deleted. No remaining videos.` });
          }
        });
      } else {
        res.json({ message: 'Video deleted successfully.' });
      }
    });
  });
});

// 6. Set Primary Video for Hero OR Background
router.post('/set-primary-video', (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required.' });
  }

  db.get('SELECT * FROM media_videos WHERE id = ?', [videoId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Target video not found.' });
    }

    const videoType = row.video_type || 'hero';

    db.run('UPDATE media_videos SET is_primary = 0 WHERE video_type = ?', [videoType], () => {
      db.run('UPDATE media_videos SET is_primary = 1 WHERE id = ?', [videoId], () => {
        res.json({
          message: `Primary ${videoType} video set successfully!`,
          video: row.filename,
          video_type: videoType
        });

        if (videoType === 'hero') {
          console.log(`\n[Auto Frame Extraction] Active Primary Hero Video changed to '${row.filename}'. Checking frames...`);
          const pyProc = spawn('python', ['-u', 'python/extract_frames.py'], { cwd: projectRoot });
          pyProc.stdout.on('data', (data) => process.stdout.write(data.toString()));
          pyProc.stderr.on('data', (data) => process.stderr.write(data.toString()));
        }
      });
    });
  });
});

export default router;
