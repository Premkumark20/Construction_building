import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all stats
router.get('/', (req, res) => {
  db.all('SELECT * FROM stats ORDER BY display_order ASC, id ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// POST add new stat
router.post('/', (req, res) => {
  const { icon_name, value, label, display_order } = req.body;
  if (!value || !label) {
    return res.status(400).json({ error: 'Value and label are required.' });
  }
  const sql = `INSERT INTO stats (icon_name, value, label, display_order) VALUES (?, ?, ?, ?)`;
  db.run(sql, [icon_name || 'Home', value, label, display_order || 1], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, icon_name, value, label, display_order });
  });
});

// PUT reorder stats
router.put('/reorder', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Array of items required' });
  }
  const stmt = db.prepare('UPDATE stats SET display_order = ? WHERE id = ?');
  db.serialize(() => {
    items.forEach((item) => {
      stmt.run([item.display_order, item.id]);
    });
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Stats reordered.' });
    });
  });
});

// PUT update stat
router.put('/:id', (req, res) => {
  const { icon_name, value, label, display_order } = req.body;
  const sql = `UPDATE stats SET icon_name = ?, value = ?, label = ?, display_order = ? WHERE id = ?`;
  db.run(sql, [icon_name, value, label, display_order, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Stat updated successfully.' });
  });
});

// DELETE stat
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM stats WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Stat deleted successfully.' });
  });
});

export default router;
