# カンシアリンク — 企業管理CRMシステム

## 技術スタック
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth + RLS)
- Vercel デプロイ
- Tailwind CSS
- TypeScript (strict mode)
- Zod + react-hook-form

## セットアップ

### 1. 依存パッケージをインストール
```bash
npm install
```

### 2. 環境変数を設定
```bash
cp .env.local.example .env.local
```
`.env.local` を編集して Supabase の URL・キーを設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Supabaseマイグレーションを実行
Supabase ダッシュボードの SQL エディタで以下を順番に実行：
1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`

### 4. 日本語フォントの配置（PDF用）
Noto Sans JP フォントを `public/fonts/NotoSansJP-Regular.ttf` に配置してください。
[Google Fonts から入手](https://fonts.google.com/noto/specimen/Noto+Sans+JP)

### 5. 開発サーバーを起動
```bash
npm run dev
```

### 6. ビルド・デプロイ
```bash
npm run build
vercel --prod
```

## 機能一覧
- 企業一覧（検索・フィルター・ページネーション・CSVエクスポート）
- 企業新規登録・編集（全フィールド）
- PDF出力（顧客詳細シート、日本語フォント対応）
- ユーザー管理（一覧・登録・削除）
- Supabase Auth ログイン認証

## セキュリティ
- Supabase RLS 全テーブル対応
- Zod サーバーサイドバリデーション
- ログイン試行レート制限
- セキュリティヘッダー設定
- HTTPS 強制 (Vercel)
