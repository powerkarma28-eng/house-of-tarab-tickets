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
    body{background:#1C0F0A;color:#F5EDE4;font-family:Georgia,serif;padding:40px 20px;margin:0}
    .wrap{max-width:600px;margin:0 auto;background:#2E1A13;border:1px solid rgba(201,169,110,0.2);padding:40px}
    h1{font-family:Georgia,serif;color:#C9A96E;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:5px}
    .sub{font-style:italic;color:#9A8070;text-align:center;font-size:14px;margin-bottom:30px}
    .divider{height:1px;background:linear-gradient(to right,transparent,rgba(201,169,110,0.3),transparent);margin:20px 0}
    p{font-size:15px;line-height:1.8;color:#F5EDE4}
    .details{background:#1C0F0A;border-left:3px solid #C9A96E;padding:15px 20px;margin:20px 0;font-size:14px;line-height:1.7}
    .details strong{color:#C9A96E}
    .cta{text-align:center;margin:30px 0}
    .cta a{display:inline-block;background:#C9A96E;color:#1C0F0A;padding:12px 28px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif}
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
      Doors open 7:00 PM · Show begins 7:30 PM · Cocktail reception 9:00 PM<br>
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

module.exports = { sendConfirmationEmail };