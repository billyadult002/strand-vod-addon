const fs = require('fs');
const path = require('path');
const axios = require('axios');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// STRICTLY ONLY THESE 4 SITES - NO OTHER SITES ALLOWED
const targetSites = [
  { id: "gz_app", name: "瓜子影视 (gz.app)", url: "https://gz.app" },
  { id: "nqjc_net", name: "NQJC Net (nqjc.net)", url: "https://nqjc.net" },
  { id: "fluxtv_cc", name: "FluxTV (fluxtv.cc)", url: "https://fluxtv.cc" },
  { id: "dulo_cx", name: "Dulo CX (dulo.cx)", url: "https://dulo.cx" }
];

async function main() {
  console.log('[Four Only Builder] Strictly processing ONLY the 4 requested sites: gz.app, nqjc.net, fluxtv.cc, dulo.cx...');

  // 1. Strand Addon Manifest (Strictly 4 Sites)
  const manifest = {
    id: "org.strand.vod.billy.fouronly",
    version: "1.0.0",
    name: "4 Sites Exclusive VOD Addon (gz.app / nqjc.net / fluxtv.cc / dulo.cx)",
    description: "Exclusive VOD Addon for Strand containing strictly gz.app, nqjc.net, fluxtv.cc, and dulo.cx VOD catalogs.",
    resources: ["catalog", "stream", "meta"],
    types: ["movie", "series"],
    catalogs: [
      { type: "movie", id: "four_movies", name: "电影 (Movies)" },
      { type: "series", id: "four_series", name: "电视剧 (TV Series)" },
      { type: "anime", id: "four_anime", name: "动漫 (Anime)" },
      { type: "show", id: "four_shows", name: "综艺 (Variety)" }
    ],
    idPrefixes: ["four_"]
  };
  fs.writeFileSync(path.join(docsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 2. Fetch VOD items strictly from these 4 sites
  const m3uLines = ['#EXTM3U'];
  let totalStreams = 0;

  for (const site of targetSites) {
    const api = `${site.url}/api.php/provide/vod/`;
    console.log(`Fetching VOD catalog from ${site.name} (${api})...`);

    let siteItemCount = 0;
    // Fetch up to 10 detail pages per site to capture maximum items across categories
    for (let page = 1; page <= 10; page++) {
      try {
        const res = await axios.get(`${api}?ac=detail&pg=${page}`, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        });
        const data = res.data;
        const list = data && data.list ? data.list : [];
        if (list.length === 0) break;

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

                if (playUrl.startsWith('http')) {
                  if (!playUrl.includes('.m3u8') && !playUrl.includes('.mp4')) {
                    playUrl += '/index.m3u8';
                  }

                  const title = `[${site.name}] ${item.vod_name} ${epTitle !== item.vod_name ? epTitle : ''}`.trim().replace(/,/g, ' ');
                  const rawGroup = item.type_name || '综合影视';
                  
                  // Category Mapping
                  let level1 = "其他";
                  if (rawGroup.includes('电影') || rawGroup.includes('片') && !rawGroup.includes('纪录片')) level1 = "电影";
                  if (rawGroup.includes('剧')) level1 = "电视剧";
                  if (rawGroup.includes('综艺')) level1 = "综艺";
                  if (rawGroup.includes('纪录片') || rawGroup.includes('记录')) level1 = "纪录片";

                  let level2 = "其他";
                  if (rawGroup.includes('欧') || rawGroup.includes('美')) level2 = "欧美";
                  else if (rawGroup.includes('日')) level2 = "日本";
                  else if (rawGroup.includes('韩')) level2 = "韩国";
                  else if (rawGroup.includes('台')) level2 = "台湾";
                  else if (rawGroup.includes('港')) level2 = "香港";
                  else if (rawGroup.includes('亚') || rawGroup.includes('泰') || rawGroup.includes('新马')) level2 = "亚洲其他";

                  const group = `${level1} - ${level2}`;
                  const logo = item.vod_pic || '';

                  m3uLines.push(`#EXTINF:-1 tvg-id="${item.vod_id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${group}",${title}`);
                  m3uLines.push(playUrl);
                  totalStreams++;
                  siteItemCount++;
                }
              }
            }
          }
        }
      } catch (e) {
        console.log(`Error fetching ${api}?ac=detail&pg=${page} : ${e.message}`);
        // Continue trying next page or skip if down
      }
    }
    console.log(`Collected ${siteItemCount} playable streams from ${site.name}`);
  }

  // Fallback demo stream if target sites require login/bypass
  if (totalStreams === 0) {
    console.log('Target sites protected; adding fallback structure for SenPlayer.');
    m3uLines.push('#EXTINF:-1 tvg-name="[瓜子影视 gz.app] 演示示例频道",瓜子影视 演示频道');
    m3uLines.push('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  }

  fs.writeFileSync(path.join(docsDir, 'playlist.m3u8'), m3uLines.join('\n'));
  fs.writeFileSync(path.join(docsDir, 'playlist.m3u'), m3uLines.join('\n'));

  console.log(`✅ Build Complete! Written ${totalStreams} streams strictly from the 4 requested sites into docs/playlist.m3u8.`);
}

main();
