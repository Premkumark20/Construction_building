import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET feedbacks (public gets approved feedbacks, admin can pass ?all=true)
router.get('/', (req, res) => {
  const showAll = req.query.all === 'true' || req.query.admin === 'true';
  const sql = showAll
    ? 'SELECT * FROM feedback ORDER BY id DESC'
    : 'SELECT * FROM feedback WHERE approved = 1 ORDER BY id DESC';

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// POST new client feedback
router.post('/', (req, res) => {
  const { client_name, phone, location, service, rating, message } = req.body;

  if (!client_name || !message) {
    return res.status(400).json({ error: 'Client name and feedback message are required' });
  }

  const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  const sql = `
    INSERT INTO feedback (client_name, phone, location, service, rating, message, approved)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `;

  db.run(
    sql,
    [
      client_name.trim(),
      phone ? phone.trim() : '',
      location ? location.trim() : '',
      service ? service.trim() : 'General Feedback',
      numericRating,
      message.trim()
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        feedbackId: this.lastID,
        message: 'Thank you for your feedback! It has been submitted successfully.'
      });
    }
  );
});

// PUT update feedback / toggle approval
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { client_name, phone, location, service, rating, message, approved } = req.body;

  db.get('SELECT * FROM feedback WHERE id = ?', [id], (err, existing) => {
    if (err || !existing) {
      return res.status(404).json({ error: 'Feedback record not found' });
    }

    const updatedName = client_name !== undefined ? client_name : existing.client_name;
    const updatedPhone = phone !== undefined ? phone : existing.phone;
    const updatedLocation = location !== undefined ? location : existing.location;
    const updatedService = service !== undefined ? service : existing.service;
    const updatedRating = rating !== undefined ? Math.min(5, Math.max(1, parseInt(rating, 10) || 5)) : existing.rating;
    const updatedMessage = message !== undefined ? message : existing.message;
    const updatedApproved = approved !== undefined ? (approved ? 1 : 0) : existing.approved;

    const sql = `
      UPDATE feedback
      SET client_name = ?, phone = ?, location = ?, service = ?, rating = ?, message = ?, approved = ?
      WHERE id = ?
    `;

    db.run(
      sql,
      [updatedName, updatedPhone, updatedLocation, updatedService, updatedRating, updatedMessage, updatedApproved, id],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        res.json({ success: true, message: 'Feedback updated successfully.' });
      }
    );
  });
});

// DELETE feedback
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM feedback WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Feedback deleted successfully.' });
  });
});

export default router;
