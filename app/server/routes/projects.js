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
    cb(null, `proj-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`);
  }
});
const upload = multer({ storage });
const router = express.Router();

// Auto-generate SK-PROJECT-xxx project_id
const generateProjectId = (cb) => {
  db.get("SELECT COUNT(*) as count FROM projects", [], (err, row) => {
    const nextNum = ((row?.count || 0) + 1).toString().padStart(3, '0');
    cb(`SK-PROJECT-${nextNum}`);
  });
};

// GET all projects
router.get('/', (req, res) => {
  const { status, project_type, location, published, featured, search } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1';
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
    sql += ' AND location = ?';
    params.push(location);
  }

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (project_type && project_type !== 'All') {
    sql += ' AND project_type = ?';
    params.push(project_type);
  }

  if (search && search.trim()) {
    sql += ' AND (title LIKE ? OR name LIKE ? OR location LIKE ? OR description LIKE ? OR project_id LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term, term);
  }

  sql += ' ORDER BY id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ projects: rows || [] });
  });
});

// GET single project by ID with categorized images
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM projects WHERE id = ? OR project_id = ?', [req.params.id, req.params.id], (err, project) => {
    if (err || !project) return res.status(404).json({ error: 'Project not found' });

    db.all('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC', [project.id], (err, images) => {
      res.json({ project: { ...project, images: images || [] } });
    });
  });
});

// POST Create new Project
router.post('/', (req, res) => {
  const body = req.body;
  generateProjectId((autoId) => {
    const projId = body.project_id || autoId;
    const name = body.name || body.title || 'House Construction Project';
    const title = body.title || name;
    const project_type = body.project_type || 'Individual House';
    const status = body.status || 'Completed';
    const location = body.location || 'Poonamallee';
    const cover_image = body.cover_image || body.image || '/house/completed-house.jpg';

    const sql = `
      INSERT INTO projects (
        project_id, name, title, project_type, status, address, area, city, pincode,
        maps_url, latitude, longitude, plot_area, plot_area_unit, builtup_area, builtup_area_unit,
        floors, bedrooms, bathrooms, start_date, expected_completion_date, actual_completion_date,
        rcc_structure, concrete_roof, compound_wall, gate, parking, water_connection, electrical_work,
        plumbing, painting, interior_work, overview, description, construction_details, special_features,
        challenges, solutions, client_requirements, final_outcome, completion_date, cover_image,
        published, featured, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      projId, name, title, project_type, status, body.address || '', body.area || location, body.city || 'Chennai', body.pincode || '',
      body.maps_url || '', body.latitude || '', body.longitude || '', body.plot_area || '', body.plot_area_unit || 'sq.ft', body.builtup_area || '', body.builtup_area_unit || 'sq.ft',
      body.floors || '2', body.bedrooms || '3 BHK', body.bathrooms || '3', body.start_date || '', body.expected_completion_date || '', body.actual_completion_date || '',
      body.rcc_structure ? 1 : 0, body.concrete_roof ? 1 : 0, body.compound_wall ? 1 : 0, body.gate ? 1 : 0, body.parking ? 1 : 0, body.water_connection ? 1 : 0, body.electrical_work ? 1 : 0,
      body.plumbing ? 1 : 0, body.painting ? 1 : 0, body.interior_work ? 1 : 0, body.overview || '', body.description || '', body.construction_details || '', body.special_features || '',
      body.challenges || '', body.solutions || '', body.client_requirements || '', body.final_outcome || '', body.completion_date || '2024', cover_image,
      body.published !== undefined ? (body.published ? 1 : 0) : 1, body.featured !== undefined ? (body.featured ? 1 : 0) : 0, location
    ];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, project_id: projId, message: 'Project created successfully' });
    });
  });
});

// PUT Update Project
router.put('/:id', (req, res) => {
  const body = req.body;
  const id = req.params.id;

  const sql = `
    UPDATE projects SET
      project_id = COALESCE(?, project_id),
      name = COALESCE(?, name),
      title = COALESCE(?, title),
      project_type = COALESCE(?, project_type),
      status = COALESCE(?, status),
      address = COALESCE(?, address),
      area = COALESCE(?, area),
      city = COALESCE(?, city),
      pincode = COALESCE(?, pincode),
      maps_url = COALESCE(?, maps_url),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      plot_area = COALESCE(?, plot_area),
      plot_area_unit = COALESCE(?, plot_area_unit),
      builtup_area = COALESCE(?, builtup_area),
      builtup_area_unit = COALESCE(?, builtup_area_unit),
      floors = COALESCE(?, floors),
      bedrooms = COALESCE(?, bedrooms),
      bathrooms = COALESCE(?, bathrooms),
      start_date = COALESCE(?, start_date),
      expected_completion_date = COALESCE(?, expected_completion_date),
      actual_completion_date = COALESCE(?, actual_completion_date),
      rcc_structure = COALESCE(?, rcc_structure),
      concrete_roof = COALESCE(?, concrete_roof),
      compound_wall = COALESCE(?, compound_wall),
      gate = COALESCE(?, gate),
      parking = COALESCE(?, parking),
      water_connection = COALESCE(?, water_connection),
      electrical_work = COALESCE(?, electrical_work),
      plumbing = COALESCE(?, plumbing),
      painting = COALESCE(?, painting),
      interior_work = COALESCE(?, interior_work),
      overview = COALESCE(?, overview),
      description = COALESCE(?, description),
      construction_details = COALESCE(?, construction_details),
      special_features = COALESCE(?, special_features),
      challenges = COALESCE(?, challenges),
      solutions = COALESCE(?, solutions),
      client_requirements = COALESCE(?, client_requirements),
      final_outcome = COALESCE(?, final_outcome),
      completion_date = COALESCE(?, completion_date),
      cover_image = COALESCE(?, cover_image),
      published = COALESCE(?, published),
      featured = COALESCE(?, featured),
      location = COALESCE(?, location),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    body.project_id, body.name, body.title, body.project_type, body.status, body.address, body.area, body.city, body.pincode,
    body.maps_url, body.latitude, body.longitude, body.plot_area, body.plot_area_unit, body.builtup_area, body.builtup_area_unit,
    body.floors, body.bedrooms, body.bathrooms, body.start_date, body.expected_completion_date, body.actual_completion_date,
    body.rcc_structure !== undefined ? (body.rcc_structure ? 1 : 0) : null,
    body.concrete_roof !== undefined ? (body.concrete_roof ? 1 : 0) : null,
    body.compound_wall !== undefined ? (body.compound_wall ? 1 : 0) : null,
    body.gate !== undefined ? (body.gate ? 1 : 0) : null,
    body.parking !== undefined ? (body.parking ? 1 : 0) : null,
    body.water_connection !== undefined ? (body.water_connection ? 1 : 0) : null,
    body.electrical_work !== undefined ? (body.electrical_work ? 1 : 0) : null,
    body.plumbing !== undefined ? (body.plumbing ? 1 : 0) : null,
    body.painting !== undefined ? (body.painting ? 1 : 0) : null,
    body.interior_work !== undefined ? (body.interior_work ? 1 : 0) : null,
    body.overview, body.description, body.construction_details, body.special_features,
    body.challenges, body.solutions, body.client_requirements, body.final_outcome,
    body.completion_date, body.cover_image,
    body.published !== undefined ? (body.published ? 1 : 0) : null,
    body.featured !== undefined ? (body.featured ? 1 : 0) : null,
    body.location, id
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Project updated successfully', id });
  });
});

// DELETE Project
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT cover_image, image FROM projects WHERE id = ?', [id], (err, projRow) => {
    db.all('SELECT image_url FROM project_images WHERE project_id = ?', [id], (err, imgRows) => {
      const filesToDelete = [];
      if (projRow && projRow.cover_image && projRow.cover_image.startsWith('/uploads/')) {
        filesToDelete.push(projRow.cover_image);
      }
      if (projRow && projRow.image && projRow.image.startsWith('/uploads/')) {
        filesToDelete.push(projRow.image);
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
          try { fs.unlinkSync(fullPath); console.log(`[Project Delete] Unlinked file: ${fullPath}`); } catch (e) {}
        }
      });

      db.run('DELETE FROM project_images WHERE project_id = ?', [id], () => {
        db.run('DELETE FROM projects WHERE id = ?', [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Project and associated image files deleted successfully' });
        });
      });
    });
  });
});

// CATEGORIZED MULTI-IMAGE UPLOAD for Project (categories: before, construction, progress, completed)
router.post('/:id/images', upload.array('images', 20), (req, res) => {
  const projectId = req.params.id;
  const category = req.body.category || 'completed';

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files uploaded.' });
  }

  db.all('SELECT COUNT(*) as count FROM project_images WHERE project_id = ?', [projectId], (err, rows) => {
    const existingCount = rows[0]?.count || 0;
    const insert = db.prepare('INSERT INTO project_images (project_id, image_url, category, caption, sort_order) VALUES (?, ?, ?, ?, ?)');

    const uploadedImages = [];
    req.files.forEach((file, idx) => {
      const imgUrl = `/uploads/images/${file.filename}`;
      insert.run(projectId, imgUrl, category, req.body.caption || '', existingCount + idx);
      uploadedImages.push({ image_url: imgUrl, category });

      if (existingCount === 0 && idx === 0) {
        db.run('UPDATE projects SET cover_image = ? WHERE id = ?', [imgUrl, projectId]);
      }
    });

    insert.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Project images uploaded successfully', images: uploadedImages });
    });
  });
});

// DELETE single Project image
router.delete('/:id/images/:imageId', (req, res) => {
  db.run('DELETE FROM project_images WHERE id = ? AND project_id = ?', [req.params.imageId, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Project image deleted' });
  });
});

export default router;
