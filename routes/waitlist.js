const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/waitlist — add email to waitlist
router.post('/', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const result = db.addToWaitlist(email);
    const count = db.getWaitlistCount();

    return res.json({
      success: true,
      alreadyExists: result.alreadyExists || false,
      message: result.alreadyExists
        ? 'You are already on the list!'
        : 'You are on the list. Welcome to the House.',
      count,
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// GET /api/waitlist/count — get waitlist count
router.get('/count', (req, res) => {
  try {
    const count = db.getWaitlistCount();
    return res.json({ count });
  } catch (err) {
    console.error('Waitlist count error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;