/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "true";   // ← 環境変数で判定

module.exports = {
  output: isStatic ? "export" : undefined,               // 静的ビルド時だけ 'export'
  images: {
    unoptimized: isStatic,                               // export 時は必須
  },
};
