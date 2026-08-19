/**
 * SPlayer Web Backend - Crypto Utilities
 *
 * Implements WEAPI and EAPI encryption for Netease Cloud Music API.
 * Based on the encryption schemes from NeteaseCloudMusicApi / @neteaseapireborn.
 */

// ── CryptoJS (lazy-loaded) ──────────────────────────────────────────────────
let _CryptoJS = null;

async function getCryptoJS() {
  if (!_CryptoJS) {
    const mod = await import("crypto-js");
    _CryptoJS = mod.default || mod;
  }
  return _CryptoJS;
}

// ── Constants ────────────────────────────────────────────────────────────────
const WEAPI_IV = "0102030405060708";
const WEAPI_PRESET_KEY = "0CoJUm6Qyw8W8jud";
const BASE62 =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const RSA_MODULUS = BigInt(
  "0x00e0b509687ced76546702928393559386373f97f4bd87010e86e9dc5e9420045ad356246d589f2b55255718489024626d0b2818510a7183371fd1fa5e5c2060680fb1d6a5174550377bac929486b66f7a7227885f85b8e167659a1743a663c1a7fb332f5806759d15b88184a5121634ce09b46fd570bad5bf9d9bc304698a4db447f08e2249884cbba5a84a663b2727764bf15c67832fa85795262b2ff6f7a2c5300c2b74cc3300a5e587265bfa30fe2c4d7772ef64e174c486bb9631a5880a7fa5ae9f9e8a40b532b2963d4ffe1e1"
);
const RSA_EXP = BigInt(65537);

const EAPI_KEY = "e82ckenh8dichen8";
const EAPI_BASE = "https://interface.music.163.com";
const EAPI_UA = "NeteaseMusic 9.0.90/5038 (iPhone; iOS 16.2; zh_CN)";
const EAPI_COOKIE_KEYS = [
  "MUSIC_U", "MUSIC_A", "__csrf", "NMTID", "WNMCID",
  "WEVNSM", "_ntes_nuid", "_ntes_nnid", "MUSIC_R_U",
  "deviceId", "sDeviceId", "WM_TID", "WM_NI", "WM_NIKE",
];

// ── WEAPI (web API) encryption ──────────────────────────────────────────────
function modPow(base, exp, mod) {
  let result = BigInt(1);
  let b = base % mod;
  let e = exp;
  while (e > BigInt(0)) {
    if (e % BigInt(2) === BigInt(1)) result = (result * b) % mod;
    b = (b * b) % mod;
    e /= BigInt(2);
  }
  return result;
}

function rsaEncrypt(text) {
  const reversed = String(text || "").split("").reverse().join("");
  let x = BigInt(0);
  for (let i = 0; i < reversed.length; i++) {
    x = (x << BigInt(8)) + BigInt(reversed.charCodeAt(i));
  }
  const y = modPow(x, RSA_EXP, RSA_MODULUS);
  return y.toString(16).padStart(256, "0");
}

// All crypto functions are async to support lazy-loaded CryptoJS
export async function aesEncrypt(text, key, iv) {
  const C = await getCryptoJS();
  return C.AES.encrypt(
    C.enc.Utf8.parse(text),
    C.enc.Utf8.parse(key),
    { iv: C.enc.Utf8.parse(iv), mode: C.mode.CBC, padding: C.pad.Pkcs7 }
  ).toString();
}

export async function weapiEncrypt(object) {
  const text = JSON.stringify(object || {});
  let secretKey = "";
  for (let i = 0; i < 16; i++) {
    secretKey += BASE62.charAt(Math.floor(Math.random() * BASE62.length));
  }
  const enc1 = await aesEncrypt(text, WEAPI_PRESET_KEY, WEAPI_IV);
  const enc2 = await aesEncrypt(enc1, secretKey, WEAPI_IV);
  return {
    params: enc2,
    encSecKey: rsaEncrypt(secretKey),
  };
}

export async function weapiRequest(path, data, cookieHeader) {
  const apiPath = String(path || "")
    .replace(/^\/+/, "")
    .replace(/^weapi\//, "")
    .replace(/^api\//, "");
  const encrypted = await weapiEncrypt(data || {});
  const resp = await fetch(`https://music.163.com/weapi/${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://music.163.com/",
      Cookie: cookieHeader || "",
    },
    body: new URLSearchParams(encrypted).toString(),
  });
  try {
    return await resp.json();
  } catch (_) {
    return {};
  }
}

// ── EAPI (app API) encryption ───────────────────────────────────────────────
export async function eapiEncrypt(url, object) {
  const C = await getCryptoJS();
  const text = typeof object === "object" ? JSON.stringify(object) : String(object || "");
  const message = `nobody${url}use${text}md5forencrypt`;
  const digest = C.MD5(message).toString();
  const payload = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;
  const encrypted = C.AES.encrypt(
    C.enc.Utf8.parse(payload),
    C.enc.Utf8.parse(EAPI_KEY),
    { mode: C.mode.ECB, padding: C.pad.Pkcs7 }
  );
  return { params: encrypted.ciphertext.toString().toUpperCase() };
}

function safeDecodeCookieValue(value) {
  const raw = String(value || "");
  try {
    return decodeURIComponent(raw);
  } catch (_) {
    return raw;
  }
}

function encodeCookiePair(key, value) {
  return `${encodeURIComponent(key)}=${encodeURIComponent(safeDecodeCookieValue(value))}`;
}

export async function buildEapiCookieHeader(cookieHeader) {
  const parsed = parseCookieString(cookieHeader);
  const header = {
    osver: parsed.osver || "16.2",
    os: parsed.os || "ios",
    appver: parsed.appver || "9.0.90",
    versioncode: parsed.versioncode || "140",
    channel: parsed.channel || "distribution",
  };
  EAPI_COOKIE_KEYS.forEach((key) => {
    if (parsed[key]) header[key] = parsed[key];
  });
  return Object.entries(header)
    .filter(([, value]) => value != null && String(value) !== "")
    .map(([key, value]) => encodeCookiePair(key, value))
    .join("; ");
}

export async function eapiRequest(path, data, cookieHeader) {
  const uri = path.startsWith("/api/") ? path : `/api/${path.replace(/^\//, "")}`;
  const apiPath = uri.slice(5);
  const encrypted = await eapiEncrypt(uri, data || {});
  const resp = await fetch(`${EAPI_BASE}/eapi/${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": EAPI_UA,
      Cookie: await buildEapiCookieHeader(cookieHeader),
    },
    body: new URLSearchParams(encrypted).toString(),
    credentials: "include",
  });
  let body = {};
  try {
    body = await resp.json();
  } catch (_) {
    body = {};
  }
  let setCookies = [];
  try {
    if (resp.headers && typeof resp.headers.getSetCookie === "function") {
      setCookies = resp.headers.getSetCookie() || [];
    }
  } catch (_) {
    // ignore
  }
  return { status: resp.status, body, setCookies };
}

// ── Cookie parsing utilities ─────────────────────────────────────────────────
export function parseCookieString(cookieHeader) {
  const out = {};
  String(cookieHeader || "")
    .split(";")
    .forEach((part) => {
      const idx = part.indexOf("=");
      if (idx <= 0) return;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (key) out[key] = value;
    });
  return out;
}

/**
 * Check if the cookie header contains a valid Netease login session.
 */
export function hasNeteaseLogin(cookieHeader) {
  const obj = parseCookieString(cookieHeader);
  return !!(obj.MUSIC_U || obj.MUSIC_A || obj.__csrf);
}

/**
 * Extract MUSIC_U value from a cookie header string.
 */
export function getNeteaseMusicU(cookieHeader) {
  return parseCookieString(cookieHeader).MUSIC_U || "";
}

/**
 * Normalize a cookie header for use with Netease API.
 */
export function ensureCookieHeader(cookieHeader) {
  return String(cookieHeader || "");
}
