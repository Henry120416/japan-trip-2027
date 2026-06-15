// 本機用 SQLite，雲端用 PostgreSQL（自動偵測）
const USE_PG = !!process.env.DATABASE_URL;

let run, get, all, initDB;

if (USE_PG) {
  // ── PostgreSQL (Render 雲端) ─────────────────────
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const toPG = sql => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

  run = async (sql, p = []) => {
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    const q = isInsert ? toPG(sql) + ' RETURNING id' : toPG(sql);
    const r = await pool.query(q, p);
    return { lastID: r.rows[0]?.id, changes: r.rowCount };
  };
  get = async (sql, p = []) => { const r = await pool.query(toPG(sql), p); return r.rows[0]; };
  all = async (sql, p = []) => { const r = await pool.query(toPG(sql), p); return r.rows; };

  initDB = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS days (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        time TEXT DEFAULT '',
        title TEXT NOT NULL,
        location TEXT DEFAULT '',
        map_url TEXT DEFAULT '',
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'attraction'
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        day_id INTEGER REFERENCES days(id),
        title TEXT NOT NULL,
        amount_jpy INTEGER DEFAULT 0,
        amount_twd INTEGER DEFAULT 0,
        payer TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    const r = await pool.query('SELECT COUNT(*) as c FROM days');
    if (parseInt(r.rows[0].c) === 0) {
      await pool.query(`
        INSERT INTO days (date, title, city) VALUES
        ('2027-04-17','啟程 · 大阪','大阪'),
        ('2027-04-18','大阪探索','大阪'),
        ('2027-04-19','大阪深度遊','大阪'),
        ('2027-04-20','前往京都','京都'),
        ('2027-04-21','京都古都之美','京都'),
        ('2027-04-22','返程','大阪')
      `);
    }
  };

} else {
  // ── SQLite (本機開發) ────────────────────────────
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const db = new sqlite3.Database(path.join(__dirname, 'trip.db'));

  run = (sql, p = []) => new Promise((res, rej) =>
    db.run(sql, p, function (err) { err ? rej(err) : res({ lastID: this.lastID, changes: this.changes }); })
  );
  get = (sql, p = []) => new Promise((res, rej) =>
    db.get(sql, p, (err, row) => { err ? rej(err) : res(row); })
  );
  all = (sql, p = []) => new Promise((res, rej) =>
    db.all(sql, p, (err, rows) => { err ? rej(err) : res(rows); })
  );

  initDB = () => new Promise(resolve => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run(`CREATE TABLE IF NOT EXISTS days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL, title TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '', notes TEXT DEFAULT '')`);
      db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0, time TEXT DEFAULT '',
        title TEXT NOT NULL, location TEXT DEFAULT '',
        map_url TEXT DEFAULT '', description TEXT DEFAULT '',
        category TEXT DEFAULT 'attraction')`);
      db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER REFERENCES days(id),
        title TEXT NOT NULL, amount_jpy INTEGER DEFAULT 0,
        amount_twd INTEGER DEFAULT 0, payer TEXT DEFAULT '',
        notes TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
      db.get('SELECT COUNT(*) as c FROM days', (err, row) => {
        if (!err && row.c === 0) {
          const s = db.prepare('INSERT INTO days (date, title, city) VALUES (?, ?, ?)');
          [['2027-04-17','啟程 · 大阪','大阪'],['2027-04-18','大阪探索','大阪'],
           ['2027-04-19','大阪深度遊','大阪'],['2027-04-20','前往京都','京都'],
           ['2027-04-21','京都古都之美','京都'],['2027-04-22','返程','大阪']]
          .forEach(d => s.run(d));
          s.finalize();
        }
        resolve();
      });
    });
  });
}

module.exports = { run, get, all, initDB };
