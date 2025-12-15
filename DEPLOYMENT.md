# GitHub Pages へのデプロイ手順

## 前提条件
- Node.js と npm/pnpm がインストールされていること
- GitHub アカウントを持っていること
- プロジェクトが GitHub リポジトリとして初期化されていること

## 1. 必要なパッケージのインストール

```bash
# プロジェクトの依存関係をインストール
pnpm install

# GitHub Pages デプロイ用のパッケージをインストール
pnpm add -D gh-pages
```

## 2. package.json の設定

`package.json` に以下の設定を追加します：

```json
{
  "homepage": "https://<ユーザー名>.github.io/<リポジトリ名>",
  "scripts": {
    "predeploy": "pnpm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

## 3. Vite の設定

`vite.config.ts` にベースパスを設定します：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/<リポジトリ名>/',
  plugins: [react()],
})
```

## 4. 環境変数の設定（必要な場合）

`.env` ファイルを作成し、必要な環境変数を設定します：

```
VITE_API_BASE_URL=あなたのAPIのベースURL
VITE_GOOGLE_CLIENT_ID=あなたのGoogleクライアントID
```

## 5. ビルドとデプロイ

```bash
# プロジェクトをビルド
pnpm run build

# GitHub Pages にデプロイ
pnpm run deploy
```

## 6. GitHub Pages の設定

1. GitHub リポジトリにアクセス
2. 「Settings」タブを開く
3. 左メニューから「Pages」を選択
4. 「Source」で「gh-pages」ブランチを選択し、「/ (root)」を選択
5. 「Save」をクリック

## 7. 確認

デプロイが完了したら、以下のURLでサイトにアクセスできます：
`https://<ユーザー名>.github.io/<リポジトリ名>`

## 注意点

- 初回のデプロイ後、サイトが表示されるまでに最大10分程度かかることがあります
- 環境変数はビルド時に埋め込まれるため、変更後は再度ビルドとデプロイが必要です
- カスタムドメインを使用する場合は、リポジトリの「Settings」→「Pages」で設定できます

## トラブルシューティング

- 404エラーが表示される場合：
  - `vite.config.ts` の `base` 設定が正しいか確認
  - デプロイ後、数分待ってから再度アクセス

- デプロイに失敗する場合：
  - GitHub のアクセストークンが正しく設定されているか確認
  - コンソールのエラーメッセージを確認
