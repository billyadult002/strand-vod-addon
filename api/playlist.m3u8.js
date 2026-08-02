const { vodSources } = require('../src/maccms');

let top50Hub = [];
try {
  top50Hub = require('../src/data_top50.json');
} catch (e) {
  top50Hub = [];
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  
  let m3u = '#EXTM3U\n';
  if (Array.isArray(vodSources)) {
    vodSources.forEach((src) => {
      m3u += `#EXTINF:-1 group-title="中文VOD影视源", ${src.name}\n${src.api}\n`;
    });
  }
  if (Array.isArray(top50Hub)) {
    top50Hub.forEach((site) => {
      m3u += `#EXTINF:-1 group-title="StreamingSitesHub Top 50", #${site.rank || ''} ${site.name || ''}\n${site.url || ''}\n`;
    });
  }
  res.statusCode = 200;
  return res.end(m3u);
};
