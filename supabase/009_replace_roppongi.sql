-- ============================================================
-- 六本木一丁目エリアの投稿＋コメント全入れ替え
-- 既存データを削除 → 泉ガーデンタワー周辺に合った内容で再投入
-- 中心: 35.66468, 139.73949（六本木一丁目駅・泉ガーデンタワー付近）
-- Supabase SQL Editor で実行してください
-- ============================================================

-- === STEP 1: 既存データの削除（コメント→投稿の順） ===
DELETE FROM comments
WHERE post_id IN (
  SELECT id FROM posts
  WHERE lat BETWEEN 35.658 AND 35.672
    AND lng BETWEEN 139.733 AND 139.746
);

DELETE FROM posts
WHERE lat BETWEEN 35.658 AND 35.672
  AND lng BETWEEN 139.733 AND 139.746;


-- === STEP 2: 投稿（距離バリエーション） ===

-- ■ すぐそば（0〜50m）
INSERT INTO posts (text, lat, lng) VALUES
('泉ガーデンタワーのエスカレーター、地下から地上に出る瞬間が好き。一気に空が広がる。', 35.66470, 139.73945),
('昼休みに泉ガーデンの植栽のベンチで食べるおにぎりが、一日で一番幸せな時間。', 35.66460, 139.73955),
('南北線の改札出てすぐこの坂。毎朝の試練。でもこの坂があるから足腰丈夫でいられる気がする。', 35.66475, 139.73940),
('泉ガーデンの地下飲食街、全店制覇した。結局カレーの店に戻ってしまう。', 35.66465, 139.73960),
('ここで働き始めて3年。最初は六本木ってだけでビビってたけど、一丁目側は全然穏やか。', 35.66472, 139.73952);

-- ■ 近く（50〜150m）
INSERT INTO posts (text, lat, lng) VALUES
('サントリーホール帰り。余韻を味わいながら夜道を歩く。この辺の夜の静けさが好き。', 35.66550, 139.73950),
('アークヒルズの桜、今年も見事だった。ライトアップの時間に間に合ってよかった。', 35.66380, 139.73960),
('スウェーデン大使館の前を毎日通るけど、門の中が気になる。北欧みたいな空気感がある。', 35.66468, 139.74080),
('残業帰り、泉ガーデンから出たら月がきれいだった。東京タワーと月が並んでた。', 35.66530, 139.73870),
('この辺の坂道に全部名前があるの最近知った。江戸の大名屋敷の名残らしい。歴史の上を歩いてる。', 35.66400, 139.73900);

-- ■ 中距離（150〜300m）
INSERT INTO posts (text, lat, lng) VALUES
('泉屋博古館に昼休みにふらっと入った。こんな近くにこんな美術館があったとは。', 35.66680, 139.73950),
('六本木一丁目から麻布十番まで歩いた。坂を下るだけで街の雰囲気がガラッと変わる。', 35.66270, 139.73950),
('東京タワーがビルの隙間から見える交差点を見つけた。毎日通ってたのに気づかなかった。', 35.66468, 139.74250),
('このエリアのパン屋のレベルが高すぎる。カヌレが14時には売り切れる。昼に走った。', 35.66650, 139.74100);

-- ■ 遠め（300〜500m）
INSERT INTO posts (text, lat, lng) VALUES
('麻布台ヒルズの展望台から見下ろしたら、泉ガーデンタワーが見えた。毎日あそこにいるんだな。', 35.66800, 139.73950),
('六本木の交差点まで来ると急にうるさい。一丁目の静けさが恋しくなる。', 35.66130, 139.73950),
('神谷町から歩いてきた。このルート、朝は気持ちいい。ただし坂が多い。', 35.66468, 139.74400),
('赤坂側から来ると、溜池山王あたりの官庁街とこっちの雰囲気の違いがおもしろい。', 35.66910, 139.73950),
('この公園の深夜、六本木とは思えないくらい静か。星が少し見える。', 35.66020, 139.73950);


-- === STEP 3: コメント ===

-- 「泉ガーデンタワーのエスカレーター」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '雨の日にあのエスカレーターのありがたみを痛感する。濡れずに地上に出られる。', 35.66472, 139.73947
FROM posts WHERE text LIKE '泉ガーデンタワーのエスカレーター%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '朝、あのエスカレーターで毎日すれ違う人がいる。会釈するようになった。', 35.66468, 139.73943
FROM posts WHERE text LIKE '泉ガーデンタワーのエスカレーター%' LIMIT 1;

-- 「昼休みに泉ガーデンの植栽のベンチ」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '12時半すぎるとベンチ埋まるんだよね。12時ダッシュ派です。', 35.66462, 139.73958
FROM posts WHERE text LIKE '昼休みに泉ガーデンの植栽%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '春はあのベンチの横の花がきれいで、ちょっと贅沢な気分になる。', 35.66458, 139.73953
FROM posts WHERE text LIKE '昼休みに泉ガーデンの植栽%' LIMIT 1;

-- 「南北線の改札出てすぐこの坂」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '直結エスカレーターあるの知ってる？あれで坂を完全回避できる。', 35.66477, 139.73942
FROM posts WHERE text LIKE '南北線の改札出てすぐ%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '夏のこの坂はやばい。着く頃には汗だく。', 35.66473, 139.73938
FROM posts WHERE text LIKE '南北線の改札出てすぐ%' LIMIT 1;

-- 「泉ガーデンの地下飲食街」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'カレーの店わかる。あそこのナン、でかすぎて最高。', 35.66467, 139.73962
FROM posts WHERE text LIKE '泉ガーデンの地下飲食街%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'アークヒルズまで足伸ばすと選択肢広がるよ。歩いて5分。', 35.66463, 139.73957
FROM posts WHERE text LIKE '泉ガーデンの地下飲食街%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '金曜の混み方やばい。11:45に出ないと行列。', 35.66468, 139.73958
FROM posts WHERE text LIKE '泉ガーデンの地下飲食街%' LIMIT 1;

-- 「ここで働き始めて3年」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '同じく。六本木＝ギラギラのイメージだったけど、一丁目は全然違った。', 35.66474, 139.73955
FROM posts WHERE text LIKE 'ここで働き始めて3年%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '大使館が多いからか、外国の方も多くてインターナショナルな雰囲気がいい。', 35.66470, 139.73950
FROM posts WHERE text LIKE 'ここで働き始めて3年%' LIMIT 1;

-- 「サントリーホール帰り」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'コンサートの後のこの静けさ、余韻に浸れてぜいたく。', 35.66555, 139.73955
FROM posts WHERE text LIKE 'サントリーホール帰り%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'サントリーホールの音響は世界レベルだと思う。近くにあるのが誇らしい。', 35.66548, 139.73948
FROM posts WHERE text LIKE 'サントリーホール帰り%' LIMIT 1;

-- 「アークヒルズの桜」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '毎年あのライトアップ楽しみにしてる。仕事帰りに見れるの最高。', 35.66385, 139.73965
FROM posts WHERE text LIKE 'アークヒルズの桜%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '桜の時期のアークヒルズ、お花見してるオフィスワーカーだらけで平和な光景。', 35.66378, 139.73958
FROM posts WHERE text LIKE 'アークヒルズの桜%' LIMIT 1;

-- 「スウェーデン大使館」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '12月にルシア祭やってるの見たことある。歌声が通りまで聞こえてきて感動した。', 35.66470, 139.74085
FROM posts WHERE text LIKE 'スウェーデン大使館の前%' LIMIT 1;

-- 「残業帰り、泉ガーデンから出たら月が」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '東京タワーと月の並び、あの角度でしか見えない特権だよね。', 35.66535, 139.73875
FROM posts WHERE text LIKE '残業帰り、泉ガーデンから%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '残業は嫌だけど、帰り道の夜景だけは特典だと思ってる。', 35.66528, 139.73868
FROM posts WHERE text LIKE '残業帰り、泉ガーデンから%' LIMIT 1;

-- 「この辺の坂道に全部名前」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '泉ガーデンの「泉」も、この場所にあった久保田藩の屋敷の庭園から来てるらしいよ。', 35.66405, 139.73905
FROM posts WHERE text LIKE 'この辺の坂道に全部名前%' LIMIT 1;

-- 「泉屋博古館」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '住友コレクション、地味にすごい。昼休みに通えるの贅沢すぎる。', 35.66685, 139.73955
FROM posts WHERE text LIKE '泉屋博古館に昼休み%' LIMIT 1;

-- 「六本木一丁目から麻布十番まで」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あの坂を下りきると急に下町感出るよね。たい焼きの匂いがする。', 35.66275, 139.73955
FROM posts WHERE text LIKE '六本木一丁目から麻布十番%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '帰りの登りが地獄だけどね。', 35.66268, 139.73948
FROM posts WHERE text LIKE '六本木一丁目から麻布十番%' LIMIT 1;

-- 「東京タワーがビルの隙間から」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あの交差点！自分も最近気づいた。3年通ってたのに。', 35.66470, 139.74255
FROM posts WHERE text LIKE '東京タワーがビルの隙間%' LIMIT 1;

-- 「このエリアのパン屋のレベル」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'あのカヌレ、外カリ中もち。12時に買いに走る価値ある。', 35.66655, 139.74105
FROM posts WHERE text LIKE 'このエリアのパン屋%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '同じビルの人だと思う。自分も走ってる。', 35.66648, 139.74098
FROM posts WHERE text LIKE 'このエリアのパン屋%' LIMIT 1;

-- 「麻布台ヒルズの展望台から」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '上から見ると泉ガーデンって緑多いんだなって気づく。', 35.66805, 139.73955
FROM posts WHERE text LIKE '麻布台ヒルズの展望台%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '毎日あのビルで働いてるんだと思うと不思議な感覚になる。', 35.66798, 139.73948
FROM posts WHERE text LIKE '麻布台ヒルズの展望台%' LIMIT 1;

-- 「六本木の交差点まで来ると」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '一丁目に帰ってくるとホッとする。同じ六本木なのに。', 35.66135, 139.73955
FROM posts WHERE text LIKE '六本木の交差点まで来ると%' LIMIT 1;

-- 「この公園の深夜」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '終電逃した夜にここで座ってたことある。意外と安全で静か。', 35.66025, 139.73955
FROM posts WHERE text LIKE 'この公園の深夜%' LIMIT 1;
