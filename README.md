
# 会議資料作成支援アプリ

このアプリケーションは、Typescript + Electron + Nextjs + tailwindCSSを使用して構築された、会議資料作成を支援するビジネスアプリケーションです。

次のような機能があります。  
- PDFファイルを読み込みます。'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx' が投入された場合は、PDFに変換して読み込みます。PDFへの変換には、MSOfficeまたはLibreOfficeが必要です。  
- 読み込まれたPDFファイル一覧、ファイル名変更、並び替え、削除を行うことができます。  
- 読み込まれたPDFファイル一覧に、複数の処理パターンを作成できます。  「会議出席者への配布資料とメディア向けの資料」や、
「紙配布を行うための会議資料」と「アウトライン付きのペーパーレス会議用資料」を、１回の処理で同時に作成することができます！  
- 処理パターンには、次のものがあります。  
　- 「ページ番号の付与の有無、位置、サイズ」  
　- 「ページの方向を縦方向にするページ回転」  
　- 「白紙差込み（両面印刷が楽になります！）」  
　- 「資料一覧の作成（アウトライン、リンクも同時に作成します！）」  

## 1. セットアップ方法

### 必要条件
- Node.js (推奨バージョン: v14以上)
- npm or yarn
- MSOffice OR Libre Office
- Typescript
  tscの実行に権限が必要な場合があります。

   ```bash 
   　 Set-ExecutionPolicy RemoteSigned -Scope Process -Force
   ```

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

2. Electronアプリを開発環境で起動します。
   
   ```bash
   npm run start:electron:dev
   ```

## 3. ビルドとデプロイ

### Frontendのビルド及び静的エクスポート

   ```bash
   npm run build:frontend
   ```

### Electronのパッケージング

   ```bash
   tsc
   ```

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
