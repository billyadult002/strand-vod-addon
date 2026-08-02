const { vodSources } = require('../src/maccms');
const top50Hub = require('../src/data_top50.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  let m3u = '#EXTM3U\n';
  vodSources.forEach((src) => {
    m3u += `#EXTINF:-1 group-title="中文VOD影视源", ${src.name}\n${src.api}\n`;
  });
  top50Hub.forEach((site) => {
    m3u += `#EXTINF:-1 group-title="StreamingSitesHub Top 50", #${site.rank} ${site.name}\n${site.url}\n`;
  });
  res.status(200).send(m3u);
};
