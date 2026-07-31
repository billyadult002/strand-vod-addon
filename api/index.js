const app = require('../src/server');

module.exports = (req, res) => {
  const targetPath = req.headers['x-matched-path'] || req.url || '/';
  req.url = targetPath.replace(/^\/api\/index\.js/, '').replace(/^\/api/, '') || '/';
  if (!req.url.startsWith('/')) {
    req.url = '/' + req.url;
  }
  return app(req, res);
};
