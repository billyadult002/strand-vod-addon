const { vodSources } = require('../src/maccms');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
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
};
