const app = require('../src/server');

module.exports = (req, res) => {
  if (req.url) {
    if (req.url.startsWith('/api/index.js')) {
      req.url = req.url.replace('/api/index.js', '') || '/';
    } else if (req.url.startsWith('/api')) {
      req.url = req.url.replace('/api', '') || '/';
    }
  }
  return app(req, res);
};
