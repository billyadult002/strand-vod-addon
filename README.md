# Strand VOD Addon / Senplayer 订阅

中文视频点播资源聚合，适配 **Senplayer**、**TVBox**、**CatVod** 等播放器。

---

## 📺 使用方法

### 方式一：TVBox / Senplayer 全量订阅（推荐）

> 包含 **全部 99 个站点**（Type 1 MacCMS + Type 3 CSP 脚本站点）

**订阅地址：**
```
https://raw.githubusercontent.com/billyadult002/strand-vod-addon/main/docs/tvbox-subscription.json
```

**Senplayer 添加方法：**
1. 打开 Senplayer → 设置 → 视频源
2. 添加订阅 → 粘贴上面地址
3. 确认后刷新即可看到全部站点

**TVBox 添加方法：**
1. 设置 → 配置地址 → 粘贴上面地址

---

### 方式二：M3U8 播放列表（直接播放）

> 从 Type 1 MacCMS API 实时抓取的可直播流，适合任何支持 M3U8 的播放器（Senplayer、VLC、Infuse 等）

**播放列表地址：**
```
https://raw.githubusercontent.com/billyadult002/strand-vod-addon/main/docs/playlist.m3u8
```

**分类结构：**
- 📽️ 电影（欧美、日本、韩国、台湾、香港、亚洲其他）
- 📺 电视剧（欧美、日本、韩国、台湾、香港、亚洲其他）
- 🎭 综艺
- 🎬 纪录片
- 🎌 其他（动漫等）

---

## 📋 站点列表

### Type 1 — MacCMS API 直接访问（共 57 个）

| 站点 | API |
|------|-----|
| 360|点播 | 360zy.com |
| 墨斗|点播 | mdzyapi.com |
| 黑木耳|点播 | heimuer.xyz |
| 华为吧|点播 | hw8.live |
| 腐剧|点播 | fuju2024.cc |
| 金鹰|点播 | jinyingzy.com |
| OK|点播 | okzyw9.com |
| 宝片|点播 | zpsps.com |
| 小黄人|点播 | xiaohuangrentv.com |
| 牛牛|点播 | niuniuzy.me |
| 丫丫|点播 | yayazy.net |
| 影图|点播 | vodimg.top |
| U酷|点播 | ukuapi.com |
| 豪华|点播 | hhzyapi.com |
| 极速|点播 | jszyapi.com |
| 索尼|点播 | suoniapi.com |
| ikun|点播 | ikunzyapi.com |
| 非凡|点播 | ffzyapi.com |
| 量子|点播 | lziapi.com |
| 暴风|点播 | bfzyapi.com |
| 红牛|点播 | hongniuzy2.com |
| 快车|点播 | kczyapi.com |
| 闪电|点播 | sdzyapi.com |
| 樱花|点播 | apiyhzy.com |
| 卧龙|点播 | wolongzyw.com |
| 飘花|点播 | ahjiuman.com |
| 虎牙|点播 | huyaapi.com |
| 飘零|点播 | p2100.net |
| 无尽|点播 | wujinapi.com |
| 速博|点播 | subocaiji.com |
| 魔都|点播 | moduapi.cc |
| 最大|点播 | zuidazy.me |
| 火狐|点播 | hhzyapi.com |
| 新浪|点播 | xinlangapi.com |
| 森林资源\|AV | slapibf.com |
| 探探资源\|AV | apittzy.com |
| 奥斯卡资源\|AV | aosikazy.com |
| 老鸭资源\|AV | apilyzy.com |
| 皇冠\|AV | hghhh.com |
| 91麻豆\|AV | 91md.me |
| 易看资源\|AV | yikanapi.com |
| 番号资源\|AV | fhapi9.com |
| 鲨鱼资源\|AV | shayuapi.com |
| KK写真资源\|AV | kkzy.me |
| AIvin\|AV | lbapiby.com |
| 好色资源\|AV | haosezyw.com |
| 最色资源\|AV | zszyw.top |
| 色色虎资源\|AV | apisesehuzy.com |
| 黄瓜资源\|AV | zy018.com |
| 玉兔资源\|AV | apiyutu.com |
| 麻豆视频\|AV | madouse.la |
| 辣椒资源\|AV | apilj.com |
| 甜蜜资源\|AV | timizy10.cc |
| 奶香香\|AV | Naixxzy.com |
| 精品资源\|AV | jingpinx.com |
| 草榴资源\|AV | caoliuzyw.com |
| 老色逼资源\|AV | apilsbzy1.com |

### Type 3 — CSP 脚本站点（共 42 个，需 TVBox/Senplayer）

低端|VOD、厂长|VOD、绝缘|VOD、欧乐|VOD、独播库|VOD、在线之家|VOD、LIBVIO|VOD、AGE动漫|VOD、ギリギリ动漫|VOD、韓劇看看、金牌影院、燒火電影、素白白影視、兩個BT、NO視頻、星芽短劇、瓜子、anfuns、愛壹帆、天天影視、囧次元、hdmoli、nmlive、麻豆社、玩偶姐姐、Hanime1、秋名山見、小纸条(PAN)、玩偶哥哥(PAN)、阿里小站(PAN)、云盘资源(PAN)、南風短劇(PAN)、多多影音(PAN)、蜡笔盘(PAN)、木偶(PAN)、小米(PAN)、云盘资源网(PAN)、校长影视(PAN)、正奕(PAN)、4k-av、MISSAV、SupJav

---

## ⚙️ 技术说明

- **Type 1** 站点使用 MacCMS `/api.php/provide/vod/` 接口，可直接生成 M3U8
- **Type 3** 站点使用 CSP Spider 脚本，需要 TVBox/CatVod/Senplayer 运行时环境才能解密视频链接
- Spider JAR: `FongMi/CatVodSpider` (自动通过 gh.con.sh 代理)

---

## 🔄 更新

手动运行更新脚本：
```bash
node scripts/build-subscription.js
git add docs/ && git commit -m "update" && git push
```
