const express = require('express');
const cors = require('cors');
const { manifest, handleCatalog, handleMeta, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');
const top50Hub = require('../src/data_top50.json');

const app = express();
app.use(cors());

// Playlist handler (M3U & M3U8)
const sendPlaylist = (req, res) => {
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

app.get(['/playlist.m3u8', '/playlist.m3u', '/live.m3u8', '/tv.m3u8', '/channels.m3u8', '/api/playlist.m3u8', '/api/playlist.m3u', '/api/playlist', '/api/live.m3u8'], sendPlaylist);

// Manifest
app.get(['/manifest.json', '/billy-manifest.json', '/api/manifest.json', '/api/manifest', '/api/billy-manifest.json'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(manifest);
});

// Top 50
app.get(['/top50.json', '/top50', '/api/top50.json', '/api/top50'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(top50Hub);
});

// TVBox
app.get(['/tvbox.json', '/api/tvbox.json', '/api/tvbox'], (req, res) => {
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

// Sources
app.get(['/sources.json', '/api/sources.json', '/api/sources'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(vodSources);
});

// Catalog route
app.get(['/catalog/:type/:id.json', '/api/catalog/:type/:id.json'], async (req, res) => {
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ metas: [] });
  }
});

// Meta route
app.get(['/meta/:type/:id.json', '/api/meta/:type/:id.json'], async (req, res) => {
  try {
    const result = await handleMeta(req.params.type, req.params.id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ meta: { id: "unknown", type: "movie", name: "未知" } });
  }
});

// Stream route
app.get(['/stream/:type/:id.json', '/api/stream/:type/:id.json'], async (req, res) => {
  try {
    const result = await handleStream(req.params.type, req.params.id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (e) {
    res.json({ streams: [] });
  }
});

// Fallback all other GET requests to playlist M3U8
app.get('*', sendPlaylist);

module.exports = app;
