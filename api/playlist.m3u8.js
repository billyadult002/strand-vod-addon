const playlistHandler = require('./playlist');

module.exports = (req, res) => {
  return playlistHandler(req, res);
};
