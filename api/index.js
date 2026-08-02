const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { manifest, handleCatalog, handleMeta, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');
const top50Hub = require('../src/data_top50.json');

const app = express();

app.use(cors());

// Root home page
app.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const manifestUrl = `${protocol}://${host}/manifest.json`;
  const stremioUrl = manifestUrl.replace(/^http/, 'stremio');
  const playlistUrl = `${protocol}://${host}/playlist.m3u8`;
  const tvboxUrl = `${protocol}://${host}/tvbox.json`;
  const top50Url = `${protocol}://${host}/top50.json`;

  res.send(`
    <!DOCTYPE html>
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
        <div class="badge">已合并去重 ${vodSources.length} 个中文 VOD 接口</div>
        <div class="badge" style="background: #10b981;">已打包 StreamingSitesHub 前 ${top50Hub.length} 精选免费站点</div>
        <p>本 Addon 完美支持 Apple TV Strand App、SenPlayer、VidHub、Infuse、Stremio 等多种播放器。</p>
        
        <h3>1. Strand App / Stremio 专用 Addon 链接 (Manifest URL)：</h3>
        <div class="url-box">${manifestUrl}</div>

        <h3>2. SenPlayer / VidHub / Infuse (M3U8 订阅 URL)：</h3>
        <div class="url-box">${playlistUrl}</div>

        <h3>3. TVBox / CatVod 接口 URL：</h3>
        <div class="url-box">${tvboxUrl}</div>

        <h3>4. StreamingSitesHub Top 50 精选站点 JSON：</h3>
        <div class="url-box">${top50Url}</div>

        <a class="btn" href="${stremioUrl}">一键添加到 Stremio / Strand App</a>

        <h3>StreamingSitesHub Top 50 精选免费站点预览:</h3>
        <div class="site-grid">
          ${top50Hub.slice(0, 12).map(s => `
            <div class="site-item">
              #${s.rank} <strong>${s.name}</strong><br>
              <a href="${s.url}" target="_blank" rel="noopener">${s.domain}</a>
            </div>
          `).join('')}
        </div>

        <p style="margin-top: 20px;"><a href="/sources.json" style="color: #38bdf8;">查看去重后的 301 个源列表 (sources.json)</a> | <a href="/top50.json" style="color: #10b981;">查看 Top 50 站点列表 (top50.json)</a></p>
      </div>
    </body>
    </html>
  `);
});

// Stremio Addon manifest
app.get(['/manifest.json', '/billy-manifest.json', '/api/manifest', '/api/billy-manifest'], (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(manifest);
});

// StreamingSitesHub Top 50 JSON route
app.get(['/top50.json', '/top50', '/api/top50'], (req, res) => {
  res.json(top50Hub);
});

// M3U & M3U8 Playlist route for SenPlayer / Infuse / VidHub
app.get(['/playlist.m3u8', '/playlist.m3u', '/live.m3u8', '/tv.m3u8', '/channels.m3u8', '/api/playlist', '/api/playlist.m3u8', '/api/playlist.m3u'], (req, res) => {
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
  res.send(m3u);
});

// TVBox JSON format route
app.get(['/tvbox.json', '/api/tvbox'], (req, res) => {
  res.json({
    sites: vodSources.map(src => ({
      key: src.id,
      name: src.name,
      type: src.type || 1,
      api: src.api,
      searchable: 1,
      quickSearch: 1,
      filterable: 1
    }))
  });
});

// Catalog route
app.get(['/catalog/:type/:id.json', '/api/catalog/:type/:id.json'], async (req, res) => {
  try {
    const type = req.params.type || 'movie';
    const id = req.params.id || 'billy_maccms_movie';
    const result = await handleCatalog(type, id);
    res.json(result);
  } catch (e) {
    res.json({ metas: [] });
  }
});

app.get(['/catalog/:type/:id/:extra.json', '/api/catalog/:type/:id/:extra.json'], async (req, res) => {
  try {
    const type = req.params.type || 'movie';
    const id = req.params.id || 'billy_maccms_movie';
    const extraStr = req.params.extra || '';
    const extraParams = {};
    if (extraStr.includes('search=')) {
      const match = extraStr.match(/search=([^&]+)/);
      if (match) extraParams.search = decodeURIComponent(match[1]);
    }
    const result = await handleCatalog(type, id, extraParams);
    res.json(result);
  } catch (e) {
    res.json({ metas: [] });
  }
});

// Meta route
app.get(['/meta/:type/:id.json', '/api/meta/:type/:id.json'], async (req, res) => {
  try {
    const result = await handleMeta(req.params.type, req.params.id);
    res.json(result);
  } catch (e) {
    res.json({ meta: { id: req.params.id, type: req.params.type, name: "未知" } });
  }
});

// Stream route
app.get(['/stream/:type/:id.json', '/api/stream/:type/:id.json'], async (req, res) => {
  try {
    const result = await handleStream(req.params.type, req.params.id);
    res.json(result);
  } catch (e) {
    res.json({ streams: [] });
  }
});

// Sources raw JSON
app.get(['/sources.json', '/api/sources'], (req, res) => {
  res.json(vodSources);
});

module.exports = app;
