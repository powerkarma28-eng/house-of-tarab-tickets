const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendAppointmentConfirmation } = require('../email');

// POST /api/appointments — create a custom appointment booking
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, locationPreference, preferredDate, styleNotes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your name.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const result = db.createAppointment({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      locationPreference: locationPreference || 'Joy',
      preferredDate: preferredDate || '',
      styleNotes: styleNotes || '',
    });

    // Send confirmation email
    if (email) {
      sendAppointmentConfirmation({
        email,
        name: name.trim(),
        preferredDate: preferredDate || '',
        locationPreference: locationPreference || 'Joy',
        styleNotes: styleNotes || '',
      });
    }

    console.log(`Appointment booked: ${name} (${email}), ID: ${result.id}`);

    return res.json({
      success: true,
      id: result.id,
      message: 'Your appointment request has been received. We will be in touch within 48 hours to confirm.',
    });
  } catch (err) {
    console.error('Appointment booking error:', err);
    return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// GET /api/appointments — list all appointments (admin)
router.get('/', (req, res) => {
  try {
    const appointments = db.getAppointments();
    return res.json({ appointments });
  } catch (err) {
    console.error('Appointments list error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
