# SPlayer Web Backend

基于 Mineradio-Bridge 模式的网易云音乐 Web 后端代理。

## 功能

- **API 代理**：将所有 `/api/*` 请求代理到网易云音乐 API（`music.163.com` / `interface.music.163.com`）
- **Cookie 管理**：通过请求参数或 Session 存储用户 Cookie，支持多用户独立会话
- **QR 码登录**：实现完整的二维码扫码登录流程（EAPI）
- **加密兼容**：完整实现 WEAPI / EAPI 加密算法（crypto-js）
- **限流保护**：内置 rate limiter 防止滥用

## 与 Mineradio-Bridge 的对照

| Mineradio-Bridge (Chrome 扩展) | SPlayer Web Backend (Node.js) |
|---|---|
| `chrome.cookies.getAll()` 读取浏览器 Cookie | 客户端通过请求参数传递 Cookie（`?cookie=MUSIC_U=xxx;__csrf=xxx;`） |
| `chrome.storage.local` 缓存数据 | 内存 Session Store（支持 TTL 自动清理） |
| Service Worker (`background.js`) | Express HTTP Server (`server/index.js`) |
| Content Script → `postMessage` | 前端 axios → 后端 `/api/*` 代理 |
| CryptoJS from vendor | npm `crypto-js` 包 |

## 快速开始

### 本地运行（开发）

```bash
cd server
npm install
npm run dev
# 服务启动在 http://localhost:3000
```

### Docker 部署

```bash
docker-compose up -d
# 访问 http://localhost:7899
```

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 后端服务端口 |
| `HOST` | `0.0.0.0` | 绑定地址 |
| `NODE_ENV` | `production` | 运行环境 |
| `LOG_LEVEL` | `warn` | 日志级别：`debug`/`info`/`warn`/`error` |
| `SESSION_TTL_MS` | `86400000` | Session 有效期（毫秒） |
| `MAX_SESSIONS` | `10000` | 最大并发 Session 数 |

## 前端接入方式

### Electron 环境（已有）
Electron 内已启动本地 NCM API，无需此后端。

### Web 环境（需配置）

在 `.env` 中设置：

```env
RENDERER_VITE_SERVER_URL="https://你的后端地址/api"
```

前端请求会自动携带 Cookie 参数：
```js
// request.js 会自动附加：
params.cookie = `MUSIC_U=${getCookie("MUSIC_U")};__csrf=${getCookie("__csrf")};`
```

### 登录流程（Web 端）

1. 前端调用 `/api/login/qr/key` 获取二维码 key
2. 调用 `/api/login/qr/create?key=xxx` 获取二维码图片 URL
3. 用户扫码后，轮询 `/api/login/qr/check?key=xxx`
4. 登录成功时返回 `{ code: 803, cookie: "MUSIC_U=xxx;__csrf=xxx;" }`
5. 前端将 `cookie` 存入 localStorage/js-cookie，后续请求自动附带

## API 路由

所有路由均挂载在 `/api/` 下，与网易云音乐官方 API 路径一致：

```
GET  /api/login/qr/key         → 获取登录二维码 key
GET  /api/login/qr/create      → 生成二维码图片
GET  /api/login/qr/check       → 检查扫码状态
GET  /api/login/status         → 查询登录状态
GET  /api/login/refresh        → 刷新登录
GET  /api/logout               → 退出登录

GET  /api/*                    → 代理所有网易云 API 请求
                             → 自动转发 Cookie、realIP、proxy 参数
```

## 目录结构

```
server/
├── index.js      # Express 主服务器（API 代理 + Session 管理）
├── crypto.js     # WEAPI / EAPI 加密算法 + Cookie 解析
├── login.js      # QR 码登录处理器
└── package.json  # 服务端依赖
```
