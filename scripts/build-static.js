const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { vodSources } = require('../src/maccms');
const top50Data = require('../src/data_top50.json');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Merge all sources from both projects
function getAllMergedSources() {
  const merged = [];
  const addedUrls = new Set();

  vodSources.forEach((src, idx) => {
    if (src.active !== false && src.api) {
      merged.push({
        id: src.id || `vod_${idx}`,
        name: src.name || `VOD Source ${idx + 1}`,
        api: src.api,
        group: src.group || 'MacCMS 资源站'
      });
      addedUrls.add(src.api);
    }
  });

  top50Data.forEach((site, idx) => {
    if (site.url && !addedUrls.has(site.url)) {
      const api = site.url.endsWith('/') ? `${site.url}api.php/provide/vod/` : `${site.url}/api.php/provide/vod/`;
      merged.push({
        id: `top50_${site.rank || idx}`,
        name: `${site.rank ? site.rank + '. ' : ''}${site.name}`,
        api: api,
        group: 'Streaming Hub Top 50'
      });
    }
  });

  return merged;
}

const allSources = getAllMergedSources();

async function buildAll() {
  console.log(`[Build Static] Merging all ${allSources.length} sources from both projects...`);

  // 1. Manifest
  const manifest = {
    id: "org.strand.vod.billy.top50",
    version: "1.0.0",
    name: "Streaming Sites Hub & All VOD Sources (350+ Sites)",
    description: "Merged Top 50 & 300+ MacCMS VOD sources for Strand & M3U8 players",
    resources: ["catalog", "stream", "meta"],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "top50_vod",
        name: "Top 350+ Combined VOD Sites"
      }
    ],
    idPrefixes: ["top50_", "vod_"]
  };
  fs.writeFileSync(path.join(docsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 2. Multi-site Playable M3U8 Stream list
  let m3uLines = ['#EXTM3U'];
  let totalItems = 0;

  const batchSize = 30;
  for (let i = 0; i < allSources.length; i += batchSize) {
    const chunk = allSources.slice(i, i + batchSize);
    
    const promises = chunk.map(async (src) => {
      try {
        const apiRes = await axios.get(`${src.api}?ac=detail&pg=1`, {
          timeout: 4000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        const list = apiRes.data && apiRes.data.list ? apiRes.data.list : [];
        const items = [];
        let countForSource = 0;

        for (const item of list) {
          if (!item.vod_name || !item.vod_play_url) continue;

          const playFromSections = item.vod_play_url.split('$$$');
          for (const section of playFromSections) {
            const epEntries = section.split('#');
            for (const ep of epEntries) {
              const parts = ep.split('$');
              if (parts.length >= 2) {
                const epTitle = parts[0].trim();
                let playUrl = parts[1].trim();

                if (playUrl.startsWith('http') && (playUrl.endsWith('.m3u8') || playUrl.endsWith('.mp4') || playUrl.includes('.m3u8?'))) {
                  const title = `[${src.name}] ${item.vod_name} (${epTitle})`.replace(/,/g, ' ');
                  const group = item.type_name || src.group || src.name;
                  const logo = item.vod_pic || '';

                  items.push(`#EXTINF:-1 tvg-id="${item.vod_id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${group}",${title}`);
                  items.push(playUrl);
                  countForSource++;
                  if (countForSource >= 10) break;
                }
              }
            }
            if (countForSource >= 10) break;
          }
          if (countForSource >= 10) break;
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
        if (!item.startsWith('#')) totalItems++;
      });
    });
  }

  if (totalItems === 0) {
    m3uLines.push('#EXTINF:-1 tvg-name="Big Buck Bunny HLS Test",Big Buck Bunny HLS Test');
    m3uLines.push('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  }

  fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uLines.join('\n'));
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uLines.join('\n'));

  console.log(`✅ Build Finished! Written ${totalItems} direct streams from all ${allSources.length} combined sites.`);
}

buildAll();
