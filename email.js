const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

const FROM_EMAIL = 'hello@houseoftarab.net';

/**
 * Build the branded confirmation email HTML from Joy
 */
function buildConfirmationEmail({ firstName, ref, ticketType, quantity, total }) {
  const guestLabel = quantity === 1 ? '1 guest' : `${quantity} guests`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body{background:#2C1810;color:#F5EDE4;font-family:Georgia,serif;padding:40px 20px;margin:0}
    .wrap{max-width:600px;margin:0 auto;background:#3E2723;border:1px solid rgba(201,169,110,0.2);padding:40px}
    h1{font-family:Georgia,serif;color:#C9A96E;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:5px}
    .sub{font-style:italic;color:#9A8070;text-align:center;font-size:14px;margin-bottom:30px}
    .divider{height:1px;background:linear-gradient(to right,transparent,rgba(201,169,110,0.3),transparent);margin:20px 0}
    p{font-size:15px;line-height:1.8;color:#F5EDE4}
    .details{background:#2C1810;border-left:3px solid #C9A96E;padding:15px 20px;margin:20px 0;font-size:14px;line-height:1.7}
    .details strong{color:#C9A96E}
    .cta{text-align:center;margin:30px 0}
    .cta a{display:inline-block;background:#C9A96E;color:#2C1810;padding:12px 28px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif}
    .cta a:hover{background:#E8D5A3}
    .sig{color:#C9A96E;font-style:italic;margin-top:25px}
    .footer{text-align:center;font-size:11px;color:#9A8070;margin-top:30px}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>House of Tarab</h1>
    <p class="sub">The Debut Collection — July 16, 2026</p>
    <div class="divider"></div>

    <p>Dear <strong>${firstName}</strong>,</p>

    <p>I have been building something. And on July 16th, I want you to be in the room when it is revealed for the first time.</p>

    <p>House of Tarab — my made-to-order fashion house — presents its debut collection at a fashion show and cocktail reception in Atlanta, Georgia. Every piece you will see was designed for a specific kind of woman. The woman who walks into a room and the energy shifts. The woman who dresses not to be noticed, but because she understands the difference between being seen and being felt.</p>

    <div class="details">
      <strong>THE DEBUT SHOW</strong><br>
      Thursday, July 16, 2026<br>
      Doors open 7:00 PM · Show begins 7:30 PM<br>
      1235 Chattahoochee Ave NW Suite 130, Atlanta, Georgia<br>
      Dress code: Smart Creative<br><br>
      <strong>YOUR TICKET</strong><br>
      Reference: ${ref}<br>
      Ticket: ${ticketType}<br>
      Party: ${guestLabel}<br>
      Amount: $${total.toFixed(2)}
    </div>

    <p>Seating is limited. I would love for you to be there.</p>

    <div class="cta">
      <a href="https://house-of-tarab-tickets-2.onrender.com/rsvp.html">RSVP Now</a>
    </div>

    <p>Or reply directly to this email by July 9, 2026.</p>

    <p>I cannot wait to show you what I have been working on.</p>

    <p class="sig">With love,<br>Joy<br>Founder, House of Tarab</p>

    <div class="divider"></div>
    <div class="footer">
      hello@houseoftarab.net · Atlanta, Georgia<br>
      "For the rooms that remember you."
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build order confirmation email for dress purchases
 */
function buildOrderConfirmationEmail({ firstName, ref, productName, size, price, total }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body{background:#2C1810;color:#F5EDE4;font-family:Georgia,serif;padding:40px 20px;margin:0}
    .wrap{max-width:600px;margin:0 auto;background:#3E2723;border:1px solid rgba(201,169,110,0.2);padding:40px}
    h1{font-family:Georgia,serif;color:#C9A96E;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:5px}
    .sub{font-style:italic;color:#9A8070;text-align:center;font-size:14px;margin-bottom:30px}
    .divider{height:1px;background:linear-gradient(to right,transparent,rgba(201,169,110,0.3),transparent);margin:20px 0}
    p{font-size:15px;line-height:1.8;color:#F5EDE4}
    .details{background:#2C1810;border-left:3px solid #C9A96E;padding:15px 20px;margin:20px 0;font-size:14px;line-height:1.7}
    .details strong{color:#C9A96E}
    .sig{color:#C9A96E;font-style:italic;margin-top:25px}
    .footer{text-align:center;font-size:11px;color:#9A8070;margin-top:30px}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>House of Tarab</h1>
    <p class="sub">Les Éternelles — Made to Order</p>
    <div class="divider"></div>

    <p>Dear <strong>${firstName}</strong>,</p>

    <p>Thank you for your order from the Les Éternelles collection. Each piece is crafted individually, made to order — your garment is being prepared with the care and attention it deserves.</p>

    <div class="details">
      <strong>YOUR ORDER</strong><br>
      Reference: ${ref}<br>
      Piece: ${productName}<br>
      Size: ${size}<br>
      Amount: $${total.toFixed(2)}
    </div>

    <p>As each piece is made to order, please allow 3–4 weeks for your garment to be completed. We will be in touch with updates on your order's progress.</p>

    <p>Should you have any questions, please reply to this email — we are here for you.</p>

    <p class="sig">With gratitude,<br>Joy<br>Founder, House of Tarab</p>

    <div class="divider"></div>
    <div class="footer">
      hello@houseoftarab.net · Atlanta, Georgia<br>
      "For the rooms that remember you."
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build appointment confirmation email
 */
function buildAppointmentConfirmationEmail({ name, ref, path, budget, format, preferredDate }) {
  const pathLabel = path || 'Design consultation';
  const budgetLabel = budget || 'To be discussed';
  const formatLabel = format || 'Video Call';
  const dateDisplay = preferredDate || 'To be confirmed';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body{background:#2C1810;color:#F5EDE4;font-family:Georgia,serif;padding:40px 20px;margin:0}
    .wrap{max-width:600px;margin:0 auto;background:#3E2723;border:1px solid rgba(201,169,110,0.2);padding:40px}
    h1{font-family:Georgia,serif;color:#C9A96E;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:5px}
    .sub{font-style:italic;color:#9A8070;text-align:center;font-size:14px;margin-bottom:30px}
    .divider{height:1px;background:linear-gradient(to right,transparent,rgba(201,169,110,0.3),transparent);margin:20px 0}
    p{font-size:15px;line-height:1.8;color:#F5EDE4}
    .details{background:#2C1810;border-left:3px solid #C9A96E;padding:15px 20px;margin:20px 0;font-size:14px;line-height:1.7}
    .details strong{color:#C9A96E}
    .sig{color:#C9A96E;font-style:italic;margin-top:25px}
    .footer{text-align:center;font-size:11px;color:#9A8070;margin-top:30px}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>House of Tarab</h1>
    <p class="sub">Made to Order — Consultation Request</p>
    <div class="divider"></div>

    <p>Dear <strong>${name}</strong>,</p>

    <p>Thank you for reaching out about a Made to Order piece with House of Tarab. Your consultation request has been received, and Joy will follow up within 48 hours to confirm your appointment and begin the design process.</p>

    <div class="details">
      <strong>YOUR CONSULTATION REQUEST</strong><br>
      Reference: ${ref}<br>
      Design path: ${pathLabel}<br>
      Budget: ${budgetLabel}<br>
      Format: ${formatLabel}<br>
      Preferred date: ${dateDisplay}
    </div>

    <p>From the first sketch to the final stitch, each Made to Order piece is crafted entirely around you. We cannot wait to begin.</p>

    <p class="sig">Warmly,<br>Joy<br>Founder, House of Tarab</p>

    <div class="divider"></div>
    <div class="footer">
      hello@houseoftarab.net · Atlanta, Georgia<br>
      "For the rooms that remember you."
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build piece request confirmation email
 */
function buildPieceRequestConfirmationEmail({ name, ref, pieceName, color, dressSize, cupSize }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body{background:#2C1810;color:#F5EDE4;font-family:Georgia,serif;padding:40px 20px;margin:0}
    .wrap{max-width:600px;margin:0 auto;background:#3E2723;border:1px solid rgba(201,169,110,0.2);padding:40px}
    h1{font-family:Georgia,serif;color:#C9A96E;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:5px}
    .sub{font-style:italic;color:#9A8070;text-align:center;font-size:14px;margin-bottom:30px}
    .divider{height:1px;background:linear-gradient(to right,transparent,rgba(201,169,110,0.3),transparent);margin:20px 0}
    p{font-size:15px;line-height:1.8;color:#F5EDE4}
    .details{background:#2C1810;border-left:3px solid #C9A96E;padding:15px 20px;margin:20px 0;font-size:14px;line-height:1.7}
    .details strong{color:#C9A96E}
    .sig{color:#C9A96E;font-style:italic;margin-top:25px}
    .footer{text-align:center;font-size:11px;color:#9A8070;margin-top:30px}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>House of Tarab</h1>
    <p class="sub">Les Éternelles — Your Request</p>
    <div class="divider"></div>

    <p>Dear <strong>${name}</strong>,</p>

    <p>Thank you for your interest in <strong>${pieceName}</strong> from the Les Éternelles collection. Your request has entered the House, and we will follow up within 48 hours to confirm the details of your order.</p>

    <div class="details">
      <strong>YOUR REQUEST</strong><br>
      Reference: ${ref}<br>
      Piece: ${pieceName}<br>
      Color: ${color}<br>
      Dress size: ${dressSize}<br>
      Cup size: ${cupSize}
    </div>

    <p>Each piece is made to order over 6–10 weeks, with progress photos sent every 2 weeks so you can watch your garment come to life. We will be in touch shortly to collect measurements and finalize your order.</p>

    <p class="sig">With anticipation,<br>Joy<br>Founder, House of Tarab</p>

    <div class="divider"></div>
    <div class="footer">
      hello@houseoftarab.net · Atlanta, Georgia<br>
      "For the rooms that remember you."
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send a ticket confirmation email using Resend
 */
async function sendConfirmationEmail({ email, firstName, ref, ticketType, quantity, total }) {
  if (!resend) {
    console.log('Resend not configured — skipping email to', email);
    console.log(`Would send: ref=${ref}, ticket=${ticketType}, guests=${quantity}, total=$${total}`);
    return { sent: false, reason: 'Resend not configured' };
  }

  try {
    const html = buildConfirmationEmail({ firstName, ref, ticketType, quantity, total });
    const { data, error } = await resend.emails.send({
      from: `Joy at House of Tarab <${FROM_EMAIL}>`,
      to: email,
      subject: 'You are invited — House of Tarab Debut Show, Atlanta, July 16',
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { sent: false, error };
    }

    console.log(`Confirmation email sent to ${email} for order ${ref}`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
    return { sent: false, error: err.message };
  }
}

/**
 * Send an order confirmation email for dress purchases
 */
async function sendOrderConfirmationEmail({ email, firstName, ref, productName, size, price, total }) {
  if (!resend) {
    console.log('Resend not configured — skipping order email to', email);
    console.log(`Would send: ref=${ref}, product=${productName}, size=${size}, total=$${total}`);
    return { sent: false, reason: 'Resend not configured' };
  }

  try {
    const html = buildOrderConfirmationEmail({ firstName, ref, productName, size, price, total });
    const { data, error } = await resend.emails.send({
      from: `Joy at House of Tarab <${FROM_EMAIL}>`,
      to: email,
      subject: `Your House of Tarab Order — ${productName}`,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { sent: false, error };
    }

    console.log(`Order confirmation email sent to ${email} for order ${ref}`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
    return { sent: false, error: err.message };
  }
}

/**
 * Send an appointment confirmation email
 */
async function sendAppointmentConfirmation({ email, name, ref, path, budget, format, preferredDate }) {
  if (!resend) {
    console.log('Resend not configured — skipping appointment email to', email);
    console.log(`Would send: ref=${ref}, name=${name}, path=${path}`);
    return { sent: false, reason: 'Resend not configured' };
  }

  try {
    const html = buildAppointmentConfirmationEmail({ name, ref, path, budget, format, preferredDate });
    const { data, error } = await resend.emails.send({
      from: `Joy at House of Tarab <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your Made to Order Consultation — House of Tarab',
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { sent: false, error };
    }

    console.log(`Appointment confirmation email sent to ${email}`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send appointment confirmation email:', err);
    return { sent: false, error: err.message };
  }
}

/**
 * Send a piece request confirmation email
 */
async function sendPieceRequestConfirmation({ email, name, ref, pieceName, color, dressSize, cupSize }) {
  if (!resend) {
    console.log('Resend not configured — skipping piece request email to', email);
    console.log(`Would send: ref=${ref}, piece=${pieceName}, name=${name}`);
    return { sent: false, reason: 'Resend not configured' };
  }

  try {
    const html = buildPieceRequestConfirmationEmail({ name, ref, pieceName, color, dressSize, cupSize });
    const { data, error } = await resend.emails.send({
      from: `Joy at House of Tarab <${FROM_EMAIL}>`,
      to: email,
      subject: `Your ${pieceName} Request — House of Tarab`,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { sent: false, error };
    }

    console.log(`Piece request confirmation email sent to ${email}`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send piece request confirmation email:', err);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendConfirmationEmail, sendOrderConfirmationEmail, sendAppointmentConfirmation, sendPieceRequestConfirmation };
