const fs = require('fs');
const path = require('path');
const { vodSources } = require('../src/maccms');
const top50Hub = require('../src/data_top50.json');

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

let m3u = '#EXTM3U\n';
vodSources.forEach((src) => {
  m3u += `#EXTINF:-1 group-title="中文VOD影视源", ${src.name}\n${src.api}\n`;
});
top50Hub.forEach((site) => {
  m3u += `#EXTINF:-1 group-title="StreamingSitesHub Top 50", #${site.rank} ${site.name}\n${site.url}\n`;
});

fs.writeFileSync(path.join(publicDir, 'playlist.m3u8'), m3u, 'utf8');
fs.writeFileSync(path.join(publicDir, 'playlist.m3u'), m3u, 'utf8');
fs.writeFileSync(path.join(publicDir, 'live.m3u8'), m3u, 'utf8');
fs.writeFileSync(path.join(publicDir, 'tv.m3u8'), m3u, 'utf8');
fs.writeFileSync(path.join(publicDir, 'channels.m3u8'), m3u, 'utf8');

console.log("✅ Static M3U & M3U8 files generated in public/");
