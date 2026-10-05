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

// 2. GET all video files in database (Syncs both background and hero videos)
router.get('/videos', (req, res) => {
  syncBackgroundVideos(() => {
    syncHeroVideos(() => {
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
});

// 2b. GET active primary background video
router.get('/background-video', (req, res) => {
  syncBackgroundVideos(() => {
    db.get("SELECT * FROM media_videos WHERE video_type = 'background' AND is_primary = 1 LIMIT 1", [], (err, row) => {
      if (!err && row) {
        return res.json({ videoUrl: `/videos/${row.filename}`, filename: row.filename, video: row });
      }
      db.get("SELECT * FROM media_videos WHERE video_type = 'background' LIMIT 1", [], (err, fallbackRow) => {
        if (!err && fallbackRow) {
          return res.json({ videoUrl: `/videos/${fallbackRow.filename}`, filename: fallbackRow.filename, video: fallbackRow });
        }
        res.json({ videoUrl: '', filename: '', video: null });
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
  const relativePath = videoType === 'background' ? `videos/${finalFilename}` : `uploads/videos/${finalFilename}`;

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

    if (videoType === 'background') {
      try {
        fs.mkdirSync(appPublicVideosDir, { recursive: true });
        fs.copyFileSync(targetPath, path.join(appPublicVideosDir, finalFilename));
      } catch (copyErr) {}
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

        if (videoType === 'hero' && isFirstVideo) {
          console.log(`\n[Auto Frame Extraction] First Hero video uploaded. Purging old frame cache and extracting...`);
          const pyProc = spawn('python', ['-u', 'python/extract_frames.py', '--force'], { cwd: projectRoot });
          pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
          pyProc.stderr.on('data', data => process.stdout.write(data.toString()));
        }
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
        console.log(`\n[Auto Frame Extraction] Primary Hero video renamed to '${finalName}'. Purging old frames & re-extracting...`);
        const pyProc = spawn('python', ['-u', 'python/extract_frames.py', '--force'], { cwd: projectRoot });
        pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
        pyProc.stderr.on('data', data => process.stdout.write(data.toString()));
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
                console.log(`\n[Auto Frame Extraction] Primary hero video deleted. New primary is '${nextPrimary.filename}'. Purging old frames & re-extracting...`);
                const pyProc = spawn('python', ['-u', 'python/extract_frames.py', '--force'], { cwd: projectRoot });
                pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
                pyProc.stderr.on('data', data => process.stdout.write(data.toString()));
              }
            });
          } else {
            res.json({ message: `Primary ${videoType} video deleted. No remaining videos.` });
            if (videoType === 'hero') {
              console.log(`\n[Auto Frame Extraction] Primary hero video deleted with no remaining videos. Purging frames...`);
              const pyProc = spawn('python', ['-u', 'python/extract_frames.py', '--force'], { cwd: projectRoot });
              pyProc.stdout.on('data', data => process.stdout.write(data.toString()));
              pyProc.stderr.on('data', data => process.stdout.write(data.toString()));
            }
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
          console.log(`\n[Auto Frame Extraction] Active Primary Hero Video changed to '${row.filename}'. Purging old frames & extracting new frames...`);
          const pyProc = spawn('python', ['-u', 'python/extract_frames.py', '--force'], { cwd: projectRoot });
          pyProc.stdout.on('data', (data) => process.stdout.write(data.toString()));
          pyProc.stderr.on('data', (data) => process.stderr.write(data.toString()));
        }
      });
    });
  });
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

export default router;
