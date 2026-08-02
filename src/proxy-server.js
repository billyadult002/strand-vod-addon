const http = require('http');
const url = require('url');
const axios = require('axios');
const { vodSources } = require('./maccms');

const top50Data = require('./data_top50.json');
const PORT = process.env.PORT || 8080;

// Combine all sources from both projects
function getAllMergedSources() {
  const merged = [];
  const addedUrls = new Set();

  // 1. Add all MacCMS sources (301 sources)
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

  // 2. Add Top 50 Hub sites
  top50Data.forEach((site, idx) => {
    if (site.url && !addedUrls.has(site.url)) {
      merged.push({
        id: `top50_${site.rank || idx}`,
        name: `${site.rank ? site.rank + '. ' : ''}${site.name}`,
        api: site.url.endsWith('/') ? `${site.url}api.php/provide/vod/` : `${site.url}/api.php/provide/vod/`,
        group: 'Streaming Hub Top 50'
      });
    }
  });

  return merged;
}

const allSources = getAllMergedSources();
console.log(`[Proxy Server] Loaded ${allSources.length} total combined VOD sources from both projects.`);

const server = http.createServer(async (req, res) => {
  const reqUrl = req.url;
  const parsed = url.parse(reqUrl, true);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // 1. M3U8 Playlist Subscription Endpoint for SenPlayer (Aggregating ALL 350+ Sites)
  if (parsed.pathname === '/playlist.m3u8' || parsed.pathname === '/playlist.m3u') {
    console.log(`[Proxy Server] Generating M3U8 playlist for SenPlayer from ${allSources.length} sources...`);
    res.writeHead(200, { 'Content-Type': 'application/x-mpegURL; charset=utf-8' });

    let m3u = '#EXTM3U\n';
    let count = 0;
    const host = req.headers.host || `127.0.0.1:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';

    // Batch fetch from all active sources concurrently (50 sources per batch)
    const batchSize = 40;
    for (let i = 0; i < allSources.length; i += batchSize) {
      const chunk = allSources.slice(i, i + batchSize);
      
      const fetchPromises = chunk.map(async (src) => {
        try {
          const apiRes = await axios.get(`${src.api}?ac=detail&pg=1`, {
            timeout: 4500,
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
          });
          const list = apiRes.data && apiRes.data.list ? apiRes.data.list : [];
          const items = [];

          let sourceCount = 0;
          for (const item of list) {
            if (!item.vod_name || !item.vod_play_url) continue;

            const playFromSections = item.vod_play_url.split('$$$');
            for (const section of playFromSections) {
              const epEntries = section.split('#');
              for (const ep of epEntries) {
                const parts = ep.split('$');
                if (parts.length >= 2) {
                  const epTitle = parts[0].trim();
                  let rawPlayUrl = parts[1].trim();

                  if (rawPlayUrl.startsWith('http')) {
                    if (!rawPlayUrl.includes('.m3u8') && !rawPlayUrl.includes('.mp4')) {
                      rawPlayUrl += '/index.m3u8';
                    }

                    const title = `${item.vod_name} (${epTitle})`.replace(/,/g, ' ');
                    const group = item.type_name || src.group || src.name;
                    const logo = item.vod_pic || '';
                    const proxyUrl = `${protocol}://${host}/proxy?url=${encodeURIComponent(rawPlayUrl)}`;

                    items.push(`#EXTINF:-1 tvg-id="${item.vod_id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${group}",${title}\n${proxyUrl}`);
                    sourceCount++;
                    if (sourceCount >= 8) break;
                  }
                }
              }
              if (sourceCount >= 8) break;
            }
            if (sourceCount >= 8) break;
          }
          return items;
        } catch (err) {
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(items => {
        items.forEach(item => {
          m3u += item + '\n';
          count++;
        });
      });

      if (count >= 1000) break; // Limit playlist size to keep SenPlayer fast
    }

    if (count === 0) {
      m3u += '#EXTINF:-1 tvg-name="Big Buck Bunny Test",Big Buck Bunny Test\nhttps://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8\n';
    }

    console.log(`[Proxy Server] Done! Outputted ${count} direct stream entries from merged sites into playlist.m3u8.`);
    return res.end(m3u);
  }

  // 2. Anti-Referer HLS Stream Proxy
  if (parsed.pathname === '/proxy') {
    const targetUrl = parsed.query.url;
    if (!targetUrl) {
      res.writeHead(400);
      return res.end('Missing url parameter');
    }

    try {
      const parsedTarget = url.parse(targetUrl);
      const targetHost = parsedTarget.host;
      const targetOrigin = `${parsedTarget.protocol}//${targetHost}`;

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': targetOrigin,
        'Origin': targetOrigin,
        'Accept': '*/*'
      };

      const isM3u8 = targetUrl.endsWith('.m3u8') || targetUrl.includes('.m3u8?');

      const upstreamRes = await axios.get(targetUrl, {
        headers,
        responseType: isM3u8 ? 'text' : 'arraybuffer',
        timeout: 10000
      });

      const host = req.headers.host || `127.0.0.1:${PORT}`;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      if (typeof upstreamRes.data === 'string' && upstreamRes.data.includes('#EXTM3U')) {
        res.setHeader('Content-Type', 'application/x-mpegURL');

        const lines = upstreamRes.data.split('\n');
        const rewritten = lines.map(line => {
          let trimmed = line.trim();
          if (!trimmed) return line;

          if (trimmed.startsWith('#EXT-X-KEY:')) {
            return trimmed.replace(/URI="([^"]+)"/, (match, keyUri) => {
              let absoluteKey = keyUri;
              if (!keyUri.startsWith('http')) {
                absoluteKey = keyUri.startsWith('/') ? `${targetOrigin}${keyUri}` : `${baseUrl}${keyUri}`;
              }
              return `URI="${protocol}://${host}/proxy?url=${encodeURIComponent(absoluteKey)}"`;
            });
          }

          if (trimmed.startsWith('#')) return line;

          let absoluteSegmentUrl = trimmed;
          if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            absoluteSegmentUrl = trimmed.startsWith('/') ? `${targetOrigin}${trimmed}` : `${baseUrl}${trimmed}`;
          }

          return `${protocol}://${host}/proxy?url=${encodeURIComponent(absoluteSegmentUrl)}`;
        });

        return res.end(rewritten.join('\n'));
      } else {
        res.setHeader('Content-Type', upstreamRes.headers['content-type'] || 'video/MP2T');
        return res.end(upstreamRes.data);
      }
    } catch (e) {
      console.error(`Proxy request failed for ${targetUrl}: ${e.message}`);
      res.writeHead(502);
      return res.end(`Proxy error: ${e.message}`);
    }
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 M3U8 Anti-Referer Stream Proxy running on http://127.0.0.1:${PORT}`);
});
