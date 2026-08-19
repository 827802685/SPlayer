/**
 * SPlayer Web Backend - Login Handlers
 *
 * Provides QR code login for Netease Cloud Music, matching the frontend API:
 *   GET /login/qr/key       → { key, qrimg, url }
 *   GET /login/qr/create    → { img, qrimg, url }
 *   GET /login/qr/check     → { code, message, nickname, avatar, loggedIn, ... }
 */

import { eapiRequest } from "./crypto.js";

function buildLoginQrUrl(key) {
  return `https://music.163.com/login?codekey=${encodeURIComponent(key)}`;
}

function cookieHeaderFromSetCookieList(list) {
  const map = new Map();
  (list || []).forEach((raw) => {
    const part = String(raw || "").split(";")[0];
    const eq = part.indexOf("=");
    if (eq <= 0) return;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name && value) map.set(name, value);
  });
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Generate a QR code key for login.
 * Uses EAPI (required for QR flow).
 */
export async function handleLoginQrKey() {
  let body = {};
  try {
    const raw = await eapiRequest("/api/login/qrcode/unikey", { type: 3 }, "");
    body = raw.body || {};
  } catch (err) {
    throw new Error(err?.message || "获取二维码 key 失败");
  }
  const key =
    body.unikey ||
    body.uniKey ||
    (body.data && (body.data.unikey || body.data.uniKey)) ||
    "";
  if (!key) {
    const hint = body.message || body.msg || (body.code != null ? `code=${body.code}` : "empty body");
    throw new Error(`获取二维码 key 失败（${hint}）`);
  }
  return { key, unikey: key, code: Number(body.code) || 200 };
}

/**
 * Create QR code image URL.
 */
export async function handleLoginQrCreate(key) {
  if (!key) throw new Error("缺少二维码 key");
  const url = buildLoginQrUrl(key);
  const img = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(url)}`;
  return { img, qrimg: img, url };
}

/**
 * Check QR code scan status.
 * Returns { code, message, nickname, avatar, loggedIn, cookie } on success (code=803).
 */
export async function handleLoginQrCheck(key) {
  key = String(key || "").trim();
  if (!key) return { code: 800, message: "缺少二维码 key", loggedIn: false };

  let body = {};
  let setCookies = [];
  try {
    const raw = await eapiRequest("/api/login/qrcode/client/login", { key, type: 3 }, "");
    body = raw.body || {};
    setCookies = raw.setCookies || [];
  } catch (err) {
    return {
      code: 801,
      error: err?.message || "扫码状态查询失败",
      message: err?.message || "扫码状态查询失败",
      loggedIn: false,
    };
  }

  const code = Number(body.code || 0);
  const profile = body.profile || (body.data && body.data.profile) || {};

  // Extract cookie string from response
  let cookieText = "";
  if (Array.isArray(body.cookie)) {
    cookieText = body.cookie.filter(Boolean).join("; ");
  } else {
    cookieText = String(body.cookie || (body.data && body.data.cookie) || "").trim();
  }
  if (!cookieText && setCookies.length) {
    cookieText = cookieHeaderFromSetCookieList(setCookies);
  }

  if (code === 803) {
    // Login successful — return the cookie for the client to store
    return {
      code: 803,
      message: body.message || "登录成功",
      nickname: profile.nickname || body.nickname || "网易云用户",
      avatar: profile.avatarUrl || body.avatarUrl || "",
      loggedIn: true,
      hasCookie: !!cookieText,
      cookie: cookieText,
      userId: profile.userId || body.userId || "",
    };
  }

  return {
    code,
    message:
      body.message ||
      ({ 800: "二维码已过期", 801: "等待扫码", 802: "已扫码，待确认" }[code] || ""),
    nickname: profile.nickname || body.nickname || "",
    avatar: profile.avatarUrl || body.avatarUrl || "",
    loggedIn: false,
    hasCookie: false,
  };
}

/**
 * Get login status from cookie header.
 * Returns { loggedIn, userId, nickname, avatar, vipType, vipLevel, isVip, isSvip, vipLabel }
 */
export async function getLoginInfo(cookieHeader) {
  if (!cookieHeader || !/\bMUSIC_U\b/.test(cookieHeader)) {
    return { loggedIn: false, vipType: 0, vipLevel: "none", isVip: false, isSvip: false, vipLabel: "无VIP" };
  }

  try {
    const body = await import("./crypto.js").then((m) =>
      m.weapiRequest("/api/w/nuser/account/get", {}, cookieHeader)
    );
    const account = body.account || body.data?.account || {};
    const profile = body.profile || body.data?.profile || {};
    const userId = profile.userId || profile.user_id || account.userId || account.id || "";
    if (!userId && userId !== 0) {
      // Try alternate endpoint
      const alt = await import("./crypto.js").then((m) =>
        m.weapiRequest("/api/nuser/account/get", {}, cookieHeader)
      );
      const a2 = alt.account || alt.data?.account || {};
      const p2 = alt.profile || alt.data?.profile || {};
      return {
        loggedIn: !!(p2.userId || a2.userId),
        userId: p2.userId || a2.userId || "",
        nickname: p2.nickname || a2.userName || "网易云用户",
        avatar: p2.avatarUrl || a2.avatarUrl || "",
        vipType: 0,
        vipLevel: "none",
        isVip: false,
        isSvip: false,
        vipLabel: "无VIP",
      };
    }
    return {
      loggedIn: true,
      userId,
      nickname: profile.nickname || profile.userName || account.userName || "网易云用户",
      avatar: profile.avatarUrl || profile.avatar || account.avatarUrl || "",
      vipType: 0,
      vipLevel: "none",
      isVip: false,
      isSvip: false,
      vipLabel: "无VIP",
    };
  } catch (_) {
    return { loggedIn: false, vipType: 0, vipLevel: "none", isVip: false, isSvip: false, vipLabel: "无VIP" };
  }
}
