const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_KEY || 'sk_test_placeholder');
const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Stripe webhook needs raw body
app.use('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }));

// Regular body parser for other routes
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

const CSV_FILE = path.join(__dirname, 'ticket_sales.csv');

// Helper to save to CSV
const saveToCSV = async (data) => {
    const fileExists = fs.existsSync(CSV_FILE);
    
    const csvWriter = createObjectCsvWriter({
        path: CSV_FILE,
        header: [
            { id: 'timestamp', title: 'Timestamp' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Phone' },
            { id: 'guests', title: 'Guests' },
            { id: 'howHeard', title: 'How They Heard' },
            { id: 'ticketType', title: 'Ticket Type' },
            { id: 'ticketPrice', title: 'Ticket Price ($)' },
            { id: 'donation', title: 'Donation ($)' },
            { id: 'totalPaid', title: 'Total Paid ($)' },
            { id: 'footageDiscount', title: 'Footage Discount' },
            { id: 'note', title: 'Note' },
            { id: 'status', title: 'Status' }
        ],
        append: fileExists,
        fieldDelimiter: ';'
    });

    await csvWriter.writeRecords([data]);
};

// Pricing logic
const calculatePrice = (ticketType, footageDiscount, userInputPrice) => {
    let price = 0;
    switch (ticketType) {
        case 'General Admission':
            price = Math.max(10, parseFloat(userInputPrice) || 10);
            break;
        case 'Press Basic':
            price = 200;
            break;
        case 'Press Standard':
            price = 350;
            break;
        case 'Press Premium':
            price = 500;
            break;
        default:
            price = 0;
    }

    if (footageDiscount && ticketType.startsWith('Press')) {
        price = price * 0.8;
    }

    return price;
};

// API: Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { 
        firstName, lastName, email, phone, howHeard, 
        ticketType, quantity, donation, footageDiscount, note, ticketPrice 
    } = req.body;

    const unitPrice = calculatePrice(ticketType, footageDiscount, ticketPrice);
    const lineItems = [
        {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${ticketType} Ticket`,
                },
                unit_amount: Math.round(unitPrice * 100),
            },
            quantity: quantity,
        }
    ];

    if (donation > 0) {
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Donation',
                },
                unit_amount: Math.round(donation * 100),
            },
            quantity: 1,
        });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/index.html`,
            customer_email: email,
            metadata: {
                firstName, lastName, email, phone, howHeard,
                ticketType, quantity, donation, footageDiscount: footageDiscount ? 'Yes' : 'No', note,
                ticketPrice: unitPrice // Store the calculated unit price
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Stripe Webhook
app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // In a real app, use stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        // For placeholder/testing, we'll just parse the body
        event = JSON.parse(req.body);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;

        const ticketData = {
            timestamp: new Date().toISOString(),
            firstName: metadata.firstName,
            lastName: metadata.lastName,
            email: metadata.email,
            phone: metadata.phone,
            guests: metadata.quantity,
            howHeard: metadata.howHeard,
            ticketType: metadata.ticketType,
            ticketPrice: metadata.ticketPrice,
            donation: metadata.donation,
            totalPaid: session.amount_total / 100,
            footageDiscount: metadata.footageDiscount,
            note: metadata.note,
            status: 'Paid'
        };

        await saveToCSV(ticketData);
    }

    res.json({ received: true });
});

// API: Fallback / Manual Ticket entry
app.post('/api/tickets', async (req, res) => {
    const { 
        firstName, lastName, email, phone, howHeard, 
        ticketType, quantity, donation, footageDiscount, note, status, ticketPrice 
    } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const calculatedTicketPrice = calculatePrice(ticketType, footageDiscount, ticketPrice);
    const totalPaid = (calculatedTicketPrice * quantity) + (parseFloat(donation) || 0);

    const ticketData = {
        timestamp: new Date().toISOString(),
        firstName, lastName, email, phone,
        guests: quantity,
        howHeard, ticketType, 
        ticketPrice: calculatedTicketPrice,
        donation: donation || 0,
        totalPaid,
        footageDiscount: footageDiscount ? 'Yes' : 'No',
        note,
        status: status || 'Pending'
    };

    try {
        await saveToCSV(ticketData);
        res.json({ success: true, data: ticketData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get all tickets
app.get('/api/tickets', (req, res) => {
    if (!fs.existsSync(CSV_FILE)) {
        return res.json([]);
    }

    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(';');
    
    const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(';');
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = values[index];
        });
        return entry;
    });

    res.json(data);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});
