const fs = require('fs');
const path = require('path');
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

// 2. Generate M3U8 & M3U Playlist
let m3uContent = "#EXTM3U\n";
let count = 0;

vodSources.forEach((src) => {
  if (src.active !== false && src.api) {
    count++;
    const name = src.name || `VOD Source ${count}`;
    const group = src.group || "Streaming Hub Top 50";
    const logo = src.logo || "";
    // Output standard M3U entry
    m3uContent += `#EXTINF:-1 tvg-id="${src.id || count}" tvg-name="${name}" tvg-logo="${logo}" group-title="${group}",${name}\n`;
    m3uContent += `${src.api}\n`;
  }
});

fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uContent);
fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uContent);
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
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🎬 Streaming Sites Hub Top 50 Addon</h1>
  <div class="card">
    <h3>📌 SenPlayer / VidHub / Infuse (M3U8 Subscription URL)</h3>
    <p>Copy and paste into SenPlayer / VidHub M3U Subscription:</p>
    <code id="m3u8-url">https://billyadult002.github.io/strand-vod-addon/playlist.m3u8</code>
  </div>
  <div class="card">
    <h3>🔌 Strand / Stremio Addon Manifest URL</h3>
    <p>Copy and paste into Strand Addon URL:</p>
    <code id="manifest-url">https://billyadult002.github.io/strand-vod-addon/manifest.json</code>
  </div>
</body>
</html>
`);

console.log(`Successfully generated static build in docs/: ${count} VOD sources added.`);
