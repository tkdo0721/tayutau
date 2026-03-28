-- ============================================================
-- ダミーデータ投入 — 杉並区・井荻エリア
-- 中心: 35.71762, 139.61388
-- 西武新宿線 井荻駅付近（杉並区井草・今川・下井草周辺）
-- Supabase SQL Editor で実行してください
-- ============================================================

-- === 投稿（距離バリエーション） ===

-- ■ すぐそば（0〜50m）
INSERT INTO posts (text, lat, lng) VALUES
('井荻の踏切、開かずの踏切すぎて人生について考える時間ができる。', 35.71770, 139.61390),
('この商店街、昔はもっと賑わってたらしい。でも残ってる店は全部いい店。', 35.71750, 139.61370),
('善福寺川沿いを走るのが日課。朝の空気が東京じゃないみたいに澄んでる。', 35.71760, 139.61400),
('駅前のパン屋、朝7時に行かないとクロワッサン売り切れる。みんな知ってるんだよな。', 35.71755, 139.61395),
('西武新宿線の黄色い電車、見るたびに地元だなって思う。', 35.71768, 139.61380);

-- ■ 近く（50〜150m）
INSERT INTO posts (text, lat, lng) VALUES
('下井草の銭湯、まだ生き残ってるのすごい。薪で焚いてるらしい。', 35.71850, 139.61500),
('井草の森公園でぼーっとしてる時間が一番贅沢。東京にこんな場所があるんだな。', 35.71680, 139.61280),
('この辺の住宅街、夜めちゃくちゃ静か。23区とは思えない。', 35.71830, 139.61250),
('今川の交差点のたこ焼き屋、いつ通っても誰かしら並んでる。', 35.71700, 139.61500),
('雨の日の善福寺川、水量すごくなるから怖い。でも水の音は好き。', 35.71680, 139.61450);

-- ■ 中距離（150〜300m）
INSERT INTO posts (text, lat, lng) VALUES
('上井草のガンダム像、何回見ても笑顔になる。ここに置いた人センスいい。', 35.71950, 139.61100),
('井荻から荻窪まで歩くと意外と近い。電車乗るか迷う距離。', 35.71550, 139.61600),
('杉並区の図書館、蔵書多いし静かだし最高。ここで何冊読んだかわからない。', 35.71600, 139.61200),
('この辺のネコ、人を恐れない。堂々と道の真ん中で寝てる。', 35.71950, 139.61550),
('環八沿いはうるさいけど、一本入ると嘘みたいに静か。この落差が杉並。', 35.71500, 139.61400);

-- ■ 遠め（300〜500m）
INSERT INTO posts (text, lat, lng) VALUES
('善福寺公園の池、カワセミいるらしい。まだ見たことないけど。', 35.72150, 139.60900),
('西武新宿線、各停しか止まらないのがいい。急がない街。', 35.72100, 139.61700),
('この道、春になると桜のトンネルになる。毎年写真撮っちゃう。', 35.71400, 139.61000),
('荻窪のラーメン屋に歩いていける距離に住んでるの、地味に自慢。', 35.71350, 139.61600),
('練馬との境目あたり、どっちの区民かわからなくなる。', 35.72200, 139.61500);


-- === コメント（投稿に紐づく） ===

-- 踏切にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '朝のラッシュ時は本当にやばい。5分以上開かないときある。', 35.71772, 139.61392
FROM posts WHERE text LIKE '井荻の踏切%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '高架化の計画あるらしいよ。10年後くらいに。', 35.71768, 139.61388
FROM posts WHERE text LIKE '井荻の踏切%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あの踏切待ちの時間で読書するようになった。', 35.71775, 139.61385
FROM posts WHERE text LIKE '井荻の踏切%' LIMIT 1;

-- 善福寺川ランニングにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '桜の季節の善福寺川、走ってるだけで泣きそうになる。', 35.71762, 139.61405
FROM posts WHERE text LIKE '善福寺川沿いを走る%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '自分も毎朝走ってます。すれ違ってるかも。', 35.71758, 139.61398
FROM posts WHERE text LIKE '善福寺川沿いを走る%' LIMIT 1;

-- パン屋にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あんバターも絶品。知ってた？', 35.71758, 139.61398
FROM posts WHERE text LIKE '駅前のパン屋%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '土曜は6:45に行かないと無理。', 35.71752, 139.61390
FROM posts WHERE text LIKE '駅前のパン屋%' LIMIT 1;

-- 井草の森公園にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あの公園、夕方の光がきれい。', 35.71685, 139.61285
FROM posts WHERE text LIKE '井草の森公園で%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '読書するならあのベンチが最高。木陰になる場所。', 35.71678, 139.61275
FROM posts WHERE text LIKE '井草の森公園で%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '子どもと毎週行ってる。遊具はないけど、それがいい。', 35.71682, 139.61282
FROM posts WHERE text LIKE '井草の森公園で%' LIMIT 1;

-- 住宅街の静けさにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '虫の声聞こえるよね。新宿まで30分なのに。', 35.71832, 139.61255
FROM posts WHERE text LIKE 'この辺の住宅街、夜めちゃくちゃ静か%' LIMIT 1;

-- ガンダム像にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'サンライズのスタジオがあるからね。聖地だよ。', 35.71955, 139.61105
FROM posts WHERE text LIKE '上井草のガンダム像%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '外国人観光客が写真撮ってるの何回か見た。', 35.71948, 139.61095
FROM posts WHERE text LIKE '上井草のガンダム像%' LIMIT 1;

-- ネコにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '三毛のやつ？あの子この辺のボスだよ。', 35.71952, 139.61555
FROM posts WHERE text LIKE 'この辺のネコ%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '冬になると車の下で固まって寝てる。かわいい。', 35.71945, 139.61548
FROM posts WHERE text LIKE 'この辺のネコ%' LIMIT 1;

-- カワセミにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '12月に見た！池の東側の枝にいた。青くてきれいだった。', 35.72155, 139.60905
FROM posts WHERE text LIKE '善福寺公園の池%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '早朝がチャンスらしい。カメラおじさんに教えてもらった。', 35.72148, 139.60895
FROM posts WHERE text LIKE '善福寺公園の池%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'カワセミ待ちのカメラマン、毎朝いるよね。あの人たちの根気すごい。', 35.72145, 139.60910
FROM posts WHERE text LIKE '善福寺公園の池%' LIMIT 1;

-- 桜のトンネルにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '花びらが川に流れてくのも最高。', 35.71405, 139.61005
FROM posts WHERE text LIKE 'この道、春になると桜の%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '毎年同じ場所で撮るの、いいよね。変化がわかる。', 35.71395, 139.60995
FROM posts WHERE text LIKE 'この道、春になると桜の%' LIMIT 1;

-- 荻窪ラーメンにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '春木屋？それとも丸信？', 35.71355, 139.61605
FROM posts WHERE text LIKE '荻窪のラーメン屋に%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'わかる。歩ける距離にあの選択肢があるの贅沢すぎる。', 35.71348, 139.61595
FROM posts WHERE text LIKE '荻窪のラーメン屋に%' LIMIT 1;
