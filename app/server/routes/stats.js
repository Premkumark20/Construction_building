import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all stats
router.get('/', (req, res) => {
  const defaultStats = [
    { id: 1, icon_name: 'Home', value: '40+', label: 'Homes Built', display_order: 1 },
    { id: 2, icon_name: 'MapPin', value: '75+', label: 'Plots Sold', display_order: 2 },
    { id: 3, icon_name: 'Users', value: '150+', label: 'Property Deals', display_order: 3 },
    { id: 4, icon_name: 'Users', value: '100+', label: 'Happy Families', display_order: 4 }
  ];

  db.all('SELECT * FROM stats ORDER BY display_order ASC, id ASC', [], (err, rows) => {
    if (err) {
      console.error('Stats query error, creating table and seeding:', err.message);
      const createTableSql = db.isPg
        ? 'CREATE TABLE IF NOT EXISTS stats (id SERIAL PRIMARY KEY, icon_name TEXT NOT NULL DEFAULT \'Home\', value TEXT NOT NULL, label TEXT NOT NULL, display_order INTEGER DEFAULT 1)'
        : 'CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY AUTOINCREMENT, icon_name TEXT NOT NULL DEFAULT \'Home\', value TEXT NOT NULL, label TEXT NOT NULL, display_order INTEGER DEFAULT 1)';
      db.run(createTableSql, () => {
        defaultStats.forEach(s => {
          db.run('INSERT INTO stats (icon_name, value, label, display_order) VALUES (?, ?, ?, ?)', [s.icon_name, s.value, s.label, s.display_order]);
        });
      });
      return res.json(defaultStats);
    }

    if (!rows || rows.length === 0) {
      defaultStats.forEach(s => {
        db.run('INSERT INTO stats (icon_name, value, label, display_order) VALUES (?, ?, ?, ?)', [s.icon_name, s.value, s.label, s.display_order]);
      });
      return res.json(defaultStats);
    }

    res.json(rows);
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
