// Countdown Logic
function updateCountdown() {
  const showDate = new Date('2026-07-16T19:00:00');
  const now = new Date();
  const diff = showDate - now;

  const elements = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs')
  };

  if (!elements.days) return; // Only run on pages with countdown

  if (diff <= 0) {
    elements.days.textContent = '0';
    elements.hours.textContent = '00';
    elements.mins.textContent = '00';
    elements.secs.textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins_calc = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  elements.days.textContent = days;
  elements.hours.textContent = String(hours).padStart(2, '0');
  elements.mins.textContent = String(mins_calc).padStart(2, '0');
  elements.secs.textContent = String(secs).padStart(2, '0');
}

// Toast Notifications
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

// Ticket Calculations
let ticketData = {
  'ga': { name: 'General Admission', price: 10, qty: 0, customPrice: 10 },
  'press-basic': { name: 'Press Basic', price: 200, qty: 0, discountPrice: 160, useDiscount: false },
  'press-std': { name: 'Press Standard', price: 350, qty: 0, discountPrice: 280, useDiscount: false },
  'press-prem': { name: 'Press Premium', price: 500, qty: 0, discountPrice: 400, useDiscount: false }
};

let activeType = null;

function updateTicketQty(type, change) {
  // If changing type, reset others
  if (activeType && activeType !== type && change > 0) {
    ticketData[activeType].qty = 0;
    const oldQtyEl = document.getElementById(`qty-${activeType}`);
    if (oldQtyEl) oldQtyEl.textContent = 0;
  }
  
  const ticket = ticketData[type];
  if (!ticket) return;

  ticket.qty = Math.max(0, Math.min(5, ticket.qty + change));
  
  if (ticket.qty > 0) {
    activeType = type;
  } else if (activeType === type) {
    activeType = null;
  }
  
  const qtyNumEl = document.getElementById(`qty-${type}`);
  if (qtyNumEl) qtyNumEl.textContent = ticket.qty;

  updateSummary();
}

function toggleDiscount(type) {
  const ticket = ticketData[type];
  if (!ticket) return;
  
  const checkbox = document.getElementById(`discount-${type}`);
  ticket.useDiscount = checkbox.checked;
  
  updateSummary();
}

function updateCustomPrice(val) {
  const price = parseFloat(val) || 0;
  ticketData['ga'].customPrice = Math.max(10, price);
  updateSummary();
}

function updateSummary() {
  const summaryItems = document.getElementById('summary-items');
  const totalEl = document.getElementById('summary-total-val');
  if (!summaryItems || !totalEl) return;

  summaryItems.innerHTML = '';
  let total = 0;

  for (const [key, item] of Object.entries(ticketData)) {
    if (item.qty > 0) {
      let unitPrice = item.price;
      if (key === 'ga') {
        unitPrice = item.customPrice;
      } else if (item.useDiscount) {
        unitPrice = item.discountPrice;
      }

      const itemTotal = unitPrice * item.qty;
      total += itemTotal;

      const itemRow = document.createElement('div');
      itemRow.className = 'summary-item';
      itemRow.innerHTML = `
        <span>${item.name} x ${item.qty}</span>
        <span>$${itemTotal.toFixed(2)}</span>
      `;
      summaryItems.appendChild(itemRow);
    }
  }

  // Show donation if any
  const donationInput = document.getElementById('donation');
  const donation = parseFloat(donationInput ? donationInput.value : 0) || 0;
  if (donation > 0) {
    const donationRow = document.createElement('div');
    donationRow.className = 'summary-item';
    donationRow.innerHTML = `
      <span>Donation</span>
      <span>$${donation.toFixed(2)}</span>
    `;
    summaryItems.appendChild(donationRow);
    total += donation;
  }

  if (summaryItems.innerHTML === '') {
    summaryItems.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 12px;">No tickets selected</p>';
  }

  totalEl.textContent = `$${total.toFixed(2)}`;
}

// Form Submission
async function handleCheckout(event) {
  event.preventDefault();
  
  if (!activeType) {
    showToast('Please select a ticket type.');
    return;
  }

  const ticket = ticketData[activeType];
  const donationInput = document.getElementById('donation');
  const donation = parseFloat(donationInput ? donationInput.value : 0) || 0;

  const payload = {
    firstName: document.getElementById('f-name').value,
    lastName: document.getElementById('l-name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    howHeard: document.getElementById('source').value,
    ticketType: ticket.name,
    quantity: ticket.qty,
    donation: donation,
    footageDiscount: ticket.useDiscount || false,
    note: document.getElementById('note').value,
    ticketPrice: activeType === 'ga' ? ticket.customPrice : ticket.price
  };

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Error: ' + (data.error || 'Could not create checkout session'));
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Could not connect to the server.');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setInterval(updateCountdown, 1000);
  updateCountdown();
  updateSummary();
});
