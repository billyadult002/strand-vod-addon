const playlistM3u8Handler = require('./playlist.m3u8');

module.exports = (req, res) => {
  return playlistM3u8Handler(req, res);
};
