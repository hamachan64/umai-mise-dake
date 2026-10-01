/* =====================================================================
   お店データ。運用中に触るのは基本このファイルだけです。

   - budget は「ひとりあたりの目安（円）」を数値で。表示と絞り込みに使います
   - lat / lng は地図ページのピン位置。Googleマップで店を右クリック →
     いちばん上に出る座標をコピーして貼るのが早いです
   - photo に画像パス（例 "img/marutama.jpg" を public/ に置く）を入れると
     カードのビジュアルが写真に差し替わります。空なら絵文字表示
   ===================================================================== */

export type Shop = {
  id: string;
  name: string;
  yomi: string;
  genre: Genre;
  area: string;
  access: string;
  budget: number;
  dish: string;
  score: 1 | 2 | 3 | 4 | 5;
  lat: number;
  lng: number;
  photo: string;
  memo: string;
};

export type Genre = keyof typeof GENRES;

/* ジャンルごとの絵柄・食感オノマトペ・一文字の漢字（k）・色（tone: shu/ai/matcha/karashi）。Notion DB「グルメリスト」のジャンル選択肢と
   1対1で対応させています。Notion側に選択肢を足したら、ここにも同じ名前で追加してください */
export const GENRES = {
  "ラーメン":         { icon: "🍜", o: "ズルッ", k: "麺", tone: "karashi" },
  "そば・うどん":     { icon: "🥢", o: "つるっ", k: "蕎", tone: "matcha" },
  "寿司":             { icon: "🍣", o: "ぷりっ", k: "鮨", tone: "ai" },
  "和食":             { icon: "🍱", o: "ほろり", k: "和", tone: "matcha" },
  "焼肉":             { icon: "🥩", o: "ジュージュー", k: "焼", tone: "shu" },
  "居酒屋":           { icon: "🍺", o: "ぷはー", k: "酒", tone: "ai" },
  "中華":             { icon: "🥟", o: "パラッ", k: "華", tone: "shu" },
  "アジアン":         { icon: "🌶", o: "ヒリッ", k: "亜", tone: "karashi" },
  "イタリアン":       { icon: "🍝", o: "もちっ", k: "伊", tone: "matcha" },
  "バーガー・肉料理": { icon: "🍔", o: "がぶっ", k: "肉", tone: "shu" },
  "カレー":           { icon: "🍛", o: "ピリッ", k: "辛", tone: "karashi" },
  "洋食":             { icon: "🍽", o: "じゅわっ", k: "洋", tone: "ai" },
  "パン":             { icon: "🥐", o: "さくっ", k: "麦", tone: "karashi" },
  "スイーツ":         { icon: "🍰", o: "とろっ", k: "甘", tone: "shu" },
  "和菓子":           { icon: "🍡", o: "もちもち", k: "菓", tone: "matcha" },
  "カフェ・喫茶":     { icon: "☕", o: "ほっ", k: "喫", tone: "ai" },
} as const;

export const SHOPS: Shop[] = [
  /* ここから Notion「グルメリスト」DBから /add-shop で反映（2026-09-13、1回目・10件） */
  { id:"uokin",      name:"新橋　魚金",          yomi:"UOKIN",             genre:"居酒屋", area:"新橋",   access:"新橋駅 徒歩1分",         budget:3500, dish:"煮魚",                     score:5, lat:35.665404, lng:139.757359, photo:"", memo:"新橋駅からほぼゼロ距離。煮魚がしっかり脂の乗った身で、瓶ビールが進みすぎて困る一軒。" },
  { id:"popo",       name:"ポポー",              yomi:"POPO",              genre:"パン",   area:"西日暮里", access:"西日暮里駅 徒歩2分",     budget:800,  dish:"ポパイ",                   score:4, lat:35.731601, lng:139.765477, photo:"", memo:"早朝から並ぶサンドイッチ専門店。総菜系のポパイのバランスが良く、午前中には売り切れるので早起きが必須。" },
  { id:"think",      name:"Think",               yomi:"THINK",             genre:"パン",   area:"日暮里", access:"日暮里駅 徒歩10分",      budget:800,  dish:"ミルクフランス、カンパーニュ（高加水系）", score:5, lat:35.722399, lng:139.771017, photo:"", memo:"発酵バターの香りが強いブーランジェリー。ミルクフランスとカンパーニュ、両方頼むのが正解。" },
  { id:"tecona",     name:"テコナベーグルワークス", yomi:"TECONA BAGEL WORKS", genre:"パン", area:"代々木八幡", access:"代々木八幡駅 徒歩2分", budget:600,  dish:"あんこ系、惣菜系",         score:5, lat:35.668682, lng:139.689246, photo:"", memo:"常時50種類以上のベーグル専門店。惣菜系もあんこ系も食感が違って飽きない、代々木公園散歩帰りに寄る店。" },
  { id:"houtenkaku", name:"鵬天閣",              yomi:"HOUTENKAKU",        genre:"中華",   area:"横浜",   access:"元町中華街駅 徒歩4分",   budget:3000, dish:"焼き小籠包",               score:5, lat:35.443486, lng:139.646765, photo:"", memo:"横浜中華街の行列名物。1階で焼き小籠包を頬張ってから2階で飲茶、という使い方が正解。" },
  { id:"norizo",     name:"のり蔵",              yomi:"NORIZO",            genre:"パン",   area:"横浜",   access:"元町中華街駅 徒歩4分",   budget:800,  dish:"デニッシュ",               score:5, lat:35.443128, lng:139.648058, photo:"", memo:"中華街の裏路地にある和風パン屋。海苔や山椒を使った惣菜パンが独特で、他では味わえない一軒。" },
  { id:"dra7",       name:"新宿DRAセブン",       yomi:"DRA SEVEN",         genre:"居酒屋", area:"新宿",   access:"新宿駅西口 徒歩3分",     budget:3500, dish:"ピザ",                     score:4, lat:35.694329, lng:139.697713, photo:"", memo:"新宿西口のイタリアンバル。ピザの生地がもちっとしていて、ふらっと飲みに寄れる気安さがいい。" },
  { id:"imdonut",    name:"I'm donut？池袋",     yomi:"IM DONUT",          genre:"スイーツ", area:"池袋", access:"池袋駅東口 徒歩5分",     budget:500,  dish:"生ドーナツ",               score:4, lat:35.73177,  lng:139.714747, photo:"", memo:"生ドーナツ専門店。もちもち食感がクセになり、限定フレーバーが出るたびに並んでしまう。" },
  { id:"sigarashi",  name:"Boulangerie S.Igarashi", yomi:"BOULANGERIE S IGARASHI", genre:"パン", area:"木場", access:"木場駅 徒歩10分",  budget:1000, dish:"ハード系＆高加水（春のイチゴ）", score:5, lat:35.673774, lng:139.805345, photo:"", memo:"完全整理券制の人気店。ハード系のザクモチ食感が強烈で、季節限定のイチゴ系は特に狙い目。" },
  { id:"hiiragi",    name:"ひいらぎ",            yomi:"HIIRAGI",           genre:"和菓子", area:"恵比寿", access:"恵比寿駅東口 徒歩2分",   budget:300,  dish:"たい焼き",                 score:5, lat:35.647664, lng:139.711601, photo:"", memo:"恵比寿駅からすぐのたい焼き専門店。30分かけて焼き上げるだけあって皮が薄くパリッとし、あんこまで温かい。" },

  /* 2回目・11〜20件目 */
  { id:"nakayoshi",        name:"土鍋ご飯なかよし",    yomi:"NAKAYOSHI",            genre:"和食",   area:"恵比寿", access:"恵比寿駅 徒歩5分",             budget:3500, dish:"定食",           score:4, lat:35.647775, lng:139.70829,  photo:"", memo:"恵比寿西の路地にある土鍋炊きごはん専門店。出汁から手をかけた定食で、おこげまで美味しくよそってくれる。" },
  { id:"parklet",          name:"Parklet",             yomi:"PARKLET",              genre:"パン",   area:"日本橋", access:"三越前駅 徒歩7分",             budget:1200, dish:"トースト",       score:4, lat:35.686987, lng:139.778889, photo:"", memo:"日本橋の公園に面したベーカリーカフェ。朝の光が気持ちよく、厚切りトーストは焼き加減が絶妙。" },
  { id:"takamaru",         name:"タカマル鮮魚店",      yomi:"TAKAMARU SENGYOTEN",   genre:"居酒屋", area:"新宿",   access:"西武新宿駅 徒歩7分",           budget:4500, dish:"刺盛",           score:4, lat:35.695363, lng:139.700052, photo:"", memo:"築地直送の鮮魚を仲卸価格で。刺身の盛り合わせが厚切りで、日本酒がどんどん進む店。" },
  { id:"kameido-gyoza",    name:"亀戸ぎょうざ",        yomi:"KAMEIDO GYOZA",        genre:"中華",   area:"両国",   access:"両国駅 徒歩3分",               budget:2000, dish:"ぎょうざ",       score:4, lat:35.693775, lng:139.792689, photo:"", memo:"1953年創業の老舗の支店。パリッと焼けた餃子を、瓶ビール片手に何皿でもいける安さ。" },
  { id:"kameshige",        name:"濃厚タンメンかめしげ", yomi:"KAMESHIGE",            genre:"ラーメン", area:"亀戸", access:"亀戸駅 徒歩3分",               budget:800,  dish:"濃厚タンメン",   score:5, lat:35.696101, lng:139.824939, photo:"", memo:"野菜どっさりの濃厚タンメン専門店。シャキシャキ野菜と平打ち麺にスープがよく絡み、食べ応え十分。" },
  { id:"shinonome",        name:"菓子屋シノノメ",      yomi:"SHINONOME",            genre:"スイーツ", area:"蔵前", access:"蔵前駅 徒歩5分",               budget:800,  dish:"スコーン",       score:4, lat:35.705432, lng:139.790312, photo:"", memo:"蔵前の焼き菓子テイクアウト専門店。スコーンの生地が軽く、コーヒーのお供にちょうどいい。" },
  { id:"dandelion-kuramae", name:"ダンデライオン・チョコレート ファクトリー＆カフェ", yomi:"DANDELION CHOCOLATE", genre:"スイーツ", area:"蔵前", access:"蔵前駅 徒歩1分", budget:1500, dish:"チョコドリンク", score:5, lat:35.703807, lng:139.789697, photo:"", memo:"サンフランシスコ発Bean to Barの日本1号店。チョコドリンクの濃度が高く、1階のファクトリー見学も楽しい。" },
  { id:"en-kuramae",       name:"en",                  yomi:"EN",                   genre:"スイーツ", area:"蔵前", access:"蔵前駅 徒歩1分",               budget:1200, dish:"ドリンク",       score:4, lat:35.703682, lng:139.79181,  photo:"", memo:"蔵前駅徒歩1分の多層階カフェ。ドリンクの見た目が華やかで、屋上のガーデンスペースまで居心地がいい。" },
  { id:"mclean",           name:"McLean-OLD FASHIONED DINER-", yomi:"MCLEAN",       genre:"バーガー・肉料理", area:"蔵前", access:"蔵前駅 徒歩2分",       budget:2500, dish:"ハンバーガー",   score:4, lat:35.703448, lng:139.791513, photo:"", memo:"蔵前を代表するグルメバーガー専門店。パティがジューシーで、ダイナー然とした内装も雰囲気満点。" },
  { id:"banryu",           name:"新御茶ノ水 萬龍(まんりゅう)", yomi:"BANRYU",       genre:"中華",   area:"神田",   access:"新御茶ノ水駅 徒歩0分",         budget:1500, dish:"チャーハン",     score:4, lat:35.696932, lng:139.765432, photo:"", memo:"新御茶ノ水駅から徒歩0分の中華。チャーハンのパラパラ具合が見事で、仕事帰りにサクッと寄れる。" },

  /* 3回目・21〜30件目 */
  { id:"jazzybeats",      name:"Ramen Jazzy Beats",   yomi:"RAMEN JAZZY BEATS", genre:"ラーメン", area:"中目黒", access:"中目黒駅 徒歩2分",     budget:1500, dish:"SIO味玉、昆布水つけ麺醤油", score:4, lat:35.642539, lng:139.697251, photo:"", memo:"中目黒高架下の煮干しラーメン。整理券制で並ぶが、香り高いスープが待った甲斐を感じさせる。" },
  { id:"azoto",           name:"AZOTO DAIKANYAMA",    yomi:"AZOTO DAIKANYAMA",  genre:"スイーツ", area:"代官山", access:"代官山駅 徒歩3分",     budget:2500, dish:"パフェ",           score:5, lat:35.649739, lng:139.702687, photo:"", memo:"代官山のパフェとパスタの店。2025年に移転リニューアルしたばかりで、パフェの見た目の華やかさが写真映え。" },
  { id:"liber",           name:"果実園リーベル",       yomi:"LIBER",             genre:"スイーツ", area:"東京",   access:"東京駅 構内",           budget:2200, dish:"フルーツサンド、パフェ", score:4, lat:35.682111, lng:139.769159, photo:"", memo:"東京駅グランスタのフルーツパーラー。イチゴパフェが定番で、新幹線待ちの合間にも寄れる立地の良さ。" },
  { id:"crane",           name:"BURGER & MILKSHAKE CRANE", yomi:"CRANE",        genre:"バーガー・肉料理", area:"上野", access:"上野広小路駅 徒歩5分", budget:1500, dish:"チリビーンズバーガー", score:4, lat:35.704796, lng:139.771678, photo:"", memo:"上野・御徒町のグルメバーガー専門店。あふれるチーズのチリビーンズバーガーが名物で、クラフトコーラも合う。" },
  { id:"sakamoto-shoten", name:"大衆酒場 坂本商店",    yomi:"SAKAMOTO SHOTEN",   genre:"居酒屋", area:"門前仲町", access:"門前仲町駅 徒歩1分",  budget:3500, dish:"ハムカツ、刺身",   score:5, lat:35.671933, lng:139.797131, photo:"", memo:"門前仲町の家庭料理を再構築した大衆酒場。名物のミルフィーユチーズインハムカツが遊び心たっぷり。" },
  { id:"viron",           name:"VIRON",               yomi:"VIRON",             genre:"スイーツ", area:"渋谷",   access:"渋谷駅 徒歩7分",       budget:800,  dish:"クレープ",         score:4, lat:35.661061, lng:139.696831, photo:"", memo:"エシレバターで焼くテイクアウト専門のクレープ。渋谷でこの生地の香りに勝るクレープはなかなか無い。" },
  { id:"sanbee-jinbocho", name:"焼き鳥とワイン＋ビストロおでん 3B 神保町", yomi:"SUN BEE JINBOCHO", genre:"居酒屋", area:"神保町", access:"神保町駅 徒歩すぐ", budget:4500, dish:"おでん", score:4, lat:35.696663, lng:139.759225, photo:"", memo:"神保町の焼き鳥とビストロおでんの二刀流。鶏ガラだしのおでんがフレンチ風のひと工夫で新鮮。" },
  { id:"dolce-tacubo",    name:"DOLCE TACUBO CAFFE",  yomi:"DOLCE TACUBO CAFFE", genre:"スイーツ", area:"虎ノ門", access:"虎ノ門ヒルズ駅 徒歩0分", budget:1000, dish:"ソフトクリーム", score:5, lat:35.667713, lng:139.747907, photo:"", memo:"虎ノ門ヒルズ直結、ミシュラン店監修のドルチェをテイクアウトできるカフェ。ソフトクリームの濃厚さが段違い。" },
  { id:"shugo",           name:"麺屋 周郷",            yomi:"SHUGO",             genre:"ラーメン", area:"新橋",   access:"新橋駅 徒歩3分",       budget:1500, dish:"つけ麺",           score:4, lat:35.664557, lng:139.757531, photo:"", memo:"新橋のつけ麺専門店。特製の〆でスープを一滴も残さず飲み干せる、〆まで楽しいつけ麺。" },
  { id:"ayagawa",         name:"手打 親鶏中華そば 綾川", yomi:"AYAGAWA",          genre:"ラーメン", area:"恵比寿", access:"恵比寿駅東口 徒歩3分", budget:1200, dish:"鳥中華そば",       score:4, lat:35.646605, lng:139.713662, photo:"", memo:"恵比寿の親鶏だし中華そば。風味とうま味に奥行きがあり、夏は冷やし中華そばも捨てがたい。" },

  /* 4回目・31〜40件目 */
  { id:"mugibagel",     name:"mugibagel",           yomi:"MUGI BAGEL",       genre:"パン",   area:"目黒",   access:"目黒駅 徒歩3分",       budget:700,  dish:"栗",                 score:4, lat:35.634175, lng:139.713416, photo:"", memo:"目黒駅前のベーグル専門店。むぎゅもち食感がクセになり、栗フレーバーの季節限定が特に人気。" },
  { id:"andycoffee",    name:"ANDY COFFEE",         yomi:"ANDY COFFEE",      genre:"スイーツ", area:"代官山", access:"代官山駅 徒歩4分",     budget:800,  dish:"チョコドーナツ",     score:4, lat:35.650928, lng:139.703892, photo:"", memo:"代官山のオールドファッションドーナツ専門店。アートなカフェ空間で、揚げたてドーナツとコーヒーが染みる。" },
  { id:"henrys-burger", name:"ヘンリーズ バーガー 代官山", yomi:"HENRYS BURGER", genre:"バーガー・肉料理", area:"代官山", access:"代官山駅 徒歩3分", budget:1500, dish:"ビーフ",             score:4, lat:35.647391, lng:139.70216,  photo:"", memo:"炭火焼肉店が手がけるハンバーガー。一頭買いの端材をパティにしていて、店内4席の食べ歩き前提が潔い。" },
  { id:"doughist",      name:"dough-ist（ドウイスト）", yomi:"DOUGH IST",     genre:"パン",   area:"笹塚",   access:"笹塚駅 徒歩10分",      budget:600,  dish:"ドーナツ、ジャンボンブール", score:4, lat:35.678678, lng:139.66837,  photo:"", memo:"笹塚の湯種パン専門店。もっちり食感が独特で、ドーナツとジャンボンブールを両方頼みたくなる。" },
  { id:"chops",         name:"まぜそば 油そば ラーメン 渋谷 チョップス", yomi:"CHOPS", genre:"ラーメン", area:"渋谷", access:"渋谷駅 徒歩3分",  budget:900,  dish:"二郎系油そば",       score:5, lat:35.659924, lng:139.699034, photo:"", memo:"渋谷センター街の二郎系油そば。深夜まで営業していて、〆の一杯にちょうどいい量とコスパ。" },
  { id:"lubina",        name:"Seafood & Tapas LUBINA", yomi:"LUBINA",         genre:"洋食",   area:"日比谷", access:"日比谷駅 徒歩1分",     budget:6500, dish:"パエリア",           score:4, lat:35.67427,  lng:139.759278, photo:"", memo:"東京ミッドタウン日比谷のスペイン料理店。パエリアの魚介出汁が濃く、カバやワインとの相性も良い。" },
  { id:"bubuka",        name:"らーめん専門店ぶぶか 吉祥寺北口店", yomi:"BUBUKA", genre:"ラーメン", area:"吉祥寺", access:"吉祥寺駅北口 徒歩5分", budget:900,  dish:"油そば黒",           score:4, lat:35.703893, lng:139.578312, photo:"", memo:"吉祥寺の油そば専門店。1995年創業、手作りのタレとチャーシューで、黒い油そばのコクが強い。" },
  { id:"soleil",        name:"それいゆ",             yomi:"SOLEIL",           genre:"パン",   area:"西荻窪", access:"西荻窪駅南口 徒歩3分", budget:800,  dish:"厚切りトースト",     score:4, lat:35.70344,  lng:139.601316, photo:"", memo:"西荻窪で60年続く老舗喫茶店。厚切りトーストが看板メニューで、水出し珈琲をのんびり眺めるモーニングが良い。" },
  { id:"asari-shokudo", name:"あさり食堂",           yomi:"ASARI SHOKUDO",    genre:"和食",   area:"北千住", access:"北千住駅 徒歩3分",     budget:4500, dish:"煮込みハンバーグ定食", score:5, lat:35.74791,  lng:139.803447, photo:"", memo:"北千住の路地裏にある古民家食堂。ご飯と味噌汁がおかわり自由で、煮込みハンバーグの量が下町らしい。" },
  { id:"kanmidou",      name:"カフェ 寛味堂",        yomi:"KANMIDO",          genre:"スイーツ", area:"北千住", access:"北千住駅 徒歩5分",     budget:2500, dish:"モンブランパフェ",   score:4, lat:35.752578, lng:139.804911, photo:"", memo:"北千住の行列古民家カフェ。モンブランパフェは栗の存在感が強く、待ってでも食べる価値がある。" },

  /* 5回目・41〜50件目 */
  { id:"breadworks",   name:"ブレッドワークス 表参道店", yomi:"BREADWORKS",   genre:"パン",   area:"渋谷",   access:"表参道駅 徒歩2分",     budget:900,  dish:"ソーセージエピ、ドーナツ", score:4, lat:35.667869, lng:139.710923, photo:"", memo:"表参道の人気カフェ併設ベーカリー。ソーセージエピの塩気とパリッとした皮が朝から効く。" },
  { id:"nakajima",     name:"麺飯食堂 なかじま",    yomi:"NAKAJIMA",         genre:"中華",   area:"渋谷",   access:"渋谷駅 徒歩5分",       budget:900,  dish:"担々麵セット",       score:4, lat:35.657153, lng:139.703816, photo:"", memo:"渋谷センター街の中華食堂。現金・食票制で安く、担々麺のセットが特にコスパ良し。" },
  { id:"shimodaryu",   name:"下田流",              yomi:"SHIMODA RYU",      genre:"パン",   area:"高島平", access:"高島平駅 徒歩7分",     budget:800,  dish:"チョコリュスティク、黒蜜きなこベーグル、明太子", score:5, lat:35.791113, lng:139.658322, photo:"", memo:"高島平の加水率135%パン屋。生食パンの概念が変わる、と評判の一軒で明太子パンも人気。" },
  { id:"kitchen-abc",  name:"キッチンABC",         yomi:"KITCHEN ABC",      genre:"洋食",   area:"池袋",   access:"池袋駅 徒歩1分",       budget:900,  dish:"オリエンタルライス＆黒カレー", score:4, lat:35.726969, lng:139.712529, photo:"", memo:"昭和44年創業の老舗洋食店。黒カレーのコクが強く、オリエンタルライスとの組み合わせが独特。" },
  { id:"bouquet",      name:"bouquet",             yomi:"BOUQUET",          genre:"パン",   area:"馬喰町", access:"東日本橋駅 徒歩1分",   budget:1200, dish:"ベーコンエッグサンド", score:4, lat:35.692114, lng:139.784096, photo:"", memo:"東日本橋のビーバーブレッド姉妹店カフェ。塩あんバタートーストが定番で、モーニングにちょうどいい。" },
  { id:"sudo",         name:"ブーランジェリー スドウ", yomi:"BOULANGERIE SUDO", genre:"パン", area:"松陰神社前", access:"松陰神社前駅 徒歩1分", budget:800,  dish:"デニッシュ、フォカッチャ", score:5, lat:35.643699, lng:139.654905, photo:"", memo:"食べログパン百名店4年連続受賞の実力店。フルーツデニッシュの萌え断がSNS映えする一枚。" },
  { id:"wise",         name:"神田ラーメン わいず",  yomi:"WISE",             genre:"ラーメン", area:"神田",   access:"神田駅西口 徒歩1分",   budget:1000, dish:"家系",               score:5, lat:35.691822, lng:139.770932, photo:"", memo:"神田駅西口徒歩1分の家系ラーメン。カウンターのみの小型店で、朝から並ぶ常連も多い。" },
  { id:"kitagin",      name:"道産酒場 きたぎん！",  yomi:"KITAGIN",          genre:"居酒屋", area:"有楽町", access:"有楽町駅日比谷口 徒歩5分", budget:2500, dish:"刺身、焼き魚",     score:5, lat:35.672863, lng:139.760548, photo:"", memo:"北海道食材の大衆酒場。刺身や焼き魚の鮮度が良く、駅近で入りやすい安心感がある。" },
  { id:"baden-baden",  name:"バーデン・バーデン 有楽町店", yomi:"BADEN BADEN", genre:"居酒屋", area:"有楽町", access:"日比谷駅 徒歩2分",     budget:4000, dish:"ポテト、ソーセージ", score:4, lat:35.672962, lng:139.760616, photo:"", memo:"有楽町高架下のドイツビアレストラン。ホフブロイの生ビールに、ポテトとソーセージの盛り合わせがよく合う。" },
  { id:"atelier-kohta", name:"アトリエ コータ",     yomi:"ATELIER KOHTA",    genre:"スイーツ", area:"神楽坂", access:"神楽坂駅 徒歩1分",     budget:1700, dish:"パフェ",             score:5, lat:35.703643, lng:139.736388, photo:"", memo:"神楽坂のカウンターデセール専門店。目の前で組み立てられる芸術的なパフェは、待ってでも見る価値あり。" },

  /* 6回目・51〜60件目 */
  { id:"toriman",        name:"鳥万 本店",           yomi:"TORIMAN",         genre:"居酒屋", area:"蒲田",   access:"蒲田駅西口 徒歩2分",   budget:3000, dish:"鶏のから揚げ",       score:4, lat:35.562754, lng:139.7122,   photo:"", memo:"蒲田の老舗大衆酒場。4階建て170席、100品以上のメニューがあり、鶏のから揚げは間違いない一皿。" },
  { id:"ryuho",          name:"龍朋",                yomi:"RYUHO",           genre:"中華",   area:"神楽坂", access:"神楽坂駅 徒歩2分",     budget:900,  dish:"炒飯、回鍋肉",       score:5, lat:35.703869, lng:139.734432, photo:"", memo:"神楽坂の町中華。1978年創業でチャーハンが看板、値上げの時代に逆行する爆盛りが名物。" },
  { id:"fight-gyoza",    name:"ファイト餃子",         yomi:"FIGHT GYOZA",     genre:"中華",   area:"巣鴨",   access:"巣鴨駅 徒歩0分",       budget:2500, dish:"餃子",               score:4, lat:35.737246, lng:139.733836, photo:"", memo:"巣鴨駅前のホワイト餃子系列。パリッと揚げ焼きにした皮の食感が独特で、ビール片手に何枚でもいける。" },
  { id:"sennari-monaka", name:"千成もなか本舗 巣鴨店", yomi:"SENNARI MONAKA",  genre:"和菓子", area:"巣鴨",   access:"巣鴨駅 徒歩2分",       budget:500,  dish:"あんバタ/あんクリどら焼き", score:5, lat:35.7337,   lng:139.737746, photo:"", memo:"巣鴨の老舗もなか屋が手がけるどら焼き。あんバタとあんクリの2種、皮のパリッと感が絶妙。" },
  { id:"mizuno",         name:"元祖塩大福 みずの",    yomi:"MIZUNO",          genre:"和菓子", area:"巣鴨",   access:"巣鴨駅 徒歩5分",       budget:300,  dish:"塩大福、草餅",       score:5, lat:35.735138, lng:139.736177, photo:"", memo:"昭和12年創業、塩大福の元祖。甘さと塩気の黄金比が中毒性高く、巣鴨名物の代名詞。" },
  { id:"paddlers",       name:"パドラーズコーヒー",   yomi:"PADDLERS COFFEE", genre:"パン",   area:"幡ヶ谷", access:"幡ヶ谷駅 徒歩4分",     budget:800,  dish:"ホットドッグ",       score:4, lat:35.674911, lng:139.678575, photo:"", memo:"幡ヶ谷の隠れ家的カフェ。西原商店街の外れにあり、ホットドッグとコーヒーの組み合わせがちょうどいい。" },
  { id:"equal",          name:"Equal",               yomi:"EQUAL",           genre:"スイーツ", area:"幡ヶ谷", access:"幡ヶ谷駅 徒歩5分",     budget:600,  dish:"シュークリーム、フレンチクルーラ", score:4, lat:35.673699, lng:139.682212, photo:"", memo:"幡ヶ谷のフランス菓子店。ふわふわのシュークリームとレアな焼き加減のチーズケーキが看板。" },
  { id:"katane",         name:"カタネベーカリー",     yomi:"KATANE BAKERY",   genre:"パン",   area:"代々木上原", access:"代々木上原駅 徒歩5分", budget:800,  dish:"パニー二",           score:4, lat:35.674886, lng:139.678914, photo:"", memo:"代々木上原と幡ヶ谷の間にあるパン好き御用達。1階がパン屋、地下がカフェの2層構造。" },
  { id:"mitoya",         name:"ランチハウス ミトヤ",  yomi:"MITOYA",          genre:"洋食",   area:"池袋",   access:"池袋駅 徒歩3分",       budget:900,  dish:"焼肉＋メンチカツ",   score:5, lat:35.730908, lng:139.706473, photo:"", memo:"池袋西口の定食屋。ランチハウスの名前だが夜も営業し、特製タレの焼肉とメンチが名物のコスパ店。" },
  { id:"chorin",         name:"味噌らーめん屋 ちょりん", yomi:"CHORIN",         genre:"ラーメン", area:"高田馬場", access:"高田馬場駅早稲田口 徒歩9分", budget:1150, dish:"味噌ラーメン",     score:4, lat:35.714626, lng:139.710105, photo:"", memo:"高田馬場の濃厚味噌ラーメン。荻窪の名店で修業した店主の一杯で、体がぽかぽか温まる。" },

  /* 7回目・61〜70件目 */
  { id:"es-feuilletage",       name:"es feuilletage｜BAKERY", yomi:"ES FEUILLETAGE", genre:"パン", area:"押上", access:"とうきょうスカイツリー駅 徒歩3分", budget:800, dish:"イチゴとカカオ", score:5, lat:35.709125, lng:139.81081,  photo:"", memo:"押上のBoulangerie S.Igarashi 2号店。バターと小麦にこだわったクロワッサンが看板で、イチゴとカカオの組み合わせが季節限定。" },
  { id:"akebono",              name:"とんかつ あけぼの",    yomi:"AKEBONO",         genre:"和食", area:"有楽町", access:"有楽町駅 徒歩2分",       budget:1000, dish:"カツ丼",           score:4, lat:35.674839, lng:139.764409, photo:"", memo:"東京交通会館地下のとんかつ。粗挽き生パン粉の衣がさくさくで、昼夜問わず客足が絶えない。" },
  { id:"samurai-shibuya",      name:"横浜家系らーめん 侍 渋谷本店", yomi:"SAMURAI SHIBUYA", genre:"ラーメン", area:"渋谷", access:"渋谷駅 徒歩0分", budget:1000, dish:"家系ラーメン",     score:4, lat:35.658852, lng:139.699105, photo:"", memo:"渋谷駅直結の家系ラーメン。井の頭線改札を出てすぐで、〆の一杯としても優秀な立地。" },
  { id:"karasumori-hyakuyaku", name:"烏森百薬",            yomi:"KARASUMORI HYAKUYAKU", genre:"居酒屋", area:"新橋", access:"新橋駅 徒歩1分",   budget:3500, dish:"おでん",           score:5, lat:35.666511, lng:139.756343, photo:"", memo:"烏森神社そばの和風居酒屋。1階カウンター、2階は貸切もできて、おでんが染みる寒い日にちょうどいい。" },
  { id:"natura",               name:"NATURA",              yomi:"NATURA",          genre:"イタリアン", area:"武蔵小杉", access:"武蔵小杉駅 徒歩2分", budget:4500, dish:"カルパッチョ、ペペロンチーノ", score:5, lat:35.575256, lng:139.658462, photo:"", memo:"武蔵小杉のイタリアン酒場。分厚いカルパッチョとしらすのペペロンチーノが名物で、魚介の鮮度が良い。" },
  { id:"bondy",                name:"ボンディ",            yomi:"BONDY",           genre:"カレー", area:"神保町", access:"神保町駅 徒歩1分",     budget:1800, dish:"ビーフカレー",     score:5, lat:35.695446, lng:139.75824,  photo:"", memo:"神保町の元祖欧風カレー。神田カレーグランプリのグランプリ受賞歴を持つ、ドロッとした濃厚ルーが特徴。" },
  { id:"hakata-kazu",          name:"博多ラーメン 和",      yomi:"HAKATA RAMEN KAZU", genre:"ラーメン", area:"赤坂", access:"赤坂駅 徒歩4分",     budget:1000, dish:"とんこつラーメン", score:4, lat:35.674801, lng:139.733908, photo:"", memo:"赤坂の博多とんこつラーメン。極細麺を福岡から直送し、替え玉無料・高菜のせ放題が嬉しい。" },
  { id:"amam-dacotan",         name:"AMAM DACOTAN 表参道",  yomi:"AMAM DACOTAN",    genre:"パン",   area:"表参道", access:"表参道駅 徒歩1分",     budget:1500, dish:"食パン、惣菜パン", score:4, lat:35.664406, lng:139.711241, photo:"", memo:"表参道のベーカリーカフェブランド。惣菜パンからスイーツ系まで幅広く、朝のモーニングセットも人気。" },
  { id:"napule",               name:"ナプレ 南青山本店",    yomi:"NAPULE",          genre:"イタリアン", area:"表参道", access:"表参道駅 徒歩1分", budget:6000, dish:"生ハムとルッコラ", score:5, lat:35.663566, lng:139.712112, photo:"", memo:"南青山の薪窯ピッツェリア。生ハムとルッコラの組み合わせが定番で、記念日使いにも強い一軒。" },
  { id:"imdonut-gf",           name:"I'm donut？グルテンフリー渋谷青山通り", yomi:"IM DONUT GLUTEN FREE", genre:"スイーツ", area:"表参道", access:"渋谷駅 徒歩10分", budget:600, dish:"ドーナツ", score:4, lat:35.66088, lng:139.707597, photo:"", memo:"渋谷のグルテンフリードーナツ専門店。国産米粉のもちもち生地で、ヴィーガン対応も嬉しいリニューアル店。" },

  /* 8回目・71〜80件目 */
  { id:"manryu-tokyodome",      name:"新御茶ノ水萬龍 東京ドーム店", yomi:"MANRYU TOKYO DOME", genre:"中華", area:"後楽園", access:"水道橋駅 徒歩3分",   budget:2500, dish:"肉玉炒飯",     score:4, lat:35.703689, lng:139.752946, photo:"", memo:"東京ドームシティのネオ町中華。肉玉チャーハンが名物で、卵のふわふわ感と甘辛だれのバランスが良い。" },
  { id:"aubergine",             name:"オーベルジーヌ",       yomi:"AUBERGINE",       genre:"カレー", area:"新宿", access:"新宿御苑前駅 徒歩0分", budget:1800, dish:"ビーフカレー", score:5, lat:35.688267, lng:139.710036, photo:"", memo:"新宿御苑前のテイクアウト専門欧風カレー。日本ロケ弁大賞受賞の実力店で、ロケ弁として芸能人にも人気。" },
  { id:"le-bretagne",           name:"ル ブルターニュ 神楽坂店", yomi:"LE BRETAGNE",   genre:"洋食", area:"神楽坂", access:"牛込神楽坂駅 徒歩5分", budget:2500, dish:"ガレット",   score:3, lat:35.702147, lng:139.739816, photo:"", memo:"神楽坂のガレット専門店。日本初のそば粉クレープを掲げ、20種類以上のメニューから選べる。" },
  { id:"hidakaya-edogawabashi", name:"日高屋 江戸川橋店",     yomi:"HIDAKAYA",       genre:"中華", area:"江戸川橋", access:"江戸川橋駅 徒歩2分", budget:900,  dish:"汁なしそば",   score:2, lat:35.710125, lng:139.739017, photo:"", memo:"江戸川橋の熱烈中華食堂。深夜まで営業していて、汁なしそばがガッツリ系の締めにちょうどいい。" },
  { id:"agezuki",               name:"神楽坂とんかつ あげづき", yomi:"AGEZUKI",       genre:"和食", area:"神楽坂", access:"飯田橋駅 徒歩3分",   budget:1800, dish:"ロースカツ",   score:3, lat:35.702084, lng:139.745023, photo:"", memo:"神楽坂の食べログ百名店とんかつ。南の島豚を低温からじっくり揚げる、衣の薄さと肉の柔らかさが両立した一枚。" },
  { id:"eiraku",                name:"永楽",                 yomi:"EIRAKU",         genre:"中華", area:"大井町", access:"大井町駅 隣接",       budget:1200, dish:"もやしそば",   score:3, lat:35.607551, lng:139.735689, photo:"", memo:"大井町の昭和感漂う町中華。1953年創業3代目、もやしそばの焦がしネギの香りが変わらぬ味を守る。" },
  { id:"fuji-sushi",            name:"藤寿司",               yomi:"FUJI SUSHI",     genre:"寿司", area:"品川",   access:"品川駅 徒歩すぐ",     budget:6500, dish:"握り",         score:3, lat:35.629142, lng:139.742111, photo:"", memo:"品川駅前のすし処。個室・座敷ありで宴会にも対応でき、夜は握りでしっかりコースを楽しめる。" },
  { id:"shakeshack-yurakucho",  name:"シェイクシャック",     yomi:"SHAKE SHACK",    genre:"バーガー・肉料理", area:"有楽町", access:"有楽町駅 徒歩2分", budget:2200, dish:"バーガー",   score:3, lat:35.67675,  lng:139.763451, photo:"", memo:"東京国際フォーラム内のシェイクシャック。有楽町駅から近く、行列必至だが並ぶ価値のあるパティ。" },
  { id:"kairaku",               name:"開楽",                 yomi:"KAIRAKU",        genre:"中華", area:"池袋",   access:"池袋東口 徒歩1分",   budget:800,  dish:"ジャンボ餃子", score:3, lat:35.729305, lng:139.712948, photo:"", memo:"1954年創業、池袋東口すぐの老舗中華。名物のジャンボ餃子とセットメニューのコスパが光る。" },
  { id:"kosugi-curry",          name:"KOSUGI CURRY",         yomi:"KOSUGI CURRY",   genre:"カレー", area:"武蔵小杉", access:"武蔵小杉駅 徒歩5分", budget:1250, dish:"カレー",       score:3, lat:35.575176, lng:139.657326, photo:"", memo:"武蔵小杉の行列カレー店。13周年を迎える人気店で、スパイスの効いたルーが病みつきになる。" },

  /* 9回目・81〜90件目（ORDER BYの同着順不安定で漏れていた分をここで回収） */
  { id:"inamura-shozo",   name:"イナムラショウゾウ",   yomi:"INAMURA SHOZO",   genre:"スイーツ", area:"日暮里", access:"日暮里駅 徒歩2分",   budget:1500, dish:"モンブラン",   score:5, lat:35.727391, lng:139.769319, photo:"", memo:"谷中のチョコレート専門店。上野の山のモンブランがスペシャリテで、栗が旬の季節は限定の羽衣モンブランも登場。" },
  { id:"flourwater",      name:"flour+water 虎ノ門",   yomi:"FLOUR WATER",     genre:"パン",   area:"虎ノ門", access:"虎ノ門ヒルズ駅 徒歩0分", budget:3500, dish:"パンとブランチ", score:4, lat:35.667881, lng:139.74708,  photo:"", memo:"虎ノ門ヒルズのベーカリーカフェ。花に囲まれた空間で、パンと紅茶のスペシャルブランチが贅沢な休日になる。" },
  { id:"factory-labo-kanno", name:"Factory & Labo 神乃珈琲", yomi:"FACTORY LABO KANNO COFFEE", genre:"カフェ・喫茶", area:"学芸大学", access:"学芸大学駅東口 徒歩10分", budget:800, dish:"コーヒー", score:4, lat:35.628469, lng:139.694047, photo:"", memo:"目黒通り沿いの焙煎工場併設カフェ。工場のようなアイコニックな建物で、淹れたてのスペシャルティコーヒーが楽しめる。" },
  { id:"le-coussinet",    name:"ル・クシネ",           yomi:"LE COUSSINET",    genre:"スイーツ", area:"根津",   access:"根津駅 徒歩5分",     budget:700,  dish:"石窯シュー",   score:4, lat:35.720607, lng:139.763901, photo:"", memo:"根津の隠れ家パティスリー。石窯シューが名物で、賞味期限60秒と言われるほどの出来立てが売り。" },
  { id:"santora",         name:"三ん寅",               yomi:"SANTORA",         genre:"ラーメン", area:"江戸川橋", access:"江戸川橋駅 徒歩2分", budget:1200, dish:"味噌ラーメン", score:4, lat:35.708899, lng:139.730601, photo:"", memo:"江戸川橋のすみれ系味噌ラーメン。札幌の名店から暖簾分けした専門店で、行列必至の一杯。" },
  { id:"miharu",          name:"瞠 池袋本店",          yomi:"MIHARU",          genre:"ラーメン", area:"池袋",   access:"池袋東口 徒歩7分",   budget:900,  dish:"油そば",       score:4, lat:35.731704, lng:139.716489, photo:"", memo:"池袋の油そば専門店。比内地鶏を使った無化調の魚介系スープが特徴で、化調不使用にこだわる。" },
  { id:"niku-no-sato",    name:"肉のサトー",           yomi:"NIKU NO SATO",    genre:"バーガー・肉料理", area:"日暮里", access:"千駄木駅 徒歩5分", budget:300,  dish:"谷中メンチ",   score:4, lat:35.725483, lng:139.763243, photo:"", memo:"谷中銀座の精肉店。名物の谷中メンチと谷中コロッケを食べ歩きでほおばるのが谷中流。" },
  { id:"kameari-menchi",  name:"亀有メンチ",           yomi:"KAMEARI MENCHI",  genre:"和食",   area:"亀有",   access:"亀有駅 徒歩7分",     budget:300,  dish:"メンチカツ",   score:5, lat:35.765147, lng:139.848996, photo:"", memo:"亀有駅前アーケードのメンチカツ専門店。12種類のバリエーションがあり、テイクアウトも昼飲みも楽しめる。" },
  { id:"tomita-shokudo",  name:"松戸中華そば 富田食堂", yomi:"TOMITA SHOKUDO",  genre:"ラーメン", area:"松戸",   access:"松戸駅東口 徒歩2分", budget:1400, dish:"特製つけ麺", score:4, lat:35.783187, lng:139.901543, photo:"", memo:"松戸の地鶏中華そば。中華蕎麦とみ田系列で、和出汁ブレンドのスープと自家製麺のこだわりが光る。" },
  { id:"delimmo-azabudai", name:"パティスリー＆カフェ デリーモ 麻布台ヒルズ店", yomi:"DELIMMO AZABUDAI", genre:"スイーツ", area:"麻布台", access:"神谷町駅 直結", budget:2000, dish:"パフェ", score:4, lat:35.661966, lng:139.743451, photo:"", memo:"麻布台ヒルズのショコラティエが手がけるパティスリー。麻布台ヒルズ限定パフェが美しく、神谷町駅直結の好立地。" },
  { id:"kakan",           name:"かかん 富ヶ谷店",      yomi:"KAKAN",           genre:"中華",   area:"代々木八幡", access:"代々木公園駅 徒歩4分", budget:1380, dish:"麻婆豆腐",   score:5, lat:35.666436, lng:139.692397, photo:"", memo:"奥渋の中華食堂。屋台風のカジュアルな雰囲気で、辛さと痺れのバランスが絶妙な麻婆豆腐がやみつきになる。" },
  { id:"hakuginya",       name:"炭火焼専門食処 白銀屋 溜池分店", yomi:"HAKUGINYA", genre:"和食", area:"赤坂",   access:"溜池山王駅 近く",   budget:2500, dish:"さんま",       score:5, lat:35.671124, lng:139.741013, photo:"", memo:"溜池山王の炭火焼定食屋。トロサバの塩焼きが評判で、開店直後に行くのがおすすめの人気店。" },
  { id:"kintan",          name:"金舌",                 yomi:"KINTAN",          genre:"焼肉",   area:"赤坂",   access:"赤坂駅 徒歩2分",     budget:8000, dish:"熟成タン",     score:4, lat:35.674565, lng:139.73756,  photo:"", memo:"赤坂の熟成肉専門店。30日間熟成させた牛タン「金舌」が看板で、贅沢な一皿を求めるならここ。" },
  { id:"hitsumabushi-binchou", name:"ひつまぶし 名古屋 備長 丸ビル店", yomi:"HITSUMABUSHI BINCHOU", genre:"和食", area:"丸の内", access:"東京駅 徒歩0分", budget:7000, dish:"ひつまぶし", score:4, lat:35.681183, lng:139.76377, photo:"", memo:"丸ビル最上階のひつまぶし専門店。東京駅徒歩0分の立地で、名古屋の味を丸の内でしっかり楽しめる。" },
  { id:"commen-azabudai", name:"Comme'N TOKYO 麻布台ヒルズ店", yomi:"COMMEN AZABUDAI", genre:"パン", area:"麻布台", access:"六本木一丁目駅 徒歩2分", budget:800, dish:"パン", score:5, lat:35.663118, lng:139.745183, photo:"", memo:"パンの世界大会優勝ブーランジェが手がける麻布台ヒルズ店。種類豊富でリピート必至の一軒。" },
  { id:"menya-nakagawa",  name:"MENYA NAKAGAWA",       yomi:"MENYA NAKAGAWA",  genre:"ラーメン", area:"池袋",   access:"池袋西口 徒歩4分",   budget:2000, dish:"鶏魚介つけ麺", score:4, lat:35.733583, lng:139.708123, photo:"", memo:"池袋西口の鶏魚介つけ麺店。焙煎胚芽香る太麺と濃厚スープ、〆のチーズリゾットまで抜かりない。" },
];

/* ---- 以下は SHOPS から自動で導出されるもの。触らなくて大丈夫です ---- */

export const GENRE_LIST = [...new Set(SHOPS.map((s) => s.genre))];
export const AREA_LIST  = [...new Set(SHOPS.map((s) => s.area))];

export const iconOf  = (g: string) => GENRES[g as Genre]?.icon ?? "🍽";
export const onomaOf = (g: string) => GENRES[g as Genre]?.o ?? "うまい";
export const kanjiOf = (g: string) => GENRES[g as Genre]?.k ?? "旨";
export type Tone = "shu" | "ai" | "matcha" | "karashi";
export const toneOf  = (g: string): Tone => (GENRES[g as Genre]?.tone as Tone) ?? "shu";

/** 掲載番号（No.001〜）。SHOPS の並び順で振る */
export const noOf = (id: string) =>
  String(SHOPS.findIndex((s) => s.id === id) + 1).padStart(3, "0");

/** 1200 → 「千二百円」。短冊メニュー用の漢数字 */
export const kansuji = (n: number) => {
  const d = "〇一二三四五六七八九";
  const under = (x: number) => {
    let s = "";
    for (const [v, u] of [[1000, "千"], [100, "百"], [10, "十"]] as const) {
      const q = Math.floor(x / v); x %= v;
      if (q) s += (q > 1 ? d[q] : "") + u;
    }
    return s + (x ? d[x] : "");
  };
  const man = Math.floor(n / 10000), rest = n % 10000;
  return (man ? under(man) + "万" : "") + under(rest) + "円";
};

/** 予算帯。詳細検索の絞り込みに使います */
export const BUDGET_BANDS = [
  { id: "b1", label: "〜2,000円",       min: 0,     max: 2000 },
  { id: "b2", label: "2,000〜5,000円",  min: 2000,  max: 5000 },
  { id: "b3", label: "5,000〜10,000円", min: 5000,  max: 10000 },
  { id: "b4", label: "10,000円〜",      min: 10000, max: Infinity },
] as const;

/** 推し度（score）の呼び方。数字だけだと伝わりにくいので言葉を添える */
export const SCORE_LABEL = {
  5: "激推し",
  4: "推し",
  3: "好き",
  2: "ふつう",
  1: "いまいち",
} as const;
export const SCORE_MAX = 5;
export const scoreLabel = (n: number) => SCORE_LABEL[n as keyof typeof SCORE_LABEL] ?? "";

export const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

export const bandOf = (budget: number) =>
  BUDGET_BANDS.find((b) => budget >= b.min && budget < b.max)?.id ?? "b4";

export const mapsUrl = (s: Shop) =>
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${s.name} ${s.area}`);
