import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all testimonials
router.get('/', (req, res) => {
  const defaultList = [
    { client_name: 'Ramesh & Family', location: 'Poonamallee', quote: 'Professional approach, quality construction and on-time delivery. We are very happy with our new home in Poonamallee.', rating: 5 },
    { client_name: 'Karthik Raja', location: 'Mangadu', quote: 'Transparent dealings and smooth legal registration assistance for our plot in Mangadu. Highly recommended!', rating: 5 },
    { client_name: 'Suresh Kumar', location: 'Kundrathur', quote: 'Built our dream villa with top notch engineering standards and milestone updates. The engineering team made the process effortless.', rating: 5 }
  ];

  db.all('SELECT * FROM testimonials ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('Testimonials query error:', err.message);
      return res.json(defaultList.map((t, i) => ({ id: i + 1, ...t })));
    }

    let result = Array.isArray(rows) ? [...rows] : [];

    // Ensure all 3 default testimonials exist in result and database
    defaultList.forEach((defT) => {
      const exists = result.some(
        (r) => r.client_name && r.client_name.toLowerCase().trim() === defT.client_name.toLowerCase().trim()
      );
      if (!exists) {
        db.run(
          'INSERT INTO testimonials (client_name, location, quote, rating) VALUES (?, ?, ?, ?)',
          [defT.client_name, defT.location, defT.quote, defT.rating],
          function (insErr) {
            if (insErr) console.error('Error auto-inserting missing testimonial:', insErr);
          }
        );
        result.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          client_name: defT.client_name,
          location: defT.location,
          quote: defT.quote,
          rating: defT.rating
        });
      }
    });

    res.json(result);
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
