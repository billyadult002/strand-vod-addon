#!/usr/bin/env node
/**
 * build-subscription.js
 * 
 * Builds two output files:
 * 1. docs/tvbox-subscription.json  - Full TVBox/Senplayer subscription with ALL sites
 * 2. docs/playlist.m3u8            - M3U8 from all Type 1 MacCMS API sites (latest content)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── All sites from user's attachment ─────────────────────────────────────────
const TYPE1_SITES = [
  { name: "360|点播",    api: "https://360zy.com/api.php/provide/vod/" },
  { name: "墨斗|点播",   api: "https://www.mdzyapi.com/api.php/provide/vod/" },
  { name: "黑木耳|点播", api: "https://json02.heimuer.xyz/api.php/provide/vod/" },
  { name: "华为吧|点播", api: "https://hw8.live/api.php/provide/vod/" },
  { name: "腐剧|点播",   api: "http://www.fuju2024.cc:8013/ruifenglb_api.php/provide/vod/" },
  { name: "金鹰|点播",   api: "https://jinyingzy.com/api.php/provide/vod/" },
  { name: "OK|点播",     api: "https://okzyw9.com/api.php/provide/vod/" },
  { name: "宝片|点播",   api: "https://zpsps.com/api.php/provide/vod/" },
  { name: "小黄人|点播", api: "https://iqyi.xiaohuangrentv.com/api.php/provide/vod/" },
  { name: "牛牛|点播",   api: "https://api.niuniuzy.me/api.php/provide/vod/" },
  { name: "丫丫|点播",   api: "https://cj.yayazy.net/api.php/provide/vod/" },
  { name: "影图|点播",   api: "https://cj.vodimg.top/api.php/provide/vod/" },
  { name: "U酷|点播",    api: "https://api.ukuapi.com/api.php/provide/vod/" },
  { name: "豪华|点播",   api: "https://hhzyapi.com/api.php/provide/vod" },
  { name: "极速|点播",   api: "https://jszyapi.com/api.php/provide/vod" },
  { name: "索尼|点播",   api: "https://suoniapi.com/api.php/provide/vod/" },
  { name: "ikun|点播",   api: "https://ikunzyapi.com/api.php/provide/vod/" },
  { name: "非凡|点播",   api: "http://cj.ffzyapi.com/api.php/provide/vod/" },
  { name: "量子|点播",   api: "https://cj.lziapi.com/api.php/provide/vod/" },
  { name: "暴风|点播",   api: "https://bfzyapi.com/api.php/provide/vod/" },
  { name: "红牛|点播",   api: "https://www.hongniuzy2.com/api.php/provide/vod/" },
  { name: "快车|点播",   api: "https://caiji.kczyapi.com/api.php/provide/vod/from/kcm3u8/" },
  { name: "闪电|点播",   api: "http://sdzyapi.com/api.php/provide/vod/" },
  { name: "樱花|点播",   api: "https://m3u8.apiyhzy.com/api.php/provide/vod/" },
  { name: "卧龙|点播",   api: "https://collect.wolongzyw.com/api.php/provide/vod/" },
  { name: "飘花|点播",   api: "http://www.ahjiuman.com/api.php/provide/vod/at/json" },
  { name: "虎牙|点播",   api: "https://www.huyaapi.com/api.php/provide/vod/" },
  { name: "飘零|点播",   api: "https://p2100.net/api.php/provide/vod/" },
  { name: "无尽|点播",   api: "https://api.wujinapi.com/api.php/provide/vod/" },
  { name: "速博|点播",   api: "https://subocaiji.com/api.php/provide/vod/" },
  { name: "魔都|点播",   api: "https://caiji.moduapi.cc/api.php/provide/vod/" },
  { name: "最大|点播",   api: "http://zuidazy.me/api.php/provide/vod/" },
  { name: "火狐|点播",   api: "https://hhzyapi.com/api.php/provide/vod/" },
  { name: "新浪|点播",   api: "https://api.xinlangapi.com/xinlangapi.php/provide/vod/" },
  // AV sites (Type 1)
  { name: "森林资源|AV", api: "https://slapibf.com/api.php/provide/vod/" },
  { name: "探探资源|AV", api: "https://apittzy.com/api.php/provide/vod/" },
  { name: "奥斯卡资源|AV", api: "https://aosikazy.com/api.php/provide/vod/" },
  { name: "老鸭资源|AV", api: "https://api.apilyzy.com/api.php/provide/vod/" },
  { name: "皇冠|AV",     api: "https://hghhh.com/api.php/provide/vod/" },
  { name: "91麻豆|AV",   api: "https://91md.me/api.php/provide/vod/" },
  { name: "易看资源|AV", api: "https://api.yikanapi.com/api.php/provide/vod/" },
  { name: "番号资源|AV", api: "http://fhapi9.com/api.php/provide/vod/" },
  { name: "鲨鱼资源|AV", api: "https://shayuapi.com/api.php/provide/vod/" },
  { name: "KK写真资源|AV", api: "https://kkzy.me/api.php/provide/vod/" },
  { name: "AIvin|AV",    api: "http://lbapiby.com/api.php/provide/vod/at/json" },
  { name: "好色资源|AV", api: "https://haosezyw.com/api.php/provide/vod/" },
  { name: "最色资源|AV", api: "https://zszyw.top/api.php/provide/vod/" },
  { name: "色色虎资源|AV", api: "https://apisesehuzy.com/api.php/provide/vod/" },
  { name: "黄瓜资源|AV", api: "https://www.zy018.com/api.php/provide/vod/" },
  { name: "玉兔资源|AV", api: "https://apiyutu.com/api.php/provide/vod/" },
  { name: "麻豆视频|AV", api: "http://www.madouse.la/api.php/provide/vod/" },
  { name: "辣椒资源|AV", api: "https://apilj.com/api.php/provide/vod/" },
  { name: "甜蜜资源|AV", api: "https://timizy10.cc/api.php/provide/vod/" },
  { name: "奶香香|AV",   api: "https://Naixxzy.com/api.php/provide/vod/" },
  { name: "精品资源|AV", api: "https://www.jingpinx.com/api.php/provide/vod/" },
  { name: "草榴资源|AV", api: "https://www.caoliuzyw.com/api.php/prodao/vod/" },
  { name: "老色逼资源|AV", api: "https://apilsbzy1.com/api.php/provide/vod/" },
];

const TYPE3_SITES = [
  { name: "低端|VOD",        api: "csp_Ddrk" },
  { name: "厂长|VOD",        api: "csp_Czsapp" },
  { name: "绝缘|VOD",        api: "csp_Bdys" },
  { name: "欧乐|VOD🪜",      api: "csp_Olevod" },
  { name: "独播库|VOD",      api: "csp_duboku" },
  { name: "在线之家|VOD",    api: "csp_Zxzj" },
  { name: "LIBVIO|VOD",      api: "csp_libvio" },
  { name: "AGE动漫|VOD",     api: "csp_age" },
  { name: "ギリギリ动漫|VOD",api: "csp_girlgirllove" },
  { name: "韓劇看看",        api: "csp_hjkk",      ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/hjkk.js" },
  { name: "金牌影院",        api: "csp_jpyy",      ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/jpyy.js" },
  { name: "燒火電影",        api: "csp_saohuo",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/saohuo.js" },
  { name: "素白白影視",      api: "csp_subaibai",  ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/subaibai.js" },
  { name: "兩個BT",          api: "csp_bttwo",     ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/bttwo.js" },
  { name: "NO視頻",          api: "csp_novipnoad", ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/novipnoad.js" },
  { name: "星芽短劇",        api: "csp_xingya",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/xingya.js" },
  { name: "瓜子",            api: "csp_guazi",     ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/gzys.js" },
  { name: "anfuns",          api: "csp_anfuns",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/anfuns.js" },
  { name: "愛壹帆",          api: "csp_iyftv",     ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/iyftv.js" },
  { name: "天天影視",        api: "csp_tiantian",  ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/tiantian.js" },
  { name: "囧次元",          api: "csp_jcy",       ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/jcy.js" },
  { name: "hdmoli",          api: "csp_hdmoli",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/hdmoli.js" },
  { name: "nmlive",          api: "csp_nmlive",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/nmlive.js" },
  { name: "麻豆社",          api: "csp_madou",     ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/madou.js" },
  { name: "玩偶姐姐",        api: "csp_hkdoll",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/hkdoll.js" },
  { name: "Hanime1",         api: "csp_Hanime1",   ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/hanime.js" },
  { name: "秋名山見(live)",  api: "csp_harunasan", ext: "https://ghp.ci/https://gist.githubusercontent.com/Yswag/d9f072b75dab5b1b107c523dd148eea3/raw/harunasan.js" },
  { name: "小纸条 | PAN",    api: "csp_Gitcafe" },
  { name: "玩偶哥哥 | PAN",  api: "csp_WoGG" },
  { name: "阿里小站 | PAN",  api: "csp_pan666" },
  { name: "云盘资源 | PAN",  api: "csp_yunpan" },
  { name: "南風短劇 | PAN",  api: "csp_nanfdj",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/nanfdj.js" },
  { name: "多多影音 | PAN",  api: "csp_yydsys",    ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/yydsys.js" },
  { name: "蜡笔盘 | PAN",    api: "csp_labi",      ext: "https://ghp.ci/https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/labipan.js" },
  { name: "木偶 | PAN",      api: "csp_muou",      ext: "https://ghp.ci/https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/muou.js" },
  { name: "小米 | PAN",      api: "csp_mihdr",     ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/mihdr.js" },
  { name: "云盘资源网 | PAN",api: "csp_yunpanres", ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/yunpanres.js" },
  { name: "校长影视 | PAN",  api: "csp_xzys",      ext: "https://ghp.ci/https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/xzys.js" },
  { name: "正奕 | PAN",      api: "csp_wobgg",     ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/wobg.js" },
  // AV Type 3
  { name: "4k-av",           api: "csp_4kav",      ext: "https://ghp.ci/https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/4kav.js" },
  { name: "MISSAV",          api: "csp_Missav" },
  { name: "SupJav",          api: "csp_SupJav",    ext: "https://ghp.ci/https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/SupJav.js" },
];

// ─── Build TVBox/Senplayer JSON subscription ──────────────────────────────────
function buildTVBoxSubscription() {
  const sites = [];

  // Add Type 1 sites
  TYPE1_SITES.forEach((s, i) => {
    const key = s.name.replace(/[|｜\s]/g, '_').replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase() + '_' + i;
    sites.push({
      key,
      name: s.name,
      type: 1,
      api: s.api,
      searchable: 1,
      quickSearch: 1,
      filterable: 1
    });
  });

  // Add Type 3 sites
  TYPE3_SITES.forEach((s, i) => {
    const key = s.name.replace(/[|｜\s]/g, '_').replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase() + '_t3_' + i;
    const entry = {
      key,
      name: s.name,
      type: 3,
      api: s.api,
      searchable: 1,
      quickSearch: 1,
      filterable: 1
    };
    if (s.ext) entry.ext = s.ext;
    sites.push(entry);
  });

  const config = {
    spider: "https://gh.con.sh/https://github.com/FongMi/CatVodSpider/releases/download/release/jar.jar",
    wallpaper: "https://bing.img.run/rand_1080p.php",
    sites
  };

  return config;
}

// ─── Fetch VOD list from MacCMS Type 1 API ────────────────────────────────────
function fetchJSON(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VOD-Builder/1.0)',
        'Accept': 'application/json'
      },
      timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    setTimeout(() => { try { req.destroy(); } catch(e){} reject(new Error('Hard timeout')); }, timeout + 1000);
  });
}

// Category mapping
const CAT_MAP = {
  '电影': ['电影', '动作片', '喜剧片', '爱情片', '科幻片', '恐怖片', '剧情片', '战争片', '犯罪片', '动画片', 'Movie'],
  '电视剧': ['电视剧', '国产剧', '港台剧', '日韩剧', '欧美剧', '剧集', 'Drama', '连续剧'],
  '综艺': ['综艺', '综艺节目', '娱乐', 'variety', 'Show'],
  '纪录片': ['纪录片', '纪录', 'Documentary'],
  '其他': ['动漫', '体育', '资讯', '短片', '其他', '动画', 'Anime'],
};

function mapCategory(raw) {
  const name = (raw || '').trim();
  for (const [cat, keywords] of Object.entries(CAT_MAP)) {
    if (keywords.some(k => name.includes(k))) return cat;
  }
  return '其他';
}

function mapSubCategory(vodArea) {
  const area = (vodArea || '').trim();
  const subMap = [
    { key: '欧美', words: ['美国', '英国', '法国', '德国', '意大利', '西班牙', '欧美', '美', '英', '澳大利亚', '加拿大'] },
    { key: '日本', words: ['日本', '日'] },
    { key: '韩国', words: ['韩国', '韩', '朝鲜'] },
    { key: '台湾', words: ['台湾', '台'] },
    { key: '香港', words: ['香港', '港'] },
    { key: '亚洲其他', words: ['泰国', '印度', '马来西亚', '越南', '新加坡', '印尼', '菲律宾', '亚洲'] },
  ];
  for (const { key, words } of subMap) {
    if (words.some(w => area.includes(w))) return key;
  }
  return ''; // 中国大陆等不标注
}

async function fetchSiteVods(site, limit = 50) {
  const results = [];
  try {
    // Get first page to know total
    const firstUrl = `${site.api}?ac=videolist&pg=1`;
    const first = await fetchJSON(firstUrl);
    if (!first || !first.list) return results;

    // Only fetch up to 2 pages for speed
    const pages = Math.min(2, first.pagecount || 1);
    
    let allItems = [...first.list];
    for (let p = 2; p <= pages; p++) {
      try {
        const page = await fetchJSON(`${site.api}?ac=videolist&pg=${p}`);
        if (page && page.list) allItems = allItems.concat(page.list);
      } catch (e) { break; }
    }

    for (const item of allItems.slice(0, limit)) {
      if (!item.vod_play_url) continue;
      // Parse play URLs
      const sources = item.vod_play_url.split('$$$');
      for (const source of sources) {
        const episodes = source.split('#');
        for (const ep of episodes) {
          const parts = ep.split('$');
          const epName = parts[0] || '';
          const epUrl = parts[parts.length - 1] || '';
          if (!epUrl || !epUrl.startsWith('http')) continue;
          if (!epUrl.includes('.m3u8') && !epUrl.includes('.mp4') && !epUrl.includes('m3u8')) continue;
          
          results.push({
            title: item.vod_name || 'Unknown',
            episode: epName,
            url: epUrl,
            category: mapCategory(item.type_name),
            subCategory: mapSubCategory(item.vod_area),
            year: item.vod_year || '',
            sourceName: site.name
          });
        }
      }
    }
  } catch (e) {
    // Site unreachable, skip
  }
  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const docsDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  // 1. Build and write TVBox subscription JSON
  console.log('📦 Building TVBox/Senplayer subscription JSON...');
  const subscription = buildTVBoxSubscription();
  const subPath = path.join(docsDir, 'tvbox-subscription.json');
  fs.writeFileSync(subPath, JSON.stringify(subscription, null, 2), 'utf8');
  console.log(`✅ Written: docs/tvbox-subscription.json (${subscription.sites.length} sites)`);

  // 2. Build M3U8 from Type 1 sites (parallel, limited)
  console.log('\n🌐 Fetching VOD streams from Type 1 MacCMS sites...');
  console.log('   (This may take 1-2 minutes...)');

  // Use concurrency limit
  const CONCURRENCY = 8;
  let allVods = [];
  for (let i = 0; i < TYPE1_SITES.length; i += CONCURRENCY) {
    const batch = TYPE1_SITES.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(s => fetchSiteVods(s, 30)));
    results.forEach(r => allVods = allVods.concat(r));
    process.stdout.write(`   Fetched ${Math.min(i + CONCURRENCY, TYPE1_SITES.length)}/${TYPE1_SITES.length} sites (${allVods.length} streams so far)\r`);
  }
  console.log(`\n✅ Total streams collected: ${allVods.length}`);

  // Build M3U8
  let m3u8 = '#EXTM3U x-tvg-url="" tvg-shift=0\n';
  m3u8 += `# Generated: ${new Date().toISOString()}\n`;
  m3u8 += `# Sources: ${TYPE1_SITES.length} Type-1 MacCMS sites + ${TYPE3_SITES.length} Type-3 CSP sites (see tvbox-subscription.json)\n\n`;

  // Group by category
  const grouped = {};
  for (const vod of allVods) {
    const g = vod.category || '其他';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(vod);
  }

  const catOrder = ['电影', '电视剧', '综艺', '纪录片', '其他'];
  for (const cat of catOrder) {
    const items = grouped[cat] || [];
    for (const v of items) {
      const subCat = v.subCategory ? ` - ${v.subCategory}` : '';
      const epPart = v.episode ? ` [${v.episode}]` : '';
      const yearPart = v.year ? ` (${v.year})` : '';
      const title = `${v.title}${epPart}${yearPart}`;
      const group = `${cat}${subCat}`;
      m3u8 += `#EXTINF:-1 tvg-id="" tvg-name="${title}" group-title="${group}",${title}\n`;
      m3u8 += `${v.url}\n`;
    }
  }

  const m3u8Path = path.join(docsDir, 'playlist.m3u8');
  fs.writeFileSync(m3u8Path, m3u8, 'utf8');
  
  // Stats
  const lineCount = allVods.length;
  console.log(`\n📊 M3U8 Stats:`);
  for (const cat of catOrder) {
    const n = (grouped[cat] || []).length;
    if (n > 0) console.log(`   ${cat}: ${n} streams`);
  }
  console.log(`   Total: ${lineCount} streams`);
  console.log(`✅ Written: docs/playlist.m3u8`);

  console.log('\n🎉 Done! Files ready in docs/');
  console.log('   - docs/tvbox-subscription.json  ← Senplayer/TVBox subscription (ALL sites)');
  console.log('   - docs/playlist.m3u8            ← M3U8 playlist (Type 1 sites)');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
