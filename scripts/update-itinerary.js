// 行程更新腳本：低密度・高質感版（風景・名勝・美食）
const { run, get, all } = require('../database/db');

async function main() {

  // ── 1. 更新 days ──────────────────────────────────────────────
  const dayUpdates = [
    { id: 1, title: '京都初抵・鴨川祇園', city: '京都', notes: '下午悠閒抵達，感受京都的第一個黃昏，漫步鴨川與祇園白川。' },
    { id: 2, title: '宇治世界遺產・東寺五重塔', city: '宇治・京都', notes: '早上避開人潮前往清幽宇治，下午回京都參訪東寺。' },
    { id: 3, title: '伏見稻荷・清水寺全攻略', city: '京都', notes: '週一店家全開、人潮最少，衝刺京都最核心名勝。' },
    { id: 4, title: '嵐山竹林・金閣寺→移居大阪', city: '京都・大阪', notes: '上午遊覽嵐山與金閣寺，傍晚優雅移居大阪。' },
    { id: 5, title: '神戶一日遊・百萬夜景', city: '神戶', notes: '搭阪神電車輕鬆前往神戶，品嚐神戶牛、欣賞港灣與摩耶山夜景。' },
    { id: 6, title: '黑門市場・返程', city: '大阪・關西', notes: '早上逛黑門市場，中午臨空城Outlet，下午從關西機場返台。' },
  ];

  for (const d of dayUpdates) {
    await run('UPDATE days SET title=?, city=?, notes=? WHERE id=?', [d.title, d.city, d.notes, d.id]);
    console.log(`✓ Day ${d.id} 更新：${d.title}`);
  }

  // ── 2. 清除舊活動 ─────────────────────────────────────────────
  await run('DELETE FROM activities', []);
  console.log('✓ 舊活動已清除');

  // ── 3. 新增活動 ───────────────────────────────────────────────
  const activities = [

    // ── Day 1 (id=1) 京都初抵・鴨川祇園 ──────────────────────
    {
      day_id: 1, sort_order: 1, time: '15:00', category: 'transport',
      title: '抵達京都車站',
      location: '京都駅（JR）',
      lat: 34.9858, lng: 135.7585,
      description: '搭乘關西特急「HARUKA」列車，關西空港→京都站約75分鐘。入住飯店後投宿放行李，展開京都初探。\n\n📌 小提醒：HARUKA需提前購票，建議搭配ICOCA套票更划算。',
    },
    {
      day_id: 1, sort_order: 2, time: '17:00', category: 'attraction',
      title: '鴨川夕陽散策',
      location: '鴨川（三条〜四条段）',
      lat: 35.0042, lng: 135.7704,
      description: '京都最療癒的散步路線。沿著鴨川河岸漫步，欣賞落日餘暉映照在水面的金色光景。三条至四条段兩岸設有台階，當地人習慣在此野餐、談天，是感受京都日常生活的最佳地點。',
    },
    {
      day_id: 1, sort_order: 3, time: '18:00', category: 'attraction',
      title: '祇園白川燈籠夜色',
      location: '祇園白川（巽橋周邊）',
      lat: 35.0037, lng: 135.7752,
      description: '白川沿岸種滿垂柳，傍晚燈籠亮起後如同走入江戶時代的畫中。巽橋是拍攝京都夜景的經典機位，橋上偶爾能見到舞妓輕盈走過，是祇園最夢幻的角落。',
    },
    {
      day_id: 1, sort_order: 4, time: '19:30', category: 'food',
      title: '先斗町晚餐・壽喜燒/京料理',
      location: '先斗町（木屋町通）',
      lat: 35.0034, lng: 135.7697,
      description: '先斗町是京都最具氛圍的美食街，狹窄的石板路兩側全是百年老舖與町家餐廳，緊依鴨川。\n\n🍲 推薦選擇：\n・三嶋亭（明治6年創業壽喜燒名店）\n・京料理 天ぷら YOSHIKAWA\n・京都一の傳（西京燒）\n\n💡 先斗町的餐廳通常座位有限，旺季建議提前訂位。',
    },

    // ── Day 2 (id=2) 宇治・東寺 ──────────────────────────────
    {
      day_id: 2, sort_order: 1, time: '09:00', category: 'transport',
      title: '前往宇治',
      location: '京都駅→宇治駅（JR奈良線）',
      lat: 34.8896, lng: 135.8028,
      description: '搭乘JR奈良線，從京都站直達宇治站，約17分鐘，車票約240円。建議09:00前出發，避開平等院的人潮高峰。',
    },
    {
      day_id: 2, sort_order: 2, time: '09:30', category: 'attraction',
      title: '平等院鳳凰堂',
      location: '平等院（宇治市宇治蓮華116）',
      lat: 34.8888, lng: 135.8081,
      description: '日本10元硬幣上的建築，UNESCO世界文化遺產。建於1053年，鳳凰堂倒映在阿字池中的景色令人屏息。\n\n🏛️ 鳳翔館博物館內收藏鳳凰像與古梵鐘原件，值得細細欣賞。\n💡 門票600円，鳳翔館另付300円，開館09:00。',
    },
    {
      day_id: 2, sort_order: 3, time: '11:00', category: 'attraction',
      title: '宇治川・橘洲散步',
      location: '宇治川・橘島',
      lat: 34.8877, lng: 135.8064,
      description: '宇治川清澈見底，橘洲是川中的自然小島，種滿松樹與竹林。沿岸的宇治神社境內古木參天，是平等院後最值得漫步的地點。清晨的宇治川薄霧繚繞，如夢似幻。',
    },
    {
      day_id: 2, sort_order: 4, time: '12:00', category: 'food',
      title: '中村藤吉本店・抹茶午餐',
      location: '中村藤吉本店（宇治市宇治壱番十番地）',
      lat: 34.8896, lng: 135.8062,
      description: '創業於1854年的宇治抹茶老舖，使用自家茶園的頂級宇治茶。\n\n🍵 必點：\n・生茶果凍（生茶ゼリィ）—  透明茶凍搭配抹茶冰淇淋，是店內招牌\n・抹茶パフェ（抹茶聖代）\n・茶そば（抹茶蕎麥麵）午餐套餐\n\n💡 週末常大排長龍，平日相對好入座，建議13點前用餐。',
    },
    {
      day_id: 2, sort_order: 5, time: '14:30', category: 'attraction',
      title: '東寺（五重塔）',
      location: '東寺（教王護國寺）',
      lat: 34.9802, lng: 135.7481,
      description: '日本最高的木造五重塔（高55公尺），UNESCO世界遺產，落日映照下金碧輝煌。\n\n空海大師親手開創的密宗道場，御影堂、金堂、講堂的佛像群皆為國寶。每月21日有「弘法市集」（フリーマーケット），是尋寶的好機會。',
    },
    {
      day_id: 2, sort_order: 6, time: '18:30', category: 'food',
      title: '京都車站・伊勢丹美食街晚餐',
      location: '京都駅ビル 伊勢丹（B1〜B2）',
      lat: 34.9858, lng: 135.7585,
      description: '京都車站伊勢丹地下樓層匯集京都精選美食，一站式解決晚餐。\n\n🍜 推薦：\n・拉麵小路（11家不同風格拉麵）\n・京都伊勢丹寿司・割烹\n・麺屋 優光（清淡系京都拉麵）\n\n飯後可搭電梯上頂樓空中廣場，俯瞰京都夜景。',
    },

    // ── Day 3 (id=3) 伏見稻荷・清水寺 ───────────────────────
    {
      day_id: 3, sort_order: 1, time: '07:30', category: 'attraction',
      title: '伏見稻荷大社（千本鳥居）',
      location: '伏見稻荷大社',
      lat: 34.9672, lng: 135.7727,
      description: '日本最有名的神社之一，數千座朱紅色鳥居蜿蜒山上，被《孤獨星球》評選為必訪景點。\n\n🌅 最佳時段：早晨7:30–9:00，光線從鳥居縫隙穿透，金光燦爛且人潮最少。\n\n建議路線：本殿→奧社（千本鳥居核心）→三つ辻觀景點（此段約45分鐘即可回頭，不必走完全程）\n\n24小時開放，免費入場。',
    },
    {
      day_id: 3, sort_order: 2, time: '10:00', category: 'attraction',
      title: '清水寺舞台',
      location: '清水寺',
      lat: 34.9948, lng: 135.7851,
      description: '建立於778年，世界文化遺產，「清水之舞台」以139根巨木支撐懸空，俯瞰京都市區的視野令人讚嘆。\n\n週一人潮明顯少於週末，是衝刺此熱門景點的最佳時機。\n\n🌸 音羽瀑布的三道泉水各有寓意：學業・戀愛・長壽，只能選一道。\n💡 門票500円，開門06:00。',
    },
    {
      day_id: 3, sort_order: 3, time: '11:30', category: 'attraction',
      title: '二年坂・三年坂石板路',
      location: '産寧坂（三年坂）',
      lat: 34.9968, lng: 135.7847,
      description: '京都最上鏡的古老石板老街，兩旁林立傳統町家，販售七味粉、清水燒、京都茶菓、竹工藝品。\n\n📸 最美機位：三年坂石階從下往上拍攝，背景是清水寺的塔樓，是京都最經典的構圖之一。\n\n💡 傳說在三年坂跌倒會帶來三年厄運，謹慎踩踏古老石板。',
    },
    {
      day_id: 3, sort_order: 4, time: '13:00', category: 'food',
      title: '石板路午餐・京都定食',
      location: '高台寺・清水坂周邊',
      lat: 35.0001, lng: 135.7849,
      description: '在二三年坂附近的町家餐廳享用京都定食午餐。\n\n🍱 推薦：\n・七味屋本舗旁邊小巷的家庭料理\n・茶寮 都路里（宇治抹茶甜點）\n・Kagizen Yoshifusa（創業1717年和菓子）',
    },
    {
      day_id: 3, sort_order: 5, time: '15:00', category: 'attraction',
      title: '八坂神社・圓山公園',
      location: '八坂神社',
      lat: 35.0037, lng: 135.7786,
      description: '祇園祭的主場神社，對面的圓山公園擁有京都最著名的垂枝夜櫻（しだれ桜）。神社境內的舞殿氣勢宏偉，夜間點燈後更為壯觀。\n\n從八坂神社步行穿越圓山公園，可接到知恩院的巨大山門，整個區域景色層次豐富。',
    },
    {
      day_id: 3, sort_order: 6, time: '19:00', category: 'food',
      title: '京都和牛燒肉晚餐',
      location: '木屋町通・四条周邊',
      lat: 35.0034, lng: 135.7697,
      description: '以京都和牛（京都肉）犒賞自己！京都市區有多家頂級燒肉名店。\n\n🥩 推薦：\n・焼肉 弘 四条木屋町店（鴨川河岸景觀座位）\n・牛禅 木屋町（嚴選京都産和牛）\n・炭火焼肉 なかむら（老字號隱藏名店）\n\n💡 京都和牛因稀少性，售價高於松阪牛，但風味細膩優雅，值得一試。',
    },

    // ── Day 4 (id=4) 嵐山・金閣寺→大阪 ──────────────────────
    {
      day_id: 4, sort_order: 1, time: '08:30', category: 'attraction',
      title: '嵐山竹林小徑',
      location: '嵐山竹林（野宮神社→大河內山莊）',
      lat: 35.0170, lng: 135.6714,
      description: '早晨的嵐山竹林光影最為迷人，高聳的孟宗竹如綠色穹頂，晨風拂過發出沙沙的聲響。\n\n🎋 路線：野宮神社入口→竹林小徑（約500公尺）→大河內山莊庭園入口\n\n💡 強烈建議早晨8:30前抵達，此後人潮急增。全段步行約20-30分鐘。',
    },
    {
      day_id: 4, sort_order: 2, time: '10:00', category: 'attraction',
      title: '渡月橋・嵐山河岸風景',
      location: '渡月橋（嵐山）',
      lat: 35.0151, lng: 135.6772,
      description: '嵐山最具代表性的地標，橫跨大堰川的古老木橋，配上背後的嵐山群峰，是京都最具代表的自然風景畫。\n\n渡月橋旁的嵐山商店街有抹茶冰淇淋、湯葉豆腐、竹工藝品，可邊走邊品嚐。早晨河岸薄霧未散時景色最美。',
    },
    {
      day_id: 4, sort_order: 3, time: '11:00', category: 'attraction',
      title: '仁和寺・御室櫻',
      location: '仁和寺',
      lat: 35.0248, lng: 135.7067,
      description: 'UNESCO世界遺產，醍醐天皇所建的皇室寺院。御室櫻是日本最晚開放的低矮型染井吉野櫻，因土壤特性而生長矮小，滿開時在二王門前形成絕景花海。\n\n🌸 御室櫻又被暱稱為「笨花（あほ桜）」——開花最晚，朵朵向上盛開，不懂「謙遜」地低垂，豔麗而任性。',
    },
    {
      day_id: 4, sort_order: 4, time: '12:30', category: 'attraction',
      title: '金閣寺（鹿苑寺）',
      location: '金閣寺（鹿苑寺）',
      lat: 35.0394, lng: 135.7292,
      description: '三層鎏金樓閣完美倒映在鏡湖池中，是京都最具代表性的明信片風景，UNESCO世界遺產。\n\n💡 最佳拍攝方位是入口進去後左側的觀景台，可拍到金閣與水中倒影的完美構圖。\n\n門票500円，開館09:00，建議12-13點到訪，光線從南方直射，金閣在陽光下最為耀眼。',
    },
    {
      day_id: 4, sort_order: 5, time: '14:30', category: 'transport',
      title: '行李宅配・移往大阪',
      location: '京都→大阪（JR京都線）',
      lat: 34.7024, lng: 135.4959,
      description: '使用YAMATO宅急便（黑貓宅急便）將行李從京都飯店直送大阪飯店，享受輕裝移動的優雅體驗。\n\n🚄 交通：JR京都線新快速（Osaka方向），京都→大阪 約28分鐘，730円\n\n📦 宅配說明：前一天辦理寄件，隔日配達，費用約1500-2000円，大型行李箱兩件以內。',
    },
    {
      day_id: 4, sort_order: 6, time: '18:00', category: 'attraction',
      title: '心齋橋・道頓堀夜遊',
      location: '道頓堀・心齋橋',
      lat: 34.6687, lng: 135.5023,
      description: '大阪最熱鬧的夜間娛樂區！道頓堀的巨型霓虹招牌與格利科跑者是大阪的象徵。\n\n🦀 必吃：\n・蟹道樂（螃蟹料理）\n・道頓堀 今井（大阪烏龍麵）\n・づぼらや（河豚料理）\n・章魚燒 わなか\n\n之後步行前往心齋橋商店街，感受大阪的活力購物氛圍。',
    },

    // ── Day 5 (id=5) 神戶一日遊 ──────────────────────────────
    {
      day_id: 5, sort_order: 1, time: '09:00', category: 'transport',
      title: '前往神戶・阪神電車',
      location: '大阪梅田/難波→神戶三宮',
      lat: 34.6913, lng: 135.1956,
      description: '從大阪前往神戶交通便捷，多條路線可選。\n\n🚃 推薦路線：\n・阪神電車：大阪梅田→神戶三宮，約32分鐘，430円\n・阪急電車：大阪梅田→神戶三宮，約27分鐘，330円\n・JR新快速：大阪→三ノ宮，約20分鐘，430円\n\n💡 建議搭阪神或阪急，月票持有者可直接使用，沿途風景也更有趣。',
    },
    {
      day_id: 5, sort_order: 2, time: '09:30', category: 'attraction',
      title: '北野異人館街',
      location: '北野異人館（北野町山本通）',
      lat: 34.6997, lng: 135.1913,
      description: '明治時代西洋外交官與商人聚居的洋館建築群，散落於神戶山丘上，充滿歐洲小鎮氛圍。\n\n🏡 推薦參觀：\n・風見雞館（德式建築，神戶市立，免費外觀）\n・英國館（英格蘭風格，有福爾摩斯陳列）\n・萊茵館（山頂位置，可俯瞰神戶港灣全景）\n\n從異人館徒步上坡約15分鐘，也可搭City Loop觀光巴士。',
    },
    {
      day_id: 5, sort_order: 3, time: '11:30', category: 'attraction',
      title: '生田神社',
      location: '生田神社（中央区下山手通）',
      lat: 34.6950, lng: 135.1946,
      description: '神戶最古老的神社，創建於201年，是神戶地名的起源地。境內古木參天，翠綠的本殿在城市中心如一方靜土。\n\n💕 神戶人口中的戀愛・結緣聖地，境內的「生田の森」原始林是日本的特殊史蹟。在神社內的手水舍淨手後，安靜參拜片刻。',
    },
    {
      day_id: 5, sort_order: 4, time: '13:00', category: 'food',
      title: '頂級神戶牛鐵板燒',
      location: '神戶三宮・元町周邊',
      lat: 34.6914, lng: 135.1956,
      description: '在神戶吃神戶牛鐵板燒，是全行程最重要的美食體驗！神戶牛是世界公認最頂級的牛肉之一，油花分佈均勻細緻，入口即化。\n\n🥩 推薦：\n・神戸牛 鉄板焼き けんしろう（午間套餐性價比高）\n・ステーキランド 神戸館（旅遊客推薦，透明廚房）\n・MOURIYA 本店（創業1885年，神戶牛的先驅）\n\n💡 午餐時段（12-14點）同級餐廳通常比晚餐便宜40-50%，強烈建議午餐時段享用。',
    },
    {
      day_id: 5, sort_order: 5, time: '15:30', category: 'attraction',
      title: '神戶港灣・美利堅公園',
      location: '美利堅公園・神戶港',
      lat: 34.6841, lng: 135.1878,
      description: '沿著神戶港的美利堅公園步道散步，感受神戶作為國際港口城市的開放氣質。\n\n🌊 周邊景點：\n・神戸ポートタワー（神戶港塔，紅色格網塔，近期完成整修）\n・神戶海洋博物館（白色帆船造型，展示神戶港歷史）\n・Harborland モザイク（海港購物商場，可邊用餐邊看日落）\n\n黃昏時海灣對岸的大阪灣景色最為迷人。',
    },
    {
      day_id: 5, sort_order: 6, time: '20:00', category: 'attraction',
      title: '摩耶山掬星台・百萬夜景',
      location: '摩耶山掬星台（まや観光ロープウェイ）',
      lat: 34.7167, lng: 135.2125,
      description: '日本三大夜景之一！從摩耶山掬星台俯瞰神戶・大阪灣的夜景，燈火從腳下蔓延至地平線，如同打翻的星空。\n\n🚡 交通：搭公車至「まや ケーブル下」→摩耶ケーブル（纜車）→まや Ropewy（空中纜車）→掬星台，全程約30分鐘\n\n💡 纜車末班車時間約20:30（依季節調整），請提前確認時刻表。天氣晴朗時能見度最佳。',
    },

    // ── Day 6 (id=6) 返程 ─────────────────────────────────────
    {
      day_id: 6, sort_order: 1, time: '08:00', category: 'food',
      title: '黑門市場・海鮮早餐',
      location: '黑門市場（中央区日本橋）',
      lat: 34.6653, lng: 135.5073,
      description: '「大阪的廚房」！全長580公尺的市場匯集170家店舖，食材鮮度與品質是大阪頂級。\n\n🦞 必吃：\n・海膽（うに）現場直食\n・松葉蟹腳・帝王蟹腳\n・現剖生蠔\n・玉子燒（大阪式厚蛋燒）\n\n💡 早上8點開始，越早越新鮮人越少。邊走邊吃是黑門市場的正確打開方式，請自備購物袋。',
    },
    {
      day_id: 6, sort_order: 2, time: '10:30', category: 'attraction',
      title: '臨空城 Outlet 看海購物',
      location: '臨空城 RINKU PREMIUM OUTLETS',
      lat: 34.4317, lng: 135.3069,
      description: '關西機場旁的Premium Outlet，可邊購物邊眺望大阪灣海景與飛機起降，是返程前最佳的最後血拚地點。\n\n🛍️ 特色：\n・超過210家國際品牌（Coach、Gucci、Prada等）\n・臨海位置，有廣闊的海景走廊\n・距關西機場僅需搭免費接駁巴士（約10分鐘）\n\n💡 從難波搭南海電車到臨空城站約35分鐘（1020円），下車即到。',
    },
    {
      day_id: 6, sort_order: 3, time: '14:00', category: 'transport',
      title: '關西國際機場・返程',
      location: '關西國際空港（KIX）',
      lat: 34.4347, lng: 135.2440,
      description: '建議出發前3小時抵達機場辦理報到手續。\n\n✈️ 機場內最後安排：\n・完成免稅品退稅（TAX FREE）手續\n・關空免稅店最後掃貨（日本酒・護膚品・零食伴手禮）\n・在出境後的餐廳享用最後一餐日本料理\n\n🛫 回程交通：\n・南海電車：臨空城→關西機場站 約3分鐘\n・HARUKA：關西機場→新幹線轉乘\n\n帶著滿滿的回憶，期待下次再來日本！',
    },
  ];

  let inserted = 0;
  for (const a of activities) {
    await run(
      `INSERT INTO activities (day_id, sort_order, time, title, location, lat, lng, description, category, map_url, image_url, mapcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '')`,
      [a.day_id, a.sort_order, a.time, a.title, a.location, a.lat, a.lng, a.description, a.category]
    );
    inserted++;
  }

  console.log(`✓ 新增 ${inserted} 個活動`);
  console.log('✅ 行程更新完成！');
  process.exit(0);
}

main().catch(e => { console.error('❌ 錯誤：', e.message); process.exit(1); });
