const { handleCatalog } = require('../src/addon');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  try {
    const url = req.url || '';
    const parts = url.split('?')[0].split('/').filter(Boolean);
    // URL pattern: /catalog/movie/maccms_movie.json or /catalog/movie/maccms_movie/search=query.json
    const type = parts[1] || 'movie';
    let id = (parts[2] || 'maccms_movie').replace('.json', '');
    let extraStr = parts[3] || '';

    const extraParams = {};
    if (extraStr.includes('search=')) {
      const match = extraStr.match(/search=([^&]+)/);
      if (match) extraParams.search = decodeURIComponent(match[1]);
    }
    const result = await handleCatalog(type, id, extraParams);
    res.status(200).json(result);
  } catch (e) {
    res.status(200).json({ metas: [] });
  }
};
