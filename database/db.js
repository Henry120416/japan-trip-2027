const USE_PG = !!process.env.DATABASE_URL;

let run, get, all, initDB;

// ── 預設打包清單 ─────────────────────────────────────
const DEFAULT_CHECKLIST = [
  ['證件', '護照'], ['證件', '信用卡（2張以上）'], ['證件', '台灣健保卡'],
  ['錢財', '日圓現金'], ['錢財', '備用現金（台幣）'],
  ['3C', '手機充電線'], ['3C', '充電頭'], ['3C', '轉接頭（日本 A 型）'],
  ['3C', '行動電源'], ['3C', '相機 + 記憶卡'],
  ['交通', 'IC 卡（ICOCA / Suica）'], ['交通', 'WiFi 分享器 / SIM 卡'],
  ['衣物', '換洗衣物（含內衣）'], ['衣物', '外套 / 薄外套'],
  ['衣物', '舒適步行鞋'], ['衣物', '雨傘 / 輕量雨衣'],
  ['生活', '常備藥品（感冒 / 胃腸）'], ['生活', '防曬乳'],
  ['生活', '保養品 / 洗漱用品'], ['生活', '購物袋（環保）'],
];

// ── 預設重要資訊 ─────────────────────────────────────
const DEFAULT_INFO = [
  ['班機', '去程班機', ''],
  ['班機', '去程出發時間', '2027/04/17'],
  ['班機', '去程抵達時間', ''],
  ['班機', '回程班機', ''],
  ['班機', '回程出發時間', '2027/04/22'],
  ['班機', '回程抵達時間', ''],
  ['住宿', '大阪飯店名稱', ''],
  ['住宿', '大阪飯店地址', ''],
  ['住宿', '大阪 Check-in / Check-out', ''],
  ['住宿', '京都飯店名稱', ''],
  ['住宿', '京都飯店地址', ''],
  ['住宿', '京都 Check-in / Check-out', ''],
  ['緊急', '日本警察', '110'],
  ['緊急', '日本急救', '119'],
  ['緊急', '台灣駐大阪辦事處', '+81-6-4301-7335'],
  ['緊急', '台灣急難救助專線', '0800-085-095（免費）'],
  ['實用', '匯率參考', '1 TWD ≈ 4.8 JPY'],
  ['實用', 'IC 卡加值', '便利商店 / 車站加值機'],
  ['實用', '緊急醫療用語', '助けてください（救命）'],
];

// ── 方案一行程資料（大阪出發・環球影城）─────────────
const PLAN1_DAYS = [
  { date:'2027-04-17', title:'抵達大阪・道頓堀初夜',        city:'大阪',      notes:'下午抵達關西機場，入住難波/心齋橋周邊飯店，晚上初探道頓堀。' },
  { date:'2027-04-18', title:'大阪名所全攻略',               city:'大阪',      notes:'大阪城、黑門市場、天王寺、通天閣，感受浪速之城的活力。' },
  { date:'2027-04-19', title:'環球影城（USJ）',              city:'大阪',      notes:'全日沉浸在電影的魔法世界，哈利波特・小小兵・超級任天堂。' },
  { date:'2027-04-20', title:'金閣寺・嵐山→入住京都',       city:'京都',      notes:'從大阪移居京都，下午遊覽金閣寺與嵐山竹林。' },
  { date:'2027-04-21', title:'京都精華：稻荷・清水・祇園',  city:'京都',      notes:'伏見稻荷早晨千本鳥居、清水寺、二三年坂、八坂神社、錦市場。' },
  { date:'2027-04-22', title:'黑門市場・返程',               city:'大阪・關西', notes:'早餐逛黑門市場，臨空城Outlet最後購物，關西機場返台。' },
];

// [date, sort, time, category, title, location, lat, lng, description]
const PLAN1_ACTS = [
  // Day 1
  ['2027-04-17',1,'15:00','transport','抵達關西機場','關西國際空港（KIX）',34.4347,135.2440,
   '搭乘南海電車「Rapi:t」，關西機場→難波約38分鐘（1450円）。建議購買「YOKOSO！OSAKA TICKET」，含特急乘車券＋地鐵一日券。'],
  ['2027-04-17',2,'17:30','transport','入住大阪飯店・難波','難波・心齋橋周邊',34.6657,135.5014,
   '入住難波或心齋橋周邊飯店，步行可達道頓堀、心齋橋、黑門市場，是大阪最核心的商圈。'],
  ['2027-04-17',3,'19:00','attraction','道頓堀・心齋橋初探','道頓堀・心齋橋',34.6687,135.5023,
   '格利科跑者霓虹招牌下拍照打卡，是每位旅人必做的事。戎橋→道頓堀商店街→心齋橋商店街（全長約1.5公里），邊走邊吃章魚燒、金龍拉麵。'],
  ['2027-04-17',4,'20:30','food','串炸名店・難波晚餐','難波・道頓堀周邊',34.6657,135.5014,
   '正宗串炸（串カツ）！大阪發源的炸物料理，麵衣酥脆，沾上特調醬汁（只能沾一次！）。推薦：だるま道頓堀店（創業1929年）。'],
  // Day 2
  ['2027-04-18',1,'09:00','attraction','大阪城公園・天守閣','大阪城公園',34.6873,135.5262,
   '豐臣秀吉所建，日本三大名城之一。春天盛開1270棵染井吉野櫻，8樓展望台俯瞰大阪市區。門票600円，開館09:00。'],
  ['2027-04-18',2,'12:00','food','黑門市場午餐','黑門市場（日本橋）',34.6653,135.5073,
   '「大阪的廚房」！170家店鋪，海膽・帝王蟹腳・現烤牛肉串・厚切玉子燒。邊走邊吃是黑門市場的正確方式。'],
  ['2027-04-18',3,'14:00','attraction','天王寺・あべのハルカス','あべのハルカス',34.6461,135.5135,
   '日本最高摩天大樓（300公尺），頂層展望台360度俯瞰大阪、神戶、京都。門票1500円，日落前後最美。'],
  ['2027-04-18',4,'16:30','attraction','新世界・通天閣','新世界・通天閣',34.6524,135.5063,
   '大阪懷舊商圈，充滿昭和時代市井氣息。108公尺高的通天閣，摸幸福神ビリケン的腳掌能帶來好運。門票700円。'],
  ['2027-04-18',5,'19:00','food','新世界串炸晚餐','新世界・ジャンジャン横丁',34.6524,135.5063,
   '「ジャンジャン横丁」小巷是大阪最道地的串炸激戰區。推薦：八重勝（排隊名店）、てんぐ（份量紮實）。'],
  // Day 3
  ['2027-04-19',1,'09:00','attraction','環球影城（USJ）全日遊覽','UNIVERSAL STUDIOS JAPAN',34.6654,135.4321,
   '日本最頂級主題樂園！必玩：哈利波特魔法世界（霍格華茲城堡）、超級任天堂世界（瑪利歐賽車）、小小兵瘋狂乘車遊。\n\n強烈建議提前購買「Express Pass」快速通關票。門票約9400円起，建議09:00開園前已在門口。'],
  ['2027-04-19',2,'20:30','food','大阪站・梅田晚餐','大阪駅・梅田',34.7025,135.4959,
   '從USJ返回，在梅田商圈補充能量。推薦：Grand Front Osaka餐廳樓層、LUCUA 1100美食廣場，選擇豐富。'],
  // Day 4
  ['2027-04-20',1,'10:00','transport','移往京都・JR新快速','大阪→京都（JR京都線）',34.9858,135.7585,
   '搭JR京都線新快速，大阪→京都約28分鐘（730円）。建議提前辦理行李宅配送往京都飯店，輕裝移動。'],
  ['2027-04-20',2,'12:00','attraction','金閣寺（鹿苑寺）','金閣寺（鹿苑寺）',35.0394,135.7292,
   '三層鎏金樓閣倒映在鏡湖池中，UNESCO世界遺產。入口後左側觀景台是最佳拍攝機位。門票500円。'],
  ['2027-04-20',3,'14:30','attraction','嵐山竹林小徑','嵐山竹林（野宮神社→大河內山莊）',35.0170,135.6714,
   '高聳孟宗竹如綠色穹頂，路線：野宮神社→竹林小徑（約500公尺）→大河內山莊。下午人潮較多，快步走完核心段。'],
  ['2027-04-20',4,'16:00','attraction','渡月橋・嵐山河景','渡月橋（嵐山）',35.0151,135.6772,
   '嵐山最具代表性的地標，橫跨大堰川的古老木橋，配上嵐山群峰是京都最具代表的自然風景畫。'],
  ['2027-04-20',5,'19:00','food','先斗町晚餐・京料理','先斗町（木屋町通）',35.0034,135.7697,
   '抵達京都第一晚，享用道地京料理。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。'],
  // Day 5
  ['2027-04-21',1,'08:00','attraction','伏見稻荷大社（千本鳥居）','伏見稻荷大社',34.9672,135.7727,
   '數千座朱紅色鳥居蜿蜒山上。最佳時段：早晨8-9點，光線金燦且人潮最少。24小時開放，免費入場。'],
  ['2027-04-21',2,'10:30','attraction','清水寺・二年坂・三年坂','清水寺',34.9948,135.7851,
   '「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，UNESCO世界遺產。之後漫步二三年坂石板老街。門票500円。'],
  ['2027-04-21',3,'14:00','attraction','八坂神社・祇園散策','八坂神社',35.0037,135.7786,
   '祇園祭主場神社，圓山公園的垂枝夜櫻聞名全日本。往南走是祇園花見小路，機緣好能見到藝妓或舞妓。'],
  ['2027-04-21',4,'16:00','attraction','錦市場（京都廚房）','錦市場',35.0038,135.7674,
   '全長390公尺，130家店鋪，有「京都廚房」之稱。醃漬蔬菜・豆腐・玉子燒・烤海鮮，全程邊走邊吃。'],
  ['2027-04-21',5,'19:00','food','京都和牛燒肉晚餐','木屋町通・四条周邊',35.0034,135.7697,
   '最後一個京都夜晚，以京都和牛（京都肉）犒賞自己。推薦：焼肉弘四条木屋町店（鴨川河岸景觀座位）。'],
  // Day 6
  ['2027-04-22',1,'09:00','food','黑門市場・最後海鮮早餐','黑門市場（日本橋）',34.6653,135.5073,
   '旅程最後早上，現場直食海膽・螃蟹・生蠔。從京都搭JR新快速到大阪約28分，越早越新鮮。'],
  ['2027-04-22',2,'11:30','attraction','臨空城 Outlet 購物','臨空城 RINKU PREMIUM OUTLETS',34.4317,135.3069,
   '超過210家國際品牌，邊購物邊眺望大阪灣海景。從難波搭南海電車約35分（1020円），距機場免費接駁約10分。'],
  ['2027-04-22',3,'14:30','transport','關西國際機場・返程','關西國際空港（KIX）',34.4347,135.2440,
   '建議出發前3小時抵達，完成免稅退稅、關空免稅店最後掃貨，帶著6天滿滿回憶返台！'],
];

// ── 方案二行程資料（京都出發・神戶一日遊）─────────────
const PLAN2_DAYS = [
  { date:'2027-04-17', title:'京都初抵・鴨川祇園',          city:'京都',      notes:'下午悠閒抵達，感受京都的第一個黃昏，漫步鴨川與祇園白川。' },
  { date:'2027-04-18', title:'宇治世界遺產・東寺五重塔',    city:'宇治・京都', notes:'早上避開人潮前往清幽宇治，下午回京都參訪東寺。' },
  { date:'2027-04-19', title:'伏見稻荷・清水寺全攻略',      city:'京都',      notes:'週一店家全開、人潮最少，衝刺京都最核心名勝。' },
  { date:'2027-04-20', title:'嵐山竹林・金閣寺→移居大阪',  city:'京都・大阪', notes:'上午遊覽嵐山與金閣寺，傍晚優雅移居大阪。' },
  { date:'2027-04-21', title:'神戶一日遊・百萬夜景',        city:'神戶',      notes:'搭阪神電車輕鬆前往神戶，品嚐神戶牛、欣賞港灣與摩耶山夜景。' },
  { date:'2027-04-22', title:'黑門市場・返程',               city:'大阪・關西', notes:'早上逛黑門市場，中午臨空城Outlet，下午從關西機場返台。' },
];

const PLAN2_ACTS = [
  // Day 1
  ['2027-04-17',1,'15:00','transport','抵達京都車站','京都駅（JR）',34.9858,135.7585,
   '搭乘關西特急「HARUKA」，關西空港→京都站約75分鐘。建議搭配ICOCA套票更划算。入住飯店放行李後展開京都初探。'],
  ['2027-04-17',2,'17:00','attraction','鴨川夕陽散策','鴨川（三条〜四条段）',35.0042,135.7704,
   '京都最療癒的散步路線。三条至四条段兩岸設有台階，當地人在此野餐談天，感受京都日常生活的最佳地點。'],
  ['2027-04-17',3,'18:00','attraction','祇園白川燈籠夜色','祇園白川（巽橋周邊）',35.0037,135.7752,
   '白川沿岸種滿垂柳，傍晚燈籠亮起後如同江戶時代的畫中。巽橋是拍攝京都夜景的經典機位。'],
  ['2027-04-17',4,'19:30','food','先斗町晚餐・壽喜燒/京料理','先斗町（木屋町通）',35.0034,135.7697,
   '京都最具氛圍的美食街，緊依鴨川。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。'],
  // Day 2
  ['2027-04-18',1,'09:00','transport','前往宇治','京都駅→宇治駅（JR奈良線）',34.8896,135.8028,
   '搭JR奈良線，京都站→宇治站約17分鐘（240円）。建議09:00前出發，避開平等院人潮高峰。'],
  ['2027-04-18',2,'09:30','attraction','平等院鳳凰堂','平等院',34.8888,135.8081,
   '10元硬幣上的建築，UNESCO世界遺產，建於1053年。鳳凰堂倒映在阿字池中令人屏息。門票600円，鳳翔館另付300円。'],
  ['2027-04-18',3,'11:00','attraction','宇治川・橘洲散步','宇治川・橘島',34.8877,135.8064,
   '宇治川清澈見底，橘洲是川中的自然小島。沿岸的宇治神社境內古木參天，是平等院後最值得漫步的地點。'],
  ['2027-04-18',4,'12:00','food','中村藤吉本店・抹茶午餐','中村藤吉本店',34.8896,135.8062,
   '創業1854年宇治抹茶老舖。必點：生茶果凍（生茶ゼリィ）——透明茶凍搭配抹茶冰淇淋，是店內招牌。'],
  ['2027-04-18',5,'14:30','attraction','東寺（五重塔）','東寺（教王護國寺）',34.9802,135.7481,
   '日本最高木造五重塔（高55公尺），UNESCO世界遺產。空海大師開創的密宗道場，落日映照金碧輝煌。'],
  ['2027-04-18',6,'18:30','food','京都車站・伊勢丹美食街晚餐','京都駅ビル 伊勢丹（B1〜B2）',34.9858,135.7585,
   '地下樓層匯集京都精選美食。推薦：拉麵小路（11家拉麵）、京都壽司割烹。飯後可上頂樓空中廣場俯瞰夜景。'],
  // Day 3
  ['2027-04-19',1,'07:30','attraction','伏見稻荷大社（千本鳥居）','伏見稻荷大社',34.9672,135.7727,
   '早晨7:30–9:00是最佳攝影時段！光線從鳥居縫隙穿透，金光燦爛且人潮最少。24小時開放，免費入場。'],
  ['2027-04-19',2,'10:00','attraction','清水寺舞台','清水寺',34.9948,135.7851,
   '「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，UNESCO世界遺產。週一人潮明顯少於週末。門票500円。'],
  ['2027-04-19',3,'11:30','attraction','二年坂・三年坂石板路','産寧坂（三年坂）',34.9968,135.7847,
   '京都最上鏡的古老石板老街，兩旁林立傳統町家。從三年坂石階往上拍攝是京都最經典的構圖之一。'],
  ['2027-04-19',4,'13:00','food','石板路午餐・京都定食','高台寺・清水坂周邊',35.0001,135.7849,
   '在二三年坂附近的町家餐廳享用京都定食。推薦：都路里（宇治抹茶甜點）、Kagizen Yoshifusa（創業1717年和菓子）。'],
  ['2027-04-19',5,'15:00','attraction','八坂神社・圓山公園','八坂神社',35.0037,135.7786,
   '祇園祭主場神社。旁邊圓山公園的垂枝夜櫻（しだれ桜）聞名全日本。從八坂步行穿越可接到知恩院巨大山門。'],
  ['2027-04-19',6,'19:00','food','京都和牛燒肉晚餐','木屋町通・四条周邊',35.0034,135.7697,
   '以京都和牛犒賞自己！推薦：焼肉弘四条木屋町店（鴨川河岸景觀座位）、牛禅木屋町（嚴選京都産和牛）。'],
  // Day 4
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
   '大阪最熱鬧的夜間娛樂區！道頓堀巨型霓虹招牌與格利科跑者是大阪的象徵。蟹道樂・章魚燒・串炸，感受大阪活力。'],
  // Day 5
  ['2027-04-21',1,'09:00','transport','前往神戶・阪神電車','大阪梅田/難波→神戶三宮',34.6913,135.1956,
   '阪神電車：大阪梅田→神戶三宮約32分（430円）。阪急電車：梅田→三宮約27分（330円）。JR新快速：大阪→三ノ宮約20分。'],
  ['2027-04-21',2,'09:30','attraction','北野異人館街','北野異人館（北野町山本通）',34.6997,135.1913,
   '明治時代西洋人聚居的洋館建築群，充滿歐洲小鎮氛圍。推薦：風見雞館（德式）、萊茵館（山頂可俯瞰神戶港）。'],
  ['2027-04-21',3,'11:30','attraction','生田神社','生田神社（中央区下山手通）',34.6950,135.1946,
   '神戶最古老的神社，創建於201年。境內古木參天，神戶人戀愛・結緣的聖地。「生田の森」是日本特殊史蹟。'],
  ['2027-04-21',4,'13:00','food','頂級神戶牛鐵板燒','神戶三宮・元町周邊',34.6914,135.1956,
   '全行程最重要的美食體驗！神戶牛是世界頂級牛肉，入口即化。推薦：MOURIYA本店（創業1885年）、ステーキランド神戸館。午餐時段比晚餐便宜約40%。'],
  ['2027-04-21',5,'15:30','attraction','神戶港灣・美利堅公園','美利堅公園・神戶港',34.6841,135.1878,
   '沿神戶港步道散步。周邊：神戶港塔（Kobe Port Tower）、神戶海洋博物館、Harborland モザイク（海港商場）。黃昏時大阪灣景色最迷人。'],
  ['2027-04-21',6,'20:00','attraction','摩耶山掬星台・百萬夜景','摩耶山掬星台（まや観光ロープウェイ）',34.7167,135.2125,
   '日本三大夜景之一！搭公車→摩耶ケーブル（纜車）→まやロープウェイ→掬星台，全程約30分。末班纜車約20:30，請提前確認。'],
  // Day 6
  ['2027-04-22',1,'08:00','food','黑門市場・海鮮早餐','黑門市場（中央区日本橋）',34.6653,135.5073,
   '「大阪的廚房」，現場直食海膽・松葉蟹腳・生蠔・玉子燒。早上8點越早越新鮮。邊走邊吃，準備好食慾！'],
  ['2027-04-22',2,'10:30','attraction','臨空城 Outlet 看海購物','臨空城 RINKU PREMIUM OUTLETS',34.4317,135.3069,
   '超過210家國際品牌，可邊看飛機起降邊購物。從難波搭南海電車約35分（1020円），距機場免費接駁約10分。'],
  ['2027-04-22',3,'14:00','transport','關西國際機場・返程','關西國際空港（KIX）',34.4347,135.2440,
   '建議出發前3小時到機場。完成免稅退稅、關空免稅店最後掃貨，帶著滿滿回憶，期待下次再來！'],
];

// 方案一 = 京都出發・神戶（PLAN2_DAYS/ACTS 的內容）
// 方案二 = 大阪出發・環球影城（PLAN1_DAYS/ACTS 的內容）
const P1_DAYS = PLAN2_DAYS;
const P1_ACTS = PLAN2_ACTS;
const P2_DAYS = PLAN1_DAYS;
const P2_ACTS = PLAN1_ACTS;

if (USE_PG) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const toPG = sql => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

  run = async (sql, p = []) => {
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    const q = isInsert ? toPG(sql) + ' RETURNING id' : toPG(sql);
    const r = await pool.query(q, p);
    return { lastID: r.rows[0]?.id, changes: r.rowCount };
  };
  get = async (sql, p = []) => { const r = await pool.query(toPG(sql), p); return r.rows[0]; };
  all = async (sql, p = []) => { const r = await pool.query(toPG(sql), p); return r.rows; };

  initDB = async () => {
    // ── 核心資料表 ─────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS days (
        id SERIAL PRIMARY KEY, date TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0, time TEXT DEFAULT '', title TEXT NOT NULL,
        location TEXT DEFAULT '', map_url TEXT DEFAULT '',
        description TEXT DEFAULT '', category TEXT DEFAULT 'attraction'
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY, day_id INTEGER REFERENCES days(id),
        title TEXT NOT NULL, amount_jpy INTEGER DEFAULT 0,
        amount_twd INTEGER DEFAULT 0, payer TEXT DEFAULT '',
        notes TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS checklist (
        id SERIAL PRIMARY KEY, category TEXT DEFAULT '其他',
        item TEXT NOT NULL, checked INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS trip_info (
        id SERIAL PRIMARY KEY, category TEXT NOT NULL,
        key TEXT NOT NULL, value TEXT DEFAULT '', sort_order INTEGER DEFAULT 0
      );
    `);

    // ── 欄位遷移（幂等）──────────────────────────────────────
    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT ''").catch(() => {});
    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS lat REAL").catch(() => {});
    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS lng REAL").catch(() => {});
    await pool.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS mapcode TEXT DEFAULT ''").catch(() => {});

    // ── 雙方案支援遷移 ───────────────────────────────────────
    await pool.query(`CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, subtitle TEXT
    )`);
    await pool.query(`INSERT INTO plans (id,name,subtitle) VALUES (1,'方案一','京都出發・神戶一日遊') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, subtitle=EXCLUDED.subtitle`);
    await pool.query(`INSERT INTO plans (id,name,subtitle) VALUES (2,'方案二','大阪出發・環球影城') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, subtitle=EXCLUDED.subtitle`);
    await pool.query(`ALTER TABLE days ADD COLUMN IF NOT EXISTS plan_id INTEGER DEFAULT 2`);
    // 移除舊的 date 單欄唯一約束，改為 (date, plan_id) 聯合唯一
    await pool.query(`ALTER TABLE days DROP CONSTRAINT IF EXISTS days_date_key`).catch(() => {});
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname='days_date_plan_unique'
        ) THEN
          ALTER TABLE days ADD CONSTRAINT days_date_plan_unique UNIQUE (date, plan_id);
        END IF;
      END $$
    `).catch(() => {});
    // 把舊有（未設 plan_id 的）資料設為方案二
    await pool.query(`UPDATE days SET plan_id=2 WHERE plan_id IS NULL`);

    // ── 初始資料種子 ──────────────────────────────────────────
    const dc = await pool.query('SELECT COUNT(*) as c FROM days');
    if (parseInt(dc.rows[0].c) === 0) {
      // 全新 DB：種方案一（京都）plan_id=1
      for (const d of P1_DAYS) {
        await pool.query('INSERT INTO days (date,title,city,notes,plan_id) VALUES ($1,$2,$3,$4,1)',
          [d.date, d.title, d.city, d.notes]);
      }
      // 種方案二（大阪）plan_id=2
      for (const d of P2_DAYS) {
        await pool.query('INSERT INTO days (date,title,city,notes,plan_id) VALUES ($1,$2,$3,$4,2)',
          [d.date, d.title, d.city, d.notes]);
      }
      const insAct = async (plan_id, acts) => {
        for (const a of acts) {
          const [date, sort, time, cat, title, loc, lat, lng, desc] = a;
          const dr = await pool.query('SELECT id FROM days WHERE date=$1 AND plan_id=$2', [date, plan_id]);
          if (dr.rows[0]) {
            await pool.query(
              `INSERT INTO activities (day_id,sort_order,time,category,title,location,lat,lng,description,map_url,image_url,mapcode)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'','','')`,
              [dr.rows[0].id, sort, time, cat, title, loc, lat, lng, desc]
            );
          }
        }
      };
      await insAct(1, P1_ACTS);
      await insAct(2, P2_ACTS);
    } else {
      // ── 已有資料：確保方案一（京都）存在 ────────────────
      const p1count = await pool.query('SELECT COUNT(*) as c FROM days WHERE plan_id=1');
      if (parseInt(p1count.rows[0].c) === 0) {
        for (const d of P1_DAYS) {
          const r = await pool.query(
            'INSERT INTO days (date,title,city,notes,plan_id) VALUES ($1,$2,$3,$4,1) ON CONFLICT DO NOTHING RETURNING id',
            [d.date, d.title, d.city, d.notes]
          );
          if (r.rows[0]) {
            for (const a of P1_ACTS.filter(x => x[0] === d.date)) {
              const [, sort, time, cat, title, loc, lat, lng, desc] = a;
              await pool.query(
                `INSERT INTO activities (day_id,sort_order,time,category,title,location,lat,lng,description,map_url,image_url,mapcode)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'','','')`,
                [r.rows[0].id, sort, time, cat, title, loc, lat, lng, desc]
              );
            }
          }
        }
      }
      // ── 修正方案二（大阪）若為舊佔位資料 ───────────────
      const p2d1 = await pool.query(`SELECT title FROM days WHERE date='2027-04-17' AND plan_id=2`);
      const p2title = p2d1.rows[0]?.title || '';
      if (!p2title.includes('抵達大阪')) {
        for (const d of P2_DAYS) {
          const upd = await pool.query(
            'UPDATE days SET title=$1, city=$2, notes=$3 WHERE date=$4 AND plan_id=2 RETURNING id',
            [d.title, d.city, d.notes, d.date]
          );
          if (upd.rows[0]) {
            await pool.query('DELETE FROM activities WHERE day_id=$1', [upd.rows[0].id]);
            for (const a of P2_ACTS.filter(x => x[0] === d.date)) {
              const [, sort, time, cat, title, loc, lat, lng, desc] = a;
              await pool.query(
                `INSERT INTO activities (day_id,sort_order,time,category,title,location,lat,lng,description,map_url,image_url,mapcode)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'','','')`,
                [upd.rows[0].id, sort, time, cat, title, loc, lat, lng, desc]
              );
            }
          }
        }
      }
    }

    const cl = await pool.query('SELECT COUNT(*) as c FROM checklist');
    if (parseInt(cl.rows[0].c) === 0) {
      for (let i = 0; i < DEFAULT_CHECKLIST.length; i++) {
        const [cat, item] = DEFAULT_CHECKLIST[i];
        await pool.query('INSERT INTO checklist (category, item, sort_order) VALUES ($1, $2, $3)', [cat, item, i]);
      }
    }
    const ti = await pool.query('SELECT COUNT(*) as c FROM trip_info');
    if (parseInt(ti.rows[0].c) === 0) {
      for (let i = 0; i < DEFAULT_INFO.length; i++) {
        const [cat, key, value] = DEFAULT_INFO[i];
        await pool.query('INSERT INTO trip_info (category, key, value, sort_order) VALUES ($1, $2, $3, $4)', [cat, key, value, i]);
      }
    }
  };

} else {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const db = new sqlite3.Database(path.join(__dirname, 'trip.db'));

  run = (sql, p = []) => new Promise((res, rej) =>
    db.run(sql, p, function (err) { err ? rej(err) : res({ lastID: this.lastID, changes: this.changes }); })
  );
  get = (sql, p = []) => new Promise((res, rej) =>
    db.get(sql, p, (err, row) => { err ? rej(err) : res(row); })
  );
  all = (sql, p = []) => new Promise((res, rej) =>
    db.all(sql, p, (err, rows) => { err ? rej(err) : res(rows); })
  );

  initDB = () => new Promise(resolve => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run(`CREATE TABLE IF NOT EXISTS days (id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL, title TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '', notes TEXT DEFAULT '')`);
      db.run(`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0, time TEXT DEFAULT '', title TEXT NOT NULL,
        location TEXT DEFAULT '', map_url TEXT DEFAULT '',
        description TEXT DEFAULT '', category TEXT DEFAULT 'attraction',
        image_url TEXT DEFAULT '')`);
      db.run(`ALTER TABLE activities ADD COLUMN image_url TEXT DEFAULT ''`, () => {});
      db.run(`ALTER TABLE activities ADD COLUMN lat REAL`, () => {});
      db.run(`ALTER TABLE activities ADD COLUMN lng REAL`, () => {});
      db.run(`ALTER TABLE activities ADD COLUMN mapcode TEXT DEFAULT ''`, () => {});
      db.run(`CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER REFERENCES days(id), title TEXT NOT NULL,
        amount_jpy INTEGER DEFAULT 0, amount_twd INTEGER DEFAULT 0,
        payer TEXT DEFAULT '', notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
      db.run(`CREATE TABLE IF NOT EXISTS checklist (id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT DEFAULT '其他', item TEXT NOT NULL,
        checked INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0)`);
      db.run(`CREATE TABLE IF NOT EXISTS trip_info (id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL, key TEXT NOT NULL,
        value TEXT DEFAULT '', sort_order INTEGER DEFAULT 0)`);
      db.run(`CREATE TABLE IF NOT EXISTS plans (id INTEGER PRIMARY KEY, name TEXT NOT NULL, subtitle TEXT)`);
      db.run(`INSERT OR REPLACE INTO plans VALUES (1,'方案一','京都出發・神戶一日遊')`);
      db.run(`INSERT OR REPLACE INTO plans VALUES (2,'方案二','大阪出發・環球影城')`);
      db.run(`ALTER TABLE days ADD COLUMN plan_id INTEGER DEFAULT 1`, () => {});

      setTimeout(resolve, 300);
    });
  });
}

module.exports = { run, get, all, initDB };
