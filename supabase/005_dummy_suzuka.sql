-- ============================================================
-- ダミーデータ投入 — 鈴鹿・津エリア
-- 中心: 34.84439, 136.58165
-- Supabase SQL Editor で実行してください
-- ============================================================

-- === 投稿（距離バリエーション） ===

-- ■ すぐそば（0〜50m）
INSERT INTO posts (text, lat, lng) VALUES
('サーキットの音が風に乗って聞こえる日がある。ここに住んでると当たり前だけど、よく考えたらすごいことだよな。', 34.84450, 136.58170),
('この自販機、なぜかいつもおしるこだけ売り切れてる。誰が買ってるんだろう。', 34.84430, 136.58150),
('夕方のこの道、鈴鹿おろしがすごい。でもこの風が好きなんだよな。', 34.84445, 136.58180),
('伊勢湾から朝日が昇るの見えた。冬の空気が澄んでる日だけの特権。', 34.84435, 136.58160),
('ここのたい焼き、しっぽまであんこ入ってる。それだけで信頼できる。', 34.84442, 136.58155);

-- ■ 近く（50〜150m）
INSERT INTO posts (text, lat, lng) VALUES
('鈴鹿の夏は暑すぎる。でもかき氷がうまい季節だと思えばまあいいか。', 34.84520, 136.58250),
('おばあちゃんがくれた伊勢茶、やっぱりペットボトルと全然違う。', 34.84350, 136.58080),
('通学路のこの桜並木、毎年当たり前に見てたけど卒業したら見れなくなるんだな。', 34.84500, 136.58100),
('この交差点、信号長すぎない？毎朝ここで人生について考えてしまう。', 34.84380, 136.58260),
('雨の日の田んぼの匂いが好き。都会に出た友達に言ったら変な顔された。', 34.84460, 136.58300);

-- ■ 中距離（150〜300m）
INSERT INTO posts (text, lat, lng) VALUES
('鈴鹿サーキット、地元民だけど実はちゃんと観戦したことない。今年こそ行く。', 34.84650, 136.58400),
('椿大神社でおみくじ引いたら大吉だった。ここのおみくじ、当たる気がする。', 34.84250, 136.57900),
('この公園のベンチ、いつも同じおじいさんが座ってる。一回話してみたい。', 34.84600, 136.57950),
('コンビニのイートインで勉強してる高校生を見ると、自分もああだったなと思う。', 34.84300, 136.58400),
('夜の国道23号、トラックが多すぎて怖い。でもこの道がないと三重は成り立たない。', 34.84200, 136.58300);

-- ■ 遠め（300〜500m）
INSERT INTO posts (text, lat, lng) VALUES
('地元のうどん屋、伊勢うどんじゃなくて普通のうどん出してくるけど、それがうまい。', 34.84800, 136.58600),
('鈴鹿川沿いを散歩してたら鹿を見た。鈴鹿だけに。', 34.84100, 136.57700),
('この町は何もないって言う人いるけど、何もないのがいいんだよ。', 34.84700, 136.57750),
('F1の季節だけ街が急ににぎやかになる。あの数日間だけ世界中から人が来る不思議。', 34.84900, 136.58500),
('津の県庁前の道、広すぎて逆に歩きにくい。', 34.84000, 136.58000);


-- === コメント（投稿に紐づく） ===
-- 最初の投稿（サーキットの音）にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'わかる。窓開けてると聞こえる日ある。', 34.84448, 136.58168
FROM posts WHERE text LIKE 'サーキットの音が%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '8耐のときは夜まで聞こえるよね。', 34.84452, 136.58172
FROM posts WHERE text LIKE 'サーキットの音が%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '引っ越してきた時はびっくりしたけど、今は子守唄みたいなもん。', 34.84440, 136.58175
FROM posts WHERE text LIKE 'サーキットの音が%' LIMIT 1;

-- たい焼きにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'どこの店？教えて。', 34.84445, 136.58158
FROM posts WHERE text LIKE 'ここのたい焼き%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'しっぽまであんこ、大事。', 34.84440, 136.58152
FROM posts WHERE text LIKE 'ここのたい焼き%' LIMIT 1;

-- 桜並木にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '卒業しても見に来ればいいじゃん。', 34.84505, 136.58105
FROM posts WHERE text LIKE '通学路のこの桜並木%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'わたしも去年卒業したけど、4月に来たよ。', 34.84495, 136.58095
FROM posts WHERE text LIKE '通学路のこの桜並木%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'この道、夜桜もきれいだよ。', 34.84502, 136.58110
FROM posts WHERE text LIKE '通学路のこの桜並木%' LIMIT 1;

-- 田んぼにコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '変じゃないよ。わかる人にはわかる。', 34.84462, 136.58305
FROM posts WHERE text LIKE '雨の日の田んぼの匂い%' LIMIT 1;

-- 椿大神社にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あそこの空気は特別だよね。', 34.84255, 136.57905
FROM posts WHERE text LIKE '椿大神社で%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '猿田彦さんにお参りすると仕事運上がる気がする。', 34.84248, 136.57895
FROM posts WHERE text LIKE '椿大神社で%' LIMIT 1;

-- 鈴鹿川の鹿にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '鈴鹿だけに、って言いたかっただけでしょ。', 34.84105, 136.57705
FROM posts WHERE text LIKE '鈴鹿川沿いを散歩%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'いや実際いるよ。朝早いと会える。', 34.84095, 136.57695
FROM posts WHERE text LIKE '鈴鹿川沿いを散歩%' LIMIT 1;

-- 何もない町にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'ほんとそれ。何もないから落ち着く。', 34.84705, 136.57755
FROM posts WHERE text LIKE 'この町は何もない%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '東京に3年住んで帰ってきた。ここが一番いい。', 34.84695, 136.57745
FROM posts WHERE text LIKE 'この町は何もない%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '星が見えるだけで十分だと思う。', 34.84710, 136.57760
FROM posts WHERE text LIKE 'この町は何もない%' LIMIT 1;

-- F1にコメント
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'ホテルの値段だけは勘弁してほしい。', 34.84905, 136.58505
FROM posts WHERE text LIKE 'F1の季節だけ%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '外国人が道端でビール飲んでるの見ると、祭りだなって思う。', 34.84895, 136.58495
FROM posts WHERE text LIKE 'F1の季節だけ%' LIMIT 1;
