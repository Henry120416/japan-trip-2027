const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { run, get, all } = require('../database/db');

const TRIP_PIN = process.env.TRIP_PIN || 'japan2027';
const EDIT_TOKEN = crypto.createHash('sha256').update(TRIP_PIN + ':trip2027').digest('hex').slice(0, 32);

function requireToken(req, res, next) {
  if (req.headers['x-edit-token'] !== EDIT_TOKEN) {
    return res.status(401).json({ error: '未授權，請輸入編輯密碼' });
  }
  next();
}

router.post('/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin === TRIP_PIN) {
    res.json({ success: true, token: EDIT_TOKEN });
  } else {
    res.status(401).json({ success: false, error: '密碼錯誤' });
  }
});

// Activities
router.post('/activities', requireToken, async (req, res) => {
  try {
    const { day_id, time, title, location, map_url, description, category } = req.body;
    const maxRow = await get('SELECT MAX(sort_order) as m FROM activities WHERE day_id = ?', [day_id]);
    const sort_order = (maxRow && maxRow.m ? maxRow.m : 0) + 1;
    const result = await run(
      'INSERT INTO activities (day_id, time, title, location, map_url, description, category, sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [day_id, time || '', title, location || '', map_url || '', description || '', category || 'attraction', sort_order]
    );
    const row = await get('SELECT * FROM activities WHERE id = ?', [result.lastID]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/activities/:id', requireToken, async (req, res) => {
  try {
    const { time, title, location, map_url, description, category } = req.body;
    await run(
      'UPDATE activities SET time=?, title=?, location=?, map_url=?, description=?, category=? WHERE id=?',
      [time || '', title, location || '', map_url || '', description || '', category || 'attraction', req.params.id]
    );
    res.json(await get('SELECT * FROM activities WHERE id = ?', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/activities/:id', requireToken, async (req, res) => {
  try {
    await run('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Day title edit
router.put('/days/:id', requireToken, async (req, res) => {
  try {
    const { title, city, notes } = req.body;
    await run('UPDATE days SET title=?, city=?, notes=? WHERE id=?', [title, city, notes || '', req.params.id]);
    res.json(await get('SELECT * FROM days WHERE id = ?', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Expenses
router.post('/expenses', requireToken, async (req, res) => {
  try {
    const { day_id, title, amount_jpy, amount_twd, payer, notes } = req.body;
    const result = await run(
      'INSERT INTO expenses (day_id, title, amount_jpy, amount_twd, payer, notes) VALUES (?,?,?,?,?,?)',
      [day_id || null, title, amount_jpy || 0, amount_twd || 0, payer || '', notes || '']
    );
    res.json(await get('SELECT * FROM expenses WHERE id = ?', [result.lastID]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/expenses/:id', requireToken, async (req, res) => {
  try {
    await run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
