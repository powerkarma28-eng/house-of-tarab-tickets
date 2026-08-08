// ── NAV + REVEAL ON SCROLL ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  const obs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
  }), { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // Choice pills (used in the Made to Order form)
  document.querySelectorAll('.choice-group').forEach(group => {
    group.querySelectorAll('.choice-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.choice-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const input = pill.querySelector('input');
        if (input) input.checked = true;
      });
    });
  });

  // Close modal on overlay click or Escape
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(ov.id); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(ov => closeModal(ov.id));
  });

  initGallery();
});

// ── FITTED ONE PHOTO GALLERY ─────────────────────────────────────────────
let galleryIndex = 0, galleryTimer = null;
function initGallery() {
  const imgs = document.querySelectorAll('#fittedGallery .gallery-img');
  if (!imgs.length) return;
  galleryTimer = setInterval(() => setGalleryImage((galleryIndex + 1) % imgs.length), 4500);
}
function setGalleryImage(i) {
  const imgs = document.querySelectorAll('#fittedGallery .gallery-img');
  const dots = document.querySelectorAll('#fittedGallery .dot');
  imgs.forEach((img, idx) => img.classList.toggle('active', idx === i));
  dots.forEach((dot, idx) => dot.classList.toggle('active', idx === i));
  galleryIndex = i;
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, duration = 4200) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── PRODUCT INTEREST MODAL (The Fitted One) ───────────────────────────────
function openModal(id) {
  const ov = document.getElementById(id);
  if (ov) { ov.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const ov = document.getElementById(id);
  if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
}

async function submitPieceRequest(event, pieceName) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.name || !data.email) {
    showToast('Please share your name and email so we can reach you.');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  try {
    const response = await fetch('/api/piece-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        color: data.color || 'Olive',
        dressSize: data.dressSize || '',
        cupSize: data.cupSize || '',
        notes: data.notes || '',
        piece: pieceName,
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast(`Request received — ${result.ref}. We'll follow up within 48 hours.`);
      form.reset();
      const modalId = form.closest('.modal-overlay').id;
      closeModal(modalId);
    } else {
      showToast(result.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    showToast('Could not reach the server. Please try again.');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Submit Request'; }
}

// ── MADE TO ORDER — CONSULTATION REQUEST ──────────────────────────────────
async function submitAppointment(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.name || !data.email || !data.path) {
    showToast("Please fill in your name, email, and how you'd like to design your piece.");
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        occasion: data.occasion || '',
        path: data.path || '',
        vision: data.vision || '',
        fabric: data.fabric || '',
        budget: data.budget || '',
        preferredDate: data.preferredDate || '',
        format: data.format || 'Video Call',
      })
    });

    const result = await response.json();

    if (result.success) {
      form.style.display = 'none';
      const confirmBox = document.getElementById('mtoConfirm');
      if (confirmBox) {
        confirmBox.querySelector('.mto-ref').textContent = result.ref;
        confirmBox.classList.add('show');
      }
      showToast('Consultation request received. Joy will be in touch shortly.');
    } else {
      showToast(result.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    showToast('Could not reach the server. Please try again.');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Request Consultation'; }
}
