const USE_PG = !!process.env.DATABASE_URL;

let run, get, all, initDB;

// ── 預設打包清單 ─────────────────────────────────────
const DEFAULT_CHECKLIST = [
  ['證件', '護照'], ['證件', '信用卡（2張以上）'], ['證件', '台灣健保卡'],
  ['錢財', '日圓現金'], ['錢財', '備用現金（台幣）'],
  ['3C', '手機充電線'], ['3C', '充電頭'], ['3C', '轉接頭（日本 A 型）'],
  ['3C', '行動電源'], ['3C', '相機 + 記憶卡'],
  ['交通', 'IC 卡（ICOCA / Suica）'], ['交通', 'WiFi 分享器 / SIM 卡'],
  ['衣物', '換洗衣物（含內衣）'], ['衣物', '外套 / 薄外套'],
  ['衣物', '舒適步行鞋'], ['衣物', '雨傘 / 輕量雨衣'],
  ['生活', '常備藥品（感冒 / 胃腸）'], ['生活', '防曬乳'],
  ['生活', '保養品 / 洗漱用品'], ['生活', '購物袋（環保）'],
];

// ── 預設重要資訊 ─────────────────────────────────────
const DEFAULT_INFO = [
  ['班機', '去程班機', ''],
  ['班機', '去程出發時間', '2027/04/17'],
  ['班機', '去程抵達時間', ''],
  ['班機', '回程班機', ''],
  ['班機', '回程出發時間', '2027/04/22'],
  ['班機', '回程抵達時間', ''],
  ['住宿', '大阪飯店名稱', ''],
  ['住宿', '大阪飯店地址', ''],
  ['住宿', '大阪 Check-in / Check-out', ''],
  ['住宿', '京都飯店名稱', ''],
  ['住宿', '京都飯店地址', ''],
  ['住宿', '京都 Check-in / Check-out', ''],
  ['緊急', '日本警察', '110'],
  ['緊急', '日本急救', '119'],
  ['緊急', '台灣駐大阪辦事處', '+81-6-4301-7335'],
  ['緊急', '台灣急難救助專線', '0800-085-095（免費）'],
  ['實用', '匯率參考', '1 TWD ≈ 4.8 JPY'],
  ['實用', 'IC 卡加值', '便利商店 / 車站加值機'],
  ['實用', '緊急醫療用語', '助けてください（救命）'],
];

if (USE_PG) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
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
        id SERIAL PRIMARY KEY, date TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0, time TEXT DEFAULT '', title TEXT NOT NULL,
        location TEXT DEFAULT '', map_url TEXT DEFAULT '',
        description TEXT DEFAULT '', category TEXT DEFAULT 'attraction'
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY, day_id INTEGER REFERENCES days(id),
        title TEXT NOT NULL, amount_jpy INTEGER DEFAULT 0,
        amount_twd INTEGER DEFAULT 0, payer TEXT DEFAULT '',
        notes TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS checklist (
        id SERIAL PRIMARY KEY, category TEXT DEFAULT '其他',
        item TEXT NOT NULL, checked INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS trip_info (
        id SERIAL PRIMARY KEY, category TEXT NOT NULL,
        key TEXT NOT NULL, value TEXT DEFAULT '', sort_order INTEGER DEFAULT 0
      );
    `);

    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT ''").catch(() => {});
    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS lat REAL").catch(() => {});
    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS lng REAL").catch(() => {});

    const dc = await pool.query('SELECT COUNT(*) as c FROM days');
    if (parseInt(dc.rows[0].c) === 0) {
      await pool.query(`INSERT INTO days (date, title, city) VALUES
        ('2027-04-17','啟程 · 大阪','大阪'),('2027-04-18','大阪探索','大阪'),
        ('2027-04-19','大阪深度遊','大阪'),('2027-04-20','前往京都','京都'),
        ('2027-04-21','京都古都之美','京都'),('2027-04-22','返程','大阪')`);
    }
    const cl = await pool.query('SELECT COUNT(*) as c FROM checklist');
    if (parseInt(cl.rows[0].c) === 0) {
      for (let i = 0; i < DEFAULT_CHECKLIST.length; i++) {
        const [cat, item] = DEFAULT_CHECKLIST[i];
        await pool.query('INSERT INTO checklist (category, item, sort_order) VALUES ($1, $2, $3)', [cat, item, i]);
      }
    }
    const ti = await pool.query('SELECT COUNT(*) as c FROM trip_info');
    if (parseInt(ti.rows[0].c) === 0) {
      for (let i = 0; i < DEFAULT_INFO.length; i++) {
        const [cat, key, value] = DEFAULT_INFO[i];
        await pool.query('INSERT INTO trip_info (category, key, value, sort_order) VALUES ($1, $2, $3, $4)', [cat, key, value, i]);
      }
    }
  };

} else {
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
      db.run(`CREATE TABLE IF NOT EXISTS days (id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL, title TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '', notes TEXT DEFAULT '')`);
      db.run(`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0, time TEXT DEFAULT '', title TEXT NOT NULL,
        location TEXT DEFAULT '', map_url TEXT DEFAULT '',
        description TEXT DEFAULT '', category TEXT DEFAULT 'attraction',
        image_url TEXT DEFAULT '')`);
      db.run(`ALTER TABLE activities ADD COLUMN image_url TEXT DEFAULT ''`, () => {});
      db.run(`ALTER TABLE activities ADD COLUMN lat REAL`, () => {});
      db.run(`ALTER TABLE activities ADD COLUMN lng REAL`, () => {});
      db.run(`CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER REFERENCES days(id), title TEXT NOT NULL,
        amount_jpy INTEGER DEFAULT 0, amount_twd INTEGER DEFAULT 0,
        payer TEXT DEFAULT '', notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
      db.run(`CREATE TABLE IF NOT EXISTS checklist (id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT DEFAULT '其他', item TEXT NOT NULL,
        checked INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0)`);
      db.run(`CREATE TABLE IF NOT EXISTS trip_info (id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL, key TEXT NOT NULL,
        value TEXT DEFAULT '', sort_order INTEGER DEFAULT 0)`);

      db.get('SELECT COUNT(*) as c FROM days', (err, row) => {
        if (!err && row.c === 0) {
          const s = db.prepare('INSERT INTO days (date, title, city) VALUES (?, ?, ?)');
          [['2027-04-17','啟程 · 大阪','大阪'],['2027-04-18','大阪探索','大阪'],
           ['2027-04-19','大阪深度遊','大阪'],['2027-04-20','前往京都','京都'],
           ['2027-04-21','京都古都之美','京都'],['2027-04-22','返程','大阪']]
          .forEach(d => s.run(d));
          s.finalize();
        }
      });
      db.get('SELECT COUNT(*) as c FROM checklist', (err, row) => {
        if (!err && row.c === 0) {
          const s = db.prepare('INSERT INTO checklist (category, item, sort_order) VALUES (?, ?, ?)');
          DEFAULT_CHECKLIST.forEach(([cat, item], i) => s.run([cat, item, i]));
          s.finalize();
        }
      });
      db.get('SELECT COUNT(*) as c FROM trip_info', (err, row) => {
        if (!err && row.c === 0) {
          const s = db.prepare('INSERT INTO trip_info (category, key, value, sort_order) VALUES (?, ?, ?, ?)');
          DEFAULT_INFO.forEach(([cat, key, val], i) => s.run([cat, key, val, i]));
          s.finalize();
        }
      });
      setTimeout(resolve, 300);
    });
  });
}

module.exports = { run, get, all, initDB };
