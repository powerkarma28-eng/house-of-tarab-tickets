const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendPieceRequestConfirmation } = require('../email');

function refCode(prefix) {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${new Date().getFullYear()}-${n}`;
}

// POST /api/piece-request — submit a piece request (The Fitted One)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, color, dressSize, cupSize, notes, piece } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your name.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const ref = refCode('REQ');

    db.createPieceRequest({
      ref,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      color: color || 'Olive',
      dressSize: dressSize || '',
      cupSize: cupSize || '',
      notes: notes || '',
      pieceName: piece || 'The Fitted One',
    });

    // Send confirmation email
    if (email) {
      sendPieceRequestConfirmation({
        email,
        name: name.trim(),
        ref,
        pieceName: piece || 'The Fitted One',
        color: color || 'Olive',
        dressSize: dressSize || '',
        cupSize: cupSize || '',
      });
    }

    console.log(`Piece request received: ${name} (${email}), ref: ${ref}`);

    return res.json({
      success: true,
      ref,
      message: 'Request received. We\'ll follow up within 48 hours.',
    });
  } catch (err) {
    console.error('Piece request error:', err);
    return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// GET /api/piece-request — list all piece requests (admin)
router.get('/', (req, res) => {
  try {
    const requests = db.getPieceRequests();
    return res.json({ requests });
  } catch (err) {
    console.error('Piece requests list error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
