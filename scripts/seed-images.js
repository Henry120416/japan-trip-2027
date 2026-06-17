/**
 * seed-images.js
 * 向 ja.wikipedia.org 查詢 Plan 1 各活動的縮圖 URL，
 * 並更新本地 SQLite 的 image_url 欄位，同時輸出 ENRICH 陣列供 db.js 使用。
 */
const { all, run, initDB } = require('../database/db');

// 繁體→日文漢字對應（與 day.ejs 保持一致）
const TC2JP = [
  ['稻荷','稲荷'],['稻','稲'],['黑','黒'],['國','国'],['關','関'],
  ['兩','両'],['來','来'],['會','会'],['萬','万'],['鐵','鉄'],
  ['號','号'],['區','区'],['藝','芸'],['觀','観'],['覽','覧'],
  ['澤','沢'],['濱','浜'],['豐','豊'],['禪','禅'],['龍','龍'],
  ['總','総'],['體','体'],['寶','宝'],['齊','斉'],['邊','辺'],
  ['圓','円'],['驛','駅'],['處','処'],['廟','廟'],
];
function toJP(s) {
  let r = s;
  for (const [tc, jp] of TC2JP) r = r.replaceAll(tc, jp);
  return r;
}

// 從 location 欄位提取 Wikipedia 搜尋關鍵字
function extractWikiTerm(activity) {
  const { title, location, category } = activity;

  // transport: 取目的地（→ 後的最後一段），再清理括號
  if (category === 'transport' && location && location.includes('→')) {
    const dest = location.split('→').pop();
    const cleaned = dest.replace(/（[^）]*）/g,'').replace(/\([^\)]*\)/g,'').replace(/[・/].*/,'').trim();
    if (cleaned) return cleaned;
  }

  // 用 location 清理後作為搜尋詞
  if (location) {
    const cleaned = location
      .replace(/（[^）]*）/g,'')
      .replace(/\([^\)]*\)/g,'')
      .split('・')[0]
      .split('→')[0]
      .split('/')[0]
      .trim();
    if (cleaned) return cleaned;
  }

  // fallback: 用 title 第一個・之前的部分
  return title.split('・')[0].split('（')[0].trim();
}

async function fetchWikiImages(terms) {
  const jpTerms = terms.map(toJP);
  const url = 'https://ja.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=800&origin=*&redirects=1&titles='
    + jpTerms.map(encodeURIComponent).join('|');
  const res = await fetch(url, { headers: { 'User-Agent': 'JapanTrip2027-seed/1.0' } });
  const data = await res.json();

  // jp title → image url
  const imgMap = {};
  for (const p of Object.values(data.query?.pages || {})) {
    if (p.thumbnail?.source) imgMap[p.title] = p.thumbnail.source;
  }
  // 處理 redirect
  for (const rd of (data.query?.redirects || [])) {
    if (imgMap[rd.to]) imgMap[rd.from] = imgMap[rd.to];
  }

  // 反映射回原始 term（TC 版本）
  const result = {};
  terms.forEach((orig, i) => {
    const jp = jpTerms[i];
    if (imgMap[jp]) { result[orig] = imgMap[jp]; return; }
    // fuzzy 前4字比對
    const found = Object.entries(imgMap).find(([k]) =>
      k.includes(jp.slice(0,4)) || jp.includes(k.slice(0,4))
    );
    if (found) result[orig] = found[1];
  });
  return result;
}

async function main() {
  await initDB();

  const acts = await all(`
    SELECT a.id, a.title, a.location, a.category, a.image_url
    FROM activities a JOIN days d ON d.id = a.day_id
    WHERE d.plan_id = 1 ORDER BY d.date, a.sort_order
  `);

  // 為每個活動建立搜尋詞
  const termOf = {};
  acts.forEach(a => { termOf[a.id] = extractWikiTerm(a); });

  console.log('\n=== 搜尋詞 ===');
  acts.forEach(a => console.log(`  [${a.category}] ${a.title} → "${termOf[a.id]}"`));

  // 批次查詢（每次最多 50 個 titles）
  const uniqueTerms = [...new Set(Object.values(termOf))];
  const imgMap = {};
  for (let i = 0; i < uniqueTerms.length; i += 20) {
    const batch = uniqueTerms.slice(i, i + 20);
    console.log(`\n查詢批次 ${Math.floor(i/20)+1}: ${batch.join(', ')}`);
    const res = await fetchWikiImages(batch);
    Object.assign(imgMap, res);
    if (i + 20 < uniqueTerms.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== 找到的圖片 ===');
  const enrichEntries = [];
  let found = 0, missing = 0;

  for (const a of acts) {
    const term = termOf[a.id];
    const url = imgMap[term];
    if (url) {
      found++;
      console.log(`  ✓ ${a.title} → ${url.slice(0, 70)}...`);
      await run('UPDATE activities SET image_url=? WHERE id=?', [url, a.id]);
      enrichEntries.push({ kw: a.title.split('（')[0].split('・')[0].trim(), img: url });
    } else {
      missing++;
      console.log(`  ✗ ${a.title} → 未找到 (searched: "${term}")`);
    }
  }

  console.log(`\n結果: ${found} 找到 / ${missing} 未找到`);

  // 輸出 ENRICH 陣列供複製到 db.js
  console.log('\n=== 可加入 db.js ENRICH 的 img 欄位 ===');
  enrichEntries.forEach(e => {
    console.log(`  { kw:'${e.kw}', img:'${e.img}' },`);
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
