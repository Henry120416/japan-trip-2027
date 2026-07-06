const express = require('express');
const router = express.Router();
const { get, all, run } = require('../database/db');

const PLAN = 1;

const CAT_COLORS = { '機票':'#FD7043','住宿':'#A29BFE','交通':'#5E97F6','景點門票':'#FF9F43','餐飲':'#66BB6A','購物':'#EE5A24','其他':'#B2BEC3' };
const PERSONS = 6;

function expCat(title) {
  if (/機票/.test(title))                                                             return '機票';
  if (/電車|JR|南海|阪神|阪急|交通|宅配|HARUKA|纜車|機場|搭乘|Rapi|電鐵|巴士|ロープウェイ|公車|地鐵/.test(title)) return '交通';
  if (/入場費|門票|參觀|入場|入館/.test(title))                                         return '景點門票';
  if (/午餐|晚餐|早餐|茶|燒肉|牛肉|料理|餐|市場|飲食|壽司|拉麵|串炸|甜點|美食|抹茶/.test(title)) return '餐飲';
  if (/購物|Outlet|免稅|手信|伴手禮/.test(title))                                       return '購物';
  if (/住宿|飯店|旅館|Hotel/.test(title))                                               return '住宿';
  return '其他';
}

async function geocode(loc) {
  if (!loc) return null;
  const clean = loc.replace(/[（(][^）)]*[）)]/g, '').trim();
  try {
    const q = encodeURIComponent(clean + ' 日本');
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'JapanTrip2027/1.0' }
    });
    const d = await r.json();
    return d[0] ? { lat: +d[0].lat, lng: +d[0].lon } : null;
  } catch { return null; }
}

router.get('/', async (req, res) => {
  try {
    const plan = PLAN;
    const days = await all(`
      SELECT d.*, COUNT(a.id) as activity_count
      FROM days d LEFT JOIN activities a ON a.day_id = d.id
      WHERE d.plan_id = ?
      GROUP BY d.id ORDER BY d.date
    `, [plan]);
    for (const day of days) {
      const img = await get(
        `SELECT image_url FROM activities WHERE day_id = ? AND image_url IS NOT NULL AND image_url != '' ORDER BY sort_order, id LIMIT 1`,
        [day.id]
      );
      day.heroImg = img ? img.image_url : null;
    }
    res.render('index', { days });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/day/:date', async (req, res) => {
  try {
    const plan = PLAN;
    const day = await get('SELECT * FROM days WHERE date = ? AND plan_id = ?', [req.params.date, plan]);
    if (!day) return res.redirect('/');
    const activities = await all(
      'SELECT * FROM activities WHERE day_id = ? ORDER BY time, sort_order',
      [day.id]
    );
    res.render('day', { day, activities, currentPlan: plan });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/day/:date/map', async (req, res) => {
  try {
    const plan = PLAN;
    const day = await get('SELECT * FROM days WHERE date = ? AND plan_id = ?', [req.params.date, plan]);
    if (!day) return res.redirect('/');
    const acts = await all('SELECT * FROM activities WHERE day_id = ? ORDER BY time, sort_order', [day.id]);
    for (const a of acts) {
      if (a.lat == null && a.location) {
        const c = await geocode(a.location);
        if (c) {
          await run('UPDATE activities SET lat=?, lng=? WHERE id=?', [c.lat, c.lng, a.id]);
          a.lat = c.lat; a.lng = c.lng;
        }
        await new Promise(r => setTimeout(r, 350));
      }
    }
    res.render('map', { day, activities: acts });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/overview-map', async (req, res) => {
  try {
    const plan = PLAN;
    const days = await all('SELECT * FROM days WHERE plan_id = ? ORDER BY date', [plan]);
    const acts = await all(`
      SELECT a.*, d.date as day_date, d.title as day_title, d.city as day_city
      FROM activities a JOIN days d ON d.id = a.day_id
      WHERE d.plan_id = ? AND a.lat IS NOT NULL AND a.lng IS NOT NULL
      ORDER BY d.date, a.time, a.sort_order
    `, [plan]);
    res.render('overview-map', { days, acts });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/expenses', async (req, res) => {
  try {
    const plan = PLAN;
    const days = await all('SELECT * FROM days WHERE plan_id = ? ORDER BY date', [PLAN]);
    const expenses = await all(`
      SELECT e.*, d.date as day_date, d.city as day_city, d.title as day_title
      FROM expenses e
      LEFT JOIN days d ON d.id = e.day_id
      WHERE d.plan_id = ? OR e.day_id IS NULL
      ORDER BY d.date, e.created_at
    `, [PLAN]);
    const stats = await get(`
      SELECT SUM(e.amount_jpy) as total_jpy, SUM(e.amount_twd) as total_twd
      FROM expenses e
      LEFT JOIN days d ON d.id = e.day_id
      WHERE d.plan_id = ? OR e.day_id IS NULL
    `, [PLAN]);

    const catTotals = {};
    expenses.forEach(e => {
      const cat = expCat(e.title);
      catTotals[cat] = (catTotals[cat] || 0) + (e.amount_twd || 0);
    });
    const chartLabels = Object.keys(catTotals).filter(k => catTotals[k] > 0);
    const chartData   = chartLabels.map(k => Math.ceil(catTotals[k] / PERSONS));
    const chartColors = chartLabels.map(k => CAT_COLORS[k] || CAT_COLORS['其他']);

    const grouped = {};
    expenses.forEach(e => {
      const key = e.day_id || 'none';
      if (!grouped[key]) grouped[key] = {
        label: e.day_date ? e.day_title + ' · ' + e.day_date.replace(/-/g,'/') : '未分類',
        items: []
      };
      grouped[key].items.push(e);
    });

    res.render('expenses', {
      days,
      expenses,
      grouped,
      chartLabels,
      chartData,
      chartColors,
      total_jpy: stats.total_jpy || 0,
      total_twd: stats.total_twd || 0,
      per_person: Math.ceil((stats.total_twd || 0) / PERSONS),
    });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/info', async (req, res) => {
  try {
    const infoRows = await all(`SELECT * FROM trip_info WHERE category != 'system' ORDER BY sort_order`);
    const checklist = await all('SELECT * FROM checklist ORDER BY sort_order');

    // Group info by category
    const info = {};
    infoRows.forEach(r => {
      if (!info[r.category]) info[r.category] = [];
      info[r.category].push(r);
    });

    // Group checklist by category
    const checks = {};
    checklist.forEach(r => {
      if (!checks[r.category]) checks[r.category] = [];
      checks[r.category].push(r);
    });

    const total = checklist.length;
    const done = checklist.filter(c => c.checked).length;

    res.render('info', { info, checks, total, done });
  } catch (e) { res.status(500).send(e.message); }
});

module.exports = router;
