# Tayutau — ここにいる、だれかの声

半径500m以内の匿名投稿が見える、位置情報ベースの掲示板アプリ。

## 技術構成

- **Next.js 15** (App Router)
- **Supabase** (PostgreSQL + PostGIS)
- **Vercel** デプロイ想定

---

## セットアップ手順

### 1. Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) でアカウント作成・ログイン
2. 「New Project」からプロジェクトを作成
3. リージョンは **Northeast Asia (Tokyo)** 推奨

### 2. データベースセットアップ

Supabase ダッシュボードの **SQL Editor** を開き、`supabase/001_init.sql` の内容をすべて貼り付けて実行してください。

このSQLで以下が作成されます：

- PostGIS 拡張の有効化
- `posts` テーブル（自動生成の `location` geography カラム付き）
- `comments` テーブル（同上）
- 空間インデックス（GIST）
- `nearby_posts()` RPC 関数 — 指定座標の半径内の投稿を取得
- `nearby_comments()` RPC 関数 — 指定座標の半径内のコメントを取得
- Row Level Security ポリシー（匿名読み書き許可）

### 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集し、Supabase ダッシュボードの **Settings → API** から取得した値を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. 開発サーバー起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開くと、位置情報の許可を求められます。
許可すると、半径500m以内の投稿が表示され、新しい投稿ができます。

---

## テーブル設計

### posts

| カラム      | 型                | 説明                        |
|------------|-------------------|-----------------------------|
| id         | uuid (PK)         | 自動生成                     |
| text       | text              | 投稿本文 (200文字以内)        |
| lat        | double precision  | 緯度                         |
| lng        | double precision  | 経度                         |
| location   | geography(Point)  | Generated Column (PostGIS)   |
| created_at | timestamptz       | 作成日時                     |

### comments

| カラム      | 型                | 説明                         |
|------------|-------------------|------------------------------|
| id         | uuid (PK)         | 自動生成                      |
| post_id    | uuid (FK → posts) | 親投稿                        |
| text       | text              | コメント本文 (140文字以内)      |
| lat        | double precision  | 緯度                          |
| lng        | double precision  | 経度                          |
| location   | geography(Point)  | Generated Column (PostGIS)    |
| created_at | timestamptz       | 作成日時                      |

---

## API エンドポイント

| メソッド | パス                           | 説明               |
|---------|-------------------------------|--------------------|
| GET     | /api/posts?lat=...&lng=...    | 近くの投稿を取得     |
| POST    | /api/posts                    | 投稿を作成          |
| GET     | /api/posts/[id]/comments?lat=...&lng=... | 近くのコメントを取得 |
| POST    | /api/posts/[id]/comments      | コメントを作成       |

---

## Vercel デプロイ

1. GitHub にリポジトリをプッシュ
2. [vercel.com](https://vercel.com) でインポート
3. 環境変数に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
4. デプロイ
