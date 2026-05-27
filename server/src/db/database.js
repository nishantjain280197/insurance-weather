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

  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      street_address TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zipcode TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS peril_thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wind_speed_mph REAL DEFAULT 58,
      wind_severe_mph REAL DEFAULT 65,
      wind_extreme_mph REAL DEFAULT 75,
      rain_minor_inches REAL DEFAULT 2.0,
      rain_moderate_inches REAL DEFAULT 3.0,
      rain_severe_inches REAL DEFAULT 4.0,
      hail_codes TEXT DEFAULT '96,99',
      thunderstorm_codes TEXT DEFAULT '95,96,99',
      winter_storm_codes TEXT DEFAULT '71,73,75,77,85,86',
      ice_storm_codes TEXT DEFAULT '56,57,66,67',
      winter_temp_max_f REAL DEFAULT 32,
      tornado_wind_mph REAL DEFAULT 75,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      claim_number TEXT UNIQUE NOT NULL,
      policy_number TEXT,
      claimant_name TEXT,
      city TEXT,
      state TEXT,
      date_of_loss DATE,
      peril_type TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'approved', 'denied', 'closed')),
      amount_claimed REAL,
      amount_approved REAL,
      notes TEXT,
      search_history_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (search_history_id) REFERENCES search_history(id) ON DELETE SET NULL
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
