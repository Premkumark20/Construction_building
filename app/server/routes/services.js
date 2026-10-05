import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all services
router.get('/', (req, res) => {
  db.all('SELECT * FROM services ORDER BY display_order ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST add new service
router.post('/', (req, res) => {
  const { title, description, icon_name, link_url, display_order } = req.body;
  const sql = `INSERT INTO services (title, description, icon_name, link_url, display_order) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [title, description, icon_name || 'Home', link_url || '#properties', display_order || 1], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, title, description, icon_name, link_url, display_order });
  });
});

// PUT reorder services
router.put('/reorder', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Array of items required' });
  }
  const stmt = db.prepare('UPDATE services SET display_order = ? WHERE id = ?');
  db.serialize(() => {
    items.forEach((item) => {
      stmt.run([item.display_order, item.id]);
    });
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Services reordered.' });
    });
  });
});

// PUT update service
router.put('/:id', (req, res) => {
  const { title, description, icon_name, link_url, display_order } = req.body;
  const sql = `UPDATE services SET title = ?, description = ?, icon_name = ?, link_url = ?, display_order = ? WHERE id = ?`;
  db.run(sql, [title, description, icon_name, link_url, display_order, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Service updated.' });
  });
});

// DELETE service
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM services WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Service deleted.' });
  });
});

export default router;
