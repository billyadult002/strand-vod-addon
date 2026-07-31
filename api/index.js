const app = require('../src/server');

module.exports = (req, res) => {
  if (req.url && req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  }
  return app(req, res);
};
