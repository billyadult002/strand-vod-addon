const { vodSources, searchVOD, getCatalogItems, parseStreamsFromPlayUrl } = require('./maccms');
const path = require('path');
const top50Hub = require('./data_top50.json');

const manifest = {
  id: "org.strand.maccms.vod",
  version: "2.0.0",
  name: "中文影视 & 全球Top50聚合 (Strand VOD Addon)",
  description: "适用于 Apple TV Strand App / Stremio 的影视 Addon，整合 301 个中文 VOD 源及 StreamingSitesHub 前 50 精选免费影视/动漫/体育站点",
  logo: "https://v.strem.io/images/stremio-logo-white.png",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series", "anime"],
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
    },
    {
      type: "movie",
      id: "hub_top50",
      name: "StreamingSitesHub Top 50 站点",
      extra: [
        { name: "search", isRequired: false }
      ]
    }
  ],
  idPrefixes: ["vod:", "hub:"]
};

/**
 * Catalog Handler
 */
async function handleCatalog(type, id, extra = {}) {
  const searchQuery = extra.search;

  if (id === 'hub_top50') {
    const metas = top50Hub.map(site => ({
      id: `hub:${site.rank}`,
      type: "movie",
      name: `#${site.rank} ${site.name}`,
      poster: `https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`,
      description: `【StreamingSitesHub Top 50 优质流媒体站】域名: ${site.domain} | 直达地址: ${site.url}`,
      websiteUrl: site.url
    }));
    return { metas };
  }

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
  if (id.startsWith('hub:')) {
    const rank = parseInt(id.replace('hub:', ''));
    const site = top50Hub.find(s => s.rank === rank) || top50Hub[0];
    return {
      meta: {
        id: `hub:${site.rank}`,
        type: "movie",
        name: `#${site.rank} ${site.name}`,
        poster: `https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`,
        background: `https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`,
        description: `【StreamingSitesHub Top 50 流媒体站】\n名称: ${site.name}\n域名: ${site.domain}\n直达地址: ${site.url}`
      }
    };
  }

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
  if (id.startsWith('hub:')) {
    const rank = parseInt(id.replace('hub:', ''));
    const site = top50Hub.find(s => s.rank === rank) || top50Hub[0];
    return {
      streams: [
        {
          title: `[${site.name}] 访问主页: ${site.domain}`,
          name: site.name,
          externalUrl: site.url
        }
      ]
    };
  }

  const rawTitle = decodeURIComponent(id.replace(/^vod:/, ''));
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
