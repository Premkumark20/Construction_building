import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');
const galleryUploadsDir = path.join(projectRoot, 'uploads/images/gallery');

fs.mkdirSync(galleryUploadsDir, { recursive: true });

const router = express.Router();

function saveBase64Image(base64Str) {
  if (!base64Str || typeof base64Str !== 'string') return base64Str;
  if (!base64Str.startsWith('data:image/')) return base64Str;

  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,([\s\S]+)$/);
  if (!matches || matches.length < 3) return base64Str;

  let mimeSubtype = matches[1].toLowerCase();
  let ext = 'jpg';
  if (mimeSubtype.includes('png')) ext = 'png';
  else if (mimeSubtype.includes('webp')) ext = 'webp';
  else if (mimeSubtype.includes('gif')) ext = 'gif';

  const cleanBase64 = matches[2].replace(/\s+/g, '');
  const data = Buffer.from(cleanBase64, 'base64');
  const filename = `image-${Date.now()}.${ext}`;
  const fullPath = path.join(galleryUploadsDir, filename);

  fs.writeFileSync(fullPath, data);
  console.log(`[Gallery Upload] Saved base64 image file to: ${fullPath}`);
  return `/uploads/images/gallery/${filename}`;
}

// GET all gallery items
router.get('/', (req, res) => {
  db.all('SELECT id, image, created_at FROM gallery ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const safeRows = Array.isArray(rows) ? rows : [];

    // Auto-migrate any legacy base64 entries in DB to physical files
    safeRows.forEach(row => {
      if (row.image && row.image.startsWith('data:image/')) {
        try {
          const filePath = saveBase64Image(row.image);
          if (filePath !== row.image) {
            row.image = filePath;
            db.run('UPDATE gallery SET image = ? WHERE id = ?', [filePath, row.id]);
          }
        } catch (e) {
          console.error('Error auto-migrating base64 gallery row:', e);
        }
      }
    });

    res.json(safeRows);
  });
});

// POST add gallery item
router.post('/', (req, res) => {
  let { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  try {
    image = saveBase64Image(image);
  } catch (e) {
    console.error('Error saving gallery image:', e);
  }

  const sql = `INSERT INTO gallery (image) VALUES (?)`;
  db.run(sql, [image], function (err) {
    if (err) {
      console.error('Error inserting gallery item into SQLite:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, image });
  });
});

// PUT update gallery item
router.put('/:id', (req, res) => {
  let { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  try {
    image = saveBase64Image(image);
  } catch (e) {
    console.error('Error saving gallery image:', e);
  }

  const sql = `UPDATE gallery SET image = ? WHERE id = ?`;
  db.run(sql, [image, req.params.id], function (err) {
    if (err) {
      console.error('Error updating gallery item in SQLite:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Gallery item updated.', image });
  });
});

// DELETE gallery item
router.delete('/:id', (req, res) => {
  db.get('SELECT image FROM gallery WHERE id = ?', [req.params.id], (err, row) => {
    if (row && row.image && row.image.startsWith('/uploads/')) {
      const filePath = path.join(projectRoot, row.image);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); console.log(`[Gallery Delete] Physical file unlinked: ${filePath}`); } catch (e) {}
      }
    }
    db.run('DELETE FROM gallery WHERE id = ?', [req.params.id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Gallery item deleted.' });
    });
  });
});

export default router;
