const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { vodSources } = require('../src/maccms');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Explicit requested custom sites
const customSites = [
  { name: "gz.app", url: "https://gz.app/" },
  { name: "nqjc.net", url: "https://nqjc.net/" },
  { name: "fluxtv.cc", url: "https://fluxtv.cc/" },
  { name: "dulo.cx", url: "https://dulo.cx/" }
];

async function extractTopSitesFromHub() {
  console.log('Extracting site URLs from StreamingSitesHub.com...');
  const sites = [];
  const addedDomains = new Set();

  try {
    const res = await axios.get('https://streamingsiteshub.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    });
    const html = res.data;

    // Find all external links
    const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)];
    
    matches.forEach(m => {
      let rawUrl = m[1];
      try {
        const u = new URL(rawUrl);
        const domain = u.hostname.replace('www.', '');
        if (
          !domain.includes('streamingsiteshub.com') && 
          !domain.includes('googletagmanager.com') && 
          !domain.includes('ko-fi.com') && 
          !domain.includes('discord') &&
          !domain.includes('cloudflare') &&
          !addedDomains.has(domain)
        ) {
          addedDomains.add(domain);
          sites.push({
            name: domain,
            domain: domain,
            url: `${u.protocol}//${u.hostname}`
          });
        }
      } catch (e) {}
    });
  } catch (e) {
    console.error('Error fetching hub:', e.message);
  }
  return sites;
}

async function main() {
  const hubSites = await extractTopSitesFromHub();
  console.log(`Extracted ${hubSites.length} unique streaming sites from StreamingSitesHub.`);

  const allSources = [];
  const added = new Set();

  // Add custom sites first
  customSites.forEach(s => {
    const api = s.url.endsWith('/') ? `${s.url}api.php/provide/vod/` : `${s.url}/api.php/provide/vod/`;
    allSources.push({ name: s.name, api, group: 'Custom Sites' });
    added.add(s.name);
  });

  // Add Hub sites
  hubSites.forEach((s, idx) => {
    if (!added.has(s.name)) {
      const api = `${s.url}/api.php/provide/vod/`;
      allSources.push({ name: `${idx + 1}. ${s.name}`, api, group: 'StreamingSitesHub Top 100' });
      added.add(s.name);
    }
  });

  // Add MacCMS 301 sources
  vodSources.forEach((s, idx) => {
    if (s.api && !added.has(s.name)) {
      allSources.push({ name: s.name || `MacCMS ${idx+1}`, api: s.api, group: 'MacCMS VOD Sources' });
      added.add(s.name);
    }
  });

  console.log(`Total combined sources to process: ${allSources.length}`);

  // Generate Strand Addon Manifest
  const manifest = {
    id: "org.strand.vod.billy.fulltop100",
    version: "3.0.0",
    name: "gz.app / nqjc.net / fluxtv / dulo / Top 100 & MacCMS VOD",
    description: "Strand VOD Addon containing StreamingSitesHub Top 100 + gz.app, nqjc.net, fluxtv.cc, dulo.cx & MacCMS VOD sources",
    resources: ["catalog", "stream", "meta"],
    types: ["movie", "series"],
    catalogs: [
      { type: "movie", id: "top100_all", name: "Top 100 & All VOD Sources" }
    ],
    idPrefixes: ["top100_"]
  };
  fs.writeFileSync(path.join(docsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Build playlist for SenPlayer
  let m3uLines = ['#EXTM3U'];
  let totalStreams = 0;

  const batchSize = 30;
  for (let i = 0; i < allSources.length; i += batchSize) {
    const chunk = allSources.slice(i, i + batchSize);
    const promises = chunk.map(async (src) => {
      try {
        const res = await axios.get(`${src.api}?ac=detail&pg=1`, {
          timeout: 4000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        const list = res.data && res.data.list ? res.data.list : [];
        const items = [];
        let count = 0;

        for (const item of list) {
          if (!item.vod_name || !item.vod_play_url) continue;

          const sections = item.vod_play_url.split('$$$');
          for (const sec of sections) {
            const eps = sec.split('#');
            for (const ep of eps) {
              const parts = ep.split('$');
              if (parts.length >= 2) {
                const epTitle = parts[0].trim();
                let playUrl = parts[1].trim();

                if (playUrl.startsWith('http') && (playUrl.includes('.m3u8') || playUrl.includes('.mp4'))) {
                  const title = `[${src.name}] ${item.vod_name} ${epTitle}`.replace(/,/g, ' ');
                  const group = item.type_name || src.group;
                  const logo = item.vod_pic || '';

                  items.push(`#EXTINF:-1 tvg-id="${item.vod_id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${group}",${title}`);
                  items.push(playUrl);
                  count++;
                  if (count >= 15) break;
                }
              }
            }
            if (count >= 15) break;
          }
          if (count >= 15) break;
        }
        return items;
      } catch (e) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(items => {
      items.forEach(item => {
        m3uLines.push(item);
        if (!item.startsWith('#')) totalStreams++;
      });
    });
  }

  if (totalStreams === 0) {
    m3uLines.push('#EXTINF:-1 tvg-name="Big Buck Bunny HLS Test",Big Buck Bunny HLS Test');
    m3uLines.push('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  }

  fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uLines.join('\n'));
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uLines.join('\n'));

  console.log(`✅ Build Complete! Written ${totalStreams} playable streams across all requested sources.`);
}

main();
