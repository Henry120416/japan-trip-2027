// 修正本地 SQLite：方案一=京都出發・神戶，方案二=大阪出發・環球影城（原始方案）
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, '../database/trip.db'));

const run = (sql, p = []) => new Promise((res, rej) =>
  db.run(sql, p, function (err) { err ? rej(err) : res({ lastID: this.lastID, changes: this.changes }); })
);
const get = (sql, p = []) => new Promise((res, rej) =>
  db.get(sql, p, (err, row) => { err ? rej(err) : res(row); })
);

// ── 方案一：京都出發・神戶一日遊 ─────────────────────────────
const P1_DAYS = [
  { date:'2027-04-17', title:'京都初抵・鴨川祇園',          city:'京都',      notes:'下午悠閒抵達，感受京都的第一個黃昏，漫步鴨川與祇園白川。' },
  { date:'2027-04-18', title:'宇治世界遺產・東寺五重塔',    city:'宇治・京都', notes:'早上避開人潮前往清幽宇治，下午回京都參訪東寺。' },
  { date:'2027-04-19', title:'伏見稻荷・清水寺全攻略',      city:'京都',      notes:'週一店家全開、人潮最少，衝刺京都最核心名勝。' },
  { date:'2027-04-20', title:'嵐山竹林・金閣寺→移居大阪',  city:'京都・大阪', notes:'上午遊覽嵐山與金閣寺，傍晚優雅移居大阪。' },
  { date:'2027-04-21', title:'神戶一日遊・百萬夜景',        city:'神戶',      notes:'搭阪神電車輕鬆前往神戶，品嚐神戶牛、欣賞港灣與摩耶山夜景。' },
  { date:'2027-04-22', title:'黑門市場・返程',               city:'大阪・關西', notes:'早上逛黑門市場，中午臨空城Outlet，下午從關西機場返台。' },
];

const P1_ACTS = [
  ['2027-04-17',1,'15:00','transport','抵達京都車站','京都駅（JR）',34.9858,135.7585,
   '搭乘關西特急「HARUKA」，關西空港→京都站約75分鐘。建議搭配ICOCA套票更划算。入住飯店放行李後展開京都初探。'],
  ['2027-04-17',2,'17:00','attraction','鴨川夕陽散策','鴨川（三条〜四条段）',35.0042,135.7704,
   '京都最療癒的散步路線。三条至四条段兩岸設有台階，當地人在此野餐談天，感受京都日常生活的最佳地點。'],
  ['2027-04-17',3,'18:00','attraction','祇園白川燈籠夜色','祇園白川（巽橋周邊）',35.0037,135.7752,
   '白川沿岸種滿垂柳，傍晚燈籠亮起後如同江戶時代的畫中。巽橋是拍攝京都夜景的經典機位。'],
  ['2027-04-17',4,'19:30','food','先斗町晚餐・壽喜燒/京料理','先斗町（木屋町通）',35.0034,135.7697,
   '京都最具氛圍的美食街，緊依鴨川。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。'],
  ['2027-04-18',1,'09:00','transport','前往宇治','京都駅→宇治駅（JR奈良線）',34.8896,135.8028,
   '搭JR奈良線，京都站→宇治站約17分鐘（240円）。建議09:00前出發，避開平等院人潮高峰。'],
  ['2027-04-18',2,'09:30','attraction','平等院鳳凰堂','平等院',34.8888,135.8081,
   '10元硬幣上的建築，UNESCO世界遺產，建於1053年。鳳凰堂倒映在阿字池中令人屏息。門票600円，鳳翔館另付300円。'],
  ['2027-04-18',3,'11:00','attraction','宇治川・橘洲散步','宇治川・橘島',34.8877,135.8064,
   '宇治川清澈見底，橘洲是川中的自然小島。沿岸的宇治神社境內古木參天。'],
  ['2027-04-18',4,'12:00','food','中村藤吉本店・抹茶午餐','中村藤吉本店',34.8896,135.8062,
   '創業1854年宇治抹茶老舖。必點：生茶果凍（生茶ゼリィ）——透明茶凍搭配抹茶冰淇淋，是店內招牌。'],
  ['2027-04-18',5,'14:30','attraction','東寺（五重塔）','東寺（教王護國寺）',34.9802,135.7481,
   '日本最高木造五重塔（高55公尺），UNESCO世界遺產。空海大師開創的密宗道場，落日映照金碧輝煌。'],
  ['2027-04-18',6,'18:30','food','京都車站・伊勢丹美食街晚餐','京都駅ビル 伊勢丹（B1〜B2）',34.9858,135.7585,
   '地下樓層匯集京都精選美食。推薦：拉麵小路（11家拉麵）、京都壽司割烹。'],
  ['2027-04-19',1,'07:30','attraction','伏見稻荷大社（千本鳥居）','伏見稻荷大社',34.9672,135.7727,
   '早晨7:30–9:00是最佳攝影時段！光線從鳥居縫隙穿透，金光燦爛且人潮最少。24小時開放，免費入場。'],
  ['2027-04-19',2,'10:00','attraction','清水寺舞台','清水寺',34.9948,135.7851,
   '「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，UNESCO世界遺產。週一人潮明顯少於週末。門票500円。'],
  ['2027-04-19',3,'11:30','attraction','二年坂・三年坂石板路','産寧坂（三年坂）',34.9968,135.7847,
   '京都最上鏡的古老石板老街，兩旁林立傳統町家。從三年坂石階往上拍攝是京都最經典的構圖之一。'],
  ['2027-04-19',4,'13:00','food','石板路午餐・京都定食','高台寺・清水坂周邊',35.0001,135.7849,
   '在二三年坂附近的町家餐廳享用京都定食。推薦：都路里（宇治抹茶甜點）。'],
  ['2027-04-19',5,'15:00','attraction','八坂神社・圓山公園','八坂神社',35.0037,135.7786,
   '祇園祭主場神社。旁邊圓山公園的垂枝夜櫻（しだれ桜）聞名全日本。'],
  ['2027-04-19',6,'19:00','food','京都和牛燒肉晚餐','木屋町通・四条周邊',35.0034,135.7697,
   '以京都和牛犒賞自己！推薦：焼肉弘四条木屋町店（鴨川河岸景觀座位）。'],
  ['2027-04-20',1,'08:30','attraction','嵐山竹林小徑','嵐山竹林（野宮神社→大河內山莊）',35.0170,135.6714,
   '清晨的嵐山竹林光影最迷人，強烈建議8:30前抵達，此後人潮急增。全段步行約20-30分鐘。'],
  ['2027-04-20',2,'10:00','attraction','渡月橋・嵐山河岸風景','渡月橋（嵐山）',35.0151,135.6772,
   '嵐山最具代表性的地標，橫跨大堰川的古老木橋，配上嵐山群峰是京都最具代表的自然風景畫。'],
  ['2027-04-20',3,'11:00','attraction','仁和寺・御室櫻','仁和寺',35.0248,135.7067,
   'UNESCO世界遺產。御室櫻是日本最晚開的低矮型染井吉野櫻，滿開時在二王門前形成絕景花海。'],
  ['2027-04-20',4,'12:30','attraction','金閣寺（鹿苑寺）','金閣寺（鹿苑寺）',35.0394,135.7292,
   '三層鎏金樓閣完美倒映在鏡湖池中，UNESCO世界遺產。午後光線直射，金閣最為耀眼。門票500円。'],
  ['2027-04-20',5,'14:30','transport','行李宅配・移往大阪','京都→大阪（JR京都線）',34.7024,135.4959,
   '使用YAMATO宅急便將行李送往大阪飯店，享受輕裝移動。JR京都線新快速，京都→大阪約28分（730円）。'],
  ['2027-04-20',6,'18:00','attraction','心齋橋・道頓堀夜遊','道頓堀・心齋橋',34.6687,135.5023,
   '大阪最熱鬧的夜間娛樂區！道頓堀巨型霓虹招牌與格利科跑者是大阪的象徵。章魚燒・串炸，感受大阪活力。'],
  ['2027-04-21',1,'09:00','transport','前往神戶・阪神電車','大阪梅田/難波→神戶三宮',34.6913,135.1956,
   '阪神電車：大阪梅田→神戶三宮約32分（430円）。阪急電車：梅田→三宮約27分（330円）。JR新快速：大阪→三ノ宮約20分。'],
  ['2027-04-21',2,'09:30','attraction','北野異人館街','北野異人館（北野町山本通）',34.6997,135.1913,
   '明治時代西洋人聚居的洋館建築群，充滿歐洲小鎮氛圍。推薦：風見雞館（德式）、萊茵館（山頂可俯瞰神戶港）。'],
  ['2027-04-21',3,'11:30','attraction','生田神社','生田神社（中央区下山手通）',34.6950,135.1946,
   '神戶最古老的神社，創建於201年。境內古木參天，神戶人戀愛・結緣的聖地。'],
  ['2027-04-21',4,'13:00','food','頂級神戶牛鐵板燒','神戶三宮・元町周邊',34.6914,135.1956,
   '全行程最重要的美食體驗！神戶牛是世界頂級牛肉，入口即化。推薦：MOURIYA本店（創業1885年）、ステーキランド神戸館。午餐時段比晚餐便宜約40%。'],
  ['2027-04-21',5,'15:30','attraction','神戶港灣・美利堅公園','美利堅公園・神戶港',34.6841,135.1878,
   '沿神戶港步道散步。周邊：神戶港塔、神戶海洋博物館、Harborland モザイク（海港商場）。黃昏時大阪灣景色最迷人。'],
  ['2027-04-21',6,'20:00','attraction','摩耶山掬星台・百萬夜景','摩耶山掬星台（まや観光ロープウェイ）',34.7167,135.2125,
   '日本三大夜景之一！搭公車→摩耶ケーブル（纜車）→まやロープウェイ→掬星台，全程約30分。末班纜車約20:30，請提前確認。'],
  ['2027-04-22',1,'08:00','food','黑門市場・海鮮早餐','黑門市場（中央区日本橋）',34.6653,135.5073,
   '「大阪的廚房」，現場直食海膽・松葉蟹腳・生蠔・玉子燒。早上8點越早越新鮮。'],
  ['2027-04-22',2,'10:30','attraction','臨空城 Outlet 看海購物','臨空城 RINKU PREMIUM OUTLETS',34.4317,135.3069,
   '超過210家國際品牌，可邊看飛機起降邊購物。從難波搭南海電車約35分（1020円），距機場免費接駁約10分。'],
  ['2027-04-22',3,'14:00','transport','關西國際機場・返程','關西國際空港（KIX）',34.4347,135.2440,
   '建議出發前3小時到機場。完成免稅退稅、關空免稅店最後掃貨，帶著滿滿回憶，期待下次再來！'],
];

// ── 方案二：大阪出發・環球影城（原始方案）─────────────────────
const P2_DAYS = [
  { date:'2027-04-17', title:'啟程・前往京都',            city:'京都',      notes:'從關西機場搭HARUKA特急直達京都，入住飯店後漫步鴨川感受京都第一夜。' },
  { date:'2027-04-18', title:'京都・伏見稻荷 × 清水寺',  city:'京都',      notes:'早起衝伏見稻荷千本鳥居，再前往清水寺、二三年坂、祇園散策。' },
  { date:'2027-04-19', title:'京都・嵐山 × 金閣寺',      city:'京都',      notes:'嵐山竹林、渡月橋，下午前往金閣寺，傍晚錦市場晚餐。' },
  { date:'2027-04-20', title:'移動・入住大阪',            city:'大阪',      notes:'上午告別京都，搭JR移居大阪，下午探索道頓堀與心齋橋。' },
  { date:'2027-04-21', title:'大阪・環球影城 & 通天閣',  city:'大阪',      notes:'全日暢遊USJ哈利波特與超級任天堂世界，晚間通天閣夜景。' },
  { date:'2027-04-22', title:'返程・回台灣',              city:'大阪・關西', notes:'早上黑門市場海鮮早餐，臨空城Outlet最後購物，搭機返台。' },
];

const P2_ACTS = [
  ['2027-04-17',1,'15:00','transport','抵達關西機場','關西國際空港（KIX）',34.4347,135.2440,
   '搭乘HARUKA特急，關西空港→京都站約75分鐘。建議搭配ICOCA+HARUKA套票（3600円），包含一次來回特急乘車券。'],
  ['2027-04-17',2,'17:00','transport','抵達京都・入住飯店','京都駅（JR）',34.9858,135.7585,
   '入住飯店放行李，建議選擇京都駅周邊或四条烏丸一帶，交通最為便利。'],
  ['2027-04-17',3,'18:30','attraction','鴨川夕陽散策','鴨川（三条〜四条段）',35.0042,135.7704,
   '沿鴨川漫步，感受京都的第一個黃昏。三条至四条段兩岸設有台階，當地人在此野餐談天。'],
  ['2027-04-17',4,'20:00','food','先斗町晚餐','先斗町（木屋町通）',35.0034,135.7697,
   '京都最具氛圍的美食街，緊依鴨川。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。'],
  ['2027-04-18',1,'08:00','attraction','伏見稻荷大社（千本鳥居）','伏見稻荷大社',34.9672,135.7727,
   '數千座朱紅色鳥居蜿蜒山上，早晨8點人潮最少、光線最美。24小時開放，免費入場。'],
  ['2027-04-18',2,'10:30','attraction','清水寺・清水舞台','清水寺',34.9948,135.7851,
   '「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，UNESCO世界遺產。門票500円。'],
  ['2027-04-18',3,'12:00','attraction','二年坂・三年坂石板路','産寧坂（三年坂）',34.9968,135.7847,
   '京都最上鏡的古老石板老街，兩旁林立傳統町家，從清水寺步行下山的必經路線。'],
  ['2027-04-18',4,'13:30','food','清水坂午餐','高台寺・清水坂周邊',35.0001,135.7849,
   '在二三年坂附近的町家餐廳享用京都定食。推薦：都路里（宇治抹茶甜點）。'],
  ['2027-04-18',5,'16:00','attraction','八坂神社・祇園散策','八坂神社',35.0037,135.7786,
   '祇園祭主場神社，往南走是祇園花見小路，機緣好能見到藝妓或舞妓。'],
  ['2027-04-18',6,'19:00','food','錦市場・晚餐','錦市場',35.0038,135.7674,
   '「京都廚房」，全長390公尺、130家店鋪，醃漬蔬菜・豆腐・玉子燒・烤海鮮。'],
  ['2027-04-19',1,'09:00','attraction','嵐山竹林小徑','嵐山竹林（野宮神社→大河內山莊）',35.0170,135.6714,
   '高聳孟宗竹如綠色穹頂，路線：野宮神社→竹林小徑（約500公尺）→大河內山莊。建議早上抵達避開人潮。'],
  ['2027-04-19',2,'10:30','attraction','渡月橋・天龍寺','渡月橋（嵐山）',35.0151,135.6772,
   '嵐山最具代表性的地標，橫跨大堰川的古老木橋。旁邊天龍寺的曹源池庭園是UNESCO世界遺產。'],
  ['2027-04-19',3,'12:30','food','嵐山竹林午餐','嵐山・嵯峨野周邊',35.0160,135.6740,
   '嵐山觀光途中享用午餐。推薦：竹取亭（竹林景觀）、野宮神社附近的豆腐料理。'],
  ['2027-04-19',4,'14:00','attraction','金閣寺（鹿苑寺）','金閣寺（鹿苑寺）',35.0394,135.7292,
   '三層鎏金樓閣倒映在鏡湖池中，UNESCO世界遺產。入口後左側觀景台是最佳拍攝機位。門票500円。'],
  ['2027-04-19',5,'16:00','attraction','二条城（世界遺產）','二条城（元離宮二条城）',35.0142,135.7481,
   '德川家康興建的城堡，UNESCO世界遺產。「鶯張り」廊道每步皆有鶯鳴聲，防止刺客入侵。'],
  ['2027-04-19',6,'19:00','food','京料理晚餐','木屋町通・四条周邊',35.0034,135.7697,
   '最後一個京都夜晚，享用道地京料理。推薦：焼肉弘四条木屋町店（鴨川河岸景觀座位）。'],
  ['2027-04-20',1,'09:30','food','錦市場晨間逛街','錦市場',35.0038,135.7674,
   '最後一個京都早晨，錦市場邊走邊吃告別京都。玉子燒、湯豆腐、漬物。'],
  ['2027-04-20',2,'11:00','transport','搭JR移往大阪','京都→大阪（JR京都線）',34.7024,135.4959,
   '搭JR京都線新快速，京都→大阪約28分鐘（730円）。建議使用YAMATO宅急便將行李提前送往大阪飯店。'],
  ['2027-04-20',3,'13:00','food','道頓堀午餐・章魚燒','道頓堀・心齋橋',34.6687,135.5023,
   '正式踏入大阪！道頓堀格利科跑者打卡，吃章魚燒（たこ焼き）、大阪燒（お好み焼き）。'],
  ['2027-04-20',4,'15:00','attraction','心齋橋・美國村散策','心齋橋・アメリカ村',34.6699,135.5008,
   '大阪最潮的購物街區。心齋橋筋商店街→美國村（次文化・古著），步行可達。'],
  ['2027-04-20',5,'19:00','food','串炸晚餐・道頓堀','難波・道頓堀周邊',34.6657,135.5014,
   '正宗串炸（串カツ）！推薦：だるま道頓堀店（創業1929年）。'],
  ['2027-04-21',1,'09:00','attraction','環球影城（USJ）全日遊覽','UNIVERSAL STUDIOS JAPAN',34.6654,135.4321,
   '日本最頂級主題樂園！必玩：哈利波特魔法世界（霍格華茲城堡）、超級任天堂世界（瑪利歐賽車）、小小兵瘋狂乘車遊。強烈建議提前購買「Express Pass」快速通關票。門票約9400円起，建議09:00前已在門口。'],
  ['2027-04-21',2,'19:00','attraction','新世界・通天閣夜景','新世界・通天閣',34.6524,135.5063,
   '大阪懷舊商圈，充滿昭和時代市井氣息。108公尺高的通天閣，摸幸福神ビリケン的腳掌能帶來好運。門票700円。'],
  ['2027-04-21',3,'20:30','food','新世界串炸晚餐','新世界・ジャンジャン横丁',34.6524,135.5063,
   '「ジャンジャン横丁」小巷是大阪最道地的串炸激戰區。推薦：八重勝（排隊名店）、てんぐ（份量紮實）。'],
  ['2027-04-22',1,'08:00','food','黑門市場・最後海鮮早餐','黑門市場（日本橋）',34.6653,135.5073,
   '「大阪的廚房」，現場直食海膽・螃蟹・生蠔。早上8點越早越新鮮。'],
  ['2027-04-22',2,'10:30','attraction','臨空城 Outlet 購物','臨空城 RINKU PREMIUM OUTLETS',34.4317,135.3069,
   '超過210家國際品牌，邊購物邊眺望大阪灣海景。從難波搭南海電車約35分（1020円），距機場免費接駁約10分。'],
  ['2027-04-22',3,'14:00','transport','關西國際機場・返程','關西國際空港（KIX）',34.4347,135.2440,
   '建議出發前3小時抵達，完成免稅退稅、關空免稅店最後掃貨，帶著6天滿滿回憶返台！'],
];

async function reset() {
  console.log('開始修正本地 SQLite 行程資料...');

  // 關閉外鍵約束以避免 CASCADE 問題
  await run('PRAGMA foreign_keys = OFF');

  // 清空所有行程相關資料
  await run('DELETE FROM activities');
  await run('DELETE FROM days');
  await run('DELETE FROM plans');
  console.log('已清空舊資料');

  // 插入方案名稱
  await run(`INSERT OR REPLACE INTO plans VALUES (1,'方案一','京都出發・神戶一日遊')`);
  await run(`INSERT OR REPLACE INTO plans VALUES (2,'方案二','大阪出發・環球影城')`);
  console.log('已插入方案名稱');

  // 插入方案一天數
  for (const d of P1_DAYS) {
    await run('INSERT INTO days (date,title,city,notes,plan_id) VALUES (?,?,?,?,1)',
      [d.date, d.title, d.city, d.notes]);
  }
  console.log('已插入方案一 6 天');

  // 插入方案二天數
  for (const d of P2_DAYS) {
    await run('INSERT INTO days (date,title,city,notes,plan_id) VALUES (?,?,?,?,2)',
      [d.date, d.title, d.city, d.notes]);
  }
  console.log('已插入方案二 6 天');

  // 插入活動的 helper
  const insAct = async (planId, acts) => {
    for (const a of acts) {
      const [date, sort, time, cat, title, loc, lat, lng, desc] = a;
      const day = await get('SELECT id FROM days WHERE date=? AND plan_id=?', [date, planId]);
      if (day) {
        await run(
          `INSERT INTO activities (day_id,sort_order,time,category,title,location,lat,lng,description,map_url,image_url,mapcode)
           VALUES (?,?,?,?,?,?,?,?,?,'','','')`,
          [day.id, sort, time, cat, title, loc, lat, lng, desc]
        );
      }
    }
  };

  await insAct(1, P1_ACTS);
  console.log(`已插入方案一 ${P1_ACTS.length} 個活動`);

  await insAct(2, P2_ACTS);
  console.log(`已插入方案二 ${P2_ACTS.length} 個活動`);

  // 方案一活動圖片（Wikipedia/Wikimedia Commons 核實 URL）
  const P1_IMAGES = [
    { kw:'抵達京都車站',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Kyoto-STA_Central.jpg/960px-Kyoto-STA_Central.jpg' },
    { kw:'鴨川夕陽散策',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Kyoto_Sanjo_hashi.JPG/960px-Kyoto_Sanjo_hashi.JPG' },
    { kw:'祇園白川燈籠夜色',     img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/150124_Gion_Kyoto_Japan01s3.jpg/960px-150124_Gion_Kyoto_Japan01s3.jpg' },
    { kw:'先斗町晚餐',           img:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/20111023_Gion1.jpg/960px-20111023_Gion1.jpg' },
    { kw:'前往宇治',             img:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/8A04%E7%B7%A8%E6%88%90.jpg/960px-8A04%E7%B7%A8%E6%88%90.jpg' },
    { kw:'平等院鳳凰堂',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Phoenix_Hall_in_Byodo-in_Temple%2C_Ujirenge_Uji_city_2026.jpg/960px-Phoenix_Hall_in_Byodo-in_Temple%2C_Ujirenge_Uji_city_2026.jpg' },
    { kw:'宇治川・橘洲散步',     img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Phoenix_Hall.jpg/960px-Phoenix_Hall.jpg' },
    { kw:'中村藤吉本店',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Tea_Minami-yamashiro%2C_Uji_Kyoto%2C_Japan.jpg/960px-Tea_Minami-yamashiro%2C_Uji_Kyoto%2C_Japan.jpg' },
    { kw:'東寺（五重塔）',       img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Toji_2015.JPG/960px-Toji_2015.JPG' },
    { kw:'京都車站・伊勢丹',     img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Kyoto-STA_Central.jpg/960px-Kyoto-STA_Central.jpg' },
    { kw:'伏見稻荷大社',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Fushimiinari-taisha%2C_gehaiden-1.jpg/960px-Fushimiinari-taisha%2C_gehaiden-1.jpg' },
    { kw:'清水寺舞台',           img:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg/960px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg' },
    { kw:'二年坂・三年坂',       img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Stone_stairway_Kiyomizu-dera.JPG/960px-Stone_stairway_Kiyomizu-dera.JPG' },
    { kw:'石板路午餐',           img:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/170923_Kodaiji_Kyoto_Japan09n.jpg/960px-170923_Kodaiji_Kyoto_Japan09n.jpg' },
    { kw:'八坂神社・圓山公園',   img:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/JP-Kyoto-yasaka.JPG/960px-JP-Kyoto-yasaka.JPG' },
    { kw:'京都和牛燒肉晚餐',     img:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/%E9%AB%98%E7%80%AC%E5%B7%9D2583.JPG/960px-%E9%AB%98%E7%80%AC%E5%B7%9D2583.JPG' },
    { kw:'嵐山竹林小徑',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Arashiyama_%2887417598%29.jpg/960px-Arashiyama_%2887417598%29.jpg' },
    { kw:'渡月橋・嵐山河岸風景', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Togetsukyo_in_Kyoto_Arashiyama.jpg/960px-Togetsukyo_in_Kyoto_Arashiyama.jpg' },
    { kw:'仁和寺・御室櫻',       img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Ninnaji_Kyoto07n4500.jpg/960px-Ninnaji_Kyoto07n4500.jpg' },
    { kw:'金閣寺（鹿苑寺）',     img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Kinkaku-ji_2015.JPG/960px-Kinkaku-ji_2015.JPG' },
    { kw:'行李宅配・移往大阪',   img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/JR_Osaka_Station_20260305.jpg/960px-JR_Osaka_Station_20260305.jpg' },
    { kw:'心齋橋・道頓堀夜遊',   img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Dotonburi_River_Namba_Japan_by_Don_Ramey_Logan.jpg/960px-Dotonburi_River_Namba_Japan_by_Don_Ramey_Logan.jpg' },
    { kw:'前往神戶・阪神電車',   img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Headquarters_of_Hanshin_Electric_Railway_Co.%2C_Ltd.JPG/960px-Headquarters_of_Hanshin_Electric_Railway_Co.%2C_Ltd.JPG' },
    { kw:'北野異人館街',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Kobe_City_Thomas_House.jpg/960px-Kobe_City_Thomas_House.jpg' },
    { kw:'生田神社',             img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Ikuta-jinja%2C_haiden-1.jpg/960px-Ikuta-jinja%2C_haiden-1.jpg' },
    { kw:'頂級神戶牛鐵板燒',     img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/4_Kobe_Beef%2C_Kobe_Japan.jpg/960px-4_Kobe_Beef%2C_Kobe_Japan.jpg' },
    { kw:'神戶港灣・美利堅公園', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Kobe_Meriken_Park01bs3200.jpg/960px-Kobe_Meriken_Park01bs3200.jpg' },
    { kw:'摩耶山掬星台',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Amsterdam_at_Kobe10s3872.jpg/960px-Amsterdam_at_Kobe10s3872.jpg' },
    { kw:'黑門市場・海鮮早餐',   img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/%E9%BB%92%E9%96%80%E5%B8%82%E5%A0%B4_2024%281%29.jpg/960px-%E9%BB%92%E9%96%80%E5%B8%82%E5%A0%B4_2024%281%29.jpg' },
    { kw:'臨空城 Outlet',        img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Rinku_premium_outlets02s3200.jpg/960px-Rinku_premium_outlets02s3200.jpg' },
    { kw:'關西國際機場・返程',   img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Kix_aerial_photo.jpg/960px-Kix_aerial_photo.jpg' },
  ];
  for (const e of P1_IMAGES) {
    await run(
      `UPDATE activities SET image_url=? WHERE title LIKE ? AND day_id IN (SELECT id FROM days WHERE plan_id=1)`,
      [e.img, `%${e.kw}%`]
    );
  }
  console.log('已設定方案一圖片 31 筆');

  // Mapcode 填充（只補空白）
  const ENRICH = [
    { kw:'伏見稻荷',     mc:'8 437 898*38' },
    { kw:'清水寺',       mc:'8 468 687*22' },
    { kw:'金閣寺',       mc:'8 468 360*82' },
    { kw:'嵐山竹林',     mc:'8 437 255*34' },
    { kw:'渡月橋',       mc:'8 437 255*52' },
    { kw:'八坂神社',     mc:'8 468 658*11' },
    { kw:'東寺',         mc:'8 437 785*65' },
    { kw:'平等院',       mc:'8 436 472*52' },
    { kw:'仁和寺',       mc:'8 468 286*14' },
    { kw:'二条城',       mc:'8 468 235*40' },
    { kw:'北野異人館',   mc:'10 524 580*74' },
    { kw:'生田神社',     mc:'10 524 576*18' },
    { kw:'美利堅公園',   mc:'10 524 636*13' },
    { kw:'掬星台',       mc:'10 524 741*00' },
    { kw:'黑門市場',     mc:'8 369 604*37'  },
    { kw:'臨空城',       mc:'8 277 449*34'  },
    { kw:'關西國際機場', mc:'8 247 823*08'  },
    { kw:'通天閣',       mc:'8 369 574*43'  },
    { kw:'道頓堀',       mc:'8 369 690*12'  },
    { kw:'祇園白川',     mc:'8 468 658*43'  },
    { kw:'先斗町',       mc:'8 468 439*54'  },
    { kw:'大阪城',       mc:'8 370 076*35'  },
    { kw:'環球影城',     mc:'8 306 120*14'  },
    { kw:'中村藤吉',     mc:'8 436 472*56'  },
    { kw:'二年坂',       mc:'8 468 687*34'  },
    { kw:'宇治川',       mc:'8 436 495*50'  },
  ];
  for (const e of ENRICH) {
    await run(`UPDATE activities SET mapcode=? WHERE title LIKE ? AND (mapcode IS NULL OR mapcode='')`, [e.mc, `%${e.kw}%`]);
  }
  console.log('已填充 Mapcode');

  // ── 費用種子：兩個方案統一分類 ──────────────────────────────────
  // 分類：機票 / 住宿 / 交通 / 景點門票 / 餐飲 / 其他
  // 匯率基準：1 TWD ≈ 4.8 JPY；機票純台幣費用 jpy=0
  // 格式：[date, title, amount_jpy, amount_twd, payer, notes]

  // ── 方案一費用（京都出發・神戶一日遊）────────────────────────────
  await run('DELETE FROM expenses WHERE day_id IN (SELECT id FROM days WHERE plan_id=1)');
  const P1_EXP = [
    // 機票（兩方案相同，純台幣）
    ['2027-04-17','來回機票（台灣↔關西）×6',          0, 97842, '', 'NT$16,307/人'],
    // 住宿
    ['2027-04-17','京都住宿・4晚（3間）',         144000, 30000, '', '¥12,000/間/晚 × 3間 × 4晚'],
    ['2027-04-21','大阪住宿・1晚（3間）',          33000,  6875, '', '¥11,000/間/晚 × 3間'],
    // 交通
    ['2027-04-17','HARUKA電車（KIX→京都）×6',    21600,  4500, '', '¥3,600/人；單程，建議搭配ICOCA套票'],
    ['2027-04-17','京都市區公車・地鐵（3日）×6', 12600,  2625, '', '¥700/人/日 × 3天'],
    ['2027-04-18','JR宇治線往返×6',               3480,   725, '', '¥290/人單程，往返¥580'],
    ['2027-04-20','行李宅配（京都→大阪）',          3000,   625, '', '¥1,500/件 × 2件'],
    ['2027-04-20','JR京都→大阪新快速×6',           4380,   913, '', '¥730/人'],
    ['2027-04-21','阪神電車往返（大阪↔神戶三宮）×6',3960,   825, '', '¥330×2/人；梅田出發'],
    ['2027-04-21','摩耶山ロープウェイ往返×6',      10200,  2125, '', '¥1,700/人往返'],
    ['2027-04-22','南海電車（難波→KIX）×6',         6120,  1275, '', '¥1,020/人'],
    // 景點門票
    ['2027-04-18','平等院鳳凰堂入場費×6',           3600,   750, '', '¥600/人'],
    ['2027-04-18','東寺入場費×6',                   3000,   625, '', '¥500/人'],
    ['2027-04-19','清水寺入場費×6',                  3000,   625, '', '¥500/人'],
    ['2027-04-20','金閣寺入場費×6',                  3000,   625, '', '¥500/人'],
    ['2027-04-20','仁和寺入場費×6',                  3000,   625, '', '¥500/人'],
    ['2027-04-21','北野異人館入場費×6',              4800,  1000, '', '¥800/人（風見鶏の館等）'],
    // 餐飲
    ['2027-04-17','先斗町壽喜燒/京料理晚餐×6',    57600, 12000, '', '¥9,600/人；先斗町料亭，含飲料'],
    ['2027-04-18','中村藤吉抹茶午餐×6',            18000,  3750, '', '¥3,000/人；名店抹茶套餐含甜點'],
    ['2027-04-18','伊勢丹美食街晚餐×6',            18000,  3750, '', '¥3,000/人；京都車站B1~B2百貨美食'],
    ['2027-04-19','石板路午餐・京都定食×6',         15000,  3125, '', '¥2,500/人；清水坂/三年坂觀光區行情'],
    ['2027-04-19','京都和牛燒肉晚餐×6',             48000, 10000, '', '¥8,000/人；木屋町通和牛燒肉，含飲料'],
    ['2027-04-20','嵐山竹林午餐×6',                15000,  3125, '', '¥2,500/人；嵐山渡月橋周邊觀光餐廳'],
    ['2027-04-20','道頓堀晚餐・串炸/章魚燒×6',     18000,  3750, '', '¥3,000/人；道頓堀串炸+章魚燒+飲料'],
    ['2027-04-21','頂級神戶牛鐵板燒午餐×6',         72000, 15000, '', '¥12,000/人；神戶A5和牛鐵板燒'],
    ['2027-04-21','神戶港灣・美利堅公園茶點×6',      9000,  1875, '', '¥1,500/人；港灣咖啡廳飲料甜點'],
    ['2027-04-22','黑門市場早餐・海鮮×6',           18000,  3750, '', '¥3,000/人；觀光客價位，生魚片/海鮮燒烤'],
    ['2027-04-22','臨空城午餐・輕食×6',             12000,  2500, '', '¥2,000/人'],
  ];
  for (const [date, title, jpy, twd, payer, notes] of P1_EXP) {
    const day = await get('SELECT id FROM days WHERE date=? AND plan_id=1', [date]);
    if (day) await run(
      `INSERT INTO expenses (day_id,title,amount_jpy,amount_twd,payer,notes) VALUES (?,?,?,?,?,?)`,
      [day.id, title, jpy, twd, payer, notes]
    );
  }
  console.log(`已插入方案一費用 ${P1_EXP.length} 筆`);

  // ── 方案二費用（大阪出發・環球影城）────────────────────────────
  await run('DELETE FROM expenses WHERE day_id IN (SELECT id FROM days WHERE plan_id=2)');
  const P2_EXP = [
    // 機票（與方案一相同）
    ['2027-04-17','來回機票（台灣↔關西）×6',          0, 97842, '', 'NT$16,307/人'],
    // 住宿（方案二：京都3晚+大阪2晚）
    ['2027-04-17','京都住宿・3晚（3間）',         108000, 22500, '', '¥12,000/間/晚 × 3間 × 3晚'],
    ['2027-04-20','大阪住宿・2晚（3間）',          66000, 13750, '', '¥11,000/間/晚 × 3間 × 2晚'],
    // 交通
    ['2027-04-17','HARUKA電車（KIX→京都）×6',    21600,  4500, '', '¥3,600/人；單程，建議搭配ICOCA套票'],
    ['2027-04-17','京都市區公車・地鐵（2日）×6',   8400,  1750, '', '¥700/人/日 × 2天'],
    ['2027-04-20','JR京都→大阪新快速×6',           4380,   913, '', '¥730/人'],
    ['2027-04-20','大阪市區地鐵（2日）×6',          5040,  1050, '', '¥420/人/日 × 2天（大阪1日乘車券）'],
    ['2027-04-22','南海電車（難波→KIX）×6',         6120,  1275, '', '¥1,020/人'],
    // 景點門票
    ['2027-04-18','清水寺入場費×6',                  3000,   625, '', '¥500/人'],
    ['2027-04-19','金閣寺入場費×6',                  3000,   625, '', '¥500/人'],
    ['2027-04-19','二条城入場費×6',                  4800,  1000, '', '¥800/人（世界遺產）'],
    ['2027-04-21','USJ門票×6',                      60000, 12500, '', '¥10,000/人；一般日Studio Pass（2027預估）'],
    ['2027-04-21','通天閣展望台入場費×6',             7200,  1500, '', '¥1,200/人'],
    // 餐飲
    ['2027-04-17','先斗町晚餐×6',                   57600, 12000, '', '¥9,600/人；先斗町料亭，含飲料'],
    ['2027-04-18','清水坂午餐・京都定食×6',          15000,  3125, '', '¥2,500/人；清水坂觀光區行情'],
    ['2027-04-18','錦市場晚餐・京都小食×6',          15000,  3125, '', '¥2,500/人；錦市場各攤'],
    ['2027-04-19','嵐山竹林午餐×6',                 15000,  3125, '', '¥2,500/人；嵐山渡月橋周邊'],
    ['2027-04-19','京料理晚餐（木屋町通）×6',         48000, 10000, '', '¥8,000/人；京都最後一晚，含飲料'],
    ['2027-04-20','錦市場晨逛・小食×6',               6000,  1250, '', '¥1,000/人；出發前輕食'],
    ['2027-04-20','道頓堀午餐・章魚燒×6',            12000,  2500, '', '¥2,000/人；道頓堀招牌小吃'],
    ['2027-04-20','串炸晚餐・道頓堀×6',              18000,  3750, '', '¥3,000/人；道頓堀串炸名店'],
    ['2027-04-21','USJ園內餐飲×6',                  18000,  3750, '', '¥3,000/人；哈利波特奶油啤酒+午餐'],
    ['2027-04-21','新世界串炸晚餐×6',               15000,  3125, '', '¥2,500/人；新世界・ジャンジャン横丁'],
    ['2027-04-22','黑門市場早餐・海鮮×6',            18000,  3750, '', '¥3,000/人；觀光客價位，生魚片/海鮮燒烤'],
    ['2027-04-22','臨空城午餐・輕食×6',              12000,  2500, '', '¥2,000/人'],
  ];
  for (const [date, title, jpy, twd, payer, notes] of P2_EXP) {
    const day = await get('SELECT id FROM days WHERE date=? AND plan_id=2', [date]);
    if (day) await run(
      `INSERT INTO expenses (day_id,title,amount_jpy,amount_twd,payer,notes) VALUES (?,?,?,?,?,?)`,
      [day.id, title, jpy, twd, payer, notes]
    );
  }
  console.log(`已插入方案二費用 ${P2_EXP.length} 筆`);

  await run('PRAGMA foreign_keys = ON');
  console.log('完成！本地資料已修正。');
  db.close();
}

reset().catch(e => { console.error(e); db.close(); });
