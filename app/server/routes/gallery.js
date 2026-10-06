import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/database.js';
import { uploadFileToBlob, deleteFileFromBlob } from '../utils/blobStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');
const galleryUploadsDir = process.env.VERCEL ? '/tmp/uploads/images/gallery' : path.join(projectRoot, 'uploads/images/gallery');
try { fs.mkdirSync(galleryUploadsDir, { recursive: true }); } catch (e) {}

const router = express.Router();

async function processGalleryImage(base64Str) {
  if (!base64Str || typeof base64Str !== 'string') return base64Str;
  if (!base64Str.startsWith('data:image/')) return base64Str;

  const matches = base64Str.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,([\s\S]+)$/);
  if (!matches || matches.length < 3) return base64Str;

  const mimeType = matches[1].toLowerCase();
  let ext = 'jpg';
  if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('gif')) ext = 'gif';

  const cleanBase64 = matches[2].replace(/\s+/g, '');
  const dataBuffer = Buffer.from(cleanBase64, 'base64');
  const filename = `gallery/image-${Date.now()}.${ext}`;

  // Try Vercel Blob Storage first if token is available
  const blobUrl = await uploadFileToBlob(filename, dataBuffer, mimeType);
  if (blobUrl) {
    return blobUrl;
  }

  if (process.env.VERCEL) {
    return base64Str;
  }

  const localPath = path.join(galleryUploadsDir, `image-${Date.now()}.${ext}`);
  fs.writeFileSync(localPath, dataBuffer);
  return `/uploads/images/gallery/${path.basename(localPath)}`;
}

// GET all gallery items
router.get('/', (req, res) => {
  db.all('SELECT id, image, created_at FROM gallery ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const safeRows = Array.isArray(rows) ? rows : [];
    res.json(safeRows);
  });
});

// POST add gallery item
router.post('/', async (req, res) => {
  let { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  try {
    image = await processGalleryImage(image);
  } catch (e) {
    console.error('Error processing gallery image:', e);
  }

  const sql = `INSERT INTO gallery (image) VALUES (?)`;
  db.run(sql, [image], function (err) {
    if (err) {
      console.error('Error inserting gallery item into DB:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, image });
  });
});

// PUT update gallery item
router.put('/:id', async (req, res) => {
  let { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  try {
    image = await processGalleryImage(image);
  } catch (e) {
    console.error('Error processing gallery image:', e);
  }

  const sql = `UPDATE gallery SET image = ? WHERE id = ?`;
  db.run(sql, [image, req.params.id], function (err) {
    if (err) {
      console.error('Error updating gallery item in DB:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Gallery item updated.', image });
  });
});

// DELETE gallery item
router.delete('/:id', (req, res) => {
  db.get('SELECT image FROM gallery WHERE id = ?', [req.params.id], (err, row) => {
    if (row && row.image) {
      if (row.image.includes('vercel-storage.com')) {
        deleteFileFromBlob(row.image);
      } else if (row.image.startsWith('/uploads/')) {
        const filePath = path.join(projectRoot, row.image);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
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
