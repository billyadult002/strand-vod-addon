const vodSources = [
  { id: "ffm3u8", name: "非凡资源 (FFM3U8)", api: "https://cj.ffzyapi.com/api.php/provide/vod/" },
  { id: "lzm3u8", name: "暴风资源 (LZM3U8)", api: "https://bfzyapi.com/api.php/provide/vod/" },
  { id: "ikm3u8", name: "爱客资源 (IKM3U8)", api: "https://ikunzyapi.com/api.php/provide/vod/" },
  { id: "hnm3u8", name: "红牛资源 (HNM3U8)", api: "https://www.hongniuzy2.com/api.php/provide/vod/" },
  { id: "snm3u8", name: "索尼资源 (SNM3U8)", api: "https://suoniapi.com/api.php/provide/vod/" },
  { id: "kuaikanyun", name: "快看资源 (KUAICK)", api: "https://kuaikanzy.com/api.php/provide/vod/" },
  { id: "wjm3u8", name: "无尽资源 (WJM3U8)", api: "https://api.wujinapi.me/api.php/provide/vod/" },
  { id: "xlm3u8", name: "新浪资源 (XLM3U8)", api: "https://api.xinlangapi.com/api.php/provide/vod/" }
];

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
  vodSources.forEach((src) => {
    m3u += `#EXTINF:-1 group-title="中文VOD影视源", ${src.name}\n${src.api}\n`;
  });
  if (Array.isArray(top50Hub)) {
    top50Hub.forEach((site) => {
      m3u += `#EXTINF:-1 group-title="StreamingSitesHub Top 50", #${site.rank} ${site.name}\n${site.url}\n`;
    });
  }
  return res.status(200).send(m3u);
};
