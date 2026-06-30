const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendConfirmationEmail } = require('../email');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeSecretKey) {
  stripe = require('stripe')(stripeSecretKey);
}

// POST /api/create-checkout-session — create a Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      howHeard,
      ticketType,
      quantity,
      donation,
      footageDiscount,
      ticketPrice,
      note,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!phone) {
      return res.status(400).json({ error: 'Please enter your phone number.' });
    }

    const basePrice = parseInt(ticketPrice) || 1000; // cents
    const qty = parseInt(quantity) || 1;
    const donAmount = parseFloat(donation) || 0;
    const footageDiscountPct = footageDiscount ? 0.2 : 0;

    // Calculate total in cents
    let lineItemTotal = basePrice * qty;
    if (footageDiscountPct > 0) {
      lineItemTotal = Math.round(lineItemTotal * (1 - footageDiscountPct));
    }
    const donationCents = Math.round(donAmount * 100);
    const totalCents = lineItemTotal + donationCents;

    // Generate reference
    const ref = 'HOT-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    if (stripe) {
      // Create Stripe checkout session
      const lineItems = [];

      // Main ticket line item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `House of Tarab — ${ticketType || 'General Admission'}`,
            description: `Fashion Show & Cocktail Reception · July 16, 2026 · Atlanta${footageDiscount ? ' (20% footage discount applied)' : ''}`,
            images: [],
          },
          unit_amount: footageDiscountPct > 0
            ? Math.round(basePrice * (1 - footageDiscountPct))
            : basePrice,
        },
        quantity: qty,
      });

      // Donation line item if present
      if (donationCents > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to House of Tarab',
              description: 'Supporting finer materials, craftsmanship, and the future of the House.',
            },
            unit_amount: donationCents,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/tickets.html?confirmed=true&ref=${ref}&name=${encodeURIComponent(firstName + ' ' + lastName)}&ticket=${encodeURIComponent(ticketType || 'General Admission')}&guests=${qty}&email=${encodeURIComponent(email)}&total=${(totalCents / 100).toFixed(2)}`,
        cancel_url: `${baseUrl}/tickets.html`,
        customer_email: email,
        metadata: {
          ref,
          firstName,
          lastName,
          ticketType: ticketType || 'General Admission',
          quantity: String(qty),
          donation: String(donAmount),
          footageDiscount: footageDiscount ? 'true' : 'false',
          howHeard: howHeard || '',
        },
      });

      // Store order in database
      db.createOrder({
        ref,
        firstName,
        lastName,
        email,
        phone: phone || '',
        ticketType: ticketType || 'General Admission',
        quantity: qty,
        donation: donAmount,
        ticketPrice: basePrice / 100,
        total: totalCents / 100,
        howHeard: howHeard || '',
        footageDiscount: !!footageDiscount,
        stripeSessionId: session.id,
        paymentStatus: 'pending',
      });

      // Send confirmation email immediately
      if (email) {
        sendConfirmationEmail({
          email,
          firstName,
          ref,
          ticketType: ticketType || 'General Admission',
          quantity: qty,
          total: totalCents / 100,
        });
      }
      console.log(`Confirmation email triggered for ${email} (ref: ${ref})`);

      return res.json({ url: session.url, sessionId: session.id });
    } else {
      // Fallback: no Stripe configured — store order and return success URL
      db.createOrder({
        ref,
        firstName,
        lastName,
        email,
        phone: phone || '',
        ticketType: ticketType || 'General Admission',
        quantity: qty,
        donation: donAmount,
        ticketPrice: basePrice / 100,
        total: totalCents / 100,
        howHeard: howHeard || '',
        footageDiscount: !!footageDiscount,
        stripeSessionId: '',
        paymentStatus: 'pending',
      });

      // Send confirmation email immediately
      if (email) {
        sendConfirmationEmail({
          email,
          firstName,
          ref,
          ticketType: ticketType || 'General Admission',
          quantity: qty,
          total: totalCents / 100,
        });
      }

      const successUrl = `${baseUrl}/tickets.html?confirmed=true&ref=${ref}&name=${encodeURIComponent(firstName + ' ' + lastName)}&ticket=${encodeURIComponent(ticketType || 'General Admission')}&guests=${qty}&email=${encodeURIComponent(email)}&total=${(totalCents / 100).toFixed(2)}`;
      return res.json({ url: successUrl, sessionId: null, fallback: true });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Could not create checkout session. Please try again.' });
  }
});

// POST /api/stripe-webhook — handle Stripe webhook events
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(200).json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const ref = session.metadata?.ref;

    if (ref) {
      db.updateOrderStatus(ref, 'completed');
      console.log(`Order ${ref} completed via Stripe`);

      // Send confirmation email
      const customerEmail = session.customer_email || session.metadata?.email;
      const firstName = session.metadata?.firstName || 'Friend';
      const ticketType = session.metadata?.ticketType || 'General Admission';
      const quantity = parseInt(session.metadata?.quantity) || 1;
      const totalCents = session.amount_total || 0;

      if (customerEmail) {
        sendConfirmationEmail({
          email: customerEmail,
          firstName,
          ref,
          ticketType,
          quantity,
          total: totalCents / 100,
        });
      }
    }
  }

  res.json({ received: true });
});

// POST /api/checkout — simpler checkout endpoint (fallback)
router.post('/', async (req, res) => {
  try {
    const { email, ticketType, quantity, donation, footageDiscount, ticketPrice } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const ref = 'HOT-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

    db.createOrder({
      ref,
      firstName: req.body.firstName || '',
      lastName: req.body.lastName || '',
      email,
      phone: req.body.phone || '',
      ticketType: ticketType || 'General Admission',
      quantity: parseInt(quantity) || 1,
      donation: parseFloat(donation) || 0,
      ticketPrice: parseFloat(ticketPrice) || 10,
      total: parseFloat(req.body.total) || 0,
      howHeard: req.body.howHeard || '',
      footageDiscount: !!footageDiscount,
      stripeSessionId: '',
      paymentStatus: 'pending',
    });

    return res.json({ success: true, ref });
  } catch (err) {
    console.error('Checkout fallback error:', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;