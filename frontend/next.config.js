/** @type {import('next').NextConfig} */
module.exports = {
  // Electron向けの設定
  distDir: '.next',
  assetPrefix: './',

  // 静的エクスポートの設定
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      // 必要に応じて、その他のページも追加...
    };
  }
};
