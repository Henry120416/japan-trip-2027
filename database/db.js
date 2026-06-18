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
  ['班機', '去程班機',     '星宇航空 JX（Taiwan to KIX）'],
  ['班機', '去程出發時間', '2027/04/17  08:30（桃園）'],
  ['班機', '去程抵達時間', '2027/04/17  12:15（關西KIX）'],
  ['班機', '回程班機',     '星宇航空 JX（KIX to Taiwan）'],
  ['班機', '回程出發時間', '2027/04/22  15:10（關西KIX）'],
  ['班機', '回程抵達時間', '2027/04/22  17:05（桃園）'],
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

// ── 方案二行程資料（大阪出發・環球影城，原始方案）─────────────
const PLAN1_DAYS = [
  { date:'2027-04-17', title:'啟程・前往京都',            city:'京都',      notes:'從關西機場搭HARUKA特急直達京都，入住飯店後漫步鴨川感受京都第一夜。' },
  { date:'2027-04-18', title:'京都・伏見稻荷 × 清水寺',  city:'京都',      notes:'早起衝伏見稻荷千本鳥居，再前往清水寺、二三年坂、祇園散策。' },
  { date:'2027-04-19', title:'京都・嵐山 × 金閣寺',      city:'京都',      notes:'嵐山竹林、渡月橋，下午前往金閣寺，傍晚錦市場晚餐。' },
  { date:'2027-04-20', title:'移動・入住大阪',            city:'大阪',      notes:'上午告別京都，搭JR移居大阪，下午探索道頓堀與心齋橋。' },
  { date:'2027-04-21', title:'大阪・環球影城 & 通天閣',  city:'大阪',      notes:'全日暢遊USJ哈利波特與超級任天堂世界，晚間通天閣夜景。' },
  { date:'2027-04-22', title:'返程・回台灣',              city:'大阪・關西', notes:'早上黑門市場海鮮早餐，臨空城Outlet最後購物，搭機返台。' },
];

// [date, sort, time, category, title, location, lat, lng, description]
const PLAN1_ACTS = [
  // Day 1 - 啟程・前往京都
  ['2027-04-17',1,'15:00','transport','抵達關西機場','關西國際空港（KIX）',34.4347,135.2440,
   '搭乘HARUKA特急，關西空港→京都站約75分鐘。建議搭配ICOCA+HARUKA套票（3600円），包含一次來回特急乘車券。'],
  ['2027-04-17',2,'17:00','transport','抵達京都・入住飯店','京都駅（JR）',34.9858,135.7585,
   '入住飯店放行李，建議選擇京都駅周邊或四条烏丸一帶，交通最為便利。'],
  ['2027-04-17',3,'18:30','attraction','鴨川夕陽散策','鴨川（三条〜四条段）',35.0042,135.7704,
   '沿鴨川漫步，感受京都的第一個黃昏。三条至四条段兩岸設有台階，當地人在此野餐談天。'],
  ['2027-04-17',4,'20:00','food','先斗町晚餐','先斗町（木屋町通）',35.0034,135.7697,
   '京都最具氛圍的美食街，緊依鴨川。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。'],
  // Day 2 - 京都・伏見稻荷 × 清水寺
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
  // Day 3 - 京都・嵐山 × 金閣寺
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
  // Day 4 - 移動・入住大阪
  ['2027-04-20',1,'09:30','food','錦市場晨間逛街','錦市場',35.0038,135.7674,
   '最後一個京都早晨，錦市場邊走邊吃告別京都。玉子燒、湯豆腐、漬物，準備好帶著好心情出發。'],
  ['2027-04-20',2,'11:00','transport','搭JR移往大阪','京都→大阪（JR京都線）',34.7024,135.4959,
   '搭JR京都線新快速，京都→大阪約28分鐘（730円）。建議使用YAMATO宅急便將行李提前送往大阪飯店。'],
  ['2027-04-20',3,'13:00','food','道頓堀午餐・章魚燒','道頓堀・心齋橋',34.6687,135.5023,
   '正式踏入大阪！道頓堀格利科跑者打卡，吃章魚燒（たこ焼き）、大阪燒（お好み焼き）。'],
  ['2027-04-20',4,'15:00','attraction','心齋橋・美國村散策','心齋橋・アメリカ村',34.6699,135.5008,
   '大阪最潮的購物街區。心齋橋筋商店街→美國村（次文化・古著），步行可達。'],
  ['2027-04-20',5,'19:00','food','串炸晚餐・道頓堀','難波・道頓堀周邊',34.6657,135.5014,
   '正宗串炸（串カツ）！大阪發源的炸物料理，麵衣酥脆，沾特調醬汁只能沾一次！推薦：だるま道頓堀店（創業1929年）。'],
  // Day 5 - 大阪・環球影城 & 通天閣
  ['2027-04-21',1,'09:00','attraction','環球影城（USJ）全日遊覽','UNIVERSAL STUDIOS JAPAN',34.6654,135.4321,
   '日本最頂級主題樂園！必玩：哈利波特魔法世界（霍格華茲城堡）、超級任天堂世界（瑪利歐賽車）、小小兵瘋狂乘車遊。強烈建議提前購買「Express Pass」快速通關票。門票約9400円起，建議09:00前已在門口。'],
  ['2027-04-21',2,'19:00','attraction','新世界・通天閣夜景','新世界・通天閣',34.6524,135.5063,
   '大阪懷舊商圈，充滿昭和時代市井氣息。108公尺高的通天閣，摸幸福神ビリケン的腳掌能帶來好運。門票700円。'],
  ['2027-04-21',3,'20:30','food','新世界串炸晚餐','新世界・ジャンジャン横丁',34.6524,135.5063,
   '「ジャンジャン横丁」小巷是大阪最道地的串炸激戰區。推薦：八重勝（排隊名店）、てんぐ（份量紮實）。'],
  // Day 6 - 返程・回台灣
  ['2027-04-22',1,'08:00','food','黑門市場・最後海鮮早餐','黑門市場（日本橋）',34.6653,135.5073,
   '「大阪的廚房」，現場直食海膽・螃蟹・生蠔。早上8點越早越新鮮，邊走邊吃是黑門市場的正確方式。'],
  ['2027-04-22',2,'10:30','attraction','臨空城 Outlet 購物','臨空城 RINKU PREMIUM OUTLETS',34.4317,135.3069,
   '超過210家國際品牌，邊購物邊眺望大阪灣海景。從難波搭南海電車約35分（1020円），距機場免費接駁約10分。'],
  ['2027-04-22',3,'14:00','transport','關西國際機場・返程','關西國際空港（KIX）',34.4347,135.2440,
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
      // ── 修正方案一（京都・神戶）若為舊錯誤資料 ──────────
      const p1d1 = await pool.query(`SELECT title FROM days WHERE date='2027-04-17' AND plan_id=1`);
      const p1title = p1d1.rows[0]?.title || '';
      if (!p1title.includes('京都初抵')) {
        for (const d of P1_DAYS) {
          const upd = await pool.query(
            'UPDATE days SET title=$1, city=$2, notes=$3 WHERE date=$4 AND plan_id=1 RETURNING id',
            [d.title, d.city, d.notes, d.date]
          );
          if (upd.rows[0]) {
            await pool.query('DELETE FROM activities WHERE day_id=$1', [upd.rows[0].id]);
            for (const a of P1_ACTS.filter(x => x[0] === d.date)) {
              const [, sort, time, cat, title, loc, lat, lng, desc] = a;
              await pool.query(
                `INSERT INTO activities (day_id,sort_order,time,category,title,location,lat,lng,description,map_url,image_url,mapcode)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'','','')`,
                [upd.rows[0].id, sort, time, cat, title, loc, lat, lng, desc]
              );
            }
          } else {
            // 若該日不存在（plan_id=1 rows 缺失），直接 INSERT
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
      }
      // ── 修正方案二（大阪出發・原始方案）若為舊錯誤資料 ──
      const p2d1 = await pool.query(`SELECT title FROM days WHERE date='2027-04-17' AND plan_id=2`);
      const p2title = p2d1.rows[0]?.title || '';
      if (!p2title.includes('啟程')) {
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

    // ── 班機時間修正（幂等）──────────────────────────────────────────
    // 去程：星宇 08:30 出發，12:15 抵達 KIX
    const p2d1r = await pool.query(`SELECT d.id FROM days d WHERE d.date='2027-04-17' AND d.plan_id=2`);
    if (p2d1r.rows[0]) {
      await pool.query(`UPDATE activities SET time='12:15' WHERE day_id=$1 AND title LIKE '%抵達關西機場%'`, [p2d1r.rows[0].id]);
      await pool.query(`UPDATE activities SET time='14:30' WHERE day_id=$1 AND title LIKE '%抵達京都%'`, [p2d1r.rows[0].id]);
    }
    // 回程：星宇 15:10 出發，需 13:00 到機場（臨空城→KIX 僅 5 分鐘）
    for (const pid of [1, 2]) {
      const d6r = await pool.query(`SELECT d.id FROM days d WHERE d.date='2027-04-22' AND d.plan_id=$1`, [pid]);
      if (d6r.rows[0]) {
        await pool.query(`UPDATE activities SET time='13:00', description='星宇航空 15:10 起飛，需 13:10 前完成報到。臨空城搭南海電車 1 站（5 分鐘）即達 KIX。建議 12:30 前離開 Outlet。' WHERE day_id=$1 AND title LIKE '%機場%'`, [d6r.rows[0].id]);
      }
    }

    // ── 方案一活動圖片（Wikipedia/Wikimedia Commons 核實 URL，幂等）────
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
      await pool.query(
        `UPDATE activities SET image_url=$1 WHERE title LIKE $2 AND day_id IN (SELECT id FROM days WHERE plan_id=1)`,
        [e.img, `%${e.kw}%`]
      );
    }

    // ── 交通接駁說明（幂等，只補未含 ▶ 的描述）─────────────────────────
    const TRANSIT_DESCS = [
      // 方案一
      { kw:'鴨川夕陽散策',         pid:1, date:'2027-04-17', desc:'▶ 從京都車站步行15分鐘：出中央口往北，沿河原町通至四条大橋，即抵達鴨川河岸。\n\n京都最療癒的散步路線。三条至四条段兩岸設有台階，當地人在此野餐談天，感受京都日常生活的最佳地點。' },
      { kw:'祇園白川燈籠夜色',     pid:1, date:'2027-04-17', desc:'▶ 從鴨川三条段步行8分鐘：沿三条通往東過三条大橋，轉入白川沿岸。\n\n白川沿岸種滿垂柳，傍晚燈籠亮起後如同江戶時代的畫中。巽橋是拍攝京都夜景的經典機位。' },
      { kw:'先斗町晚餐・壽喜燒',   pid:1, date:'2027-04-17', desc:'▶ 從祇園白川步行5分鐘：往西過鴨川，沿木屋町通南行即達先斗町入口。\n\n京都最具氛圍的美食街，緊依鴨川。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。' },
      { kw:'平等院鳳凰堂',         pid:1, date:'2027-04-18', desc:'▶ 從宇治駅步行10分鐘：出站往南，過宇治橋後右轉沿宇治橋通即達。\n\n10元硬幣上的建築，UNESCO世界遺產，建於1053年。鳳凰堂倒映在阿字池中令人屏息。門票600円，鳳翔館另付300円。' },
      { kw:'宇治川・橘洲散步',     pid:1, date:'2027-04-18', desc:'▶ 從平等院步行3分鐘：往北回到宇治橋，沿河岸步道即達橘島。\n\n宇治川清澈見底，橘洲是川中的自然小島。沿岸的宇治神社境內古木參天。' },
      { kw:'中村藤吉本店',         pid:1, date:'2027-04-18', desc:'▶ 從宇治川橘洲步行3分鐘：回到宇治橋通，店面就在橋頭附近。\n\n創業1854年宇治抹茶老舖。必點：生茶果凍（生茶ゼリィ）——透明茶凍搭配抹茶冰淇淋，是店內招牌。' },
      { kw:'東寺（五重塔）',       pid:1, date:'2027-04-18', desc:'▶ 從中村藤吉搭JR奈良線→京都駅（17分，240円），出八条口步行15分鐘向西南；或搭公車207號到「東寺東門前」（10分）。\n\n日本最高木造五重塔（高55公尺），UNESCO世界遺產。空海大師開創的密宗道場，落日映照金碧輝煌。' },
      { kw:'京都車站・伊勢丹',     pid:1, date:'2027-04-18', desc:'▶ 從東寺步行15分鐘往東北回京都駅，進駅ビル直下B1~B2美食街。\n\n地下樓層匯集京都精選美食。推薦：拉麵小路（11家拉麵）、京都壽司割烹。' },
      { kw:'伏見稻荷大社（千本鳥居）', pid:1, date:'2027-04-19', desc:'▶ 從飯店搭JR奈良線→稲荷駅（京都駅起5分，150円）；或搭京阪電車→伏見稲荷駅（祇園四条起約12分，210円）。\n\n早晨7:30–9:00是最佳攝影時段！光線從鳥居縫隙穿透，金光燦爛且人潮最少。24小時開放，免費入場。' },
      { kw:'清水寺舞台',           pid:1, date:'2027-04-19', desc:'▶ 從伏見稻荷搭京阪→清水五条駅（5分，180円），步行上坡20分鐘（五条坂路線）；全程約25分鐘。\n\n「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，UNESCO世界遺產。週一人潮明顯少於週末。門票500円。' },
      { kw:'二年坂・三年坂石板路', pid:1, date:'2027-04-19', desc:'▶ 從清水寺正門步行5分鐘下坡：出寺門往西北，右側即為三年坂石階入口。\n\n京都最上鏡的古老石板老街，兩旁林立傳統町家。從三年坂石階往上拍攝是京都最經典的構圖之一。' },
      { kw:'石板路午餐',           pid:1, date:'2027-04-19', desc:'▶ 在三年坂・二年坂同一區域，步行2分鐘即可找到周邊町家餐廳。\n\n在二三年坂附近的町家餐廳享用京都定食。推薦：都路里（宇治抹茶甜點）。' },
      { kw:'八坂神社・圓山公園',   pid:1, date:'2027-04-19', desc:'▶ 從三年坂步行15分鐘：石板路下坡往西北，穿過圓山公園即達八坂神社西樓門。\n\n祇園祭主場神社。旁邊圓山公園的垂枝夜櫻（しだれ桜）聞名全日本。' },
      { kw:'京都和牛燒肉晚餐',     pid:1, date:'2027-04-19', desc:'▶ 從八坂神社沿四条通往西步行18分鐘：過祇園交叉口→鴨川大橋→木屋町通即達。\n\n以京都和牛犒賞自己！推薦：焼肉弘四条木屋町店（鴨川河岸景觀座位）。' },
      { kw:'嵐山竹林小徑',         pid:1, date:'2027-04-20', desc:'▶ 從飯店搭JR山陰本線（嵯峨野線）→嵯峨嵐山駅（京都駅起20分，240円），步行5分鐘北上即達野宮神社竹林入口。\n\n清晨的嵐山竹林光影最迷人，強烈建議8:30前抵達，此後人潮急增。全段步行約20-30分鐘。' },
      { kw:'渡月橋・嵐山河岸風景', pid:1, date:'2027-04-20', desc:'▶ 從竹林小徑步行10分鐘往南：穿過嵐山公園，順山坡而下即看見渡月橋橫跨大堰川。\n\n嵐山最具代表性的地標，橫跨大堰川的古老木橋，配上嵐山群峰是京都最具代表的自然風景畫。' },
      { kw:'仁和寺・御室櫻',       pid:1, date:'2027-04-20', desc:'▶ 從嵐山搭嵐電（京福電鉄）：嵐山駅→御室仁和寺駅（12分，220円）；出站即達仁和寺二王門。\n\nUNESCO世界遺產。御室櫻是日本最晚開的低矮型染井吉野櫻，滿開時在二王門前形成絕景花海。' },
      { kw:'金閣寺（鹿苑寺）',     pid:1, date:'2027-04-20', desc:'▶ 從仁和寺步行15分鐘往東；或搭公車59號→金閣寺道（10分，230円）。\n\n三層鎏金樓閣完美倒映在鏡湖池中，UNESCO世界遺產。午後光線直射，金閣最為耀眼。門票500円。' },
      { kw:'心齋橋・道頓堀夜遊',   pid:1, date:'2027-04-20', desc:'▶ 到大阪後，搭大阪Metro御堂筋線梅田→難波（2分，180円），步行5分鐘即達道頓堀・心齋橋。\n\n大阪最熱鬧的夜間娛樂區！道頓堀巨型霓虹招牌與格利科跑者是大阪的象徵。章魚燒・串炸，感受大阪活力。' },
      { kw:'北野異人館街',         pid:1, date:'2027-04-21', desc:'▶ 從神戶三宮駅步行上坡20分鐘往北：出北口沿山本通上行；或搭市巴士（Citylop北野線，100円）3分鐘直達。\n\n明治時代西洋人聚居的洋館建築群，充滿歐洲小鎮氛圍。推薦：風見雞館（德式）、萊茵館（山頂可俯瞰神戶港）。' },
      { kw:'生田神社',             pid:1, date:'2027-04-21', desc:'▶ 從北野異人館步行下坡20分鐘往東南：沿山本通→下山手通→花隈方向往東，即達生田神社表參道。\n\n神戶最古老的神社，創建於201年。境內古木參天，神戶人戀愛・結緣的聖地。' },
      { kw:'頂級神戶牛鐵板燒',     pid:1, date:'2027-04-21', desc:'▶ 從生田神社步行5分鐘：沿東側參道出口往南，即進入三宮・元町餐廳密集區。\n\n全行程最重要的美食體驗！神戶牛是世界頂級牛肉，入口即化。推薦：MOURIYA本店（創業1885年）、ステーキランド神戸館。午餐時段比晚餐便宜約40%。' },
      { kw:'神戶港灣・美利堅公園', pid:1, date:'2027-04-21', desc:'▶ 從三宮步行25分鐘往南：沿花時計前→Harborland方向→美利堅公園；或搭計程車（¥800~1,000，5分鐘）。\n\n沿神戶港步道散步。周邊：神戶港塔、神戶海洋博物館、Harborland モザイク（海港商場）。黃昏時大阪灣景色最迷人。' },
      { kw:'摩耶山掬星台',         pid:1, date:'2027-04-21', desc:'▶ 從美利堅公園搭市巴士18號→「摩耶ケーブル」站下車（25分，230円）→搭摩耶纜車（纜車）上山（6分）→轉まやロープウェイ（空中纜車）→掬星台（6分）。\n\n日本三大夜景之一！末班纜車約20:30，請提前確認。' },
      { kw:'黑門市場・海鮮早餐',   pid:1, date:'2027-04-22', desc:'▶ 從難波飯店步行10分鐘：往日本橋方向即達黑門市場南端入口（日本橋1丁目）。\n\n「大阪的廚房」，現場直食海膽・松葉蟹腳・生蠔・玉子燒。早上8點越早越新鮮。' },
      { kw:'臨空城 Outlet',        pid:1, date:'2027-04-22', desc:'▶ 從難波站搭南海電車機場急行→りんくうタウン駅（38分，920円）；Outlet 就在出站步行3分鐘。購物後再搭1站到關西機場（5分，100円），或步行連絡橋（20分）。\n\n超過210家國際品牌，可邊看飛機起降邊購物。距機場免費接駁約10分。' },
      // 方案二
      { kw:'鴨川夕陽散策',         pid:2, date:'2027-04-17', desc:'▶ 從飯店步行前往鴨川（京都駅周邊飯店約15分；四条烏丸飯店約5分），沿四条大橋往北即達三条〜四条段。\n\n沿鴨川漫步，感受京都的第一個黃昏。三条至四条段兩岸設有台階，當地人在此野餐談天。' },
      { kw:'先斗町晚餐',           pid:2, date:'2027-04-17', desc:'▶ 從鴨川三条段步行5分鐘往西：過三条大橋後左轉木屋町通，先斗町在木屋町和鴨川之間的窄巷。\n\n京都最具氛圍的美食街，緊依鴨川。推薦：三嶋亭（明治6年創業壽喜燒）、京都一の傳（西京燒）。' },
      { kw:'伏見稻荷大社（千本鳥居）', pid:2, date:'2027-04-18', desc:'▶ 從飯店搭JR奈良線→稲荷駅（京都駅起5分，150円）；或搭京阪電車→伏見稲荷駅（祇園四条起約12分，210円）。\n\n數千座朱紅色鳥居蜿蜒山上，早晨8點人潮最少、光線最美。24小時開放，免費入場。' },
      { kw:'清水寺・清水舞台',     pid:2, date:'2027-04-18', desc:'▶ 從伏見稻荷搭京阪→清水五条駅（5分，180円），步行上坡20分鐘；全程約25分鐘。\n\n「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區，UNESCO世界遺產。門票500円。' },
      { kw:'二年坂・三年坂石板路', pid:2, date:'2027-04-18', desc:'▶ 從清水寺正門步行5分鐘下坡：出寺門往西北，右側即為三年坂石階入口。\n\n京都最上鏡的古老石板老街，兩旁林立傳統町家，從清水寺步行下山的必經路線。' },
      { kw:'清水坂午餐',           pid:2, date:'2027-04-18', desc:'▶ 在三年坂・二年坂同一區域，步行2分鐘。\n\n在二三年坂附近的町家餐廳享用京都定食。推薦：都路里（宇治抹茶甜點）。' },
      { kw:'八坂神社・祇園散策',   pid:2, date:'2027-04-18', desc:'▶ 從三年坂步行15分鐘：石板路下坡往西北，穿過圓山公園即達八坂神社。\n\n祇園祭主場神社，往南走是祇園花見小路，機緣好能見到藝妓或舞妓。' },
      { kw:'錦市場・晚餐',         pid:2, date:'2027-04-18', desc:'▶ 從八坂神社沿四条通往西步行20分鐘：四条通→木屋町→高倉通，即達錦市場東口。或搭公車201號（10分）。\n\n「京都廚房」，全長390公尺、130家店鋪，醃漬蔬菜・豆腐・玉子燒・烤海鮮。' },
      { kw:'嵐山竹林小徑',         pid:2, date:'2027-04-19', desc:'▶ 從飯店搭JR山陰本線（嵯峨野線）→嵯峨嵐山駅（京都駅起20分，240円），步行5分鐘即達野宮神社竹林入口。\n\n高聳孟宗竹如綠色穹頂，路線：野宮神社→竹林小徑（約500公尺）→大河內山莊。建議早上抵達避開人潮。' },
      { kw:'渡月橋・天龍寺',       pid:2, date:'2027-04-19', desc:'▶ 從竹林小徑步行10分鐘往南：穿過嵐山公園，順山坡而下即看見渡月橋。\n\n嵐山最具代表性的地標，橫跨大堰川的古老木橋。旁邊天龍寺的曹源池庭園是UNESCO世界遺產。' },
      { kw:'嵐山竹林午餐',         pid:2, date:'2027-04-19', desc:'▶ 渡月橋周邊步行5分鐘：橋頭兩側聚集大量餐廳，天龍寺前的商店街亦有多家選擇。\n\n嵐山觀光途中享用午餐。推薦：竹取亭（竹林景觀）、野宮神社附近的豆腐料理。' },
      { kw:'金閣寺（鹿苑寺）',     pid:2, date:'2027-04-19', desc:'▶ 從嵐山搭公車11號→「金閣寺道」（25分，230円）；或搭嵐電→北野白梅町，再步行15分或換公車。\n\n三層鎏金樓閣倒映在鏡湖池中，UNESCO世界遺產。入口後左側觀景台是最佳拍攝機位。門票500円。' },
      { kw:'二条城',               pid:2, date:'2027-04-19', desc:'▶ 從金閣寺搭公車12或59號→「二条城前」（15分，230円）；出站即達大手門。\n\n德川家康興建的城堡，UNESCO世界遺產。「鶯張り」廊道每步皆有鶯鳴聲，防止刺客入侵。' },
      { kw:'京料理晚餐',           pid:2, date:'2027-04-19', desc:'▶ 從二条城搭地鐵東西線→三条京阪駅（5分，210円），步行5分鐘往南達木屋町通。\n\n最後一個京都夜晚，享用道地京料理。推薦：焼肉弘四条木屋町店（鴨川河岸景觀座位）。' },
      { kw:'錦市場晨間逛街',       pid:2, date:'2027-04-20', desc:'▶ 從飯店步行或搭公車前往錦市場（四条通附近）；京都駅飯店約搭公車10分或步行20分。\n\n最後一個京都早晨，錦市場邊走邊吃告別京都。玉子燒、湯豆腐、漬物。' },
      { kw:'道頓堀午餐・章魚燒',   pid:2, date:'2027-04-20', desc:'▶ 抵大阪後，從大阪駅搭地鐵御堂筋線→難波駅（10分，180円），步行5分鐘至道頓堀戎橋。\n\n正式踏入大阪！道頓堀格利科跑者打卡，吃章魚燒（たこ焼き）、大阪燒（お好み焼き）。' },
      { kw:'心齋橋・美國村散策',   pid:2, date:'2027-04-20', desc:'▶ 從道頓堀步行5分鐘往北：戎橋筋商店街直通心齋橋筋，美國村在其西側。\n\n大阪最潮的購物街區。心齋橋筋商店街→美國村（次文化・古著），步行可達。' },
      { kw:'串炸晚餐・道頓堀',     pid:2, date:'2027-04-20', desc:'▶ 從心齋橋步行5分鐘往南回道頓堀：難波・道頓堀一帶串炸名店密集。\n\n正宗串炸（串カツ）！推薦：だるま道頓堀店（創業1929年）。' },
      { kw:'環球影城',             pid:2, date:'2027-04-21', desc:'▶ 從大阪飯店搭JR大阪環状線→西九条，換JR夢咲線→ユニバーサルシティ駅（大阪駅起合計15分，180円）；出站即為USJ正門。\n\n必玩：哈利波特魔法世界、超級任天堂世界（瑪利歐賽車）、小小兵瘋狂乘車遊。強烈建議提前購「Express Pass」。建議09:00前入場。' },
      { kw:'新世界・通天閣',       pid:2, date:'2027-04-21', desc:'▶ 從USJ搭JR夢咲線→西九条，換JR大阪環状線→今宮駅（合計12分），步行10分鐘至新世界・通天閣。\n\n大阪懷舊商圈，充滿昭和時代市井氣息。摸幸福神ビリケン的腳掌能帶來好運。門票700円。' },
      { kw:'新世界串炸晚餐',       pid:2, date:'2027-04-21', desc:'▶ 通天閣周邊步行5分鐘：往東進入ジャンジャン横丁窄巷，兩側全是串炸名店。\n\n「ジャンジャン横丁」是大阪最道地的串炸激戰區。推薦：八重勝（排隊名店）、てんぐ（份量紮實）。' },
      { kw:'黑門市場・最後海鮮早餐', pid:2, date:'2027-04-22', desc:'▶ 從大阪難波飯店步行10分鐘：往日本橋方向即達黑門市場南端入口。\n\n「大阪的廚房」，現場直食海膽・螃蟹・生蠔。早上8點越早越新鮮。' },
      { kw:'臨空城 Outlet 購物',   pid:2, date:'2027-04-22', desc:'▶ 從難波站搭南海電車機場急行→りんくうタウン駅（38分，920円）；Outlet 出站步行3分鐘。購物後再搭1站至關西機場（5分，100円）。\n\n超過210家國際品牌，邊購物邊眺望大阪灣海景。距機場免費接駁約10分。' },
    ];
    for (const t of TRANSIT_DESCS) {
      await pool.query(
        `UPDATE activities SET description=$1
         WHERE title LIKE $2
         AND day_id IN (SELECT id FROM days WHERE plan_id=$3 AND date=$4)`,
        [t.desc, `%${t.kw}%`, t.pid, t.date]
      );
    }

    // ── Mapcode 自動填充（幂等，只補空白欄位）──────────────────────────
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
      await pool.query(
        `UPDATE activities SET mapcode=$1 WHERE title LIKE $2 AND (mapcode IS NULL OR mapcode='')`,
        [e.mc, `%${e.kw}%`]
      );
    }

    // ── 費用種子：兩方案統一分類（機票/住宿/交通/景點門票/餐飲）──────
    const totalExp = await pool.query(`SELECT COUNT(*) as c FROM expenses WHERE day_id IN (SELECT id FROM days WHERE plan_id IN (1,2))`);
    if (parseInt(totalExp.rows[0].c) < 30) {
      await pool.query(`DELETE FROM expenses WHERE day_id IN (SELECT id FROM days WHERE plan_id IN (1,2))`);

      // 方案一（京都出發・神戶一日遊）
      const P1_EXP = [
        ['2027-04-17','來回機票（台灣↔關西）×6',          0, 97842, '', 'NT$16,307/人'],
        ['2027-04-17','京都住宿・4晚（3間）',         144000, 30000, '', '¥12,000/間/晚 × 3間 × 4晚'],
        ['2027-04-21','大阪住宿・1晚（3間）',          33000,  6875, '', '¥11,000/間/晚 × 3間'],
        ['2027-04-17','HARUKA電車（KIX→京都）×6',    21600,  4500, '', '¥3,600/人；單程'],
        ['2027-04-17','京都市區公車・地鐵（3日）×6', 12600,  2625, '', '¥700/人/日 × 3天'],
        ['2027-04-18','JR宇治線往返×6',               3480,   725, '', '¥290/人單程，往返¥580'],
        ['2027-04-20','行李宅配（京都→大阪）',          3000,   625, '', '¥1,500/件 × 2件'],
        ['2027-04-20','JR京都→大阪新快速×6',           4380,   913, '', '¥730/人'],
        ['2027-04-21','阪神電車往返（大阪↔神戶三宮）×6',3960,   825, '', '¥330×2/人'],
        ['2027-04-21','摩耶山ロープウェイ往返×6',      10200,  2125, '', '¥1,700/人往返'],
        ['2027-04-22','南海電車（難波→KIX）×6',         6120,  1275, '', '¥1,020/人'],
        ['2027-04-18','平等院鳳凰堂入場費×6',           3600,   750, '', '¥600/人'],
        ['2027-04-18','東寺入場費×6',                   3000,   625, '', '¥500/人'],
        ['2027-04-19','清水寺入場費×6',                  3000,   625, '', '¥500/人'],
        ['2027-04-20','金閣寺入場費×6',                  3000,   625, '', '¥500/人'],
        ['2027-04-20','仁和寺入場費×6',                  3000,   625, '', '¥500/人'],
        ['2027-04-21','北野異人館入場費×6',              4800,  1000, '', '¥800/人'],
        ['2027-04-17','先斗町壽喜燒/京料理晚餐×6',    57600, 12000, '', '¥9,600/人；先斗町料亭，含飲料'],
        ['2027-04-18','中村藤吉抹茶午餐×6',            18000,  3750, '', '¥3,000/人；名店抹茶套餐'],
        ['2027-04-18','伊勢丹美食街晚餐×6',            18000,  3750, '', '¥3,000/人；京都車站B1~B2'],
        ['2027-04-19','石板路午餐・京都定食×6',         15000,  3125, '', '¥2,500/人；清水坂觀光區'],
        ['2027-04-19','京都和牛燒肉晚餐×6',             48000, 10000, '', '¥8,000/人；木屋町通，含飲料'],
        ['2027-04-20','嵐山竹林午餐×6',                15000,  3125, '', '¥2,500/人；嵐山渡月橋周邊'],
        ['2027-04-20','道頓堀晚餐・串炸/章魚燒×6',     18000,  3750, '', '¥3,000/人'],
        ['2027-04-21','頂級神戶牛鐵板燒午餐×6',         72000, 15000, '', '¥12,000/人；神戶A5和牛鐵板燒'],
        ['2027-04-21','神戶港灣・美利堅公園茶點×6',      9000,  1875, '', '¥1,500/人'],
        ['2027-04-22','黑門市場早餐・海鮮×6',           18000,  3750, '', '¥3,000/人'],
        ['2027-04-22','臨空城午餐・輕食×6',             12000,  2500, '', '¥2,000/人'],
      ];
      for (const [date, title, jpy, twd, payer, notes] of P1_EXP) {
        const dr = await pool.query(`SELECT id FROM days WHERE date=$1 AND plan_id=1`, [date]);
        if (dr.rows[0]) await pool.query(
          `INSERT INTO expenses (day_id,title,amount_jpy,amount_twd,payer,notes) VALUES ($1,$2,$3,$4,$5,$6)`,
          [dr.rows[0].id, title, jpy, twd, payer, notes]
        );
      }

      // 方案二（大阪出發・環球影城）
      const P2_EXP = [
        ['2027-04-17','來回機票（台灣↔關西）×6',          0, 97842, '', 'NT$16,307/人'],
        ['2027-04-17','京都住宿・3晚（3間）',         108000, 22500, '', '¥12,000/間/晚 × 3間 × 3晚'],
        ['2027-04-20','大阪住宿・2晚（3間）',          66000, 13750, '', '¥11,000/間/晚 × 3間 × 2晚'],
        ['2027-04-17','HARUKA電車（KIX→京都）×6',    21600,  4500, '', '¥3,600/人；單程'],
        ['2027-04-17','京都市區公車・地鐵（2日）×6',   8400,  1750, '', '¥700/人/日 × 2天'],
        ['2027-04-20','JR京都→大阪新快速×6',           4380,   913, '', '¥730/人'],
        ['2027-04-20','大阪市區地鐵（2日）×6',          5040,  1050, '', '¥420/人/日 × 2天'],
        ['2027-04-22','南海電車（難波→KIX）×6',         6120,  1275, '', '¥1,020/人'],
        ['2027-04-18','清水寺入場費×6',                  3000,   625, '', '¥500/人'],
        ['2027-04-19','金閣寺入場費×6',                  3000,   625, '', '¥500/人'],
        ['2027-04-19','二条城入場費×6',                  4800,  1000, '', '¥800/人'],
        ['2027-04-21','USJ門票×6',                      60000, 12500, '', '¥10,000/人；一般日Studio Pass（2027預估）'],
        ['2027-04-21','通天閣展望台入場費×6',             7200,  1500, '', '¥1,200/人'],
        ['2027-04-17','先斗町晚餐×6',                   57600, 12000, '', '¥9,600/人；先斗町料亭，含飲料'],
        ['2027-04-18','清水坂午餐・京都定食×6',          15000,  3125, '', '¥2,500/人；清水坂觀光區'],
        ['2027-04-18','錦市場晚餐・京都小食×6',          15000,  3125, '', '¥2,500/人；錦市場各攤'],
        ['2027-04-19','嵐山竹林午餐×6',                 15000,  3125, '', '¥2,500/人；嵐山渡月橋周邊'],
        ['2027-04-19','京料理晚餐（木屋町通）×6',         48000, 10000, '', '¥8,000/人；含飲料'],
        ['2027-04-20','錦市場晨逛・小食×6',               6000,  1250, '', '¥1,000/人'],
        ['2027-04-20','道頓堀午餐・章魚燒×6',            12000,  2500, '', '¥2,000/人'],
        ['2027-04-20','串炸晚餐・道頓堀×6',              18000,  3750, '', '¥3,000/人'],
        ['2027-04-21','USJ園內餐飲×6',                  18000,  3750, '', '¥3,000/人；奶油啤酒+午餐'],
        ['2027-04-21','新世界串炸晚餐×6',               15000,  3125, '', '¥2,500/人'],
        ['2027-04-22','黑門市場早餐・海鮮×6',            18000,  3750, '', '¥3,000/人'],
        ['2027-04-22','臨空城午餐・輕食×6',              12000,  2500, '', '¥2,000/人'],
      ];
      for (const [date, title, jpy, twd, payer, notes] of P2_EXP) {
        const dr = await pool.query(`SELECT id FROM days WHERE date=$1 AND plan_id=2`, [date]);
        if (dr.rows[0]) await pool.query(
          `INSERT INTO expenses (day_id,title,amount_jpy,amount_twd,payer,notes) VALUES ($1,$2,$3,$4,$5,$6)`,
          [dr.rows[0].id, title, jpy, twd, payer, notes]
        );
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
