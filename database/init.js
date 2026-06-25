const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'attendance.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      reason TEXT NOT NULL,
      district TEXT DEFAULT '',
      reporting_officer TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      applied_on DATETIME DEFAULT CURRENT_TIMESTAMP,
      action_by TEXT,
      action_by_name TEXT,
      action_on DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
    )
  `);

  try { db.exec(`ALTER TABLE leaves ADD COLUMN district TEXT DEFAULT ''`); } catch (e) { /* column exists */ }
  try { db.exec(`ALTER TABLE leaves ADD COLUMN reporting_officer TEXT DEFAULT ''`); } catch (e) { /* column exists */ }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
    CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
    CREATE INDEX IF NOT EXISTS idx_leaves_from_date ON leaves(from_date);
    CREATE INDEX IF NOT EXISTS idx_leaves_to_date ON leaves(to_date);
    CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
  `);

  const hrAccounts = [
    { employee_id: 'MR001', name: 'Manager 1', password: 'xxxx' },
    { employee_id: 'MR002', name: 'Manager 2', password: 'xxxx' },
    { employee_id: 'MR003', name: 'Manager 3', password: 'xxxx' },
    { employee_id: 'HR001', name: 'HR 1', password: 'xxxx' },
    { employee_id: 'HR002', name: 'HR 2', password: 'xxxx' },
    { employee_id: 'HR003', name: 'HR 3', password: 'xxxx' },

  ];

  const insertHR = db.prepare(`
    INSERT OR IGNORE INTO employees (employee_id, name, password_hash, role)
    VALUES (?, ?, ?, 'hr')
  `);

  const seedTransaction = db.transaction(() => {
    for (const hr of hrAccounts) {
      const hash = bcrypt.hashSync(hr.password, 10);
      insertHR.run(hr.employee_id, hr.name, hash);
    }
  });

  seedTransaction();

  console.log('✅ Database initialized successfully');
}

module.exports = { db, initialize };
