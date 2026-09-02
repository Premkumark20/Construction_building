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
    cb(null, `prop-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`);
  }
});
const upload = multer({ storage });
const router = express.Router();

// Auto-generate SK-HOUSE-xxx property_id
const generatePropertyId = (cb) => {
  db.get("SELECT COUNT(*) as count FROM properties", [], (err, row) => {
    const nextNum = ((row?.count || 0) + 1).toString().padStart(3, '0');
    cb(`SK-HOUSE-${nextNum}`);
  });
};

// GET all properties with optional search, filter & pagination
router.get('/', (req, res) => {
  const { location, type, status, listing_type, published, featured, search } = req.query;
  let sql = 'SELECT * FROM properties WHERE 1=1';
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

  if (type && type !== 'All') {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (listing_type && listing_type !== 'All') {
    sql += ' AND listing_type = ?';
    params.push(listing_type);
  }

  if (search && search.trim()) {
    sql += ' AND (title LIKE ? OR address LIKE ? OR area LIKE ? OR description LIKE ? OR property_id LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term, term);
  }

  sql += ' ORDER BY id DESC';

  db.all(sql, params, (err, properties) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ properties: properties || [] });
  });
});

// GET single property by ID with associated images
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM properties WHERE id = ? OR property_id = ?', [req.params.id, req.params.id], (err, property) => {
    if (err || !property) return res.status(404).json({ error: 'Property not found' });

    db.all('SELECT * FROM property_images WHERE property_id = ? ORDER BY is_cover DESC, sort_order ASC', [property.id], (err, images) => {
      res.json({ property: { ...property, images: images || [] } });
    });
  });
});

// POST Create new Property
router.post('/', (req, res) => {
  const body = req.body;
  generatePropertyId((autoId) => {
    const propId = body.property_id || autoId;
    const title = body.title || 'Untitled Property';
    const type = body.type || 'Individual House';
    const listing_type = body.listing_type || 'For Sale';
    const status = body.status || 'Available';
    const price = body.price || 'Price on Request';
    const location = body.location || body.area || 'Poonamallee';
    const image = body.image || '/house/completed-house.jpg';

    const sql = `
      INSERT INTO properties (
        property_id, title, type, listing_type, status, address, area, city, pincode,
        maps_url, latitude, longitude, landmark, price, price_display_type, negotiable,
        price_per_sqft, plot_area, plot_area_unit, builtup_area, builtup_area_unit, floor_area,
        floors, bedrooms, bathrooms, balconies, kitchens, living_room, dining_area, pooja_room,
        construction_status, year_built, construction_type, roof_type, parking_available, parking_type,
        cars, bikes, compound_wall, gate, water_connection, eb_connection, sewer_connection,
        borewell, overhead_tank, ground_water, road_access, facing, road_width, road_width_unit,
        road_type, corner_property, patta_status, ec_status, approved_plan_status,
        building_approval_status, property_tax_status, sale_deed_status, other_documents,
        short_description, full_description, highlights, published, featured, category, location, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      propId, title, type, listing_type, status, body.address || '', body.area || location, body.city || 'Chennai', body.pincode || '',
      body.maps_url || '', body.latitude || '', body.longitude || '', body.landmark || '', price, body.price_display_type || 'Exact Price', body.negotiable || 'Yes',
      body.price_per_sqft || '', body.plot_area || '', body.plot_area_unit || 'sq.ft', body.builtup_area || '', body.builtup_area_unit || 'sq.ft', body.floor_area || '',
      body.floors || '1', body.bedrooms || '2 BHK', body.bathrooms || '2', body.balconies || '1', body.kitchens || '1', body.living_room || '1', body.dining_area || '1', body.pooja_room || '1',
      body.construction_status || 'Completed', body.year_built || '2024', body.construction_type || 'RCC / Concrete', body.roof_type || 'RCC Flat Concrete Roof', body.parking_available || 'Yes', body.parking_type || 'Car + Bike',
      body.cars || '1', body.bikes || '2', body.compound_wall ? 1 : 0, body.gate ? 1 : 0, body.water_connection ? 1 : 0, body.eb_connection ? 1 : 0, body.sewer_connection ? 1 : 0,
      body.borewell ? 1 : 0, body.overhead_tank ? 1 : 0, body.ground_water ? 1 : 0, body.road_access ? 1 : 0, body.facing || 'East', body.road_width || '30', body.road_width_unit || 'ft',
      body.road_type || 'Tar Road', body.corner_property || 'No', body.patta_status || 'Not Provided', body.ec_status || 'Not Provided', body.approved_plan_status || 'Not Provided',
      body.building_approval_status || 'Not Provided', body.property_tax_status || 'Not Provided', body.sale_deed_status || 'Not Provided', body.other_documents || '',
      body.short_description || '', body.full_description || '', body.highlights || '', body.published !== undefined ? (body.published ? 1 : 0) : 1, body.featured !== undefined ? (body.featured ? 1 : 0) : 0,
      body.category || 'Houses for Sale', location, image
    ];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, property_id: propId, message: 'Property created successfully' });
    });
  });
});

// PUT Update Property
router.put('/:id', (req, res) => {
  const body = req.body;
  const id = req.params.id;

  const sql = `
    UPDATE properties SET
      property_id = COALESCE(?, property_id),
      title = COALESCE(?, title),
      type = COALESCE(?, type),
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
      price = COALESCE(?, price),
      price_display_type = COALESCE(?, price_display_type),
      negotiable = COALESCE(?, negotiable),
      price_per_sqft = COALESCE(?, price_per_sqft),
      plot_area = COALESCE(?, plot_area),
      plot_area_unit = COALESCE(?, plot_area_unit),
      builtup_area = COALESCE(?, builtup_area),
      builtup_area_unit = COALESCE(?, builtup_area_unit),
      floor_area = COALESCE(?, floor_area),
      floors = COALESCE(?, floors),
      bedrooms = COALESCE(?, bedrooms),
      bathrooms = COALESCE(?, bathrooms),
      balconies = COALESCE(?, balconies),
      kitchens = COALESCE(?, kitchens),
      living_room = COALESCE(?, living_room),
      dining_area = COALESCE(?, dining_area),
      pooja_room = COALESCE(?, pooja_room),
      construction_status = COALESCE(?, construction_status),
      year_built = COALESCE(?, year_built),
      construction_type = COALESCE(?, construction_type),
      roof_type = COALESCE(?, roof_type),
      parking_available = COALESCE(?, parking_available),
      parking_type = COALESCE(?, parking_type),
      cars = COALESCE(?, cars),
      bikes = COALESCE(?, bikes),
      compound_wall = COALESCE(?, compound_wall),
      gate = COALESCE(?, gate),
      water_connection = COALESCE(?, water_connection),
      eb_connection = COALESCE(?, eb_connection),
      sewer_connection = COALESCE(?, sewer_connection),
      borewell = COALESCE(?, borewell),
      overhead_tank = COALESCE(?, overhead_tank),
      ground_water = COALESCE(?, ground_water),
      road_access = COALESCE(?, road_access),
      facing = COALESCE(?, facing),
      road_width = COALESCE(?, road_width),
      road_width_unit = COALESCE(?, road_width_unit),
      road_type = COALESCE(?, road_type),
      corner_property = COALESCE(?, corner_property),
      patta_status = COALESCE(?, patta_status),
      ec_status = COALESCE(?, ec_status),
      approved_plan_status = COALESCE(?, approved_plan_status),
      building_approval_status = COALESCE(?, building_approval_status),
      property_tax_status = COALESCE(?, property_tax_status),
      sale_deed_status = COALESCE(?, sale_deed_status),
      other_documents = COALESCE(?, other_documents),
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
    body.property_id, body.title, body.type, body.listing_type, body.status, body.address, body.area, body.city, body.pincode,
    body.maps_url, body.latitude, body.longitude, body.landmark, body.price, body.price_display_type, body.negotiable,
    body.price_per_sqft, body.plot_area, body.plot_area_unit, body.builtup_area, body.builtup_area_unit, body.floor_area,
    body.floors, body.bedrooms, body.bathrooms, body.balconies, body.kitchens, body.living_room, body.dining_area, body.pooja_room,
    body.construction_status, body.year_built, body.construction_type, body.roof_type, body.parking_available, body.parking_type,
    body.cars, body.bikes, body.compound_wall !== undefined ? (body.compound_wall ? 1 : 0) : null,
    body.gate !== undefined ? (body.gate ? 1 : 0) : null, body.water_connection !== undefined ? (body.water_connection ? 1 : 0) : null,
    body.eb_connection !== undefined ? (body.eb_connection ? 1 : 0) : null, body.sewer_connection !== undefined ? (body.sewer_connection ? 1 : 0) : null,
    body.borewell !== undefined ? (body.borewell ? 1 : 0) : null, body.overhead_tank !== undefined ? (body.overhead_tank ? 1 : 0) : null,
    body.ground_water !== undefined ? (body.ground_water ? 1 : 0) : null, body.road_access !== undefined ? (body.road_access ? 1 : 0) : null,
    body.facing, body.road_width, body.road_width_unit, body.road_type, body.corner_property,
    body.patta_status, body.ec_status, body.approved_plan_status, body.building_approval_status, body.property_tax_status,
    body.sale_deed_status, body.other_documents, body.short_description, body.full_description, body.highlights,
    body.published !== undefined ? (body.published ? 1 : 0) : null, body.featured !== undefined ? (body.featured ? 1 : 0) : null,
    body.location, body.image, id
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Property updated successfully', id });
  });
});

// DELETE Property
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT image FROM properties WHERE id = ?', [id], (err, propRow) => {
    db.all('SELECT image_url FROM property_images WHERE property_id = ?', [id], (err, imgRows) => {
      const filesToDelete = [];
      if (propRow && propRow.image && propRow.image.startsWith('/uploads/')) {
        filesToDelete.push(propRow.image);
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
          try { fs.unlinkSync(fullPath); console.log(`[Property Delete] Unlinked file: ${fullPath}`); } catch (e) {}
        }
      });

      db.run('DELETE FROM property_images WHERE property_id = ?', [id], () => {
        db.run('DELETE FROM properties WHERE id = ?', [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Property and associated image files deleted successfully' });
        });
      });
    });
  });
});

// MULTI-IMAGE UPLOAD for Property
router.post('/:id/images', upload.array('images', 20), (req, res) => {
  const propertyId = req.params.id;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files uploaded.' });
  }

  db.all('SELECT COUNT(*) as count FROM property_images WHERE property_id = ?', [propertyId], (err, rows) => {
    const existingCount = rows[0]?.count || 0;
    const insert = db.prepare('INSERT INTO property_images (property_id, image_url, sort_order, is_cover) VALUES (?, ?, ?, ?)');

    const uploadedImages = [];
    req.files.forEach((file, idx) => {
      const imgUrl = `/uploads/images/${file.filename}`;
      const isCover = (existingCount === 0 && idx === 0) ? 1 : 0;
      insert.run(propertyId, imgUrl, existingCount + idx, isCover);
      uploadedImages.push({ image_url: imgUrl, is_cover: isCover });

      if (isCover) {
        db.run('UPDATE properties SET image = ? WHERE id = ?', [imgUrl, propertyId]);
      }
    });

    insert.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Images uploaded successfully', images: uploadedImages });
    });
  });
});

// DELETE single Property image
router.delete('/:id/images/:imageId', (req, res) => {
  db.get('SELECT * FROM property_images WHERE id = ? AND property_id = ?', [req.params.imageId, req.params.id], (err, img) => {
    if (err || !img) return res.status(404).json({ error: 'Image not found' });

    db.run('DELETE FROM property_images WHERE id = ?', [req.params.imageId], () => {
      // If deleted image was cover, automatically assign new cover
      if (img.is_cover) {
        db.get('SELECT * FROM property_images WHERE property_id = ? ORDER BY id ASC LIMIT 1', [req.params.id], (err, nextImg) => {
          if (nextImg) {
            db.run('UPDATE property_images SET is_cover = 1 WHERE id = ?', [nextImg.id]);
            db.run('UPDATE properties SET image = ? WHERE id = ?', [nextImg.image_url, req.params.id]);
          }
        });
      }
      res.json({ message: 'Image deleted' });
    });
  });
});

// SET Cover Image for Property
router.put('/:id/images/:imageId/cover', (req, res) => {
  const { id, imageId } = req.params;
  db.get('SELECT * FROM property_images WHERE id = ? AND property_id = ?', [imageId, id], (err, img) => {
    if (err || !img) return res.status(404).json({ error: 'Image not found' });

    db.run('UPDATE property_images SET is_cover = 0 WHERE property_id = ?', [id], () => {
      db.run('UPDATE property_images SET is_cover = 1 WHERE id = ?', [imageId], () => {
        db.run('UPDATE properties SET image = ? WHERE id = ?', [img.image_url, id], () => {
          res.json({ message: 'Cover image updated', cover: img.image_url });
        });
      });
    });
  });
});

export default router;
