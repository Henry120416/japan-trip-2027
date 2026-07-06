/* ── Tab switching ──────────────────────────────────── */
const PANELS = ['trip', 'taxi', 'restaurant', 'check'];
function switchSeg(tab) {
  PANELS.forEach(p => {
    document.getElementById('panel-' + p).style.display = p === tab ? '' : 'none';
    document.getElementById('seg-' + p).classList.toggle('active', p === tab);
  });
}

/* ── Accordion ──────────────────────────────────────── */
function toggleAcc(hd) {
  hd.classList.toggle('open');
  hd.nextElementSibling.classList.toggle('open');
}

/* ── Text-to-Speech ─────────────────────────────────── */
function speakJP(text, btn) {
  if (!window.speechSynthesis) { showToast('此裝置不支援語音播放'); return; }
  if (btn.classList.contains('playing')) {
    speechSynthesis.cancel();
    btn.classList.remove('playing');
    return;
  }
  speechSynthesis.cancel();
  document.querySelectorAll('.speak-btn.playing').forEach(b => b.classList.remove('playing'));
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.82;
  u.onend  = () => btn.classList.remove('playing');
  u.onerror = () => btn.classList.remove('playing');
  btn.classList.add('playing');
  speechSynthesis.speak(u);
}

/* ── Checklist ──────────────────────────────────────── */
const _pb = document.getElementById('progressBar');
const CHECKLIST_TOTAL = _pb ? +_pb.dataset.total : 0;
let checkDone = _pb ? +_pb.dataset.done : 0;

function updateProgress(delta) {
  checkDone += delta;
  document.getElementById('progressText').textContent = checkDone;
  const pct = CHECKLIST_TOTAL > 0 ? Math.round(checkDone / CHECKLIST_TOTAL * 100) : 0;
  document.getElementById('progressBar').style.width = pct + '%';
}

async function toggleCheck(id, checked) {
  requireAuth(async () => {
    const r = await fetch('/api/checklist/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
      body: JSON.stringify({ checked })
    });
    if (r.status === 401) { editToken = null; sessionStorage.removeItem('trip_token'); return; }
    const box = document.getElementById('checkBox-' + id);
    const lbl = document.getElementById('checkLabel-' + id);
    if (checked) {
      box.classList.add('checked');
      box.innerHTML = '<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      lbl.classList.add('checked');
      updateProgress(1);
    } else {
      box.classList.remove('checked');
      box.innerHTML = '';
      lbl.classList.remove('checked');
      updateProgress(-1);
    }
  });
}

async function deleteCheck(id) {
  requireAuth(async () => {
    if (!confirm('確定刪除？')) return;
    const r = await fetch('/api/checklist/' + id, { method: 'DELETE', headers: { 'x-edit-token': editToken } });
    if (!r.ok) return showToast('刪除失敗');
    document.getElementById('check-' + id).remove();
    showToast('已刪除');
  });
}

function openAddCheck() {
  requireAuth(() => {
    document.getElementById('checkCat').value = '';
    document.getElementById('checkItem').value = '';
    document.getElementById('checkOverlay').classList.add('open');
    setTimeout(() => document.getElementById('checkItem').focus(), 350);
  });
}
function closeCheckModal() { document.getElementById('checkOverlay').classList.remove('open'); }

async function saveCheck() {
  const item = document.getElementById('checkItem').value.trim();
  if (!item) { showToast('請輸入項目名稱'); return; }
  const r = await fetch('/api/checklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
    body: JSON.stringify({ category: document.getElementById('checkCat').value.trim() || '其他', item })
  });
  if (!r.ok) return showToast('新增失敗');
  closeCheckModal();
  showToast('已新增');
  setTimeout(() => location.reload(), 400);
}

/* ── Trip info edit ─────────────────────────────────── */
function editInfo(id, key, value) {
  requireAuth(() => {
    document.getElementById('infoId').value = id;
    document.getElementById('infoModalTitle').textContent = key;
    document.getElementById('infoValue').value = value;
    document.getElementById('infoOverlay').classList.add('open');
    setTimeout(() => document.getElementById('infoValue').focus(), 350);
  });
}
function closeInfoModal() { document.getElementById('infoOverlay').classList.remove('open'); }

async function saveInfo() {
  const id = document.getElementById('infoId').value;
  const value = document.getElementById('infoValue').value.trim();
  const r = await fetch('/api/info/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
    body: JSON.stringify({ value })
  });
  if (!r.ok) return showToast('儲存失敗');
  document.getElementById('info-val-' + id).textContent = value || '點擊填寫';
  closeInfoModal();
  showToast('已儲存');
}
