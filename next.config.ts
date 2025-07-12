/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "true";   // ← 環境変数で判定

// GitHub Pagesのリポジトリ名（サブディレクトリ）を設定
// 例: https://username.github.io/repository-name の場合は '/repository-name'
const basePath = isStatic ? process.env.NEXT_PUBLIC_BASE_PATH || '' : '';

module.exports = {
  output: isStatic ? "export" : undefined,               // 静的ビルド時だけ 'export'
  basePath: basePath,                                    // GitHub Pagesのサブパス
  assetPrefix: basePath,                                 // アセットファイルのプレフィックス
  trailingSlash: true,                                   // GitHub Pagesとの互換性向上
  images: {
    unoptimized: isStatic,                               // export 時は必須
  },
};
