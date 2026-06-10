require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const waitlistRoutes = require('./routes/waitlist');
const checkoutRoutes = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allow frontend from any origin
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/waitlist', waitlistRoutes);
app.use('/api', checkoutRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Fallback: serve index.html for unmatched routes (SPA-like)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`House of Tarab backend running on http://0.0.0.0:${PORT}`);
  console.log(`Stripe: ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'NOT configured (checkout will use fallback mode)'}`);
});

module.exports = app;