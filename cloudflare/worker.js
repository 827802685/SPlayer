/**
 * SPlayer Web Backend — Cloudflare Workers
 *
 * 零依赖，无需 npm install。直接部署到 Cloudflare Workers。
 *
 * 部署步骤：
 *   1. 安装 Wrangler: npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy
 *
 * 访问地址：https://你的域名 或 https://你的-worker.workers.dev
 */

// ═══════════════════════════════════════════════════════════════
//  Crypto — 内联实现，无需任何依赖
// ═══════════════════════════════════════════════════════════════

const WEAPI_IV   = '0102030405060708'
const WEAPI_KEY  = '0CoJUm6Qyw8W8jud'
const EAPI_KEY   = 'e82ckenh8dichen8'
const BASE62     = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const EAPI_UA    = 'NeteaseMusic 9.0.90/5038 (iPhone; iOS 16.2; zh_CN)'
const UA_WEB     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── ArrayBuffer helpers ─────────────────────────────────────────────────────
function str2buf(str) { return new TextEncoder().encode(str).buffer }
function buf2str(buf) { return new TextDecoder('utf-8').decode(buf) }
function ab2hex(buf) { return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('') }
function hex2ab(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return bytes.buffer
}
function ab2b64(buf) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
function b642ab(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// ── AES (via Web Crypto API, native in Workers) ─────────────────────────────
async function aesCrypt(text, keyHex, ivHex, mode, op) {
  const keyBuf = hex2ab(keyHex)
  let ivBuf = mode === 'cbc' ? hex2ab(ivHex) : null
  const algo = { name: `AES-${mode.toUpperCase()}`, ...(ivBuf ? { iv: ivBuf } : {}) }
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuf, algo, false, [op])
  const dataBuf = op === 'encrypt' ? str2buf(text) : b642ab(text)
  const result = await crypto.subtle.encrypt(algo, cryptoKey, dataBuf)
  return ab2b64(result)
}

async function aesDecrypt(b64, keyHex, ivHex, mode) {
  const keyBuf = hex2ab(keyHex)
  let ivBuf = mode === 'cbc' ? hex2ab(ivHex) : null
  const algo = { name: `AES-${mode.toUpperCase()}`, ...(ivBuf ? { iv: ivBuf } : {}) }
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuf, algo, false, ['decrypt'])
  const result = await crypto.subtle.decrypt(algo, cryptoKey, b642ab(b64))
  return buf2str(result)
}

// PKCS7 unpadding
function unpadPkcs7(str) {
  const bytes = new Uint8Array(str2buf(str))
  const padLen = bytes[bytes.length - 1]
  return buf2str(bytes.subarray(0, bytes.length - padLen).buffer)
}

// ── MD5 ─────────────────────────────────────────────────────────────────────
async function md5(message) {
  const hashBuf = await crypto.subtle.digest('MD5', str2buf(message))
  return ab2hex(hashBuf)
}

// ── RSA (for WEAPI) ─────────────────────────────────────────────────────────
const RSA_MODULUS = BigInt(
  '0x00e0b509687ced76546702928393559386373f97f4bd87010e86e9dc5e9420045ad356246d589f2b55255718489024626d0b2818510a7183371fd1fa5e5c2060680fb1d6a5174550377bac929486b66f7a7227885f85b8e167659a1743a663c1a7fb332f5806759d15b88184a5121634ce09b46fd570bad5bf9d9bc304698a4db447f08e2249884cbba5a84a663b2727764bf15c67832fa85795262b2ff6f7a2c5300c2b74cc3300a5e587265bfa30fe2c4d7772ef64e174c486bb9631a5880a7fa5ae9f9e8a40b532b2963d4ffe1e1'
)
const RSA_EXP = BigInt(65537)

function rsaEncrypt(text) {
  const reversed = text.split('').reverse().join('')
  let x = BigInt(0)
  for (const ch of reversed) x = (x << BigInt(8)) + BigInt(ch.charCodeAt(0))
  let y = BigInt(1), b = x % RSA_MODULUS, e = RSA_EXP, mod = RSA_MODULUS
  while (e > 0n) {
    if (e % 2n === 1n) y = (y * b) % mod
    b = (b * b) % mod
    e /= 2n
  }
  return y.toString(16).padStart(256, '0')
}

// ── WEAPI encrypt ───────────────────────────────────────────────────────────
async function weapiEncrypt(object) {
  const text = JSON.stringify(object || {})
  let secretKey = ''
  for (let i = 0; i < 16; i++) secretKey += BASE62[Math.floor(Math.random() * BASE62.length)]
  const enc1 = await aesCrypt(text, WEAPI_KEY, WEAPI_IV, 'cbc', 'encrypt')
  const enc2 = await aesCrypt(enc1, secretKey, WEAPI_IV, 'cbc', 'encrypt')
  return { params: enc2, encSecKey: rsaEncrypt(secretKey) }
}

// ── EAPI encrypt ────────────────────────────────────────────────────────────
async function eapiEncrypt(url, object) {
  const text = typeof object === 'object' ? JSON.stringify(object) : String(object || '')
  const md5hash = await md5(`nobody${url}use${text}md5forencrypt`)
  const payload = `${url}-36cd479b6b5-${text}-36cd479b6b5-${md5hash}`
  const encrypted = await aesCrypt(payload, EAPI_KEY, '', 'ecb', 'encrypt')
  return { params: encrypted.toUpperCase() }
}

// ── Cookie helpers ──────────────────────────────────────────────────────────
function parseCookie(str) {
  const out = {}
  for (const part of String(str || '').split(';')) {
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return out
}

function hasLogin(cookie) {
  const obj = parseCookie(cookie)
  return !!(obj.MUSIC_U || obj.MUSIC_A || obj.__csrf)
}

async function buildEapiCookie(cookie) {
  const obj = parseCookie(cookie)
  const header = {
    osver: obj.osver || '16.2',
    os: obj.os || 'ios',
    appver: obj.appver || '9.0.90',
    versioncode: obj.versioncode || '140',
    channel: obj.channel || 'distribution',
  }
  for (const key of ['MUSIC_U','MUSIC_A','__csrf','NMTID','WNMCID','WEVNSM','_ntes_nuid','_ntes_nnid','MUSIC_R_U','deviceId','sDeviceId','WM_TID','WM_NI','WM_NIKE']) {
    if (obj[key]) header[key] = obj[key]
  }
  return Object.entries(header)
    .filter(([, v]) => v != null && String(v) !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('; ')
}

// ═══════════════════════════════════════════════════════════════
//  Session Store (in-memory, Worker global scope)
// ═══════════════════════════════════════════════════════════════

const SESSIONS = new Map() // id → { cookie, userId, createdAt }
const SESSION_TTL = 24 * 60 * 60 * 1000 // 24h
// Sessions are cleaned lazily on each request (no setInterval at global scope)

function getSessionId(request) {
  const url = new URL(request.url)
  return url.searchParams.get('clientId') || url.searchParams.get('uid')
    || request.headers.get('x-client-id')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'anonymous'
}

function getSession(id) {
  const entry = SESSIONS.get(id)
  if (!entry || Date.now() - entry.createdAt > SESSION_TTL) {
    SESSIONS.delete(id)
    return null
  }
  return entry
}

function setSession(id, cookie, userId) {
  if (SESSIONS.size >= 10000) {
    let oldestId = null, oldestTime = Infinity
    for (const [k, v] of SESSIONS) {
      if (v.createdAt < oldestTime) { oldestTime = v.createdAt; oldestId = k }
    }
    if (oldestId) SESSIONS.delete(oldestId)
  }
  SESSIONS.set(id, { cookie, userId, createdAt: Date.now() })
}

// ═══════════════════════════════════════════════════════════════
//  API Requests
// ═══════════════════════════════════════════════════════════════

async function weapiRequest(path, data, cookie) {
  const apiPath = path.replace(/^weapi\//, '').replace(/^api\//, '')
  const encrypted = await weapiEncrypt(data)
  const resp = await fetch(`https://music.163.com/weapi/${apiPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA_WEB,
      'Referer': 'https://music.163.com/',
      'Cookie': cookie || '',
    },
    body: new URLSearchParams(encrypted).toString(),
  })
  return resp.json().catch(() => ({}))
}

async function eapiRequest(path, data, cookie) {
  const uri = path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`
  const apiPath = uri.slice(5)
  const encrypted = await eapiEncrypt(uri, data)
  const resp = await fetch(`https://interface.music.163.com/eapi/${apiPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': EAPI_UA,
      'Cookie': await buildEapiCookie(cookie),
    },
    body: new URLSearchParams(encrypted).toString(),
    credentials: 'include',
  })
  let body = {}
  try { body = await resp.json() } catch (_) {}
  let setCookies = []
  try {
    if (resp.headers && typeof resp.headers.getSetCookie === 'function') setCookies = resp.headers.getSetCookie()
  } catch (_) {}
  return { status: resp.status, body, setCookies }
}

async function proxyToNetease(cookie, method, path, bodyData) {
  const p = path.replace(/^\/+/, '')
  if (p.startsWith('login/') || p.startsWith('eapi/') || p === 'user/account') {
    return eapiRequest(p, bodyData || {}, cookie)
  }
  if (method === 'POST') return weapiRequest(p, bodyData || {}, cookie)
  try { return await weapiRequest(p, bodyData || {}, cookie) }
  catch (_) { return await eapiRequest(p, bodyData || {}, cookie) }
}

// ═══════════════════════════════════════════════════════════════
//  Login Handlers
// ═══════════════════════════════════════════════════════════════

async function handleLoginQrKey() {
  const raw = await eapiRequest('/api/login/qrcode/unikey', { type: 3 }, '')
  const body = raw.body || {}
  const key = body.unikey || body.uniKey || (body.data && (body.data.unikey || body.data.uniKey)) || ''
  if (!key) throw new Error(`获取二维码 key 失败: ${body.message || body.msg || JSON.stringify(body)}`)
  return { key, unikey: key, code: Number(body.code) || 200 }
}

async function handleLoginQrCreate(key) {
  const url = `https://music.163.com/login?codekey=${encodeURIComponent(key)}`
  const img = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(url)}`
  return { img, qrimg: img, url }
}

async function handleLoginQrCheck(key) {
  key = String(key || '').trim()
  if (!key) return { code: 800, message: '缺少二维码 key', loggedIn: false }
  let body = {}, setCookies = []
  try {
    const raw = await eapiRequest('/api/login/qrcode/client/login', { key, type: 3 }, '')
    body = raw.body || {}
    setCookies = raw.setCookies || []
  } catch (err) {
    return { code: 801, error: err?.message, message: '扫码状态查询失败', loggedIn: false }
  }
  const code = Number(body.code || 0)
  const profile = body.profile || (body.data && body.data.profile) || {}
  let cookieText = ''
  if (Array.isArray(body.cookie)) cookieText = body.cookie.filter(Boolean).join('; ')
  else cookieText = String(body.cookie || (body.data && body.data.cookie) || '').trim()
  if (!cookieText && setCookies.length) {
    const map = new Map()
    setCookies.forEach(raw => {
      const part = String(raw || '').split(';')[0]
      const eq = part.indexOf('=')
      if (eq > 0) map.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim())
    })
    cookieText = Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  }
  if (code === 803) {
    return { code: 803, message: body.message || '登录成功', nickname: profile.nickname || '网易云用户',
      avatar: profile.avatarUrl || '', loggedIn: true, hasCookie: !!cookieText, cookie: cookieText,
      userId: profile.userId || '' }
  }
  return { code, message: ({ 800: '二维码已过期', 801: '等待扫码', 802: '已扫码，待确认' }[code] || body.message || ''),
    nickname: profile.nickname || '', avatar: profile.avatarUrl || '', loggedIn: false, hasCookie: false }
}

async function handleLoginStatus(cookie) {
  if (!cookie || !/MUSIC_U/.test(cookie)) return { loggedIn: false, vipType: 0, isVip: false, vipLabel: '无VIP' }
  try {
    const body = await weapiRequest('/api/w/nuser/account/get', {}, cookie)
    const account = body.account || body.data?.account || {}
    const profile = body.profile || body.data?.profile || {}
    const userId = profile.userId || profile.user_id || account.userId || account.id || ''
    if (!userId) {
      const alt = await weapiRequest('/api/nuser/account/get', {}, cookie)
      const a2 = alt.account || alt.data?.account || {}
      const p2 = alt.profile || alt.data?.profile || {}
      return { loggedIn: !!(p2.userId || a2.userId), userId: p2.userId || a2.userId || '',
        nickname: p2.nickname || a2.userName || '', avatar: p2.avatarUrl || a2.avatarUrl || '',
        vipType: 0, isVip: false, vipLabel: '无VIP' }
    }
    return { loggedIn: true, userId,
      nickname: profile.nickname || profile.userName || account.userName || '',
      avatar: profile.avatarUrl || account.avatarUrl || '',
      vipType: 0, isVip: false, vipLabel: '无VIP' }
  } catch (_) { return { loggedIn: false, vipType: 0, isVip: false, vipLabel: '无VIP' } }
}

// ═══════════════════════════════════════════════════════════════
//  Response Helpers
// ═══════════════════════════════════════════════════════════════

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-ID',
  'Access-Control-Max-Age': '86400',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS }
  })
}

function readCookie(request, url) {
  const q = url.searchParams.get('cookie')
  if (q) return decodeURIComponent(q)
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return request.headers.get('cookie') || ''
}

// ═══════════════════════════════════════════════════════════════
//  Main Fetch Handler
// ═══════════════════════════════════════════════════════════════

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

    const url = new URL(request.url)
    const path = url.pathname
    const sessionId = getSessionId(request)

    // Health check
    if (path === '/api/health') return json({ ok: true, service: 'splayer-web-backend', env: 'cloudflare', sessions: SESSIONS.size })

    // Login QR key
    if (path === '/api/login/qr/key') {
      try { return json(await handleLoginQrKey()) } catch (e) { return json({ code: 500, error: e.message }, 500) }
    }
    // Login QR create
    if (path === '/api/login/qr/create') {
      const key = url.searchParams.get('key') || ''
      try { return json(await handleLoginQrCreate(key)) } catch (e) { return json({ code: 500, error: e.message }, 500) }
    }
    // Login QR check
    if (path === '/api/login/qr/check') {
      const key = url.searchParams.get('key') || ''
      return json(await handleLoginQrCheck(key))
    }
    // Login status
    if (path === '/api/login/status') {
      const cookie = readCookie(request, url)
      const session = getSession(sessionId)
      return json(await handleLoginStatus(cookie || session?.cookie || ''))
    }
    // Login refresh
    if (path === '/api/login/refresh') {
      const cookie = readCookie(request, url)
      const session = getSession(sessionId)
      return json(await handleLoginStatus(cookie || session?.cookie || ''))
    }
    // Logout
    if (path === '/api/logout') { SESSIONS.delete(sessionId); return json({ code: 200, message: '退出成功' }) }

    // API proxy
    if (path.startsWith('/api/')) {
      const cookie = readCookie(request, url)
      const session = getSession(sessionId)
      const userCookie = cookie || session?.cookie || ''
      let bodyData = {}

      if (request.method === 'POST') {
        const ct = request.headers.get('content-type') || ''
        try { bodyData = ct.includes('json') ? await request.json() : Object.fromEntries(await request.formData()) } catch (_) {}
      } else {
        const skip = new Set(['cookie', 'noCookie', 'realIP', 'proxy', 'clientId', 'uid'])
        for (const [k, v] of url.searchParams) { if (!skip.has(k)) bodyData[k] = v }
      }

      try {
        const result = await proxyToNetease(userCookie, request.method, path, bodyData)
        if (hasLogin(userCookie) && !session) setSession(sessionId, userCookie, result?.profile?.userId || result?.userId || '')
        return json(result)
      } catch (err) {
        return json({ code: 502, error: err?.message || '服务暂时不可用', path }, 502)
      }
    }

    return json({ code: 404, message: `Not found: ${request.method} ${path}` }, 404)
  }
}
