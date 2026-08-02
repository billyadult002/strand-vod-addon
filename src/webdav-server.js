const http = require('http');
const axios = require('axios');
const { vodSources } = require('./maccms');

const PORT = process.env.PORT || 8080;

// Simple WebDAV server converting MacCMS APIs to Virtual WebDAV Folder Structure
const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url);
  const method = req.method.toUpperCase();

  console.log(`[WebDAV] ${method} ${url}`);

  // 1. CORS & WebDAV Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Depth, User-Agent, X-Expected-Entity-Length');
  res.setHeader('DAV', '1, 2');

  if (method === 'OPTIONS') {
    res.writeHead(200, { 'Allow': 'OPTIONS, GET, HEAD, PROPFIND' });
    return res.end();
  }

  // 2. PROPFIND - List Directory Structure
  if (method === 'PROPFIND') {
    // Root folder listing
    if (url === '/' || url === '') {
      let xml = `<?xml version="1.0" encoding="utf-8" ?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:displayname>Top 50 影视库</D:displayname>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;

      vodSources.slice(0, 50).forEach((src, idx) => {
        const name = `${idx + 1}. ${src.name.replace(/[&<>'"]/g, '')}`;
        xml += `
  <D:response>
    <D:href>/${encodeURIComponent(name)}/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:displayname>${name}</D:displayname>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
      });

      xml += `\n</D:multistatus>`;

      res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8' });
      return res.end(xml);
    }

    // Sub-folder listing (VOD Source Content)
    const match = url.match(/^\/(\d+)\.\s*([^/]+)\/?$/);
    if (match) {
      const srcIndex = parseInt(match[1]) - 1;
      const src = vodSources[srcIndex];

      let xml = `<?xml version="1.0" encoding="utf-8" ?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${url}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;

      if (src && src.api) {
        try {
          const apiRes = await axios.get(`${src.api}?ac=detail&pg=1`, { timeout: 5000 });
          const list = apiRes.data && apiRes.data.list ? apiRes.data.list : [];

          list.forEach(item => {
            if (!item.vod_name) return;
            const fileName = `${item.vod_name.replace(/[&<>'"]/g, '')}.strm`;
            const fileHref = `${url}${encodeURIComponent(fileName)}`;

            xml += `
  <D:response>
    <D:href>${fileHref}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getcontentlength>1024</D:getcontentlength>
        <D:displayname>${fileName}</D:displayname>
        <D:getcontenttype>video/x-m4v</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
          });
        } catch (e) {
          console.error(`Error fetching VOD for WebDAV: ${e.message}`);
        }
      }

      xml += `\n</D:multistatus>`;
      res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8' });
      return res.end(xml);
    }
  }

  // 3. GET - File Playback Stream
  if (method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 WebDAV Server running at http://127.0.0.1:${PORT}`);
});
