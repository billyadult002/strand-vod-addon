// Plain Node.js Vercel Serverless Function — NO Express
// All routing is done manually via req.url
const { manifest, handleCatalog, handleMeta, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');

let top50Hub = [];
try {
  top50Hub = require('../src/data_top50.json');
} catch (e) {
  top50Hub = [];
}

function generateM3U() {
  let m3u = '#EXTM3U\n';
  (vodSources || []).forEach((src) => {
    m3u += `#EXTINF:-1 group-title="中文VOD影视源", ${src.name}\n${src.api}\n`;
  });
  (top50Hub || []).forEach((site) => {
    m3u += `#EXTINF:-1 group-title="StreamingSitesHub Top 50", #${site.rank} ${site.name}\n${site.url}\n`;
  });
  return m3u;
}

function sendJSON(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(JSON.stringify(data));
}

function sendM3U(res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(generateM3U());
}

function sendHTML(res, html) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(html);
}

function getLandingHTML(host) {
  const baseUrl = `https://${host}`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apple TV Strand / Stremio VOD & Top50 Addon</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
    .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 720px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; font-size: 1.8rem; margin-top: 0; }
    .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; display: inline-block; margin-bottom: 16px; margin-right: 8px; }
    .url-box { background: #0f172a; border: 1px solid #334155; padding: 12px 16px; border-radius: 8px; font-family: monospace; word-break: break-all; color: #a5f3fc; font-size: 0.95rem; margin: 12px 0; }
    .btn { display: inline-block; background: #0284c7; color: white; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 12px; }
    .btn:hover { background: #0369a1; }
    ol { padding-left: 20px; line-height: 1.7; color: #cbd5e1; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; color: #f1f5f9; }
    .site-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 16px; }
    .site-item { background: #0f172a; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #334155; }
    .site-item a { color: #38bdf8; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Apple TV Strand / Stremio 影视 Addon (v2.1)</h1>
    <div class="badge">已合并去重 ${(vodSources || []).length} 个中文 VOD 接口</div>
    <div class="badge" style="background: #10b981;">已打包 StreamingSitesHub 前 ${top50Hub.length} 精选免费站点</div>
    <p>本 Addon 完美支持 Apple TV Strand App、SenPlayer、VidHub、Infuse、Stremio 等多种播放器。</p>

    <h3>1. Strand App / Stremio 专用 Addon 链接 (Manifest URL)：</h3>
    <div class="url-box">${baseUrl}/manifest.json</div>

    <h3>2. SenPlayer / VidHub / Infuse (M3U8 订阅 URL)：</h3>
    <div class="url-box">${baseUrl}/playlist.m3u8</div>

    <h3>3. TVBox / CatVod 接口 URL：</h3>
    <div class="url-box">${baseUrl}/tvbox.json</div>

    <h3>4. StreamingSitesHub Top 50 精选站点 JSON：</h3>
    <div class="url-box">${baseUrl}/top50.json</div>

    <a class="btn" href="stremio://${host}/manifest.json">一键添加到 Stremio / Strand App</a>

    <h3>StreamingSitesHub Top 50 精选免费站点预览:</h3>
    <div class="site-grid">
      ${top50Hub.slice(0, 12).map(s => `
        <div class="site-item">
          #${s.rank} <strong>${s.name}</strong><br>
          <a href="${s.url}" target="_blank" rel="noopener">${s.domain}</a>
        </div>
      `).join('')}
    </div>

    <p style="margin-top: 20px;"><a href="/sources.json" style="color: #38bdf8;">查看去重后的源列表 (sources.json)</a> | <a href="/top50.json" style="color: #10b981;">查看 Top 50 站点列表 (top50.json)</a></p>
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  const url = (req.url || '/').split('?')[0];
  const host = req.headers.host || 'strand-vod-billy.vercel.app';

  // Debug route
  if (url === '/debug') {
    return sendJSON(res, { url: req.url, path: url, host, method: req.method });
  }

  // Homepage
  if (url === '/' || url === '') {
    return sendHTML(res, getLandingHTML(host));
  }

  // Manifest
  if (url === '/manifest.json' || url === '/billy-manifest.json') {
    return sendJSON(res, manifest);
  }

  // Top50
  if (url === '/top50.json' || url === '/top50') {
    return sendJSON(res, top50Hub);
  }

  // TVBox
  if (url === '/tvbox.json' || url === '/tvbox') {
    return sendJSON(res, {
      sites: (vodSources || []).map(src => ({
        key: src.id,
        name: src.name,
        type: src.type || 1,
        api: src.api,
        searchable: 1,
        quickSearch: 1,
        filterable: 1
      }))
    });
  }

  // Sources
  if (url === '/sources.json' || url === '/sources') {
    return sendJSON(res, vodSources || []);
  }

  // M3U8 / M3U Playlist — THE MAIN TARGET
  if (url === '/playlist.m3u8' || url === '/playlist.m3u' || url === '/playlist' ||
      url === '/live.m3u8' || url === '/tv.m3u8' || url === '/channels.m3u8') {
    return sendM3U(res);
  }

  // Catalog routes
  const catalogMatch = url.match(/^\/catalog\/(\w+)\/([^/]+)\.json$/);
  if (catalogMatch) {
    try {
      const result = await handleCatalog(catalogMatch[1], catalogMatch[2]);
      return sendJSON(res, result);
    } catch (e) {
      return sendJSON(res, { metas: [] });
    }
  }

  const catalogExtraMatch = url.match(/^\/catalog\/(\w+)\/([^/]+)\/(.+)\.json$/);
  if (catalogExtraMatch) {
    try {
      const extraStr = catalogExtraMatch[3] || '';
      const extraParams = {};
      if (extraStr.includes('search=')) {
        const m = extraStr.match(/search=([^&]+)/);
        if (m) extraParams.search = decodeURIComponent(m[1]);
      }
      const result = await handleCatalog(catalogExtraMatch[1], catalogExtraMatch[2], extraParams);
      return sendJSON(res, result);
    } catch (e) {
      return sendJSON(res, { metas: [] });
    }
  }

  // Meta routes
  const metaMatch = url.match(/^\/meta\/(\w+)\/(.+)\.json$/);
  if (metaMatch) {
    try {
      const result = await handleMeta(metaMatch[1], metaMatch[2]);
      return sendJSON(res, result);
    } catch (e) {
      return sendJSON(res, { meta: { id: metaMatch[2], type: metaMatch[1], name: "未知" } });
    }
  }

  // Stream routes
  const streamMatch = url.match(/^\/stream\/(\w+)\/(.+)\.json$/);
  if (streamMatch) {
    try {
      const result = await handleStream(streamMatch[1], streamMatch[2]);
      return sendJSON(res, result);
    } catch (e) {
      return sendJSON(res, { streams: [] });
    }
  }

  // Default fallback: serve M3U8 playlist for any unmatched route
  return sendM3U(res);
};
