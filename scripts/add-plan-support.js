// 新增雙方案支援：plans 表、days.plan_id 欄位、方案一資料
const { run, get, all } = require('../database/db');

async function main() {

  // ── 1. 建立 plans 表 ─────────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS plans (
    id       INTEGER PRIMARY KEY,
    name     TEXT NOT NULL,
    subtitle TEXT
  )`);
  await run(`INSERT OR IGNORE INTO plans VALUES (1,'方案一','大阪出發・環球影城')`);
  await run(`INSERT OR IGNORE INTO plans VALUES (2,'方案二','京都出發・神戶一日遊')`);
  console.log('✓ plans 表建立');

  // ── 2. 重建 days 表：移除 date UNIQUE，改為 (date,plan_id) 聯合唯一 ──
  const ddl = await get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='days'`);
  const needsRebuild = ddl && ddl.sql.includes('date TEXT UNIQUE');
  if (needsRebuild) {
    await run(`PRAGMA foreign_keys=OFF`);
    await run(`CREATE TABLE days_new (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      date    TEXT NOT NULL,
      title   TEXT NOT NULL DEFAULT '',
      city    TEXT NOT NULL DEFAULT '',
      notes   TEXT DEFAULT '',
      plan_id INTEGER DEFAULT 1,
      UNIQUE(date, plan_id)
    )`);
    await run(`INSERT INTO days_new SELECT id,date,title,city,notes,COALESCE(plan_id,2) FROM days`);
    await run(`DROP TABLE days`);
    await run(`ALTER TABLE days_new RENAME TO days`);
    await run(`PRAGMA foreign_keys=ON`);
    console.log('✓ days 表重建（date UNIQUE → (date,plan_id) 聯合唯一）');
  } else {
    console.log('✓ days 表無需重建');
  }

  // ── 3. 確保現有 6 筆 days 為 plan_id=2 ──────────────────────
  await run(`UPDATE days SET plan_id=2 WHERE plan_id IS NULL OR plan_id NOT IN (1,2)`);
  console.log('✓ 現有行程確認為方案二');

  // ── 4. 插入方案一的 days（若已存在則跳過）───────────────────
  const exist = await get(`SELECT id FROM days WHERE date='2027-04-17' AND plan_id=1`);
  if (exist) {
    console.log('! 方案一已存在，跳過插入');
  } else {
    const p1Days = [
      { date:'2027-04-17', title:'抵達大阪・道頓堀初夜',      city:'大阪',    notes:'下午抵達關西機場，入住難波/心齋橋周邊飯店，晚上初探道頓堀。' },
      { date:'2027-04-18', title:'大阪名所全攻略',              city:'大阪',    notes:'大阪城、黑門市場、天王寺、通天閣，感受浪速之城的活力。' },
      { date:'2027-04-19', title:'環球影城（USJ）',             city:'大阪',    notes:'全日沉浸在電影的魔法世界，哈利波特・小小兵・超級任天堂。' },
      { date:'2027-04-20', title:'金閣寺・嵐山→入住京都',      city:'京都',    notes:'從大阪移居京都，下午遊覽金閣寺與嵐山竹林。' },
      { date:'2027-04-21', title:'京都精華：稻荷・清水・祇園', city:'京都',    notes:'伏見稻荷早晨千本鳥居、清水寺、二三年坂、八坂神社、錦市場。' },
      { date:'2027-04-22', title:'黑門市場・返程',              city:'大阪・關西', notes:'早餐逛黑門市場，臨空城Outlet最後購物，關西機場返台。' },
    ];
    for (const d of p1Days) {
      await run(
        `INSERT INTO days (date, title, city, notes, plan_id) VALUES (?,?,?,?,1)`,
        [d.date, d.title, d.city, d.notes]
      );
    }
    console.log('✓ 方案一 6 天建立完成');
  }

  // ── 5. 取得方案一各天 ID ─────────────────────────────────────
  const p1 = {};
  const p1Days = await all(`SELECT id, date FROM days WHERE plan_id=1 ORDER BY date`);
  p1Days.forEach(d => { p1[d.date] = d.id; });

  // 已有活動則跳過
  const cnt = await get(`SELECT COUNT(*) as c FROM activities WHERE day_id IN (${Object.values(p1).join(',')})`);
  if (cnt.c > 0) {
    console.log('! 方案一活動已存在，跳過');
    console.log('✅ 完成');
    process.exit(0);
  }

  // ── 6. 插入方案一活動 ────────────────────────────────────────
  const ins = (day_id, sort_order, time, category, title, location, lat, lng, description) =>
    run(`INSERT INTO activities (day_id,sort_order,time,category,title,location,lat,lng,description,map_url,image_url,mapcode)
         VALUES (?,?,?,?,?,?,?,?,?,'','','')`,
        [day_id, sort_order, time, category, title, location, lat, lng, description]);

  // Day 1: 抵達大阪・道頓堀初夜
  const d1 = p1['2027-04-17'];
  await ins(d1,1,'15:00','transport','抵達關西機場','關西國際空港（KIX）',34.4347,135.2440,
    '搭乘南海電車「Rapi:t」從關西機場出發，終點難波站約38分鐘（1450円），是前往大阪市區最快捷的方式。\n\n🚃 路線選擇：\n・南海Rapi:t（特急）→ 難波 約38分\n・南海空港急行 → 難波 約50分（較便宜）\n・JR Haruka → 天王寺/大阪站 約50分\n\n💡 建議購買「南海電車 YOKOSO！OSAKA TICKET」，含Rapi:t乘車券＋地鐵一日券，超值划算。');
  await ins(d1,2,'17:30','transport','入住大阪飯店・難波','難波・心齋橋周邊',34.6657,135.5014,
    '入住難波或心齋橋周邊飯店，這裡是大阪最核心的商圈，步行可達道頓堀、心齋橋、黑門市場。\n\n📍 推薦住宿區域：\n・難波（Namba）— 交通便捷，地鐵4線交匯\n・心齋橋（Shinsaibashi）— 購物、餐廳最集中\n・道頓堀周邊 — 熱鬧有氣氛，適合夜貓族');
  await ins(d1,3,'19:00','attraction','道頓堀・心齋橋初探','道頓堀・心齋橋',34.6687,135.5023,
    '大阪最具代表性的繁華地帶！格利科跑者霓虹招牌下拍照打卡，是每位旅人必做的事。\n\n🌃 散步路線：\n格利科跑者→戎橋→道頓堀商店街→心齋橋商店街（全長約1.5公里）\n\n螃蟹道樂、章魚燒わなか、金龍拉麵，邊走邊吃是大阪夜晚最正確的打開方式。');
  await ins(d1,4,'20:30','food','串炸名店・難波晚餐','難波・道頓堀周邊',34.6657,135.5014,
    '初抵大阪，必嚐正宗串炸（串カツ）！大阪發源的炸物料理，麵衣酥脆、食材多元，沾上特調醬汁（只能沾一次，禁止二次沾醬！）。\n\n🍢 推薦：\n・だるま 道頓堀店（創業1929年，元祖串炸）\n・やまちゃん（難波本店，人氣排隊店）\n・串カツ 一番（隱藏版巷弄名店）\n\n💡 串炸配上大阪生啤，是一天最完美的收尾。');

  // Day 2: 大阪名所全攻略
  const d2 = p1['2027-04-18'];
  await ins(d2,1,'09:00','attraction','大阪城公園・天守閣','大阪城公園',34.6873,135.5262,
    '豐臣秀吉所建，日本三大名城之一。大阪城公園綠意盎然，春天盛開1270棵染井吉野櫻，天守閣內設有歷史博物館，8樓展望台可俯瞰大阪市區。\n\n🏯 實用資訊：\n・門票600円，開館09:00\n・從地鐵「谷町4丁目站」步行約10分\n・建議先遊公園外圍（免費），再入內天守閣');
  await ins(d2,2,'12:00','food','黑門市場午餐','黑門市場（日本橋）',34.6653,135.5073,
    '「大阪的廚房」！170家店鋪匯集，食材直接在市場內現吃，是最有大阪風味的午餐體驗。\n\n🦀 必吃：\n・海膽（うに）現食\n・帝王蟹腳・松葉蟹\n・現烤牛肉串\n・厚切玉子燒\n\n邊走邊吃是黑門市場的正確方式，準備好購物袋和食慾！');
  await ins(d2,3,'14:00','attraction','天王寺・あべのハルカス','あべのハルカス（天王寺）',34.6461,135.5135,
    '日本最高摩天大樓（300公尺），頂層展望台「ハルカス300」可360度俯瞰大阪、神戶、京都甚至淡路島。\n\n📍 周邊：\n・天王寺動物園（親子適合）\n・通天閣（步行15分）\n・天王寺公園（免費散步）\n\n💡 展望台票價1500円，日落前後最美，17-19點是黃金時段。');
  await ins(d2,4,'16:30','attraction','新世界・通天閣','新世界・通天閣',34.6524,135.5063,
    '大阪懷舊商圈，充滿昭和時代的市井氣息。108公尺高的通天閣是大阪象徵，頂部幸福神（ビリケン）是當地的福氣之神，摸摸他的腳掌能帶來好運。\n\n串炸小店、懷舊遊戲廳、老大阪的日常風景，與道頓堀完全不同的大阪面貌。\n\n💡 通天閣門票700円，頂層特別展望台300円（加購）。');
  await ins(d2,5,'19:00','food','新世界串炸晚餐','新世界・ジャンジャン横丁',34.6524,135.5063,
    '新世界的「ジャンジャン横丁」小巷是大阪最道地的串炸激戰區，十幾家老字號排排站，每家都有自己的醬汁秘方。\n\n🍢 推薦：\n・八重勝（排隊也值得的名店）\n・てんぐ（新世界本店，份量紮實）\n・元祖串炸 横綱（老字號，傳統口味）\n\n配上一杯生啤，感受大阪庶民的夜晚。');

  // Day 3: 環球影城
  const d3 = p1['2027-04-19'];
  await ins(d3,1,'09:00','attraction','環球影城（USJ）全日遊覽','UNIVERSAL STUDIOS JAPAN',34.6654,135.4321,
    '日本最頂級的主題樂園！佔地約54公頃，擁有哈利波特、小小兵、超級任天堂等世界級主題區。\n\n🎢 必玩設施：\n・哈利波特魔法世界（奧利凡德魔杖店・霍格華茲城堡・鷹馬的飛行）\n・超級任天堂世界（瑪利歐賽車・耀西冒險）\n・小小兵瘋狂乘車遊\n・蜘蛛人驚魂歷險記\n\n💡 強烈建議提前購買「快速通關票（Express Pass）」，避免排隊2-3小時。門票約9400円起，快速通關另計。\n\n🕗 建議09:00開園前已在門口，最後入場時間根據季節不同，通常到21:00。');
  await ins(d3,2,'20:30','food','大阪站・梅田晚餐','大阪駅・梅田',34.7025,135.4959,
    '從USJ返回後，在大阪站周邊的梅田商圈享用晚餐，補充一天消耗的能量。\n\n🍜 推薦：\n・梅田地下街（Whity Umeda / Diamor Osaka）各式料理\n・Grand Front Osaka 餐廳樓層\n・LUCUA 1100 美食廣場\n\n梅田是大阪最大的交通樞紐，選擇豐富，口袋深淺皆宜。');

  // Day 4: 移往京都
  const d4 = p1['2027-04-20'];
  await ins(d4,1,'10:00','transport','移往京都・JR新快速','大阪→京都（JR京都線）',34.9858,135.7585,
    '搭JR京都線新快速，大阪站→京都站約28分鐘（730円），輕鬆移居古都。\n\n🧳 行李處理：\n・先到京都飯店辦理行李寄放（check-in通常14:00起）\n・若飯店支援早期入住可直接入住\n・大行李建議前一天用YAMATO宅急便寄送，輕裝移動更優雅\n\n入住後即可輕裝出發探索京都。');
  await ins(d4,2,'12:00','attraction','金閣寺（鹿苑寺）','金閣寺（鹿苑寺）',35.0394,135.7292,
    '三層鎏金樓閣完美倒映在鏡湖池中，是京都最具代表性的明信片風景，UNESCO世界遺產。\n\n💡 最佳拍攝方位是入口進去後左側的觀景台，可拍到金閣與水中倒影的完美構圖。\n\n門票500円，開館09:00，午後光線從南方直射，金閣在陽光下最為耀眼。');
  await ins(d4,3,'14:30','attraction','嵐山竹林小徑','嵐山竹林（野宮神社→大河內山莊）',35.0170,135.6714,
    '高聳的孟宗竹如綠色穹頂，竹葉沙沙作響，是京都最療癒的自然景點。\n\n🎋 路線：野宮神社入口→竹林小徑（約500公尺）→大河內山莊庭園\n\n下午人潮較多，建議快步走完核心段後前往渡月橋休息。');
  await ins(d4,4,'16:00','attraction','渡月橋・嵐山河景','渡月橋（嵐山）',35.0151,135.6772,
    '嵐山最具代表性的地標，橫跨大堰川的古老木橋，配上背後嵐山群峰，是京都最具代表的自然風景畫。\n\n渡月橋旁的嵐山商店街有抹茶冰淇淋、湯葉豆腐、竹工藝品，可邊走邊品嚐。傍晚的嵐山光線柔和，非常適合拍照。');
  await ins(d4,5,'19:00','food','先斗町晚餐・京料理','先斗町（木屋町通）',35.0034,135.7697,
    '先斗町是京都最具氛圍的美食街，狹窄石板路兩側全是百年老舖與町家餐廳，緊依鴨川。\n\n🍲 推薦：\n・三嶋亭（明治6年創業，壽喜燒名店）\n・京料理 天ぷら YOSHIKAWA\n・京都一の傳（西京燒、漬魚料理）\n\n抵達京都第一晚，值得好好享用一頓道地京料理。');

  // Day 5: 京都精華
  const d5 = p1['2027-04-21'];
  await ins(d5,1,'08:00','attraction','伏見稻荷大社（千本鳥居）','伏見稻荷大社',34.9672,135.7727,
    '數千座朱紅色鳥居蜿蜒山上，是日本最有名的神社之一。\n\n🌅 最佳時段：早晨8-9點，光線從鳥居縫隙穿透，金光燦爛且人潮最少。\n\n建議路線：本殿→奧社（千本鳥居核心）→三つ辻觀景點\n\n24小時開放，免費入場。');
  await ins(d5,2,'10:30','attraction','清水寺・二年坂・三年坂','清水寺',34.9948,135.7851,
    '「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，世界文化遺產。\n\n之後沿石板路漫步二三年坂，兩旁林立傳統町家，販售京都茶菓、清水燒、工藝品。\n\n💡 門票500円，開館06:00。');
  await ins(d5,3,'14:00','attraction','八坂神社・祇園散策','八坂神社',35.0037,135.7786,
    '祇園祭主場神社，圓山公園的垂枝夜櫻聞名全日本。穿越圓山公園可銜接知恩院巨大山門，整區景色層次豐富。\n\n從八坂神社往南走是祇園花見小路，機緣好的話能見到藝妓或舞妓輕步而過。');
  await ins(d5,4,'16:00','attraction','錦市場（京都廚房）','錦市場',35.0038,135.7674,
    '全長390公尺的日式市場，130家店鋪匯集，有「京都的廚房」之稱。醃漬蔬菜、豆腐、京都漬物、玉子燒、烤海鮮，全程邊走邊吃。\n\n🛒 必買：\n・有次（刀具・廚具老舖）\n・三木雞卵（厚燒玉子）\n・京つけもの（各式漬物）');
  await ins(d5,5,'19:00','food','京都和牛燒肉晚餐','木屋町通・四条周邊',35.0034,135.7697,
    '以京都和牛（京都肉）犒賞自己！最後一個京都夜晚，值得盛大對待。\n\n🥩 推薦：\n・焼肉 弘 四条木屋町店（鴨川河岸景觀座位）\n・牛禅 木屋町（嚴選京都産和牛）\n・炭火焼肉 なかむら（老字號隱藏名店）\n\n飯後沿鴨川河岸散步，告別京都的最後一夜。');

  // Day 6: 返程
  const d6 = p1['2027-04-22'];
  await ins(d6,1,'09:00','food','黑門市場・最後海鮮早餐','黑門市場（日本橋）',34.6653,135.5073,
    '「大阪的廚房」，旅程最後一個早上的必訪之地！現場直食海膽、螃蟹、生蠔，帶走滿滿的大阪滋味。\n\n從京都到大阪黑門市場搭JR新快速約28分，早點出發人最少食材最新鮮。');
  await ins(d6,2,'11:30','attraction','臨空城 Outlet 購物','臨空城 RINKU PREMIUM OUTLETS',34.4317,135.3069,
    '關西機場旁的Premium Outlet，邊購物邊眺望大阪灣海景與飛機起降，是返程前最佳的最後血拚地點。\n\n🛍️ 超過210家國際品牌（Coach、Gucci、Prada等），從難波搭南海電車到臨空城站約35分鐘（1020円）。\n\n距關西機場僅需搭免費接駁巴士約10分鐘。');
  await ins(d6,3,'14:30','transport','關西國際機場・返程','關西國際空港（KIX）',34.4347,135.2440,
    '建議出發前3小時抵達機場辦理報到手續。\n\n✈️ 機場最後安排：\n・完成免稅品退稅（TAX FREE）手續\n・關空免稅店最後掃貨\n・在出境後享用最後一餐日本料理\n\n帶著6天滿滿的回憶，期待下次再來日本！');

  console.log('✓ 方案一活動新增完成');
  console.log('✅ 全部完成');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
