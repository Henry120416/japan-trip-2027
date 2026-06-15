const express = require('express');
const router = express.Router();
const { get, all } = require('../database/db');

router.get('/', async (req, res) => {
  try {
    const days = await all(`
      SELECT d.*, COUNT(a.id) as activity_count
      FROM days d LEFT JOIN activities a ON a.day_id = d.id
      GROUP BY d.id ORDER BY d.date
    `);
    res.render('index', { days });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/day/:date', async (req, res) => {
  try {
    const day = await get('SELECT * FROM days WHERE date = ?', [req.params.date]);
    if (!day) return res.redirect('/');
    const activities = await all(
      'SELECT * FROM activities WHERE day_id = ? ORDER BY time, sort_order',
      [day.id]
    );
    res.render('day', { day, activities });
  } catch (e) { res.status(500).send(e.message); }
});

router.get('/expenses', async (req, res) => {
  try {
    const days = await all('SELECT * FROM days ORDER BY date');
    const expenses = await all(`
      SELECT e.*, d.date as day_date, d.city as day_city, d.title as day_title
      FROM expenses e LEFT JOIN days d ON d.id = e.day_id
      ORDER BY d.date, e.created_at
    `);
    const stats = await get('SELECT SUM(amount_jpy) as total_jpy, SUM(amount_twd) as total_twd FROM expenses');
    res.render('expenses', {
      days,
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
