import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// POST general contact message
router.post('/', (req, res) => {
  const { name, phone, message } = req.body;

  if (!name || !phone) {
    res.status(400).json({ error: 'Name and Phone number are required' });
    return;
  }

  const sql = 'INSERT INTO leads (name, phone, message) VALUES (?, ?, ?)';
  db.run(sql, [name, phone, message || 'General Consultation Request'], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, message: 'Consultation request submitted successfully. Our team will call you back shortly.' });
  });
});

export default router;
