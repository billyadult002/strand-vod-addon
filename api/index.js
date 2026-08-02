const express = require('express');
const cors = require('cors');
const { manifest, handleCatalog, handleMeta, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');

let top50Hub = [];
try {
  top50Hub = require('../src/data_top50.json');
} catch (e) {
  top50Hub = [];
}

const app = express();
app.use(cors());

// Universal Playlist generator with bulletproof try/catch
const sendPlaylist = (req, res) => {
  try {
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
    return res.status(200).send(m3u);
  } catch (err) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
    return res.status(200).send('#EXTM3U\n#EXTINF:-1, Billy VOD Addon\nhttps://strand-vod-billy.vercel.app/manifest.json\n');
  }
};

// TOP-LEVEL INTERCEPTOR: Catch ALL playlist requests & non-API routes FIRST
app.use((req, res, next) => {
  const url = (req.url || '').toLowerCase();
  const isApiJson = (
    url.includes('manifest') ||
    url.includes('top50') ||
    url.includes('tvbox') ||
    url.includes('sources') ||
    url.includes('catalog') ||
    url.includes('meta') ||
    url.includes('stream')
  );

  if (!isApiJson || url.includes('m3u') || url.includes('playlist') || url.includes('live') || url.includes('tv') || url.includes('channels')) {
    return sendPlaylist(req, res);
  }
  next();
});

// 1. Manifest
app.all(['/manifest.json', '/billy-manifest.json', '/api/manifest.json', '/api/manifest', '/api/billy-manifest.json'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(manifest);
});

// 2. Top 50
app.all(['/top50.json', '/top50', '/api/top50.json', '/api/top50'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(top50Hub);
});

// 3. TVBox
app.all(['/tvbox.json', '/api/tvbox.json', '/api/tvbox'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
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

// 4. Sources
app.all(['/sources.json', '/api/sources.json', '/api/sources'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(vodSources);
});

// 5. Catalog
app.all(['/catalog/:type/:id.json', '/api/catalog/:type/:id.json'], async (req, res) => {
  try {
    const type = req.params.type || 'movie';
    const id = req.params.id || 'billy_maccms_movie';
    const result = await handleCatalog(type, id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ metas: [] });
  }
});

app.all(['/catalog/:type/:id/:extra.json', '/api/catalog/:type/:id/:extra.json'], async (req, res) => {
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ metas: [] });
  }
});

// 6. Meta
app.all(['/meta/:type/:id.json', '/api/meta/:type/:id.json'], async (req, res) => {
  try {
    const result = await handleMeta(req.params.type, req.params.id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ meta: { id: "unknown", type: "movie", name: "未知" } });
  }
});

// 7. Stream
app.all(['/stream/:type/:id.json', '/api/stream/:type/:id.json'], async (req, res) => {
  try {
    const result = await handleStream(req.params.type, req.params.id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ streams: [] });
  }
});

// Fallback all other GET requests to playlist M3U8
app.use(sendPlaylist);

module.exports = app;
