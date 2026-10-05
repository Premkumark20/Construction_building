import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET all leads
router.get('/', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.warn('Notice querying leads table:', err.message);
      return res.json([]);
    }
    res.json(rows || []);
  });
});

// POST new property lead / enquiry
router.post('/', (req, res) => {
  const { name, phone, email, service, property_id, message, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone number are required' });
  }

  const cleanName = String(name).trim();
  const cleanPhone = String(phone).trim();
  const cleanEmail = email ? String(email).trim() : '';
  const cleanService = service ? String(service).trim() : 'General Inquiry';
  const cleanPropId = property_id ? String(property_id).trim() : null;
  const cleanMsg = (message || notes || '').trim();

  const sql = 'INSERT INTO leads (name, phone, email, service, property_id, message) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [cleanName, cleanPhone, cleanEmail, cleanService, cleanPropId, cleanMsg], function (err) {
    if (err) {
      console.warn('Warning inserting full lead, trying legacy column format:', err.message);
      return db.run(
        'INSERT INTO leads (name, phone, service, message) VALUES (?, ?, ?, ?)',
        [cleanName, cleanPhone, cleanService, cleanMsg],
        function (err2) {
          if (err2) {
            console.error('Fatal error inserting lead:', err2.message);
            return res.status(500).json({ error: err2.message });
          }
          res.json({ success: true, leadId: this.lastID, message: 'Enquiry received successfully.' });
        }
      );
    }
    res.json({ success: true, leadId: this.lastID, message: 'Enquiry received successfully.' });
  });
});

// DELETE lead
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM leads WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Lead enquiry deleted successfully.' });
  });
});

export default router;

