const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { manifest, handleCatalog, handleMeta, handleStream } = require('./addon');
const { vodSources } = require('./maccms');

const app = express();
const PORT = process.env.PORT || 7000;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Root home page
app.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const manifestUrl = `${protocol}://${host}/manifest.json`;
  const stremioUrl = manifestUrl.replace(/^http/, 'stremio');
  const playlistUrl = `${protocol}://${host}/playlist.m3u`;
  const tvboxUrl = `${protocol}://${host}/tvbox.json`;

  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Apple TV Strand / SenPlayer VOD Addon</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
        .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 640px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; font-size: 1.8rem; margin-top: 0; }
        .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; display: inline-block; margin-bottom: 16px; }
        .url-box { background: #0f172a; border: 1px solid #334155; padding: 12px 16px; border-radius: 8px; font-family: monospace; word-break: break-all; color: #a5f3fc; font-size: 0.95rem; margin: 12px 0; }
        .btn { display: inline-block; background: #0284c7; color: white; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 12px; }
        .btn:hover { background: #0369a1; }
        ol { padding-left: 20px; line-height: 1.7; color: #cbd5e1; }
        code { background: #334155; padding: 2px 6px; border-radius: 4px; color: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Apple TV Strand / SenPlayer 中文影视 Addon</h1>
        <div class="badge">已合并去重 ${vodSources.length} 个 VOD 资源接口</div>
        <p>本 Addon 支持 Apple TV Strand App、SenPlayer、VidHub、Stremio 等多种播放器。</p>
        
        <h3>1. Strand App / Stremio (Manifest URL)：</h3>
        <div class="url-box">${manifestUrl}</div>

        <h3>2. SenPlayer / VidHub / Infuse (M3U 订阅 URL)：</h3>
        <div class="url-box">${playlistUrl}</div>

        <h3>3. TVBox / CatVod 接口 URL：</h3>
        <div class="url-box">${tvboxUrl}</div>

        <a class="btn" href="${stremioUrl}">一键添加到 Stremio / Strand App</a>

        <h3>使用方法 (SenPlayer):</h3>
        <ol>
          <li>在 Apple TV 打开 <strong>SenPlayer</strong>。</li>
          <li>进入 <strong>设置 -> 网络订阅 / 资源库 -> 添加 M3U 订阅</strong>。</li>
          <li>输入订阅链接：<code>${playlistUrl}</code> 即可导入 301 个源。</li>
        </ol>

        <p><a href="/sources.json" style="color: #38bdf8;">查看合并去重后的 301 个源列表 (sources.json)</a></p>
      </div>
    </body>
    </html>
  `);
});

// Stremio Addon manifest
app.get(['/manifest.json', '*manifest.json*'], (req, res) => {
  res.json(manifest);
});

// M3U Playlist route for SenPlayer / Infuse / VidHub
app.get(['/playlist.m3u', '*playlist.m3u*'], (req, res) => {
  res.setHeader('Content-Type', 'audio/x-mpegurl');
  let m3u = '#EXTM3U\n';
  vodSources.forEach((src) => {
    m3u += `#EXTINF:-1 group-title="中文VOD影视源", ${src.name}\n${src.api}\n`;
  });
  res.send(m3u);
});

// TVBox JSON format route
app.get(['/tvbox.json', '*tvbox.json*'], (req, res) => {
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
app.get(['/catalog/:type/:id.json', '/catalog/:type/:id/:extra.json'], async (req, res) => {
  try {
    const type = req.params.type || 'movie';
    const id = req.params.id || 'maccms_movie';
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
app.get('/meta/:type/:id.json', async (req, res) => {
  try {
    const result = await handleMeta(req.params.type, req.params.id);
    res.json(result);
  } catch (e) {
    res.json({ meta: { id: req.params.id, type: req.params.type, name: "未知" } });
  }
});

// Stream route
app.get('/stream/:type/:id.json', async (req, res) => {
  try {
    const result = await handleStream(req.params.type, req.params.id);
    res.json(result);
  } catch (e) {
    res.json({ streams: [] });
  }
});

// Sources raw JSON
app.get(['/sources.json', '*sources.json*'], (req, res) => {
  res.json(vodSources);
});

app.listen(PORT, () => {
  const localIp = getLocalIp();
  console.log(`\n==================================================`);
  console.log(`🚀 VOD Addon Server running!`);
  console.log(`📺 Manifest URL:       http://${localIp}:${PORT}/manifest.json`);
  console.log(`📺 SenPlayer M3U URL:   http://${localIp}:${PORT}/playlist.m3u`);
  console.log(`==================================================\n`);
});

module.exports = app;
