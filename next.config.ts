/** @type {import('next').NextConfig} */

// 環境変数で静的エクスポートを判定
const isStatic = process.env.STATIC_EXPORT === "true";

// GitHub Actionsでの実行かを判定
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

// リポジトリ名（GitHub Pagesのサブパスになる部分）
const repo = 'slideshow-html';

const nextConfig = {
  /**
   * GitHub Pagesにデプロイする場合、リポジトリ名がサブパスとしてURLに含まれるため、
   * basePathとassetPrefixをリポジトリ名に設定する必要があります。
   * GITHUB_ACTIONS環境変数は、GitHub Actionsの実行中には自動的に 'true' に設定されます。
   */
  basePath: isGithubActions ? `/${repo}` : '',
  assetPrefix: isGithubActions ? `/${repo}/` : '',

  // 静的サイトとして出力する設定
  output: isStatic ? "export" : undefined,

  // 静的サイトではNext.jsの画像最適化が使えないため、無効化する
  images: {
    unoptimized: isStatic,
  },
  
  reactStrictMode: true,
};

module.exports = nextConfig;
