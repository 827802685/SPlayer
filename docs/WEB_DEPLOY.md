# SPlayer Web 部署指南

本文档说明如何将 SPlayer 部署为纯 Web 应用（非 Electron 桌面端），提供完整可用的后端 API 服务。

---

## 架构概述

```
┌─────────────────────────────────────────────────┐
│  浏览器 (SPlayer 前端)                           │
│  · Vue 3 + Pinia + Naive UI                    │
│  · axios 请求 → /api/*                         │
│  · Cookie 存储在 localStorage (js-cookie)       │
└──────────────────────┬──────────────────────────┘
                       │ HTTP /api/*
                       ▼
┌─────────────────────────────────────────────────┐
│  Nginx (port 7899)                              │
│  · 静态文件 → /usr/share/nginx/html             │
│  · /api/*  → proxy_pass → localhost:3000        │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Node.js Backend (server/index.js, port 3000)   │
│  · Session Store: 内存，支持 TTL + 自动清理      │
│  · Cookie 管理: 从请求参数/Session 读取           │
│  · WEAPI/EAPI 加密: 转发到 music.163.com         │
│  · QR 登录: EAPI 扫码登录流程                    │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
                       ▼
            ┌──────────────────────┐
            │  网易云音乐 API       │
            │  music.163.com       │
            │  interface.music.    │
            │  163.com             │
            └──────────────────────┘
```

---

## 快速部署（Docker）

### 前置条件
- Docker + Docker Compose 已安装
- 至少 512MB 内存

### 一键部署
```bash
# 克隆项目
git clone https://github.com/MoeFurina/SPlayer.git
cd SPlayer

# 构建并启动
docker-compose up -d

# 访问 http://你的服务器IP:7899
```

### 自定义配置
```bash
# 编辑 .env 文件
cp .env.example .env
# 修改 RENDERER_VITE_SERVER_URL 等配置

# 重新构建
docker-compose up -d --build
```

### 查看日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
# 保留数据
docker-compose down -v
```

---

## 手动部署（VPS）

### 1. 安装依赖
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx supervisor

# 安装全局依赖
npm install -g crypto-js express cors express-rate-limit
```

### 2. 构建前端
```bash
git clone https://github.com/MoeFurina/SPlayer.git
cd SPlayer
cp .env.example .env
npm install -g pnpm
pnpm install
pnpm run build
```

### 3. 配置 Nginx
```bash
sudo cp nginx.conf /etc/nginx/conf.d/default.conf
sudo nginx -t && sudo systemctl restart nginx
```

### 4. 启动后端
```bash
# 开发模式
node server/index.js 3000

# 生产模式（使用 supervisor）
sudo cp server/splayer.conf /etc/supervisor/conf.d/
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl start splayer
```

### 5. 配置防火墙
```bash
sudo ufw allow 7899/tcp
sudo ufw allow 3000/tcp  # 仅本地访问
```

---

## 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| `RENDERER_VITE_SERVER_URL` | `""` | 后端 API 地址（浏览器端使用） |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 后端服务端口 |
| `LOG_LEVEL` | `warn` | 日志级别：debug/info/warn/error |
| `SESSION_TTL_MS` | `86400000` | Session 有效期（毫秒），默认 24h |
| `MAX_SESSIONS` | `10000` | 最大并发 Session 数 |

---

## 登录流程（Web 端）

Web 端没有浏览器 Cookie 访问权限，需要通过以下步骤完成登录：

1. **用户访问前端** → 前端检测到未登录
2. **点击登录** → 前端调用 `/api/login/qr/key` 获取二维码 key
3. **显示二维码** → 前端调用 `/api/login/qr/create?key=xxx` 获取图片 URL
4. **用户扫码** → 前端轮询 `/api/login/qr/check?key=xxx`
5. **登录成功** → 后端返回 `{ code: 803, cookie: "MUSIC_U=xxx;__csrf=xxx;" }`
6. **存储 Cookie** → 前端将 cookie 存入 `localStorage` + `js-cookie`
7. **后续请求** → 前端自动在每次请求中附带 `?cookie=MUSIC_U=xxx;`

后端会自动将 Cookie 存入 Session，下次访问无需重复登录。

---

## 与 Mineradio-Bridge 的对照

| 功能 | Mineradio-Bridge (Chrome 扩展) | SPlayer Web Backend |
|---|---|---|
| **Cookie 来源** | `chrome.cookies.getAll()` 读取浏览器已登录 Cookie | 用户通过 QR 码登录后，Cookie 存于 Session |
| **API 代理** | Service Worker → `fetch()` | Express → `fetch()` 到 `music.163.com` |
| **加密算法** | WEAPI/EAPI (crypto-es) | WEAPI/EAPI (crypto-js) |
| **多账号支持** | 每个浏览器标签独立 Cookie | 每个 Session 独立 Cookie（基于客户端 ID 或 IP） |
| **登录方式** | 依赖用户在 music.163.com 已登录 | 内置 QR 码登录（EAPI） |
| **部署方式** | Chrome Web Store 扩展 | Docker / VPS Node.js 服务 |

---

## 常见问题

### Q: 登录成功后无法播放音乐？
A: 检查 `.env` 中 `RENDERER_VITE_SERVER_URL` 是否正确指向你的后端地址，并确保后端服务运行正常（`http://你的域名:3000/api/health` 返回 JSON）。

### Q: 部分歌曲仍然灰色无法播放？
A: 这是网易云版权限制，与后端无关。可以尝试切换音质等级或使用解灰功能（需配置 meting-api-serverless）。

### Q: Session 过期后需要重新登录？
A: 默认 Session 有效期 24 小时。可通过 `SESSION_TTL_MS` 环境变量调整。Cookie 中的 MUSIC_U 本身有效期约 30 天。

### Q: 如何更换后端地址？
A: 修改 `.env` 中的 `RENDERER_VITE_SERVER_URL`，重新构建前端并部署。

### Q: 支持多用户同时使用吗？
A: 支持。每个用户通过独立的 Session 隔离 Cookie，互不干扰。

---

## 目录结构

```
SPlayer/
├── server/                    # 后端 API 服务
│   ├── index.js              # Express 主服务器
│   ├── crypto.js             # WEAPI/EAPI 加密算法
│   ├── login.js              # QR 码登录处理器
│   ├── package.json          # 服务端依赖
│   └── README.md             # 详细文档
├── electron/                  # Electron 桌面端代码
├── src/                       # Vue 前端代码
├── Dockerfile                 # Docker 构建文件
├── docker-compose.yml         # Docker Compose 配置
├── nginx.conf                 # Nginx 反向代理配置
├── .env.example               # 环境变量示例
└── package.json               # 项目根配置
```
