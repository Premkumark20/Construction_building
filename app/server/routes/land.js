import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');
const uploadsDir = path.join(projectRoot, 'uploads/images');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `land-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`);
  }
});
const upload = multer({ storage });
const router = express.Router();

// Auto-generate SK-LAND-xxx land_id
const generateLandId = (cb) => {
  db.get("SELECT COUNT(*) as count FROM land", [], (err, row) => {
    const nextNum = ((row?.count || 0) + 1).toString().padStart(3, '0');
    cb(`SK-LAND-${nextNum}`);
  });
};

// GET all land records
router.get('/', (req, res) => {
  const { location, land_type, status, approval_status, published, featured, search } = req.query;
  let sql = 'SELECT * FROM land WHERE 1=1';
  const params = [];

  if (published !== undefined && published !== '') {
    sql += ' AND published = ?';
    params.push(published === 'true' || published === '1' ? 1 : 0);
  }

  if (featured !== undefined && featured !== '') {
    sql += ' AND featured = ?';
    params.push(featured === 'true' || featured === '1' ? 1 : 0);
  }

  if (location && location !== 'All') {
    sql += ' AND (location = ? OR area = ?)';
    params.push(location, location);
  }

  if (land_type && land_type !== 'All') {
    sql += ' AND land_type = ?';
    params.push(land_type);
  }

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (approval_status && approval_status !== 'All') {
    sql += ' AND approval_status = ?';
    params.push(approval_status);
  }

  if (search && search.trim()) {
    sql += ' AND (title LIKE ? OR address LIKE ? OR area LIKE ? OR description LIKE ? OR land_id LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term, term);
  }

  sql += ' ORDER BY id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ land: rows || [] });
  });
});

// GET single land record by ID with images
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM land WHERE id = ? OR land_id = ?', [req.params.id, req.params.id], (err, land) => {
    if (err || !land) return res.status(404).json({ error: 'Land record not found' });

    db.all('SELECT * FROM land_images WHERE land_id = ? ORDER BY is_cover DESC, sort_order ASC', [land.id], (err, images) => {
      res.json({ land: { ...land, images: images || [] } });
    });
  });
});

// POST Create new Land record
router.post('/', (req, res) => {
  const body = req.body;
  generateLandId((autoId) => {
    const landId = body.land_id || autoId;
    const title = body.title || 'Residential Plot';
    const land_type = body.land_type || 'Residential Plot';
    const listing_type = body.listing_type || 'For Sale';
    const status = body.status || 'Available';
    const total_price = body.total_price || body.price || 'Price on Request';
    const plot_area = body.plot_area || '1200';
    const location = body.location || body.area || 'Poonamallee';
    const image = body.image || '/house/completed-house.jpg';

    const sql = `
      INSERT INTO land (
        land_id, title, land_type, listing_type, status, address, area, city, pincode,
        maps_url, latitude, longitude, landmark, plot_area, plot_area_unit, frontage, length, width,
        total_price, price_per_sqft, negotiable, price_display_type, approval_status, facing,
        road_width, road_width_unit, road_type, road_facing, corner_plot, eb_available, water_available,
        drainage_available, borewell_available, patta_status, ec_status, parent_documents_status,
        sale_deed_status, approval_documents_status, other_documents, nearby_school, nearby_hospital,
        nearby_bus_stop, nearby_railway, nearby_main_road, nearby_shopping, short_description,
        full_description, highlights, published, featured, location, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      landId, title, land_type, listing_type, status, body.address || '', body.area || location, body.city || 'Chennai', body.pincode || '',
      body.maps_url || '', body.latitude || '', body.longitude || '', body.landmark || '', plot_area, body.plot_area_unit || 'sq.ft',
      body.frontage || '', body.length || '', body.width || '', total_price, body.price_per_sqft || '', body.negotiable || 'Yes',
      body.price_display_type || 'Exact Price', body.approval_status || 'Not Provided', body.facing || 'East', body.road_width || '30',
      body.road_width_unit || 'ft', body.road_type || 'Tar Road', body.road_facing || 'North', body.corner_plot || 'No',
      body.eb_available ? 1 : 0, body.water_available ? 1 : 0, body.drainage_available ? 1 : 0, body.borewell_available ? 1 : 0,
      body.patta_status || 'Not Provided', body.ec_status || 'Not Provided', body.parent_documents_status || 'Not Provided',
      body.sale_deed_status || 'Not Provided', body.approval_documents_status || 'Not Provided', body.other_documents || '',
      body.nearby_school || '', body.nearby_hospital || '', body.nearby_bus_stop || '', body.nearby_railway || '', body.nearby_main_road || '', body.nearby_shopping || '',
      body.short_description || '', body.full_description || '', body.highlights || '', body.published !== undefined ? (body.published ? 1 : 0) : 1,
      body.featured !== undefined ? (body.featured ? 1 : 0) : 0, location, image
    ];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, land_id: landId, message: 'Land record created successfully' });
    });
  });
});

// PUT Update Land record
router.put('/:id', (req, res) => {
  const body = req.body;
  const id = req.params.id;

  const sql = `
    UPDATE land SET
      land_id = COALESCE(?, land_id),
      title = COALESCE(?, title),
      land_type = COALESCE(?, land_type),
      listing_type = COALESCE(?, listing_type),
      status = COALESCE(?, status),
      address = COALESCE(?, address),
      area = COALESCE(?, area),
      city = COALESCE(?, city),
      pincode = COALESCE(?, pincode),
      maps_url = COALESCE(?, maps_url),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      landmark = COALESCE(?, landmark),
      plot_area = COALESCE(?, plot_area),
      plot_area_unit = COALESCE(?, plot_area_unit),
      frontage = COALESCE(?, frontage),
      length = COALESCE(?, length),
      width = COALESCE(?, width),
      total_price = COALESCE(?, total_price),
      price_per_sqft = COALESCE(?, price_per_sqft),
      negotiable = COALESCE(?, negotiable),
      price_display_type = COALESCE(?, price_display_type),
      approval_status = COALESCE(?, approval_status),
      facing = COALESCE(?, facing),
      road_width = COALESCE(?, road_width),
      road_width_unit = COALESCE(?, road_width_unit),
      road_type = COALESCE(?, road_type),
      road_facing = COALESCE(?, road_facing),
      corner_plot = COALESCE(?, corner_plot),
      eb_available = COALESCE(?, eb_available),
      water_available = COALESCE(?, water_available),
      drainage_available = COALESCE(?, drainage_available),
      borewell_available = COALESCE(?, borewell_available),
      patta_status = COALESCE(?, patta_status),
      ec_status = COALESCE(?, ec_status),
      parent_documents_status = COALESCE(?, parent_documents_status),
      sale_deed_status = COALESCE(?, sale_deed_status),
      approval_documents_status = COALESCE(?, approval_documents_status),
      other_documents = COALESCE(?, other_documents),
      nearby_school = COALESCE(?, nearby_school),
      nearby_hospital = COALESCE(?, nearby_hospital),
      nearby_bus_stop = COALESCE(?, nearby_bus_stop),
      nearby_railway = COALESCE(?, nearby_railway),
      nearby_main_road = COALESCE(?, nearby_main_road),
      nearby_shopping = COALESCE(?, nearby_shopping),
      short_description = COALESCE(?, short_description),
      full_description = COALESCE(?, full_description),
      highlights = COALESCE(?, highlights),
      published = COALESCE(?, published),
      featured = COALESCE(?, featured),
      location = COALESCE(?, location),
      image = COALESCE(?, image),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    body.land_id, body.title, body.land_type, body.listing_type, body.status, body.address, body.area, body.city, body.pincode,
    body.maps_url, body.latitude, body.longitude, body.landmark, body.plot_area, body.plot_area_unit, body.frontage, body.length, body.width,
    body.total_price, body.price_per_sqft, body.negotiable, body.price_display_type, body.approval_status, body.facing,
    body.road_width, body.road_width_unit, body.road_type, body.road_facing, body.corner_plot,
    body.eb_available !== undefined ? (body.eb_available ? 1 : 0) : null,
    body.water_available !== undefined ? (body.water_available ? 1 : 0) : null,
    body.drainage_available !== undefined ? (body.drainage_available ? 1 : 0) : null,
    body.borewell_available !== undefined ? (body.borewell_available ? 1 : 0) : null,
    body.patta_status, body.ec_status, body.parent_documents_status, body.sale_deed_status, body.approval_documents_status,
    body.other_documents, body.nearby_school, body.nearby_hospital, body.nearby_bus_stop, body.nearby_railway, body.nearby_main_road, body.nearby_shopping,
    body.short_description, body.full_description, body.highlights,
    body.published !== undefined ? (body.published ? 1 : 0) : null,
    body.featured !== undefined ? (body.featured ? 1 : 0) : null,
    body.location, body.image, id
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Land record updated successfully', id });
  });
});

// DELETE Land record
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT image FROM land WHERE id = ?', [id], (err, landRow) => {
    db.all('SELECT image_url FROM land_images WHERE land_id = ?', [id], (err, imgRows) => {
      const filesToDelete = [];
      if (landRow && landRow.image && landRow.image.startsWith('/uploads/')) {
        filesToDelete.push(landRow.image);
      }
      if (Array.isArray(imgRows)) {
        imgRows.forEach(r => {
          if (r.image_url && r.image_url.startsWith('/uploads/')) {
            filesToDelete.push(r.image_url);
          }
        });
      }

      filesToDelete.forEach(relPath => {
        const fullPath = path.join(projectRoot, relPath);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); console.log(`[Land Delete] Unlinked file: ${fullPath}`); } catch (e) {}
        }
      });

      db.run('DELETE FROM land_images WHERE land_id = ?', [id], () => {
        db.run('DELETE FROM land WHERE id = ?', [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Land record and associated image files deleted successfully' });
        });
      });
    });
  });
});

// MULTI-IMAGE UPLOAD for Land
router.post('/:id/images', upload.array('images', 20), (req, res) => {
  const landId = req.params.id;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files uploaded.' });
  }

  db.all('SELECT COUNT(*) as count FROM land_images WHERE land_id = ?', [landId], (err, rows) => {
    const existingCount = rows[0]?.count || 0;
    const insert = db.prepare('INSERT INTO land_images (land_id, image_url, sort_order, is_cover) VALUES (?, ?, ?, ?)');

    const uploadedImages = [];
    req.files.forEach((file, idx) => {
      const imgUrl = `/uploads/images/${file.filename}`;
      const isCover = (existingCount === 0 && idx === 0) ? 1 : 0;
      insert.run(landId, imgUrl, existingCount + idx, isCover);
      uploadedImages.push({ image_url: imgUrl, is_cover: isCover });

      if (isCover) {
        db.run('UPDATE land SET image = ? WHERE id = ?', [imgUrl, landId]);
      }
    });

    insert.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Land images uploaded successfully', images: uploadedImages });
    });
  });
});

// DELETE single Land image
router.delete('/:id/images/:imageId', (req, res) => {
  db.get('SELECT * FROM land_images WHERE id = ? AND land_id = ?', [req.params.imageId, req.params.id], (err, img) => {
    if (err || !img) return res.status(404).json({ error: 'Image not found' });

    db.run('DELETE FROM land_images WHERE id = ?', [req.params.imageId], () => {
      if (img.is_cover) {
        db.get('SELECT * FROM land_images WHERE land_id = ? ORDER BY id ASC LIMIT 1', [req.params.id], (err, nextImg) => {
          if (nextImg) {
            db.run('UPDATE land_images SET is_cover = 1 WHERE id = ?', [nextImg.id]);
            db.run('UPDATE land SET image = ? WHERE id = ?', [nextImg.image_url, req.params.id]);
          }
        });
      }
      res.json({ message: 'Land image deleted' });
    });
  });
});

// SET Cover Image for Land
router.put('/:id/images/:imageId/cover', (req, res) => {
  const { id, imageId } = req.params;
  db.get('SELECT * FROM land_images WHERE id = ? AND land_id = ?', [imageId, id], (err, img) => {
    if (err || !img) return res.status(404).json({ error: 'Image not found' });

    db.run('UPDATE land_images SET is_cover = 0 WHERE land_id = ?', [id], () => {
      db.run('UPDATE land_images SET is_cover = 1 WHERE id = ?', [imageId], () => {
        db.run('UPDATE land SET image = ? WHERE id = ?', [img.image_url, id], () => {
          res.json({ message: 'Cover image updated', cover: img.image_url });
        });
      });
    });
  });
});

export default router;
