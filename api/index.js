const app = require('../src/server');

module.exports = (req, res) => {
  // Restore original request URL from Vercel's x-matched-path header
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath) {
    req.url = matchedPath;
  }
  return app(req, res);
};
