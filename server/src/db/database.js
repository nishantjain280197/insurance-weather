const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'weather_portal.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb();
  }
  return db;
}

function initializeDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      street_address TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zipcode TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      date_of_loss DATE NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const adminExists = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('admin@weatherportal.com');

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('Admin@123', 10);
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
      'admin@weatherportal.com',
      hashedPassword,
      'admin'
    );
    console.log('Default admin user created: admin@weatherportal.com / Admin@123');
  }
}

module.exports = { getDb };
