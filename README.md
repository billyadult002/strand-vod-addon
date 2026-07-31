# Apple TV Strand App & Stremio - 中文聚合影视 VOD Addon

这是一个专为 **Apple TV Strand App** 和 **Stremio** 设计的中文多源影视聚合 Addon 服务。

本项目将输入的 4 个原始 VOD 配置文件（共 602 个源）进行了深度合并与去重，精简提炼出 **301 个有效独立的中文 VOD API 接口**，并自动封装为标准 Stremio v3 Addon 协议。

---

## 🌟 功能特性

- **合并去重**: 自动去除重复域名、格式化 URLPath、保留最佳站点名称，从 602 个原始源中提炼出 301 个独占源。
- **Strand / Stremio 极速兼容**: 完美支持 Apple TV Strand App 的 Addon 扩展机制，提供 `/manifest.json`, `/catalog`, `/meta`, `/stream` 路由。
- **并发检索 & 自动解包**: 在搜剧或播放时，自动并发请求优质 VOD 接口，并解析 MacCMS/苹果CMS `vod_play_url` 输出流媒体 URL。
- **零配置一键部署**: 支持 Vercel 免费一键部署、Docker 容器化部署或本地 Node.js 运行。

---

## 📁 目录结构

```text
strand-vod-addon/
├── data/
│   ├── vod_sources.json     # 合并去重后的 301 个 VOD 源 JSON
│   └── tvbox_sources.json   # TVBox / CatVod 兼容格式 JSON
├── scripts/
│   └── merge_dedup.py       # Python 自动合并去重脚本
├── src/
│   ├── addon.js             # Stremio Addon Protocol 处理器
│   ├── maccms.js            # MacCMS VOD API 并发客户端
│   └── server.js            # Express Web 服务器
├── Dockerfile               # Docker 镜像构建文件
├── vercel.json              # Vercel 云端发布配置
└── package.json
```

---

## 🚀 快速上手与运行

### 1. 本地运行

```bash
# 安装依赖
npm install

# 启动服务 (默认端口 7000)
npm start
```

服务启动后，浏览器打开 `http://localhost:7000` 即可看到主页。

### 2. Vercel 一键云端部署 (推荐 Apple TV 使用)

可以直接将本 GitHub 仓库导入至 [Vercel](https://vercel.com/)，选择 Node.js 环境一键部署，部署完成后获得公网 HTTPS 域名，例如：
`https://your-addon.vercel.app/manifest.json`

---

## 📺 在 Apple TV Strand App 中使用

1. 打开 Apple TV 上的 **Strand App**。
2. 进入 `Settings (设置) -> Addons (插件)`。
3. 输入您部署好的 Addon 地址：`https://your-domain.com/manifest.json`。
4. 点击确认安装，即可在 Strand App 中搜索、浏览与播放海量影视资源！

---

## 📄 开源协议

MIT License
