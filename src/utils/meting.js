// meting-api-serverless 对接工具
// 文档: https://github.com/827802685/meting-api-serverless
// 接口地址与密钥通过环境变量配置, 避免被滥用

/**
 * 读取 meting API 配置
 * 环境变量: RENDERER_VITE_METING_URL / RENDERER_VITE_METING_TOKEN
 */
export const getMetingConfig = () => {
  const baseURL = import.meta.env.RENDERER_VITE_METING_URL || "";
  const token = import.meta.env.RENDERER_VITE_METING_TOKEN || "";
  return { baseURL, token };
};

/**
 * 判断 meting API 是否已配置
 */
export const hasMetingConfig = () => {
  const { baseURL, token } = getMetingConfig();
  return Boolean(baseURL && token);
};

/**
 * HMAC-SHA1 计算 (Web Crypto)
 * auth = HMAC-SHA1(METING_TOKEN, server + type + id)
 * @param {string} key - 密钥
 * @param {string} message - 待签名内容
 * @returns {Promise<string>} hex 字符串
 */
const hmacSHA1 = async (key, message) => {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * 构造 meting API 请求地址
 * @param {string} server - 平台: netease/tencent/kugou/baidu/kuwo
 * @param {string} type - 类型: search/song/album/artist/playlist/lrc/url/pic
 * @param {string|number} id - 资源 ID
 * @returns {Promise<string>} 完整请求 URL (含鉴权参数)
 */
export const buildMetingUrl = async (server, type, id) => {
  const { baseURL, token } = getMetingConfig();
  const params = new URLSearchParams({ server, type, id });
  // 仅 url / pic / lrc 类型需要鉴权
  if (["url", "pic", "lrc"].includes(type)) {
    const auth = await hmacSHA1(token, `${server}${type}${id}`);
    params.set("auth", auth);
  }
  return `${baseURL}?${params.toString()}`;
};

/**
 * 获取真实播放地址 (跟随重定向)
 * @param {string} server - 平台
 * @param {string|number} id - 歌曲 ID
 * @returns {Promise<?string>} 可播放的音频地址, 失败返回 null
 */
export const getMetingPlayUrl = async (server, id) => {
  const url = await buildMetingUrl(server, "url", id);
  const res = await fetch(url, { redirect: "follow" });
  // 302 重定向到真实音频地址
  if (res.redirected) return res.url;
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data?.url || data?.data?.url || null;
  } catch (e) {
    return text || null;
  }
};

/**
 * 获取歌词 (LRC)
 * @param {string} server - 平台
 * @param {string|number} id - 歌曲 ID
 * @returns {Promise<?string>} LRC 歌词文本, 失败返回 null
 */
export const getMetingLyric = async (server, id) => {
  const url = await buildMetingUrl(server, "lrc", id);
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text || text === "NOT FOUND") return null;
  return text;
};

/**
 * 搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {string} server - 平台, 默认 netease
 * @returns {Promise<Array>} 歌曲列表
 */
export const searchMeting = async (keyword, server = "netease") => {
  const url = await buildMetingUrl(server, "search", keyword);
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};