const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { vodSources } = require('../src/maccms');

async function buildPlayableM3u8() {
  console.log('Fetching playable movies/episodes from top MacCMS API sources...');
  let m3uLines = ['#EXTM3U'];
  let totalItems = 0;
  
  // Pick top active providers
  const activeSources = vodSources.filter(s => s.active !== false && s.api).slice(0, 15);

  for (const src of activeSources) {
    try {
      console.log(`Fetching latest VOD items from ${src.name}...`);
      const res = await axios.get(`${src.api}?ac=detail&pg=1`, { timeout: 8000 });
      const data = res.data;
      const list = data && data.list ? data.list : [];

      let countForSource = 0;
      for (const item of list) {
        if (!item.vod_name || !item.vod_play_url) continue;
        
        // Parse vod_play_url: format is "Episode$http://...m3u8#Episode2$http..."
        const playFromSections = item.vod_play_url.split('$$$');
        for (const section of playFromSections) {
          const epEntries = section.split('#');
          for (const ep of epEntries) {
            const parts = ep.split('$');
            if (parts.length >= 2) {
              const epTitle = parts[0].trim();
              const playUrl = parts[1].trim();
              if (playUrl.startsWith('http') && (playUrl.includes('.m3u8') || playUrl.includes('.mp4') || playUrl.includes('play'))) {
                const title = `${item.vod_name} ${epTitle}`.replace(/,/g, ' ');
                const group = item.type_name || src.name || 'VOD';
                const logo = item.vod_pic || '';
                
                m3uLines.push(`#EXTINF:-1 tvg-id="${item.vod_id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${group}",${title}`);
                m3uLines.push(playUrl);
                countForSource++;
                totalItems++;
                if (countForSource >= 20) break; // limit per provider to keep playlist fast
              }
            }
          }
          if (countForSource >= 20) break;
        }
        if (countForSource >= 20) break;
      }
      console.log(`Added ${countForSource} playable streams from ${src.name}`);
    } catch (err) {
      console.warn(`Skipped ${src.name}: ${err.message}`);
    }
  }

  const docsDir = path.join(__dirname, '..', 'docs');
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uLines.join('\n'));
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uLines.join('\n'));

  console.log(`✅ Finished! Generated docs/playlist.m3u8 with ${totalItems} playable video streams.`);
}

buildPlayableM3u8();
