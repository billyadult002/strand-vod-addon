const playlistM3u8 = require('./playlist.m3u8');

module.exports = (req, res) => {
  return playlistM3u8(req, res);
};
