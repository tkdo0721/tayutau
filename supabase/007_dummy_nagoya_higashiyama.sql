-- ============================================================
-- ダミーデータ投入 — 名古屋市千種区・東山エリア
-- 中心: 35.16844, 136.96327
-- 東山公園・本山・名古屋大学周辺
-- Supabase SQL Editor で実行してください
-- ============================================================

-- === 投稿（距離バリエーション） ===

-- ■ すぐそば（0〜50m）
INSERT INTO posts (text, lat, lng) VALUES
('東山動物園のイケメンゴリラ、シャバーニに会いに来た。何回見てもかっこいい。', 35.16850, 136.96330),
('この坂道、毎日登ってるけど慣れない。でも上からの景色が好きで続けてる。', 35.16840, 136.96320),
('本山の交差点、四方向から大学生が来るのおもしろい。みんなイヤホンしてる。', 35.16838, 136.96340),
('ここのベンチでぼーっとしてると、名古屋に住んでてよかったと思う瞬間がある。', 35.16848, 136.96315),
('秋の東山、紅葉がすごかった。来年もまた来よう。', 35.16855, 136.96335);

-- ■ 近く（50〜150m）
INSERT INTO posts (text, lat, lng) VALUES
('本山のカフェ巡り、一生かかっても制覇できない気がする。また新しい店できてる。', 35.16750, 136.96450),
('名大の銀杏並木、イチョウの匂いはすごいけど景色は最高。', 35.16950, 136.96200),
('このあたりの古本屋、掘り出し物が多い。学生街ならでは。', 35.16900, 136.96400),
('東山線、朝の本山→栄は戦場。でも名古屋の地下鉄は時間通りなのがえらい。', 35.16780, 136.96250),
('この住宅街、夜になると星が少し見える。名古屋の真ん中なのに。', 35.16800, 136.96180);

-- ■ 中距離（150〜300m）
INSERT INTO posts (text, lat, lng) VALUES
('東山のスカイタワー、夜景がきれい。デートスポットだけど一人で来てもいい。', 35.16600, 136.96500),
('名大坂、チャリで登るの地獄。電動アシスト買ったら人生変わった。', 35.17050, 136.96100),
('この辺にある味噌煮込みうどんの店、観光客には教えたくないくらいうまい。', 35.17000, 136.96550),
('千種区に引っ越してきて3年。栄にも名駅にも出やすいし、静かだし、最高の立地。', 35.16650, 136.96150),
('散歩してたら野良猫の集会に遭遇した。5匹くらい集まってた。', 35.16700, 136.96600);

-- ■ 遠め（300〜500m）
INSERT INTO posts (text, lat, lng) VALUES
('覚王山の日泰寺の参道、毎月21日の縁日が楽しい。食べ歩き最高。', 35.16500, 136.96000),
('星ヶ丘テラスでお茶してから東山まで歩くの、休日の定番ルート。', 35.16600, 136.96800),
('名古屋って何もないって言われるけど、住んでみるとちょうどいい街だと気づく。', 35.17200, 136.96700),
('平和公園の墓地を抜けると猫ヶ洞池。名古屋の秘境感ある。', 35.17250, 136.96100),
('この辺の坂の多さ、名古屋が台地だって実感する。毎日が筋トレ。', 35.16450, 136.96500);


-- === コメント（投稿に紐づく） ===

-- シャバーニにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'シャバーニのグッズ、売店で買ってしまった。', 35.16852, 136.96332
FROM posts WHERE text LIKE '東山動物園のイケメンゴリラ%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '隣にいたおばあちゃんが「男前やねぇ」って言ってて笑った。', 35.16848, 136.96328
FROM posts WHERE text LIKE '東山動物園のイケメンゴリラ%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'コアラもいいけど、やっぱりシャバーニが王者。', 35.16845, 136.96335
FROM posts WHERE text LIKE '東山動物園のイケメンゴリラ%' LIMIT 1;

-- 本山カフェにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '末盛通のあの店知ってる？焙煎のいい香りがする。', 35.16755, 136.96455
FROM posts WHERE text LIKE '本山のカフェ巡り%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '名古屋の喫茶文化、本山で一番感じる。', 35.16748, 136.96448
FROM posts WHERE text LIKE '本山のカフェ巡り%' LIMIT 1;

-- 名大銀杏にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '11月の名大キャンパス、写真撮る人多すぎ。でもわかる。', 35.16955, 136.96205
FROM posts WHERE text LIKE '名大の銀杏並木%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '銀杏拾ってるおじさんいつもいる。プロだと思う。', 35.16948, 136.96195
FROM posts WHERE text LIKE '名大の銀杏並木%' LIMIT 1;

-- 坂道にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '同じく。でもこの坂のおかげで足腰強くなった気がする。', 35.16842, 136.96322
FROM posts WHERE text LIKE 'この坂道、毎日登ってる%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '雨の日のこの坂、滑るから気をつけて。', 35.16838, 136.96318
FROM posts WHERE text LIKE 'この坂道、毎日登ってる%' LIMIT 1;

-- ベンチにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'わかる。この辺の空気、なんか違う。', 35.16850, 136.96318
FROM posts WHERE text LIKE 'ここのベンチでぼーっと%' LIMIT 1;

-- スカイタワーにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '一人スカイタワー仲間がいて嬉しい。', 35.16605, 136.96505
FROM posts WHERE text LIKE '東山のスカイタワー%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '夕方から夜に変わる瞬間が一番きれい。', 35.16598, 136.96498
FROM posts WHERE text LIKE '東山のスカイタワー%' LIMIT 1;

-- 味噌煮込みうどんにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '教えて。本気で教えて。', 35.17005, 136.96555
FROM posts WHERE text LIKE 'この辺にある味噌煮込みうどんの店%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '名古屋めし、結局味噌煮込みが最強だと思う。', 35.16998, 136.96548
FROM posts WHERE text LIKE 'この辺にある味噌煮込みうどんの店%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '観光客に教えたくないの、めっちゃわかる。', 35.17002, 136.96542
FROM posts WHERE text LIKE 'この辺にある味噌煮込みうどんの店%' LIMIT 1;

-- 覚王山にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '21日の縁日、焼きそばの屋台がうますぎる。', 35.16505, 136.96005
FROM posts WHERE text LIKE '覚王山の日泰寺%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '参道のアンティークショップも好き。掘り出し物ある。', 35.16498, 136.95998
FROM posts WHERE text LIKE '覚王山の日泰寺%' LIMIT 1;

-- 名古屋何もないにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '住みやすさなら日本一だと思ってる。', 35.17205, 136.96705
FROM posts WHERE text LIKE '名古屋って何もないって言われるけど%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '「ちょうどいい」が一番難しいのにね。', 35.17198, 136.96695
FROM posts WHERE text LIKE '名古屋って何もないって言われるけど%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '名古屋出身じゃないけど、もう離れられない。', 35.17195, 136.96710
FROM posts WHERE text LIKE '名古屋って何もないって言われるけど%' LIMIT 1;

-- 猫集会にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '夜中に見たことある。10匹以上いた。', 35.16705, 136.96605
FROM posts WHERE text LIKE '散歩してたら野良猫の集会%' LIMIT 1;
