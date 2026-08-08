const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'houseoftarab.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      ticket_type TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      donation REAL DEFAULT 0,
      ticket_price REAL NOT NULL,
      total REAL NOT NULL,
      how_heard TEXT,
      footage_discount INTEGER DEFAULT 0,
      stripe_session_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      location_preference TEXT DEFAULT 'Joy',
      preferred_date TEXT,
      style_notes TEXT,
      occasion TEXT,
      path TEXT,
      vision TEXT,
      fabric TEXT,
      budget TEXT,
      format TEXT DEFAULT 'Video Call',
      status TEXT DEFAULT 'pending',
      ref TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS piece_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      color TEXT,
      dress_size TEXT,
      cup_size TEXT,
      notes TEXT,
      piece_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration: add new columns to appointments if they don't exist
  const newCols = [
    'occasion TEXT', 'path TEXT', 'vision TEXT', 'fabric TEXT',
    'budget TEXT', 'format TEXT DEFAULT \'Video Call\'', 'ref TEXT UNIQUE'
  ];
  for (const col of newCols) {
    try { db.exec(`ALTER TABLE appointments ADD COLUMN ${col}`); } catch (e) { /* column exists */ }
  }
}

function addToWaitlist(email) {
  const d = getDb();
  try {
    const stmt = d.prepare('INSERT INTO waitlist (email) VALUES (?)');
    stmt.run(email.toLowerCase().trim());
    return { success: true };
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return { success: true, alreadyExists: true };
    }
    throw err;
  }
}

function getWaitlistCount() {
  const d = getDb();
  const row = d.prepare('SELECT COUNT(*) as count FROM waitlist').get();
  return row.count;
}

function createOrder(data) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO orders (ref, first_name, last_name, email, phone, ticket_type, quantity, donation, ticket_price, total, how_heard, footage_discount, stripe_session_id, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.ref,
    data.firstName,
    data.lastName,
    data.email,
    data.phone || '',
    data.ticketType,
    data.quantity,
    data.donation || 0,
    data.ticketPrice,
    data.total,
    data.howHeard || '',
    data.footageDiscount ? 1 : 0,
    data.stripeSessionId || '',
    data.paymentStatus || 'pending'
  );
  return data.ref;
}

function getOrderByRef(ref) {
  const d = getDb();
  return d.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
}

function getOrderBySessionId(sessionId) {
  const d = getDb();
  return d.prepare('SELECT * FROM orders WHERE stripe_session_id = ?').get(sessionId);
}

function updateOrderStatus(ref, status) {
  const d = getDb();
  d.prepare('UPDATE orders SET payment_status = ? WHERE ref = ?').run(status, ref);
}

// Appointments
function createAppointment(data) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO appointments (ref, name, email, phone, occasion, path, vision, fabric, budget, preferred_date, format, location_preference, style_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.ref || '',
    data.name,
    data.email,
    data.phone || '',
    data.occasion || '',
    data.path || '',
    data.vision || '',
    data.fabric || '',
    data.budget || '',
    data.preferredDate || '',
    data.format || 'Video Call',
    data.locationPreference || 'Joy',
    data.styleNotes || '',
    'pending'
  );
  return { id: info.lastInsertRowid };
}

function getAppointments() {
  const d = getDb();
  return d.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all();
}

function getAppointmentById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
}

// Piece requests
function createPieceRequest(data) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO piece_requests (ref, name, email, phone, color, dress_size, cup_size, notes, piece_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.ref,
    data.name,
    data.email,
    data.phone || '',
    data.color || '',
    data.dressSize || '',
    data.cupSize || '',
    data.notes || '',
    data.pieceName || '',
    'pending'
  );
  return { id: info.lastInsertRowid };
}

function getPieceRequests() {
  const d = getDb();
  return d.prepare('SELECT * FROM piece_requests ORDER BY created_at DESC').all();
}

module.exports = {
  addToWaitlist,
  getWaitlistCount,
  createOrder,
  getOrderByRef,
  getOrderBySessionId,
  updateOrderStatus,
  createAppointment,
  getAppointments,
  getAppointmentById,
  createPieceRequest,
  getPieceRequests,
};
