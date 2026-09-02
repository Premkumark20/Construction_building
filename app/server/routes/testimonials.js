import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all testimonials
router.get('/', (req, res) => {
  db.all('SELECT * FROM testimonials ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST add testimonial
router.post('/', (req, res) => {
  const { client_name, location, quote, rating } = req.body;
  const sql = `INSERT INTO testimonials (client_name, location, quote, rating) VALUES (?, ?, ?, ?)`;
  db.run(sql, [client_name, location, quote, rating || 5], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, client_name, location, quote, rating });
  });
});

// PUT update testimonial
router.put('/:id', (req, res) => {
  const { client_name, location, quote, rating } = req.body;
  const sql = `UPDATE testimonials SET client_name = ?, location = ?, quote = ?, rating = ? WHERE id = ?`;
  db.run(sql, [client_name, location, quote, rating, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Testimonial updated.' });
  });
});

// DELETE testimonial
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM testimonials WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Testimonial deleted.' });
  });
});

export default router;
