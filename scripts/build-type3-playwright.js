const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 模拟 Type 3 机制的配置
// Type 3 的本质就是：无法通过统一的API获取数据，必须使用特定的脚本注入网页提取
const type3Sites = [
  {
    name: "瓜子 (gz.app)",
    url: "https://gz.app/",
    // Playwright 页面注入的解析逻辑 (类似 XPTV ext js)
    extractFn: async (page) => {
      // 等待页面主要列表加载
      await page.waitForTimeout(3000); 
      
      // 这里的逻辑代表开发者针对 gz.app 写的特定DOM解析脚本
      return await page.evaluate(() => {
        const results = [];
        // 模拟抓取网页上的 A 标签作为视频条目
        const links = document.querySelectorAll('a');
        let count = 0;
        for (const a of links) {
          const title = a.innerText.trim();
          const href = a.href;
          // 假设我们能够从详情页嗅探或者拼接出 m3u8
          // 在真实的 Type 3 脚本中，这里会进一步发起 fetch 请求或者拦截网络请求来获取最终的 .m3u8
          if (title && href && title.length > 2) {
            results.push({
              title: title,
              // 演示用途，实际需要拦截网络请求获取真实m3u8
              url: href + (href.endsWith('/') ? '' : '/') + 'video.m3u8',
              pic: 'https://via.placeholder.com/150',
              group: '其他 - 亚洲其他'
            });
            count++;
            if (count > 10) break; // 演示只取前10个
          }
        }
        return results;
      });
    }
  }
];

async function buildType3() {
  console.log('[Type 3 Builder] Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const m3uLines = ['#EXTM3U'];
  let totalStreams = 0;

  for (const site of type3Sites) {
    console.log(`[Type 3 Builder] Processing site: ${site.name} (${site.url})`);
    const page = await browser.newPage();
    try {
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 15000 });
      console.log(`[Type 3 Builder] Injected custom parser for ${site.name}...`);
      
      const items = await site.extractFn(page);
      console.log(`[Type 3 Builder] Extracted ${items.length} items from ${site.name}`);

      items.forEach(item => {
        const title = `[${site.name}] ${item.title}`;
        m3uLines.push(`#EXTINF:-1 tvg-name="${title}" tvg-logo="${item.pic}" group-title="${item.group}",${title}`);
        m3uLines.push(item.url);
        totalStreams++;
      });
    } catch (e) {
      console.error(`[Type 3 Builder] Error parsing ${site.name}:`, e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  fs.writeFileSync(path.join(docsDir, 'type3-playlist.m3u8'), m3uLines.join('\n'));
  
  // 生成专用的 Strand Addon manifest
  const manifest = {
    id: "org.strand.vod.billy.type3",
    version: "1.0.0",
    name: "Type 3 Playwright Scraper Addon",
    description: "Extracted using Playwright JS injection for non-standard sites",
    resources: ["catalog", "stream"],
    types: ["movie", "series"],
    catalogs: [
      { type: "movie", id: "movies", name: "Type 3 Movies" }
    ],
    idPrefixes: ["vod_"]
  };
  fs.writeFileSync(path.join(docsDir, 'type3-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`✅ Type 3 Build Finished! Written ${totalStreams} streams into docs/type3-playlist.m3u8.`);
}

buildType3();
