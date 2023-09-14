
# 会議資料作成支援アプリ

このアプリケーションは、Typescript + Electron + Nextjs + tailwindCSSを使用して構築された、会議資料作成を支援するビジネスアプリケーションです。

## 1. セットアップ方法

### 必要条件
- Node.js (推奨バージョン: v14以上)
- npm or yarn

### 手順

1. リポジトリをクローンまたはダウンロードします。
   
   ```bash
   git clone [リポジトリのURL]
   ```

2. プロジェクトのルートディレクトリに移動します。
   
   ```bash
   cd conference-pdf-processor-main
   ```

3. Electron向けとfrontend向けの両方の依存関係をインストールします。
   
   ```bash
   npm run init:app
   ```

## 2. 開発の流れ

1. Next.jsの開発サーバを起動します。
   
   ```bash
   npm run dev:frontend
   ```

2. Electronアプリを起動します。
   
   ```bash
   npm run start:electron
   ```

## 3. ビルドとデプロイ

### Frontendのビルド及び静的エクスポート

```bash
npm run build:frontend
```

### Electronのパッケージング

1. アプリケーションをディレクトリとしてパックする場合：

   ```bash
   npm run pack
   ```

2. アプリケーションをビルドして配布形式で出力する場合：

   ```bash
   npm run dist
   ```

## 4. 依存関係

このプロジェクトは以下の主要な技術スタックに依存しています：

- TypeScript
- Electron
- Next.js
- tailwindCSS

具体的な依存関係のバージョンは`package.json`を参照してください。
