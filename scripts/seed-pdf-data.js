/**
 * seed-pdf-data.js
 * Seeds the database with actual trip data from PDF.
 * Run: node scripts/seed-pdf-data.js
 */

const path = require('path');
// Use the app's own db module so initDB runs schema setup first
const { initDB, run: dbRun, get: dbGet, all: dbAll } = require('../database/db');

async function seed() {
  console.log('Initializing database schema...');
  await initDB();
  console.log('Database initialized');

  // Local helpers that delegate to app db module
  const run = dbRun;
  const get = dbGet;
  const all = dbAll;

  console.log('Starting seed...');

  // ── 1. Add missing columns to activities ─────────────────────────────────
  const existingCols = (await all('PRAGMA table_info(activities)')).map(c => c.name);
  const newCols = [
    ['weather_temp', 'INTEGER'],
    ['weather_rain', 'INTEGER'],
    ['weather_sun',  'INTEGER'],
    ['duration',     'INTEGER'],
    ['alt_plan',     'TEXT'],
    ['restaurant',   'TEXT'],
  ];
  for (const [col, type] of newCols) {
    if (!existingCols.includes(col)) {
      await run(`ALTER TABLE activities ADD COLUMN ${col} ${type}`);
      console.log(`  Added column: ${col}`);
    } else {
      console.log(`  Column already exists: ${col}`);
    }
  }

  // ── 2. Clear existing data for plan_id = 1 ───────────────────────────────
  const existingDays = await all('SELECT id FROM days WHERE plan_id=1');
  const existingDayIds = existingDays.map(r => r.id);
  // Delete child rows for ALL days (UNIQUE constraint on date requires clearing all plan rows)
  const allDays = await all('SELECT id FROM days');
  if (allDays.length > 0) {
    const ph = allDays.map(() => '?').join(',');
    const ids = allDays.map(r => r.id);
    await run(`DELETE FROM activities WHERE day_id IN (${ph})`, ids);
    await run(`DELETE FROM expenses WHERE day_id IN (${ph})`, ids);
    console.log(`Deleted all activities and expenses`);
  }
  // Delete all days
  await run('DELETE FROM days');
  console.log('Deleted all days');

  // ── 3. Ensure days.sort_order column exists ───────────────────────────────
  const daysCols = (await all('PRAGMA table_info(days)')).map(c => c.name);
  if (!daysCols.includes('sort_order')) {
    await run('ALTER TABLE days ADD COLUMN sort_order INTEGER DEFAULT 0');
    console.log('  Added column days.sort_order');
  }

  // ── Insert days for plan_id=1 ─────────────────────────────────────────────
  const daysData = [
    { date:'2027-04-17', city:'京都',      title:'抵達京都・鴨川散策',         notes:'今天12:15降落，體力有限，高瀨川沿岸散步就好。步數約9,000步・¥6,000/人',        sort_order:1 },
    { date:'2027-04-18', city:'奈良・京都', title:'奈良古都與錦市場',            notes:'奈良公園小鹿會咬地圖！步數約18,000步・¥5,000/人',                            sort_order:2 },
    { date:'2027-04-19', city:'京都',      title:'貴船秘境散策',                notes:'貴船烤魚、牛禪壽喜燒必吃。步數約15,000步・¥6,000/人',                        sort_order:3 },
    { date:'2027-04-20', city:'京都→大阪', title:'清水寺晨光・移防大阪',         notes:'今天05:30出門！最考驗體力的一天。步數約16,000步・¥7,000/人',                 sort_order:4 },
    { date:'2027-04-21', city:'大阪',      title:'黑門快閃・梅田採購・和牛夜景',  notes:'徹底拿掉黑門中川！精準吃三寶就走。步數約14,000步・¥8,000/人',              sort_order:5 },
    { date:'2027-04-22', city:'大阪→關西', title:'最後採購・返回台灣',            notes:'今天降雨機率最高(45%)。步數約8,000步・¥3,000/人',                         sort_order:6 },
  ];

  const dayIdByDate = {};
  for (const d of daysData) {
    const result = await run(
      'INSERT INTO days (plan_id, date, city, title, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [1, d.date, d.city, d.title, d.notes, d.sort_order]
    );
    dayIdByDate[d.date] = result.lastID;
    console.log(`  Inserted day: ${d.date} → id=${result.lastID}`);
  }

  // ── 4. Insert activities ──────────────────────────────────────────────────
  function a(date, time, cat, title, location, desc, wt, wr, ws, dur, alt, rest) {
    return { day_id: dayIdByDate[date], time, cat, title, location, desc,
      wt: wt ?? null, wr: wr ?? null, ws: ws ?? null,
      dur: dur ?? null, alt: alt ?? null, rest: rest ?? null };
  }

  const activities = [
    // ── Day 1 (2027-04-17) ────────────────────────────────────────────────
    a('2027-04-17','12:15','transport','抵達關西機場','關西國際空港（KIX）','辦理入境、領取行李、ATM提領日幣',19,30,70,70,null,null),
    a('2027-04-17','13:30','transport','搭乘JR關空特急Haruka','關西空港→京都站','於機場月台搭乘，直達京都站（建議指定席）',19,30,70,75,null,null),
    a('2027-04-17','14:50','transport','京都站前往飯店','京都駅','計程車首選（車資約¥1,500）直達飯店門口',19,30,70,15,null,null),
    a('2027-04-17','15:10','hotel','入住MIMARU京都五條','MIMARU京都河原町五條','辦理check-in、進房短暫休息、整理隨身包包',19,30,70,60,null,null),
    a('2027-04-17','16:20','attraction','高瀨川→木屋町→鴨川散步','鴨川・先斗町','晴：沿高瀨川順向散步至鴨川。雨天備案：四條地下街→藍瓶咖啡',19,30,70,70,null,null),
    a('2027-04-17','17:30','attraction','先斗町漫步','先斗町老街','從鴨川畔順路步行切入先斗町，感受迷人小巷夜色',19,30,70,30,null,null),
    a('2027-04-17','18:00','food','先斗町晚餐（燒肉弘）','燒肉弘 四條木屋町店','首選：燒肉弘 四條木屋町店（極熱門！請出發前30天官網預約）',13,25,75,90,null,'燒肉弘 四條木屋町店'),
    a('2027-04-17','19:30','attraction','四條河原町商圈散步','四條河原町','晴：戶外逛街。雨：進攻與地下街直通的百貨',13,25,75,60,null,null),
    a('2027-04-17','20:30','hotel','返回MIMARU飯店','MIMARU京都河原町五條','步行返回',13,25,75,0,null,null),

    // ── Day 2 (2027-04-18) ────────────────────────────────────────────────
    a('2027-04-18','08:00','transport','飯店出發前往奈良','清水五條站','步行8-10分鐘前往京阪「清水五條站」，早餐便利商店購買',12,40,60,15,'雨天改去宇治',null),
    a('2027-04-18','08:15','transport','搭乘電車前往奈良','近鐵奈良站','晴：京阪轉近鐵直達近鐵奈良站',12,40,60,85,null,null),
    a('2027-04-18','09:40','attraction','東大寺漫步參拜','東大寺','從車站步行前往東大寺，完美避開團客。世界最大木造建築',12,40,60,80,'宇治平等院（鳳翔館室內）',null),
    a('2027-04-18','11:00','attraction','奈良公園餵小鹿','奈良公園','公園散步餵鹿（鹿餅先收包包！）注意安全',12,40,60,80,'中村藤吉本店（茶道體驗）',null),
    a('2027-04-18','12:20','food','奈良午餐（江戶川鰻魚飯）','江戶川 奈良町店','晴天首選：江戶川奈良町店（無需預約現場即可）',18,35,65,70,null,'江戶川 奈良町店'),
    a('2027-04-18','13:30','attraction','奈良町老街散步','奈良町老街','逛奈良町。點心：中谷堂現搗麻糬（晴天限定）',18,35,65,60,null,null),
    a('2027-04-18','14:40','transport','搭電車返回京都','祇園四條站','近鐵轉京阪回京都',18,35,65,80,null,null),
    a('2027-04-18','16:00','attraction','錦市場（★黃金時段）','錦市場','晴/雨皆完美：錦市場上方有完整全封閉式拱廊頂棚。串燒、炸物',18,35,65,60,null,null),
    a('2027-04-18','17:00','attraction','寺町・新京極購物','新京極商店街','全遮棚拱廊，下雨天觀光客通通擠在這裡購物，安全又乾爽',18,35,65,90,null,null),
    a('2027-04-18','18:30','food','京都勝牛晚餐','京都勝牛 河原町店','步行前往河原町核心商圈餐廳。備案：本家尾張屋本店',12,25,75,90,null,'京都勝牛 河原町店'),
    a('2027-04-18','20:20','hotel','返回MIMARU飯店','MIMARU京都河原町五條','步行或搭計程車返回',12,25,75,0,null,null),

    // ── Day 3 (2027-04-19) ────────────────────────────────────────────────
    a('2027-04-19','07:50','transport','飯店出發','MIMARU京都河原町五條','步行8-10分鐘至清水五條站，早餐便利商店購買輕食三明治',10,20,80,15,null,null),
    a('2027-04-19','08:05','transport','前往貴船','出町柳站→貴船口站','晴：搭京阪電車至出町柳站，轉乘叡山電車至貴船口站',10,20,80,65,null,null),
    a('2027-04-19','09:20','attraction','貴船神社漫步・水占卜','貴船神社','貴船神社最著名的「水占」（將籤紙放入水中顯字）。非常特別的體驗',10,20,80,100,null,null),
    a('2027-04-19','11:00','attraction','貴船溪流山林散步','貴船溪流','皆在貴船神社周邊，沿著溪流慢活放鬆',10,20,80,60,null,null),
    a('2027-04-19','12:00','food','貴船茶屋午餐','貴船茶屋','晴天午餐：貴船茶屋（無需預約）。雨天午餐：京都車站拉麵小路',22,15,85,80,null,'貴船茶屋'),
    a('2027-04-19','13:20','transport','午餐後回市區移動','出町柳站','搭接駁公車回貴船口站，轉叡山電車回出町柳',22,15,85,65,null,null),
    a('2027-04-19','14:40','attraction','平野神社・河原町逛街','平野神社/四條河原町','A案（看花況）：平野神社賞花。B案（花已謝）：河原町商圈逛街。下午茶：Kurasu Kyoto Stand',22,15,85,90,'河原町商圈逛街',null),
    a('2027-04-19','16:10','attraction','傍晚商圈大採購','河原町商圈','晴/雨皆位於四條河原町核心室內或拱廊商圈內',22,15,85,130,null,null),
    a('2027-04-19','18:40','food','祇園牛禪壽喜燒','祇園 牛禪','熱門！建議出發前7天電話或官網預約',14,20,80,90,null,'祇園 牛禪'),
    a('2027-04-19','20:30','hotel','返回飯店休息','MIMARU京都河原町五條','步行或搭計程車返回。收拾行李準備明日超早起',14,20,80,0,null,null),

    // ── Day 4 (2027-04-20) ────────────────────────────────────────────────
    a('2027-04-20','05:30','hotel','飯店出發（行李留櫃檯）','MIMARU京都河原町五條','大行李留櫃檯，直接出門。11:15回來領行李再辦退房，能省下15分鐘',12,30,70,0,null,null),
    a('2027-04-20','05:50','transport','計程車前往伏見稻荷','伏見稻荷大社','計程車去伏見稻荷（¥1,800）',12,30,70,15,null,null),
    a('2027-04-20','06:05','attraction','伏見稻荷大社（★無人鳥居）','伏見稻荷大社','清晨享受無人千本鳥居！雨天備案：提早前往大阪，搭JR新快速（車程30分鐘）',12,30,70,65,'提早前往大阪搭JR新快速',null),
    a('2027-04-20','07:10','transport','計程車前往清水寺','清水寺','伏見稻荷計程車去清水寺（¥1,500）',12,30,70,20,null,null),
    a('2027-04-20','07:30','attraction','清水寺（★空無一人黃金時段）','清水寺','清晨晨光最佳，無人清水舞台！¥500門票',12,30,70,70,null,null),
    a('2027-04-20','08:40','attraction','漫步二年坂・三年坂・八坂塔','二年坂・三年坂','京都最上鏡古老石板路。晨間無人，慢慢走。下午茶：%Arabica 京都東山店',14,25,75,60,null,null),
    a('2027-04-20','09:45','food','阿古屋茶屋茶泡飯（提早現場登記！）','阿古屋茶屋','修正：09:45前先去登記，10:00開門第一批進去。時間超安全！',14,25,75,90,null,'阿古屋茶屋'),
    a('2027-04-20','11:15','hotel','回飯店正式退房領行李','MIMARU京都河原町五條','退房拿行李出發',21,30,70,20,null,null),
    a('2027-04-20','12:20','transport','京都站搭JR新快速前往大阪','大阪難波站','中午移動至大阪',22,30,70,30,null,null),
    a('2027-04-20','13:20','hotel','抵達大阪→入住MIMARU難波','MIMARU大阪難波站','辦理check-in，回房間躺平、徹底關機休息充電',22,30,70,60,null,null),
    a('2027-04-20','16:30','attraction','道頓堀・心齋橋逛街購物','心齋橋商店街','傍晚步行出發，開啟大阪逛街模式。心齋橋商店街有遮棚，下雨也免驚',22,30,70,180,null,null),
    a('2027-04-20','19:30','food','大阪道頓堀晚餐（北極星）','北極星 心齋橋本店','首選：北極星 心齋橋本店（無需預約，現場排隊即可）',16,35,65,90,null,'北極星 心齋橋本店'),

    // ── Day 5 (2027-04-21) ────────────────────────────────────────────────
    a('2027-04-21','09:20','attraction','黑門市場（★1小時精準吃三寶）','黑門市場','首選：黑門三平、石橋關東煮、黑銀鮪魚（免預約現場排）。市場全程有遮棚！',13,20,80,60,null,'黑門三平・石橋關東煮・黑銀鮪魚'),
    a('2027-04-21','10:30','attraction','難波商圈前半場購物','難波CITY','步行。難波CITY為全室內、與地鐵直通的共構商場',13,20,80,100,null,null),
    a('2027-04-21','12:00','hotel','回飯店放戰利品','MIMARU大阪難波站','把早上的戰利品放飯店，兩手空空出發去梅田',24,15,85,30,null,null),
    a('2027-04-21','12:30','transport','前往梅田地區','梅田站','搭乘地鐵御堂筋線（難波站→梅田站）',24,15,85,20,null,null),
    a('2027-04-21','12:50','attraction','梅田・Grand Front大阪購物','Grand Front大阪','逛各大百貨逛到腳軟。下午茶：LiLo Coffee Roasters',24,15,85,250,'梅田地下街（Whity梅田）→百貨',null),
    a('2027-04-21','17:00','attraction','中之島中央公會堂・傍晚散策','中之島中央公會堂','先去中之島散步，再去吃和牛',24,15,85,60,null,null),
    a('2027-04-21','18:15','food','本日重頭戲：頂級和牛晚餐','和牛燒肉M 法善寺橫丁店','極穩極推！建議出發前2週官網預約。吃完直接走回飯店超順',17,20,80,90,null,'和牛燒肉M 法善寺橫丁店'),
    a('2027-04-21','19:45','attraction','梅田空中庭園展望台（百萬夜景）','梅田空中庭園展望台','吃飽20:30登頂，夜景最美！對調：吃完直接走回飯店也超順',17,20,80,90,null,null),
    a('2027-04-21','21:15','hotel','返回MIMARU難波飯店','MIMARU大阪難波站','從梅田搭地鐵御堂筋線直達難波飯店，收拾行李',17,20,80,0,null,null),

    // ── Day 6 (2027-04-22) ────────────────────────────────────────────────
    a('2027-04-22','08:30','transport','辦理退房・出發南海難波站','南海難波站','拖著所有行李出發，步行至南海難波站',15,40,60,0,null,null),
    a('2027-04-22','09:00','attraction','大阪造幣局賞晚櫻/臨空城Outlet','大阪造幣局/臨空城Outlet','A案：大阪造幣局賞晚櫻。B案：臨空城Outlet室內大進擊！雨天直接衝Outlet',15,40,60,150,'臨空城Outlet室內大進擊',null),
    a('2027-04-22','11:30','food','Outlet美食街午餐（金子半之助）','金子半之助 臨空城店','回台前的最後一餐，在美食街做最後的行李重量清點',21,45,55,60,null,'金子半之助 臨空城店'),
    a('2027-04-22','12:35','transport','搭電車前往關西機場','關西國際空港','從臨空城站搭乘南海電鐵，僅需1站直達關西機場',21,45,55,10,null,null),
    a('2027-04-22','12:45','transport','抵達關西機場第一航廈','關西國際空港第一航廈','順著機場室內指標步行前往星宇航空報到櫃檯',21,45,55,0,null,null),
    a('2027-04-22','13:10','transport','辦理報到・託運・通關','關西國際空港','務必於13:10前完成航空公司報到。通關後可在機場免稅店補買最後伴手禮',21,45,55,120,null,null),
    a('2027-04-22','15:10','transport','星宇航空起飛返台','關西國際空港','順利登機，帶著滿滿的回憶與戰利品平安回台灣！',16,35,65,0,null,null),
  ];

  for (let i = 0; i < activities.length; i++) {
    const x = activities[i];
    if (!x.day_id) throw new Error(`Missing day_id at index ${i}, title: ${x.title}`);
    await run(
      `INSERT INTO activities
        (day_id, time, category, title, location, description, weather_temp, weather_rain, weather_sun, duration, alt_plan, restaurant, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [x.day_id, x.time, x.cat, x.title, x.location, x.desc,
       x.wt, x.wr, x.ws, x.dur, x.alt, x.rest, i + 1]
    );
  }
  console.log(`Inserted ${activities.length} activities`);

  // ── 5. Verify ─────────────────────────────────────────────────────────────
  const dayCount = (await get('SELECT COUNT(*) as n FROM days WHERE plan_id=1')).n;
  const totalActs = (await get('SELECT COUNT(*) as n FROM activities')).n;
  console.log('\nVerification:');
  console.log(`  Days for plan_id=1: ${dayCount}`);
  console.log(`  Total activities: ${totalActs}`);

  const perDay = await all(`
    SELECT d.date, d.city, COUNT(a.id) as acts
    FROM days d LEFT JOIN activities a ON a.day_id = d.id
    WHERE d.plan_id=1
    GROUP BY d.id ORDER BY d.date
  `);
  for (const row of perDay) {
    console.log(`  ${row.date} (${row.city}): ${row.acts} activities`);
  }

  console.log('\nSeed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
