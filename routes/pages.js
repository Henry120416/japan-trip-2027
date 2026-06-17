const express = require('express');
const router = express.Router();
const { get, all, run } = require('../database/db');

function getPlan(req) {
  const c = req.headers.cookie || '';
  const m = c.match(/\btrip_plan=(\d)/);
  return m ? parseInt(m[1]) : 1;
}

router.get('/set-plan/:id', (req, res) => {
  const plan = parseInt(req.params.id) || 1;
  res.cookie('trip_plan', plan, { maxAge: 86400 * 730, path: '/' });
  const back = req.query.redirect || '/';
  res.redirect(back);
});

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
    const plan = getPlan(req);
    const days = await all(`
      SELECT d.*, COUNT(a.id) as activity_count
      FROM days d LEFT JOIN activities a ON a.day_id = d.id
      WHERE d.plan_id = ?
      GROUP BY d.id ORDER BY d.date
    `, [plan]);
    const plans = await all('SELECT * FROM plans ORDER BY id');
    res.render('index', { days, plans, currentPlan: plan });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/day/:date', async (req, res) => {
  try {
    const plan = getPlan(req);
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
    const plan = getPlan(req);
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
    const plan = getPlan(req);
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
    const plan = getPlan(req);
    const plans = await all('SELECT * FROM plans ORDER BY id');
    const days = await all('SELECT * FROM days WHERE plan_id = ? ORDER BY date', [plan]);
    const expenses = await all(`
      SELECT e.*, d.date as day_date, d.city as day_city, d.title as day_title
      FROM expenses e
      LEFT JOIN days d ON d.id = e.day_id
      WHERE d.plan_id = ? OR e.day_id IS NULL
      ORDER BY d.date, e.created_at
    `, [plan]);
    const stats = await get(`
      SELECT SUM(e.amount_jpy) as total_jpy, SUM(e.amount_twd) as total_twd
      FROM expenses e
      LEFT JOIN days d ON d.id = e.day_id
      WHERE d.plan_id = ? OR e.day_id IS NULL
    `, [plan]);
    res.render('expenses', {
      days, plans, currentPlan: plan,
      expenses,
      total_jpy: stats.total_jpy || 0,
      total_twd: stats.total_twd || 0,
      per_person: Math.ceil((stats.total_twd || 0) / 6),
    });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/info', async (req, res) => {
  try {
    const infoRows = await all('SELECT * FROM trip_info ORDER BY sort_order');
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
