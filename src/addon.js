const { vodSources, searchVOD, getCatalogItems, parseStreamsFromPlayUrl } = require('./maccms');

const manifest = {
  id: "org.strand.maccms.vod",
  version: "1.0.0",
  name: "中文聚合影视 (Strand VOD Addon)",
  description: "适用于 Apple TV Strand / Stremio 的中文 301+ 影视聚合 Addon",
  logo: "https://v.strem.io/images/stremio-logo-white.png",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "maccms_movie",
      name: "中文电影",
      extra: [
        { name: "search", isRequired: false },
        { name: "skip", isRequired: false }
      ]
    },
    {
      type: "series",
      id: "maccms_series",
      name: "中文剧集",
      extra: [
        { name: "search", isRequired: false },
        { name: "skip", isRequired: false }
      ]
    }
  ],
  idPrefixes: ["vod:"]
};

/**
 * Catalog Handler
 */
async function handleCatalog(type, id, extra = {}) {
  const searchQuery = extra.search;

  if (searchQuery) {
    const searchResults = await searchVOD(searchQuery);
    const metas = searchResults.map(item => ({
      id: item.id,
      type: item.type,
      name: item.name,
      poster: item.poster,
      description: item.description,
      director: item.director ? [item.director] : [],
      cast: item.actor ? item.actor.split(',') : [],
      year: item.year
    }));
    return { metas };
  }

  // Recommendations/Default Catalog
  const defaultItems = await getCatalogItems(type, 30);
  const metas = defaultItems.map(item => ({
    id: item.id,
    type: item.type,
    name: item.name,
    poster: item.poster,
    description: item.description
  }));

  return { metas };
}

/**
 * Meta Handler
 */
async function handleMeta(type, id) {
  const rawTitle = decodeURIComponent(id.replace(/^vod:/, ''));
  const results = await searchVOD(rawTitle, 5);

  if (results.length > 0) {
    const item = results[0];
    return {
      meta: {
        id: item.id,
        type: item.type,
        name: item.name,
        poster: item.poster,
        background: item.poster,
        description: item.description,
        director: item.director ? [item.director] : [],
        cast: item.actor ? item.actor.split(',') : [],
        year: item.year
      }
    };
  }

  return {
    meta: {
      id,
      type,
      name: rawTitle,
      description: "暂无详细简介"
    }
  };
}

/**
 * Stream Handler
 */
async function handleStream(type, id) {
  const rawTitle = decodeURIComponent(id.replace(/^vod:/, ''));
  // Search title across top VOD sources to fetch streams
  const results = await searchVOD(rawTitle, 25);

  const streams = [];

  for (const item of results) {
    if (item.sources && item.sources.length > 0) {
      for (const src of item.sources) {
        const parsed = parseStreamsFromPlayUrl(src.playUrl, src.sourceName);
        streams.push(...parsed);
      }
    }
  }

  return { streams };
}

module.exports = {
  manifest,
  handleCatalog,
  handleMeta,
  handleStream
};
