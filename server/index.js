/**
 * SPlayer Web Backend - Main Express Server
 *
 * Proxies requests to Netease Cloud Music API with per-user cookie management.
 *
 * Usage:
 *   node server/index.js [port]
 *
 * Environment variables:
 *   NODE_ENV        - "production" or "development" (default: production)
 *   LOG_LEVEL       - "error" | "warn" | "info" | "debug" (default: warn)
 */

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {
  weapiRequest,
  eapiRequest,
  parseCookieString,
  hasNeteaseLogin,
  ensureCookieHeader,
} from "./crypto.js";
import { handleLoginQrKey, handleLoginQrCreate, handleLoginQrCheck, getLoginInfo } from "./login.js";

// ── Configuration ────────────────────────────────────────────────────────────
const PORT = parseInt(process.argv[2], 10) || parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "production";
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === "development" ? "debug" : "warn");
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS, 10) || 24 * 60 * 60 * 1000; // 24h
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS, 10) || 10000;

// ── Logging ──────────────────────────────────────────────────────────────────
function log(level, msg, meta) {
  if (level === "debug" && LOG_LEVEL !== "debug") return;
  if (level === "info" && !["info", "debug"].includes(LOG_LEVEL)) return;
  if (level === "warn" && !["warn", "info", "debug"].includes(LOG_LEVEL)) return;
  if (level === "error" && !["error", "warn", "info", "debug"].includes(LOG_LEVEL)) return;
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console[level](`[${ts}] [${level.toUpperCase()}] ${msg}${metaStr}`);
}

// ── Session Store (in-memory, with TTL cleanup) ──────────────────────────────
class SessionStore {
  constructor(maxSessions, ttlMs) {
    this.store = new Map();
    this.maxSessions = maxSessions;
    this.ttlMs = ttlMs;
    this._cleanupTimer = setInterval(() => this._cleanup(), 5 * 60 * 1000);
    this._cleanupTimer.unref?.();
  }

  _cleanup() {
    const now = Date.now();
    for (const [id, entry] of this.store) {
      if (now - entry.createdAt > this.ttlMs) {
        this.store.delete(id);
      }
    }
  }

  get(id) {
    const entry = this.store.get(id);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.store.delete(id);
      return null;
    }
    return entry;
  }

  set(id, data) {
    if (this.store.size >= this.maxSessions) {
      // Evict oldest entry
      let oldestId = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.store) {
        if (v.createdAt < oldestTime) {
          oldestTime = v.createdAt;
          oldestId = k;
        }
      }
      if (oldestId) this.store.delete(oldestId);
    }
    this.store.set(id, { ...data, createdAt: Date.now() });
  }

  destroy(id) {
    this.store.delete(id);
  }

  size() {
    return this.store.size;
  }
}

const sessions = new SessionStore(MAX_SESSIONS, SESSION_TTL_MS);

// ── Helpers ──────────────────────────────────────────────────────────────────
function getClientId(req) {
  // Prefer explicit client id from query
  const cid = req.query?.clientId || req.query?.client_id || req.query?.uid;
  if (cid) return String(cid);
  // Fall back to X-Client-ID header
  const h = req.headers["x-client-id"];
  if (h) return String(h);
  // Generate from IP + user-agent fingerprint
  return null;
}

function getSessionId(req) {
  return getClientId(req) || req.ip || "anonymous";
}

function readCookieFromRequest(req) {
  const cookie = req.query?.cookie || req.headers?.cookie || "";
  // Also check Authorization header as fallback
  const auth = req.headers?.authorization || "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return String(cookie || "");
}

/**
 * Forward a request to Netease API with proper encryption and cookies.
 * Routes to weapi or eapi based on the target path.
 */
async function proxyToNetease(cookieHeader, method, path, data) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");

  // Login endpoints always use EAPI
  if (
    normalizedPath.startsWith("login/") ||
    normalizedPath.startsWith("eapi/") ||
    normalizedPath === "user/account"
  ) {
    return eapiRequest(normalizedPath, data, cookieHeader);
  }

  // Most endpoints use WEAPI
  try {
    return await weapiRequest(normalizedPath, data, cookieHeader);
  } catch (weapiErr) {
    // Fallback to EAPI for endpoints that require it
    log("debug", `WEAPI failed for ${normalizedPath}, retrying with EAPI: ${weapiErr.message}`);
    return eapiRequest(normalizedPath, data, cookieHeader);
  }
}

/**
 * Transform cookie params into proper Cookie header format.
 */
function normalizeCookie(cookieStr) {
  if (!cookieStr) return "";
  // Ensure it ends with ; for consistent parsing
  return cookieStr.replace(/;+$/, "").trim();
}

// ── Express App ──────────────────────────────────────────────────────────────
const app = express();

// CORS — allow all origins (SPlayer frontend can be on any domain)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-ID"],
  })
);

// Body parsing (for login POST endpoints)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (debug only)
app.use((req, res, next) => {
  if (LOG_LEVEL === "debug") {
    log("debug", `${req.method} ${req.path}`, { ip: req.ip, queryKeys: Object.keys(req.query || {}) });
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 200, message: "请求过于频繁，请稍后再试" },
});
app.use("/api", limiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "splayer-web-backend",
    env: NODE_ENV,
    sessions: sessions.size(),
    uptime: process.uptime(),
  });
});

// ── Core API Proxy ───────────────────────────────────────────────────────────
app.all("/api/*", async (req, res) => {
  try {
    const clientCookie = readCookieFromRequest(req);
    const sessionId = getSessionId(req);
    const path = req.path.replace(/^\/api\//, "");

    // ── Login QR endpoints (use EAPI, no cookie needed) ────────────────────
    if (path === "login/qr/key") {
      const result = await handleLoginQrKey();
      return res.json(result);
    }
    if (path === "login/qr/create") {
      const key = req.query?.key || req.body?.key || "";
      const result = await handleLoginQrCreate(key);
      return res.json(result);
    }
    if (path === "login/qr/check") {
      const key = req.query?.key || req.body?.key || "";
      const result = await handleLoginQrCheck(key);
      if (result.cookie) {
        // Store the cookie in session
        sessions.set(sessionId, { cookie: normalizeCookie(result.cookie), userId: result.userId || "" });
      }
      return res.json(result);
    }
    if (path === "login/status") {
      const cookie = normalizeCookie(clientCookie || sessions.get(sessionId)?.cookie || "");
      const info = await getLoginInfo(cookie);
      return res.json(info);
    }
    if (path === "login/refresh") {
      const cookie = normalizeCookie(clientCookie || sessions.get(sessionId)?.cookie || "");
      const info = await getLoginInfo(cookie);
      return res.json(info);
    }
    if (path === "logout") {
      sessions.destroy(sessionId);
      return res.json({ code: 200, message: "退出成功" });
    }

    // ── Fetch the user's cookie (from query param, header, or session) ─────
    let cookieHeader = normalizeCookie(clientCookie);
    if (!cookieHeader) {
      const session = sessions.get(sessionId);
      cookieHeader = session?.cookie || "";
    }

    // ── Proxy to Netease API ────────────────────────────────────────────────
    const data = req.method === "GET" ? (req.query || {}) : (req.body || req.query || {});

    // Remove internal-only fields from forwarded data
    const { cookie: _c, noCookie, realIP: _rip, proxy: _proxy, clientId, client_id, uid, ...apiData } = data;

    const result = await proxyToNetease(cookieHeader, req.method, path, apiData);

    // Save cookie to session if login was detected
    if (hasNeteaseLogin(cookieHeader) && !sessions.get(sessionId)) {
      sessions.set(sessionId, { cookie: cookieHeader, userId: result?.profile?.userId || "" });
    }

    return res.json(result);
  } catch (err) {
    log("error", `API proxy error: ${err.message}`, { path: req.path, method: req.method });
    return res.status(502).json({
      code: 502,
      message: err.message || "服务暂时不可用，请稍后重试",
      path: req.path,
    });
  }
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `Not found: ${req.method} ${req.path}` });
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  log("error", `Unhandled error: ${err.message}`);
  res.status(500).json({ code: 500, message: "Internal Server Error" });
});

// ── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  log("info", `SPlayer Web Backend started`, {
    port: PORT,
    host: HOST,
    env: NODE_ENV,
    logLevel: LOG_LEVEL,
    maxSessions: MAX_SESSIONS,
    sessionTtl: `${SESSION_TTL_MS / 3600000}h`,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("info", "SIGTERM received, shutting down gracefully");
  clearInterval(sessions._cleanupTimer);
  server.close(() => {
    log("info", "Server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  log("info", "SIGINT received, shutting down");
  clearInterval(sessions._cleanupTimer);
  server.close(() => process.exit(0));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  log("error", `Uncaught exception: ${err.message}`, { stack: err.stack });
});
process.on("unhandledRejection", (reason) => {
  log("error", `Unhandled rejection: ${reason}`);
});

export { app, server };

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Already listening via app.listen above
}
