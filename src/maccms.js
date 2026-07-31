const axios = require('axios');
const https = require('https');
const path = require('path');
const fs = require('fs');

// Load deduplicated VOD sources
const sourcesPath = path.join(__dirname, '../data/vod_sources.json');
let vodSources = [];

try {
  vodSources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
} catch (e) {
  console.error('Failed to load vod_sources.json:', e.message);
}

// HTTPS Agent ignoring self-signed SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

const client = axios.create({
  timeout: 4500,
  httpsAgent,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  }
});

/**
 * Fetch detail from a single MacCMS VOD API endpoint
 */
async function fetchSourceSearch(source, keyword) {
  try {
    const url = `${source.api}?ac=detail&wd=${encodeURIComponent(keyword)}`;
    const res = await client.get(url);
    const data = res.data;

    let items = [];
    if (data && Array.isArray(data.list)) {
      items = data.list;
    } else if (data && Array.isArray(data.data)) {
      items = data.data;
    }

    return items.map(item => ({
      sourceId: source.id,
      sourceName: source.name,
      vodId: item.vod_id,
      name: item.vod_name,
      pic: item.vod_pic,
      remarks: item.vod_remarks || '',
      actor: item.vod_actor || '',
      director: item.vod_director || '',
      content: item.vod_content || '',
      year: item.vod_year || '',
      area: item.vod_area || '',
      type: item.type_name || '',
      playFrom: item.vod_play_from || '',
      playUrl: item.vod_play_url || ''
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Search across top active VOD sources in parallel
 */
async function searchVOD(keyword, limitSources = 20) {
  if (!keyword || !keyword.trim()) return [];

  // Pick top sources or randomize sample for variety
  const targetSources = vodSources.slice(0, limitSources);

  const searchPromises = targetSources.map(src => fetchSourceSearch(src, keyword.trim()));
  const resultsArray = await Promise.all(searchPromises);

  const mergedMap = new Map();

  for (const items of resultsArray) {
    for (const item of items) {
      if (!item.name) continue;
      
      const cleanName = item.name.trim();
      const key = cleanName.toLowerCase();

      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          id: `vod:${encodeURIComponent(cleanName)}`,
          name: cleanName,
          type: item.type && item.type.includes('漫') ? 'series' : (item.playUrl.includes('第2集') || item.playUrl.includes('$2') || item.playUrl.includes('E02') ? 'series' : 'movie'),
          poster: item.pic || '',
          description: item.content || item.remarks || '',
          director: item.director,
          actor: item.actor,
          year: item.year,
          sources: [item]
        });
      } else {
        const existing = mergedMap.get(key);
        if (!existing.poster && item.pic) existing.poster = item.pic;
        if (!existing.description && item.content) existing.description = item.content;
        existing.sources.push(item);
      }
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Get recent items for main catalog display
 */
async function getCatalogItems(type = 'movie', limit = 20) {
  // Query top 5 reliable sources for catalog recommendations
  const topSources = vodSources.slice(0, 8);
  const promises = topSources.map(async src => {
    try {
      const url = `${src.api}?ac=detail&pagesize=10`;
      const res = await client.get(url);
      if (res.data && Array.isArray(res.data.list)) {
        return res.data.list.map(item => ({
          sourceId: src.id,
          sourceName: src.name,
          vodId: item.vod_id,
          name: item.vod_name,
          pic: item.vod_pic,
          remarks: item.vod_remarks || '',
          content: item.vod_content || '',
          playUrl: item.vod_play_url || ''
        }));
      }
    } catch (e) {}
    return [];
  });

  const rawLists = await Promise.all(promises);
  const mergedMap = new Map();

  for (const list of rawLists) {
    for (const item of list) {
      if (!item.name) continue;
      const key = item.name.trim().toLowerCase();
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          id: `vod:${encodeURIComponent(item.name.trim())}`,
          name: item.name.trim(),
          type: type,
          poster: item.pic || '',
          description: item.remarks || item.content || ''
        });
      }
    }
  }

  return Array.from(mergedMap.values()).slice(0, limit);
}

/**
 * Parse vod_play_url into list of playable video streams
 */
function parseStreamsFromPlayUrl(playUrlStr, sourceName) {
  if (!playUrlStr) return [];
  const streams = [];

  // MacCMS play_url format: "第1集$http://...m3u8#第2集$http://...m3u8$$$第1集$http://..."
  const playFromGroups = playUrlStr.split('$$$');

  for (const group of playFromGroups) {
    const episodes = group.split('#');
    for (const ep of episodes) {
      if (!ep) continue;
      const parts = ep.split('$');
      let title = parts.length > 1 ? parts[0] : '播放';
      let url = parts.length > 1 ? parts[1] : parts[0];

      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        // Filter out m3u8 or mp4
        streams.push({
          title: `[${sourceName}] ${title.trim()}`,
          name: sourceName,
          url: url.trim(),
          behaviorHints: {
            notSupported: false
          }
        });
      }
    }
  }

  return streams;
}

module.exports = {
  vodSources,
  searchVOD,
  getCatalogItems,
  parseStreamsFromPlayUrl
};
