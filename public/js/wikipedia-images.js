(async () => {
  const els = [...document.querySelectorAll('.act-wiki-img')];
  if (!els.length) return;

  const TC2JP = [
    ['稻荷','稲荷'],['稻','稲'],['黑','黒'],['國','国'],['關','関'],
    ['兩','両'],['來','来'],['會','会'],['萬','万'],['鐵','鉄'],
    ['號','号'],['區','区'],['藝','芸'],['觀','観'],['覽','覧'],
    ['澤','沢'],['濱','浜'],['豐','豊'],['禪','禅'],['龍','龍'],
    ['總','総'],['體','体'],['寶','宝'],['齊','斉'],['邊','辺'],
    ['圓','円'],['驛','駅'],['處','処'],['廟','廟'],['舊','旧'],
    ['戶','戸'],['歷','歴'],['廣','広'],['傳','伝'],['氣','気'],
    ['惠','恵'],['竈','竈'],['攤','屋台'],
    ['佛','仏'],['參','参'],['奧','奥'],['燈','灯'],['晚','晩'],
  ];

  function toJP(s) {
    let r = s;
    for (const [tc, jp] of TC2JP) r = r.replaceAll(tc, jp);
    return r;
  }

  async function wikiImg(term) {
    if (!term || term.length < 2) return null;
    try {
      const r = await fetch(
        'https://ja.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(toJP(term)),
        { headers: { Accept: 'application/json' } }
      );
      if (!r.ok) return null;
      const d = await r.json();
      return d.thumbnail?.source || null;
    } catch { return null; }
  }

  const termSet = new Set();
  els.forEach(el => {
    ['wiki','loc','loc2'].forEach(k => { if (el.dataset[k]) termSet.add(el.dataset[k]); });
  });
  const cache = {};
  await Promise.all([...termSet].map(async t => { cache[t] = await wikiImg(t); }));

  const cachedPairs = Object.entries(cache).filter(([,v]) => v);
  els.forEach(el => {
    const keys = ['wiki','loc','loc2'].map(k => el.dataset[k] || '').filter(Boolean);
    let url = null;
    for (const k of keys) { if (cache[k]) { url = cache[k]; break; } }
    if (!url) {
      for (const k of keys) {
        if (k.length < 2) continue;
        const p2 = k.slice(0, 2);
        const hit = cachedPairs.find(([ck]) => ck.startsWith(p2) || p2.startsWith(ck.slice(0,2)));
        if (hit) { url = hit[1]; break; }
      }
    }
    if (url) {
      const img = document.createElement('img');
      img.src = url; img.className = 'act-img'; img.loading = 'lazy';
      img.onerror = () => img.remove();
      el.replaceWith(img);
    } else {
      el.remove();
    }
  });
})();
