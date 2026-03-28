-- ============================================================
-- 六本木一丁目エリアのコメント入れ替え
-- 既存コメントを削除 → 場所に合った多様な視点で再投入
-- 中心: 35.66468, 139.73949（六本木一丁目駅・泉ガーデンタワー付近）
-- Supabase SQL Editor で実行してください
-- ============================================================

-- === STEP 1: 既存コメントの削除 ===
DELETE FROM comments
WHERE post_id IN (
  SELECT id FROM posts
  WHERE lat BETWEEN 35.660 AND 35.670
    AND lng BETWEEN 139.735 AND 139.745
);


-- === STEP 2: コメント投入 ===

-- 「この坂、毎回息切れする」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '南北線の改札から泉ガーデン直結のエスカレーター、知らない人多いよね。あれ使えば坂を回避できる。', 35.66472, 139.73947
FROM posts WHERE text LIKE 'この坂、毎回%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '神谷町から歩いてくるとこの坂が最後の試練。でも登りきった後のビル群の景色がいい。', 35.66468, 139.73943
FROM posts WHERE text LIKE 'この坂、毎回%' LIMIT 1;

-- 「古着屋を3軒はしごした」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '昼休みに麻布十番まで歩くとけっこう古着屋ある。意外と穴場。', 35.66462, 139.73958
FROM posts WHERE text LIKE '古着屋を3軒%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'この辺住んでるけど、六本木で古着探してる人初めて見た。いいセンスしてる。', 35.66458, 139.73950
FROM posts WHERE text LIKE '古着屋を3軒%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'リーバイス見つけたの裏路地の店？あそこ店主の目利きがすごい。', 35.66463, 139.73952
FROM posts WHERE text LIKE '古着屋を3軒%' LIMIT 1;

-- 「ここのコーヒースタンド」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '泉ガーデンの1Fのところ？朝の出勤前、あそこに寄るのがルーティンになってる。', 35.66467, 139.73962
FROM posts WHERE text LIKE 'ここのコーヒースタンド%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'サントリーホールの帰りに寄ったことある。夜もやってるのがありがたい。', 35.66463, 139.73957
FROM posts WHERE text LIKE 'ここのコーヒースタンド%' LIMIT 1;

-- 「目の前の犬」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'このエリア、大使館の人が犬の散歩してるの見る。犬も品がある感じ。', 35.66474, 139.73955
FROM posts WHERE text LIKE '目の前の犬%' LIMIT 1;

-- 「風が気持ちいい」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '泉ガーデンのテラス席で昼ごはん食べると最高。ビルの谷間なのに風が通る。', 35.66477, 139.73942
FROM posts WHERE text LIKE '風が気持ちいい%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'この辺、大使館が多いから街路樹がきれいに整ってる。散歩するだけで気分がいい。', 35.66473, 139.73938
FROM posts WHERE text LIKE '風が気持ちいい%' LIMIT 1;

-- 「裏通りに新しいギャラリー」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '泉屋博古館も歩いてすぐだし、この辺はアート散歩にちょうどいい距離感。', 35.66555, 139.73955
FROM posts WHERE text LIKE '裏通りに新しいギャラリー%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '麻布台ヒルズのギャラリーもできたし、六本木〜虎ノ門のアート密度がすごいことになってる。', 35.66548, 139.73948
FROM posts WHERE text LIKE '裏通りに新しいギャラリー%' LIMIT 1;

-- 「この辺、夜は静かでいい」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '残業帰りに歩くと本当に静か。六本木の交差点側と全然違う世界。', 35.66535, 139.73875
FROM posts WHERE text LIKE 'この辺、夜は静かで%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'スウェーデン大使館の前の通り、夜のライトアップが北欧みたいできれい。', 35.66528, 139.73868
FROM posts WHERE text LIKE 'この辺、夜は静かで%' LIMIT 1;

-- 「道端にすみれが咲いてた」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'アークヒルズの桜、もうすぐだよね。あのライトアップ毎年楽しみにしてる。', 35.66405, 139.73905
FROM posts WHERE text LIKE '道端にすみれが%' LIMIT 1;

-- 「坂の途中にある石垣」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'この辺は旧久保田藩の屋敷跡。泉ガーデンの「泉」も屋敷の庭園から来てるらしいよ。', 35.66275, 139.73955
FROM posts WHERE text LIKE '坂の途中にある石垣%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '港区の坂、全部に名前がある。毎日通ってるけど調べたことなかったな。', 35.66268, 139.73948
FROM posts WHERE text LIKE '坂の途中にある石垣%' LIMIT 1;

-- 「信号待ちの間に空を見上げたら」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'この角度、東京タワーがビルの隙間からちょうど見えるの知ってる？', 35.66470, 139.74255
FROM posts WHERE text LIKE '信号待ちの間に空を%' LIMIT 1;

-- 「この角のパン屋、カヌレが」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '14時には売り切れるから、昼休みに買いに行くなら早めに。', 35.66655, 139.74105
FROM posts WHERE text LIKE 'この角のパン屋%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'このエリアのパン屋、レベル高すぎない？舌が肥えたオフィスワーカーのおかげか。', 35.66648, 139.74098
FROM posts WHERE text LIKE 'この角のパン屋%' LIMIT 1;

-- 「知らない路地に入ったら、昭和みたいな喫茶店」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '再開発で消える前に通っておきたい。この辺の古い飲食街、あと何年持つかな。', 35.66805, 139.73955
FROM posts WHERE text LIKE '知らない路地に入ったら%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'ナポリタンの店、会社の先輩に教えてもらった。あそこは秘密にしておきたい。', 35.66798, 139.73948
FROM posts WHERE text LIKE '知らない路地に入ったら%' LIMIT 1;

-- 「屋上から見る街並みが好き」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '泉ガーデンタワーの上の方、夕方の東京タワーが目の前。毎日見ても飽きない。', 35.66135, 139.73955
FROM posts WHERE text LIKE '屋上から見る街並み%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '麻布台ヒルズできてから夜景がさらに豪華になった。窓際の席取り合い。', 35.66128, 139.73948
FROM posts WHERE text LIKE '屋上から見る街並み%' LIMIT 1;

-- 「この公園のブランコ」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '終電逃した夜にここで座ってたことある。六本木の喧騒が嘘みたいに静か。', 35.66025, 139.73955
FROM posts WHERE text LIKE 'この公園のブランコ%' LIMIT 1;

-- 「美容院で2時間待ち」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'この辺の美容院、仕事帰りに寄れるのがいい。予約は必須だけど。', 35.66685, 139.73955
FROM posts WHERE text LIKE '美容院で2時間待ち%' LIMIT 1;

-- 「ランチどこにしよう」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '泉ガーデンの地下、毎日通ってると全店制覇しちゃって逆に困る。', 35.66385, 139.73965
FROM posts WHERE text LIKE 'ランチどこにしよう%' LIMIT 1;

INSERT INTO comments (post_id, text, lat, lng)
SELECT id, 'アークヒルズまで足伸ばすと選択肢広がるよ。歩いて5分くらい。', 35.66378, 139.73958
FROM posts WHERE text LIKE 'ランチどこにしよう%' LIMIT 1;

-- 「友達と久々に会った」への返信
INSERT INTO comments (post_id, text, lat, lng)
SELECT id, '六本木一丁目、飲む場所に困らないのがいい。赤坂方面にも歩けるし。', 35.66470, 139.74455
FROM posts WHERE text LIKE '友達と久々に会った%' LIMIT 1;
