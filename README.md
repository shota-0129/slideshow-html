# HTML Slideshow Viewer

サムネイル生成機能を備えた、安全で高性能なNext.jsベースのHTML プレゼンテーション表示アプリケーション

## 🚀 特徴

- **安全なHTMLレンダリング**: 組み込みHTML サニタイゼーションとXSS保護
- **動的サムネイル**: Puppeteerを使用した自動サムネイル生成
- **静的Export対応**: 静的ファイルまたはserver-side renderingでデプロイ可能
- **レスポンシブデザイン**: デスクトップとモバイルデバイスで動作
- **キーボードナビゲーション**: 矢印キー、Enter、Spaceでスライド操作
- **全画面モード**: 専用の全画面プレゼンテーション表示
- **Rate制限**: 悪用に対する組み込みAPI保護
- **Path Traversal保護**: 安全なファイルシステムアクセス

## 📋 前提条件

- Node.js 18+ 
- npm, yarn, または pnpm

## 🛠️ インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd slideshow-html

# 依存関係をインストール
npm install
# または
yarn install
# または
pnpm install
```

## 🏗️ 開発環境 vs 本番環境

### 開発モード (`npm run dev`)

**目的**: ローカル開発とテスト
- **Hot Reload**: 開発中の即座の更新
- **動的サムネイル**: APIルート経由でオンデマンド生成
- **詳細ログ**: 完全なエラーメッセージとdebug情報
- **Build最適化なし**: 高速起動、大きなbundleサイズ
- **セキュリティ**: 開発向け設定

**使用場面**:
- 新しいプレゼンテーションの追加
- UIコンポーネントの変更
- 機能のテスト
- 問題のデバッグ

### 本番Build (`npm run build` + `npm start`)

**目的**: Server-side rendered本番デプロイ
- **最適化されたBundle**: minifiedとtree-shakenされたコード
- **動的APIルート**: `/api/thumb`経由でサムネイル生成
- **Server-Side Rendering**: より良いSEOと初期読み込み性能
- **本番ログ**: サニタイズされたエラーメッセージ
- **強化されたセキュリティ**: 厳格なCSP headerとrate制限

**使用場面**:
- Vercel、Netlifyまたは類似platformのデプロイ
- Dockerコンテナ化
- Node.js runtimeを持つserver環境

### 静的Export (`npm run build:static`)

**目的**: serverが不要な静的ファイルデプロイ
- **事前生成サムネイル**: build時にすべてのサムネイルを作成
- **serverが不要**: CDNまたは静的hostingから配信可能
- **最大パフォーマンス**: runtime時のサムネイル生成なし
- **最高セキュリティ**: server-sideコード実行なし
- **build時処理**: 長いbuild時間、高速runtime

**使用場面**:
- GitHub Pagesデプロイ
- AWS S3 + CloudFront
- 任意の静的ファイルhostingサービス
- 最大セキュリティ環境

## 🚀 クイックスタート

### 1. プレゼンテーションの追加

`public/`フォルダ内にHTMLファイルでディレクトリを作成:

```
public/
├── my-presentation/
│   ├── 1.html
│   ├── 2.html
│   └── 3.html
└── another-presentation/
    ├── 1.html
    └── 2.html
```

### 2. HTMLファイル形式

各HTMLファイルは完全なスライドである必要があります:

#### 基本的なHTMLスライド（常に動作）
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Title</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .slide {
      padding: 40px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="slide">
    <h1>Your Slide Content</h1>
    <p>Add your content here</p>
  </div>
</body>
</html>
```

#### インタラクティブなHTMLスライド（`ALLOW_JAVASCRIPT=true`が必要）
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Slide</title>
  <style>
    /* Your CSS styles here */
    .interactive-button {
      padding: 15px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    .interactive-button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="slide">
    <h1>Interactive Slide</h1>
    <button class="interactive-button" onclick="this.textContent='Clicked!'">
      Click Me!
    </button>
  </div>
  
  <script>
    // JavaScript functionality (only works with ALLOW_JAVASCRIPT=true)
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Interactive slide loaded!');
      // Add your JavaScript interactions here
    });
  </script>
</body>
</html>
```

> **⚠️ JavaScript セキュリティ警告**: 信頼できるコンテンツに対してのみ`ALLOW_JAVASCRIPT=true`を有効にしてください。JavaScriptスライドはHTMLサニタイゼーションをバイパスし、任意のコードを実行できます。

### 3. アプリケーションの実行

```bash
# 開発モード
npm run dev

# 本番build
npm run build
npm start

# 静的export
npm run build:static
npm run preview:static
```

## 📁 プロジェクト構造

```
slideshow-html/
├── app/                          # Next.js App Router
│   ├── api/thumb/               # Thumbnail generation API
│   ├── presentations/[slug]/    # Dynamic presentation routes
│   ├── layout.tsx              # Root layout with security headers
│   └── page.tsx                # Home page with presentation list
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   ├── presentation-viewer.tsx  # Main presentation viewer
│   └── full-screen-viewer.tsx  # Full-screen mode component
├── lib/                        # Utility libraries
│   ├── server-utils.ts         # Server-side utilities
│   ├── html-sanitizer.ts       # HTML security functions
│   ├── logger.ts              # Logging utilities
│   └── utils.ts               # General utilities
├── public/                     # Static files and presentations
│   ├── [presentation-name]/    # Your presentation directories
│   └── thumbs/                # Generated thumbnails (static mode)
├── scripts/                    # Build scripts
│   └── generate-thumbnails-post.ts
└── README.md
```

## 🔒 セキュリティ機能

### 入力検証
- 厳格なslug検証（英数字、ハイフン、アンダースコアのみ）
- Path traversal保護
- ファイルサイズ制限

### HTMLサニタイゼーション
- `ALLOW_JAVASCRIPT`環境変数で設定可能なJavaScriptモード
- セキュリティモード有効時の危険なtag除去（`<script>`、`<iframe>`、`<object>`）
- セキュリティモード有効時のevent handler削除（`onclick`、`onload`など）
- コンテンツサイズ制限

### API保護
- Rate制限（IPあたり10リクエスト/分）
- リクエストtimeout処理
- 安全なPuppeteer設定

### Browserセキュリティ
- Content Security Policy (CSP) header
- X-Frame-Options保護
- Referrer policy設定

## ⚡ パフォーマンス最適化

### 開発モード
- Hot module replacement
- オンデマンドサムネイル生成
- 高速開発のための未最適化画像

### 本番モード
- Code splittingとtree shaking
- 画像最適化
- サムネイル用cache header
- Gzip圧縮

### 静的Exportモード
- 事前生成サムネイル
- server-side処理なし
- CDNフレンドリーな静的asset

## 🌐 Deployment Options

### Vercel (Recommended for SSR)
```bash
npm run build
# Deploy to Vercel
```

### Static Hosting (GitHub Pages, Netlify, etc.)
```bash
npm run build:static
# Deploy the 'out' directory
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🎭 JavaScriptモード

### 概要

スライドショーアプリケーションは2つのコンテンツモードをサポートします：

1. **セキュアモード**（デフォルト）: HTMLサニタイゼーションがセキュリティのためにすべてのJavaScriptを除去
2. **JavaScriptモード**: インタラクティブプレゼンテーションのためにJavaScript機能を保持

### JavaScriptモードの有効化

スライドでJavaScriptを有効にするための環境変数を設定:

```bash
# 方法1: コマンドライン
ALLOW_JAVASCRIPT=true npm run dev

# 方法2: 環境ファイル (.env.local)
ALLOW_JAVASCRIPT=true

# 方法3: 環境変数のexport
export ALLOW_JAVASCRIPT=true
npm run dev
```

### JavaScriptモード機能

`ALLOW_JAVASCRIPT=true`が有効な場合:

- ✅ `<script>`tagが保持され実行される
- ✅ Event handler（`onclick`、`onmouseover`など）が動作
- ✅ JavaScriptでの動的コンテンツ操作
- ✅ インタラクティブアニメーションとエフェクト
- ✅ API呼び出しとデータ取得

### セキュリティに関する考慮事項

⚠️ **重要なセキュリティ警告**:

- **信頼できるコンテンツ**に対してのみJavaScriptモードを有効にしてください
- JavaScriptスライドはHTMLサニタイゼーションをバイパスします
- 悪意のJavaScriptはユーザーデータにアクセスし、有害なアクションを実行できます
- 管理された環境でのみJavaScriptモードを使用してください
- このモードを有効にする前に必ずJavaScriptコードを確認してください

### 使用例

**JavaScriptモードに適している場合**:
- インタラクティブな教育用プレゼンテーション
- データ可視化スライド
- formベースのプレゼンテーション
- アニメーションが多いコンテンツ
- ローカル開発とテスト

**JavaScriptモードを避けるべき場合**:
- ユーザー生成コンテンツ
- 公開されるプレゼンテーション
- 信頼できないHTMLファイル
- 不明なコンテンツを含む本番環境

## 🔧 設定

### 環境変数

ローカル開発用に`.env.local`を作成:

```env
# Development settings
NODE_ENV=development
ENABLE_RATE_LIMITING=false
LOG_LEVEL=debug

# JavaScript Mode - Allow JavaScript in HTML slides
# WARNING: Only enable for trusted content!
ALLOW_JAVASCRIPT=false

# Production settings (uncomment for production)
# NODE_ENV=production
# ENABLE_RATE_LIMITING=true
# ALLOW_JAVASCRIPT=false
# LOG_LEVEL=info
```

### カスタマイズ

- **スタイル**: `app/globals.css`とTailwind設定を変更
- **コンポーネント**: `components/`ディレクトリのコンポーネントをカスタマイズ
- **セキュリティ**: `lib/html-sanitizer.ts`で設定を調整
- **パフォーマンス**: APIルートでcacheを設定

## 🤝 貢献

1. リポジトリをfork
2. feature branchを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をcommit (`git commit -m 'Add amazing feature'`)
4. branchにpush (`git push origin feature/amazing-feature`)
5. Pull Requestを開く

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 トラブルシューティング

### よくある問題

**サムネイルが生成されない**
- Puppeteerの依存関係がインストールされているか確認
- HTMLファイルが有効か検証
- browser consoleでエラーを確認

**Build失敗**
- Node.jsバージョンが18+であることを確認
- `.next`ディレクトリを消去して再ビルド
- TypeScriptエラーを確認

**セキュリティ警告**
- HTMLコンテンツの危険な要素を確認
- ファイル権限を確認
- 環境変数を検証

### Getting Help

- Check the [Issues](../../issues) page
- Review the [Discussions](../../discussions) section
- Submit bug reports with detailed information

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Thumbnails powered by [Puppeteer](https://pptr.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
