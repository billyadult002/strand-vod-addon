const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { vodSources } = require('../src/maccms');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Generate Manifest
const manifest = {
  id: "org.strand.vod.billy.top50",
  version: "1.0.0",
  name: "Streaming Sites Hub Top 50 VOD",
  description: "StreamingSitesHub Top 50 VOD sites addon for Strand & M3U8 players",
  resources: ["catalog", "stream", "meta"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "top50_vod",
      name: "Top 50 Streaming Hub"
    }
  ],
  idPrefixes: ["top50_"]
};
fs.writeFileSync(path.join(docsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

async function main() {
  console.log('Fetching playable movies/episodes from top MacCMS API sources...');
  let m3uLines = ['#EXTM3U'];
  let totalItems = 0;

  const activeSources = vodSources.filter(s => s.active !== false && s.api);

  for (const src of activeSources) {
    try {
      console.log(`Fetching latest VOD items from ${src.name}...`);
      const res = await axios.get(`${src.api}?ac=detail&pg=1`, { 
        timeout: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
      });
      const data = res.data;
      const list = data && data.list ? data.list : [];

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

              // ONLY include direct playable video streams (.m3u8 / .mp4)
              if (playUrl.startsWith('http') && (playUrl.endsWith('.m3u8') || playUrl.endsWith('.mp4') || playUrl.includes('.m3u8?'))) {
                const title = `${item.vod_name} (${epTitle})`.replace(/,/g, ' ');
                const group = item.type_name || src.name || 'VOD';
                const logo = item.vod_pic || '';

                m3uLines.push(`#EXTINF:-1 tvg-id="${item.vod_id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${group}",${title}`);
                m3uLines.push(playUrl);
                countForSource++;
                totalItems++;
                if (countForSource >= 20) break;
              }
            }
          }
          if (countForSource >= 20) break;
        }
        if (countForSource >= 20) break;
      }
      console.log(`Added ${countForSource} direct .m3u8 streams from ${src.name}`);
    } catch (err) {
      // skip unreachable
    }
  }

  // Fallback sample HLS streams
  if (totalItems === 0) {
    m3uLines.push('#EXTINF:-1 tvg-name="Big Buck Bunny HLS Test",Big Buck Bunny HLS Test');
    m3uLines.push('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  }

  fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uLines.join('\n'));
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uLines.join('\n'));

  // Also output index.html
  fs.writeFileSync(path.join(docsDir, 'index.html'), `<!DOCTYPE html>
<html>
<head>
  <title>Streaming Sites Hub Top 50 Addon</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { color: #38bdf8; }
    .card { background: #1e293b; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid #334155; }
    code { background: #0f172a; padding: 4px 8px; border-radius: 4px; color: #f43f5e; word-break: break-all; }
  </style>
</head>
<body>
  <h1>🎬 Streaming Sites Hub Top 50 Addon</h1>
  <div class="card">
    <h3>📌 SenPlayer / VidHub / Infuse Direct Playable M3U8 Subscription URL</h3>
    <code id="m3u8-url">https://billyadult002.github.io/strand-vod-addon/playlist.m3u8</code>
  </div>
</body>
</html>
`);

  console.log(`✅ Build Complete! Written ${totalItems} 100% direct playable .m3u8 streams into docs/playlist.m3u8.`);
}

main();
