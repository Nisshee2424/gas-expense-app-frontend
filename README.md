# GAS Expense App Frontend

Google Apps Script (GAS) バックエンドと連携して動作する、React ベースの家計簿アプリケーションのフロントエンドです。
モダンな UI と直感的な操作性を提供し、個人の収支管理をサポートします。

## 🚀 技術スタック

- **フレームワーク**: React 19 (Vite)
- **言語**: TypeScript
- **UI コンポーネント**: PrimeReact
- **スタリング**: Vanilla CSS + PrimeFlex
- **認証**: Google OAuth 2.0 (@react-oauth/google)
- **HTTP クライアント**: Axios
- **パッケージ管理**: pnpm

## ✨ 主な機能

- **月次収支一覧**: 月ごとの収支データを一覧表示・管理
- **グラフィカルな集計**: 費目別の支出割合や推移を可視化
- **固定費コピー**: 前月の固定費設定をワンクリックで当月に反映
- **レスポンシブデザイン**: スマートフォンとPCの両方で快適に利用可能
- **PWA 対応**: オフラインでの閲覧やホーム画面への追加が可能

## 🛠 セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の値を設定してください。

```text
VITE_GAS_API_URL=あなたのGASウェブアプリURL
VITE_GOOGLE_CLIENT_ID=あなたのGoogleクライアントID
VITE_API_KEY=バックエンドで設定したAPI_KEY
```

### 3. 開発サーバーの起動

```bash
pnpm run dev
```

## 🚀 コマンド

| コマンド | 説明 |
| :--- | :--- |
| `pnpm run dev` | ローカル開発サーバーを起動します |
| `pnpm run build` | 本番用のアセットをビルド（`dist/` 出力）します |
| `pnpm run deploy` | ビルド後、GitHub Pages へデプロイします |
| `pnpm run lint` | ESLint による静的解析を実行します |

## 🌐 デプロイ

このプロジェクトは GitHub Pages を利用してホスティングされています。
以下のコマンドを実行するだけで、ビルドから公開まで自動で行われます。

```bash
pnpm run deploy
```

## 📁 ディレクトリ構造

```text
src/
├── components/  # 共通コンポーネント
├── contexts/    # React Context (認証など)
├── hooks/       # カスタムフック
├── pages/       # 各画面のコンポーネント (Home, Monthly, etc.)
├── services/    # API 通信ロジック
├── types/       # TypeScript 型定義
└── utils/       # ユーティリティ関数
```

---
Developed by Nisshee2424
