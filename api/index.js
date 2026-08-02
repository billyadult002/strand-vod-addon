const { manifest, handleCatalog, handleMeta, handleStream } = require('../src/addon');
const { vodSources } = require('../src/maccms');
const top50Hub = require('../src/data_top50.json');

module.exports = async (req, res) => {
  const url = (req.url || req.originalUrl || '').toLowerCase();

  // 1. Manifest
  if (url.includes('manifest')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(manifest);
  }

  // 2. Top 50
  if (url.includes('top50')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(top50Hub);
  }

  // 3. TVBox
  if (url.includes('tvbox')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
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
  }

  // 4. Sources
  if (url.includes('sources')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(vodSources);
  }

  // 5. Catalog
  if (url.includes('/catalog/')) {
    try {
      const parts = url.split('/catalog/')[1].split('/');
      const type = parts[0] || 'movie';
      const idStr = parts[1] || 'billy_maccms_movie.json';
      const id = idStr.replace('.json', '');
      let extraParams = {};
      if (parts[2]) {
        const extraStr = parts[2].replace('.json', '');
        if (extraStr.includes('search=')) {
          const match = extraStr.match(/search=([^&]+)/);
          if (match) extraParams.search = decodeURIComponent(match[1]);
        }
      }
      const result = await handleCatalog(type, id, extraParams);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(result);
    } catch (e) {
      return res.status(200).json({ metas: [] });
    }
  }

  // 6. Meta
  if (url.includes('/meta/')) {
    try {
      const parts = url.split('/meta/')[1].split('/');
      const type = parts[0] || 'movie';
      const id = (parts[1] || '').replace('.json', '');
      const result = await handleMeta(type, id);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(result);
    } catch (e) {
      return res.status(200).json({ meta: { id: "unknown", type: "movie", name: "未知" } });
    }
  }

  // 7. Stream
  if (url.includes('/stream/')) {
    try {
      const parts = url.split('/stream/')[1].split('/');
      const type = parts[0] || 'movie';
      const id = (parts[1] || '').replace('.json', '');
      const result = await handleStream(type, id);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(result);
    } catch (e) {
      return res.status(200).json({ streams: [] });
    }
  }

  // DEFAULT / PLAYLIST / ALL OTHER PATHS -> RETURN M3U8 PLAYLIST
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
  return res.status(200).send(m3u);
};
