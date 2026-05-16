const database = require('./connection');

async function ensureColumn(tableName, columnName, alterSql) {
  const columns = await database.all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await database.run(alterSql);
  }
}

async function initializeDatabase() {
  await database.exec('PRAGMA foreign_keys = ON;');

  await database.exec(`
    CREATE TABLE IF NOT EXISTS fundings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      goal_amount REAL NOT NULL CHECK(goal_amount > 0),
      funded_amount REAL NOT NULL DEFAULT 0 CHECK(funded_amount >= 0),
      deadline TEXT NOT NULL,
      qr_code TEXT,
      donors TEXT NOT NULL DEFAULT '',
      access_code TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funding_id INTEGER,
      funding_title TEXT NOT NULL,
      funding_code TEXT NOT NULL DEFAULT '',
      donor_name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      method TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (funding_id) REFERENCES fundings(id) ON DELETE SET NULL
    );
  `);

  await ensureColumn('fundings', 'qr_code', 'ALTER TABLE fundings ADD COLUMN qr_code TEXT');
  await ensureColumn('fundings', 'funded_amount', 'ALTER TABLE fundings ADD COLUMN funded_amount REAL NOT NULL DEFAULT 0');
  await ensureColumn('fundings', 'donors', "ALTER TABLE fundings ADD COLUMN donors TEXT NOT NULL DEFAULT ''");
  await ensureColumn('fundings', 'access_code', "ALTER TABLE fundings ADD COLUMN access_code TEXT NOT NULL DEFAULT ''");
  await ensureColumn('fundings', 'updated_at', 'ALTER TABLE fundings ADD COLUMN updated_at TEXT');
  await ensureColumn('donations', 'funding_code', "ALTER TABLE donations ADD COLUMN funding_code TEXT NOT NULL DEFAULT ''");

  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_fundings_access_code ON fundings(access_code);
    CREATE INDEX IF NOT EXISTS idx_donations_funding_id ON donations(funding_id);
    CREATE INDEX IF NOT EXISTS idx_donations_funding_code ON donations(funding_code);
  `);
}

module.exports = initializeDatabase;
