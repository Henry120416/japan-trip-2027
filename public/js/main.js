/* ── Auth ──────────────────────────────────────── */
let editToken = sessionStorage.getItem('trip_token');
let pinCallback = null;

function requireAuth(cb) {
  if (editToken) { cb(); return; }
  pinCallback = cb;
  document.getElementById('pinField').value = '';
  document.getElementById('pinOverlay').classList.add('open');
  setTimeout(() => document.getElementById('pinField').focus(), 350);
}

function closePinModal() {
  document.getElementById('pinOverlay').classList.remove('open');
  pinCallback = null;
}

async function submitPin() {
  const pin = document.getElementById('pinField').value.trim();
  if (!pin) return;
  try {
    const r = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await r.json();
    if (data.success) {
      editToken = data.token;
      sessionStorage.setItem('trip_token', editToken);
      closePinModal();
      if (pinCallback) { const cb = pinCallback; pinCallback = null; cb(); }
    } else {
      showToast('密碼錯誤，請重試');
      document.getElementById('pinField').value = '';
      document.getElementById('pinField').focus();
    }
  } catch {
    showToast('網路錯誤，請稍後再試');
  }
}

/* ── Toast ──────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── Category ───────────────────────────────────── */
function selectCat(btn) {
  document.querySelectorAll('.cat-opt').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

function getSelectedCat() {
  const sel = document.querySelector('.cat-opt.sel');
  return sel ? sel.dataset.cat : 'attraction';
}

function setCat(cat) {
  document.querySelectorAll('.cat-opt').forEach(b => {
    b.classList.toggle('sel', b.dataset.cat === cat);
  });
}

/* ── Activity Modal ─────────────────────────────── */
function openAddActivity(dayId) {
  requireAuth(() => {
    document.getElementById('actModalTitle').textContent = '新增行程';
    document.getElementById('actDayId').value = dayId;
    document.getElementById('actId').value = '';
    document.getElementById('actTime').value = '';
    document.getElementById('actTitle').value = '';
    document.getElementById('actLocation').value = '';
    document.getElementById('actMapUrl').value = '';
    document.getElementById('actImageUrl').value = '';
    document.getElementById('actDesc').value = '';
    document.getElementById('actMapcode').value = '';
    setCat('transport');
    document.getElementById('actOverlay').classList.add('open');
    setTimeout(() => document.getElementById('actTitle').focus(), 350);
  });
}

function openEditActivity(data) {
  requireAuth(() => {
    document.getElementById('actModalTitle').textContent = '編輯行程';
    document.getElementById('actDayId').value = data.day_id;
    document.getElementById('actId').value = data.id;
    document.getElementById('actTime').value = data.time || '';
    document.getElementById('actTitle').value = data.title || '';
    document.getElementById('actLocation').value = data.location || '';
    document.getElementById('actMapUrl').value = data.map_url || '';
    document.getElementById('actImageUrl').value = data.image_url || '';
    document.getElementById('actDesc').value = data.description || '';
    document.getElementById('actMapcode').value = data.mapcode || '';
    setCat(data.category || 'attraction');
    document.getElementById('actOverlay').classList.add('open');
  });
}

function closeActModal() {
  document.getElementById('actOverlay').classList.remove('open');
}

async function saveActivity() {
  const title = document.getElementById('actTitle').value.trim();
  if (!title) { showToast('請輸入行程名稱'); return; }

  const id = document.getElementById('actId').value;
  const body = {
    day_id:      document.getElementById('actDayId').value,
    time:        document.getElementById('actTime').value,
    title,
    location:    document.getElementById('actLocation').value.trim(),
    map_url:     document.getElementById('actMapUrl').value.trim(),
    image_url:   document.getElementById('actImageUrl').value.trim(),
    description: document.getElementById('actDesc').value.trim(),
    category:    getSelectedCat(),
    mapcode:     document.getElementById('actMapcode').value.trim(),
  };

  const url    = id ? `/api/activities/${id}` : '/api/activities';
  const method = id ? 'PUT' : 'POST';

  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
      body: JSON.stringify(body),
    });
    if (r.status === 401) { editToken = null; sessionStorage.removeItem('trip_token'); showToast('Token 已過期，請重新輸入密碼'); return; }
    if (!r.ok) throw new Error();
    closeActModal();
    showToast(id ? '行程已更新' : '行程已新增');
    setTimeout(() => location.reload(), 500);
  } catch {
    showToast('儲存失敗，請重試');
  }
}

async function deleteActivity(id) {
  requireAuth(async () => {
    if (!confirm('確定要刪除這個行程？')) return;
    try {
      const r = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { 'x-edit-token': editToken },
      });
      if (!r.ok) throw new Error();
      showToast('已刪除');
      setTimeout(() => location.reload(), 500);
    } catch {
      showToast('刪除失敗，請重試');
    }
  });
}

/* ── Expense Modal ──────────────────────────────── */
function openAddExpense(dayId) {
  requireAuth(() => {
    document.getElementById('expDayId').value = dayId || '';
    document.getElementById('expTitle').value = '';
    document.getElementById('expJpy').value = '';
    document.getElementById('expTwd').value = '';
    document.getElementById('expPayer').value = '';
    document.getElementById('expNotes').value = '';

    // Build day selector if on expenses page
    const dayIdField = document.getElementById('expDayId');
    if (typeof TRIP_DAYS !== 'undefined' && !dayId) {
      // show a simple select if we have TRIP_DAYS
      let sel = document.getElementById('expDaySelect');
      if (!sel) {
        sel = document.createElement('select');
        sel.id = 'expDaySelect';
        sel.className = 'fg';
        sel.style.cssText = 'width:100%;padding:11px 14px;background:var(--fill);border:1px solid transparent;border-radius:var(--r-md);font-size:16px;color:var(--t1);font-family:inherit;outline:none;-webkit-appearance:none;margin-bottom:14px';
        sel.innerHTML = '<option value="">選擇日期（可選）</option>' +
          TRIP_DAYS.map(d => `<option value="${d.id}">${d.label}</option>`).join('');
        sel.onchange = () => { dayIdField.value = sel.value; };
        document.getElementById('expTitle').parentElement.before(sel);
      }
    }

    document.getElementById('expOverlay').classList.add('open');
    setTimeout(() => document.getElementById('expTitle').focus(), 350);
  });
}

function closeExpModal() {
  document.getElementById('expOverlay').classList.remove('open');
}

async function saveExpense() {
  const title = document.getElementById('expTitle').value.trim();
  if (!title) { showToast('請輸入費用名稱'); return; }

  const body = {
    day_id:     document.getElementById('expDayId').value || null,
    title,
    amount_jpy: parseInt(document.getElementById('expJpy').value) || 0,
    amount_twd: parseInt(document.getElementById('expTwd').value) || 0,
    payer:      document.getElementById('expPayer').value.trim(),
    notes:      document.getElementById('expNotes').value.trim(),
  };

  try {
    const r = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
      body: JSON.stringify(body),
    });
    if (r.status === 401) { editToken = null; sessionStorage.removeItem('trip_token'); showToast('請重新輸入密碼'); return; }
    if (!r.ok) throw new Error();
    closeExpModal();
    showToast('費用已新增');
    setTimeout(() => location.reload(), 500);
  } catch {
    showToast('儲存失敗，請重試');
  }
}

async function deleteExpense(id) {
  requireAuth(async () => {
    if (!confirm('確定要刪除這筆費用？')) return;
    try {
      const r = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'x-edit-token': editToken },
      });
      if (!r.ok) throw new Error();
      showToast('已刪除');
      setTimeout(() => location.reload(), 500);
    } catch {
      showToast('刪除失敗，請重試');
    }
  });
}

/* ── MAPCODE Copy ───────────────────────────────── */
function copyMC(code, btn) {
  navigator.clipboard.writeText(code).then(() => {
    btn.classList.add('copied');
    showToast('MAPCODE 已複製');
    setTimeout(() => btn.classList.remove('copied'), 1500);
  }).catch(() => showToast('複製失敗'));
}

/* ── PWA Service Worker ─────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
