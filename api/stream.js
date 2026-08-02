const { handleStream } = require('../src/addon');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  try {
    const url = req.url || '';
    const parts = url.split('?')[0].split('/').filter(Boolean);
    const type = parts[1] || 'movie';
    const id = (parts[2] || '').replace('.json', '');
    const result = await handleStream(type, id);
    res.status(200).json(result);
  } catch (e) {
    res.status(200).json({ streams: [] });
  }
};
