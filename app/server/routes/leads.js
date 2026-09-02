import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all leads
router.get('/', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// POST new property lead / enquiry
router.post('/', (req, res) => {
  const { name, phone, email, service, property_id, message } = req.body;

  if (!name || !phone) {
    res.status(400).json({ error: 'Name and Phone number are required' });
    return;
  }

  const sql = 'INSERT INTO leads (name, phone, email, service, property_id, message) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [name, phone, email || '', service || 'General Inquiry', property_id || null, message || ''], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, leadId: this.lastID, message: 'Property enquiry received successfully.' });
  });
});

export default router;
