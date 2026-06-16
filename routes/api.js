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
    const { day_id, time, title, location, map_url, description, category, image_url } = req.body;
    const maxRow = await get('SELECT MAX(sort_order) as m FROM activities WHERE day_id = ?', [day_id]);
    const sort_order = (maxRow && maxRow.m ? maxRow.m : 0) + 1;
    const result = await run(
      'INSERT INTO activities (day_id, time, title, location, map_url, description, category, image_url, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      [day_id, time || '', title, location || '', map_url || '', description || '', category || 'attraction', image_url || '', sort_order]
    );
    const row = await get('SELECT * FROM activities WHERE id = ?', [result.lastID]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/activities/:id', requireToken, async (req, res) => {
  try {
    const { time, title, location, map_url, description, category, image_url } = req.body;
    await run(
      'UPDATE activities SET time=?, title=?, location=?, map_url=?, description=?, category=?, image_url=? WHERE id=?',
      [time || '', title, location || '', map_url || '', description || '', category || 'attraction', image_url || '', req.params.id]
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

router.patch('/activities/:id', requireToken, async (req, res) => {
  try {
    const { image_url } = req.body;
    await run('UPDATE activities SET image_url=? WHERE id=?', [image_url || '', req.params.id]);
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

// Checklist
router.patch('/checklist/:id', requireToken, async (req, res) => {
  try {
    const { checked } = req.body;
    await run('UPDATE checklist SET checked=? WHERE id=?', [checked ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/checklist', requireToken, async (req, res) => {
  try {
    const { category, item } = req.body;
    const maxRow = await get('SELECT MAX(sort_order) as m FROM checklist');
    const sort_order = (maxRow && maxRow.m ? maxRow.m : 0) + 1;
    const result = await run(
      'INSERT INTO checklist (category, item, sort_order) VALUES (?,?,?)',
      [category || '其他', item, sort_order]
    );
    res.json(await get('SELECT * FROM checklist WHERE id = ?', [result.lastID]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/checklist/:id', requireToken, async (req, res) => {
  try {
    await run('DELETE FROM checklist WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Trip Info
router.put('/info/:id', requireToken, async (req, res) => {
  try {
    const { value, key, category } = req.body;
    await run(
      'UPDATE trip_info SET value=?, key=COALESCE(?,key), category=COALESCE(?,category) WHERE id=?',
      [value, key || null, category || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/info', requireToken, async (req, res) => {
  try {
    const { category, key, value } = req.body;
    const maxRow = await get('SELECT MAX(sort_order) as m FROM trip_info');
    const sort_order = (maxRow && maxRow.m ? maxRow.m : 0) + 1;
    const result = await run(
      'INSERT INTO trip_info (category, key, value, sort_order) VALUES (?,?,?,?)',
      [category, key, value || '', sort_order]
    );
    res.json(await get('SELECT * FROM trip_info WHERE id = ?', [result.lastID]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
