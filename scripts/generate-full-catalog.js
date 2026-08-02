const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { vodSources } = require('../src/maccms');
const top50Data = require('../src/data_top50.json');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Collect all 351 sites
function getAllSources() {
  const list = [];
  const added = new Set();

  vodSources.forEach((src, idx) => {
    if (src.api && !added.has(src.api)) {
      list.push({
        name: src.name || `VOD Source ${idx + 1}`,
        api: src.api,
        group: src.group || 'MacCMS 资源库'
      });
      added.add(src.api);
    }
  });

  top50Data.forEach((site, idx) => {
    if (site.url) {
      const api = site.url.endsWith('/') ? `${site.url}api.php/provide/vod/` : `${site.url}/api.php/provide/vod/`;
      if (!added.has(api)) {
        list.push({
          name: site.name,
          api: api,
          group: 'Top 50 影视站'
        });
        added.add(api);
      }
    }
  });

  return list;
}

const sources = getAllSources();
console.log(`[Full Generator] Loaded ${sources.length} unique sites for full catalog generation.`);

async function fetchSourceFull(src) {
  const result = { movies: [], series: [], anime: [], show: [], total: 0, status: 'FAILED' };
  
  // Try fetching first 3 pages per site to gather Movies, TV Shows, Anime, Variety
  for (let page = 1; page <= 3; page++) {
    try {
      const res = await axios.get(`${src.api}?ac=detail&pg=${page}`, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
      });
      const data = res.data;
      const list = data && data.list ? data.list : [];
      if (list.length === 0) break;

      result.status = 'OK';

      for (const item of list) {
        if (!item.vod_name || !item.vod_play_url) continue;

        // Parse play URLs
        const playSections = item.vod_play_url.split('$$$');
        for (const section of playSections) {
          const epEntries = section.split('#');
          for (const ep of epEntries) {
            const parts = ep.split('$');
            if (parts.length >= 2) {
              const epTitle = parts[0].trim();
              let playUrl = parts[1].trim();

              if (playUrl.startsWith('http') && (playUrl.includes('.m3u8') || playUrl.includes('.mp4'))) {
                const title = `[${src.name}] ${item.vod_name} ${epTitle !== item.vod_name ? epTitle : ''}`.trim().replace(/,/g, ' ');
                const cat = item.type_name || '';
                const logo = item.vod_pic || '';
                const vodItem = {
                  id: item.vod_id,
                  title,
                  playUrl,
                  logo,
                  category: cat || '综合影视',
                  sourceName: src.name
                };

                if (cat.includes('电影') || cat.includes('影')) {
                  result.movies.push(vodItem);
                } else if (cat.includes('剧') || cat.includes('连续剧')) {
                  result.series.push(vodItem);
                } else if (cat.includes('漫') || cat.includes('动画')) {
                  result.anime.push(vodItem);
                } else if (cat.includes('综艺') || cat.includes('秀')) {
                  result.show.push(vodItem);
                } else {
                  result.movies.push(vodItem);
                }
                result.total++;
              }
            }
          }
        }
      }
    } catch (e) {
      break;
    }
  }
  return result;
}

async function run() {
  const m3uLines = ['#EXTM3U'];
  let validSites = 0;
  let totalStreams = 0;

  const concurrency = 25;
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    console.log(`Processing sites ${i + 1} to ${Math.min(i + concurrency, sources.length)} of ${sources.length}...`);
    
    const results = await Promise.all(batch.map(s => fetchSourceFull(s)));
    
    results.forEach((res, idx) => {
      if (res.status === 'OK' && res.total > 0) {
        validSites++;
        const allItems = [...res.movies, ...res.series, ...res.anime, ...res.show];
        allItems.forEach(item => {
          m3uLines.push(`#EXTINF:-1 tvg-id="${item.id}" tvg-name="${item.title}" tvg-logo="${item.logo}" group-title="${item.category}",${item.title}`);
          m3uLines.push(item.playUrl);
          totalStreams++;
        });
      }
    });
  }

  console.log(`[Summary] Verified ${validSites} working sites out of ${sources.length}. Total playable streams collected: ${totalStreams}`);

  fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uLines.join('\n'));
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uLines.join('\n'));

  // Write status report artifact
  const report = `# 351 站点全量抓取与验证报告

- **目标站点总数**: ${sources.length}
- **成功在线响应站点**: ${validSites}
- **采集到可播放 M3U8 视频流总数**: ${totalStreams}
- **导出流文件**: \`docs/playlist.m3u8\`
`;
  fs.writeFileSync(path.join(docsDir, 'report.md'), report);
  console.log('✅ Generated docs/playlist.m3u8 and docs/report.md successfully.');
}

run();
