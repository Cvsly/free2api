WidgetMetadata = {
  id: "fengye.movie",
  title: "枫叶影院",
  version: "2.1.0",
  requiredVersion: "0.0.1",
  description:
    "枫叶4K影院（maihaolian.com）：全线路高清播放，支持分类筛选、热门排序、聚合搜索",
  author: "crush7s",
  site: "https://maihaolian.com",
  detailCacheDuration: 300,
  globalParams: [
    {
      name: "multiSource",
      title: "是否启用聚合搜索",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "禁用", value: "disabled" },
      ],
    },
  ],
  modules: [
    { id: "platformQQ", title: "腾讯SVIP热映", functionName: "loadPlatform", cacheDuration: 3600, params: [{ name: "platform", title: "平台", type: "constant", value: "qq" }, { name: "page", title: "页码", type: "page" }] },
    { id: "platformYouku", title: "优酷SVIP热映", functionName: "loadPlatform", cacheDuration: 3600, params: [{ name: "platform", title: "平台", type: "constant", value: "youku" }, { name: "page", title: "页码", type: "page" }] },
    { id: "platformBili", title: "B站SVIP热映", functionName: "loadPlatform", cacheDuration: 3600, params: [{ name: "platform", title: "平台", type: "constant", value: "bli" }, { name: "page", title: "页码", type: "page" }] },
    { id: "vodMovie", title: "电影", functionName: "loadVodList", cacheDuration: 1800, params: [
      { name: "tid", title: "分类", type: "enumeration", value: "1", enumOptions: [
        { title: "全部", value: "1" }, { title: "动作片", value: "6" }, { title: "喜剧片", value: "7" },
        { title: "恐怖片", value: "8" }, { title: "科幻片", value: "9" }, { title: "爱情片", value: "10" },
        { title: "剧情片", value: "11" }, { title: "战争片", value: "12" }, { title: "纪录片", value: "20" },
      ]},
      { name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
        { title: "最新更新", value: "time" }, { title: "热播排行", value: "hits" }, { title: "评分最高", value: "score" },
      ]},
      { name: "page", title: "页码", type: "page" },
    ]},
    { id: "vodTV", title: "电视剧", functionName: "loadVodList", cacheDuration: 1800, params: [
      { name: "tid", title: "分类", type: "enumeration", value: "2", enumOptions: [
        { title: "全部", value: "2" }, { title: "国产剧", value: "13" }, { title: "日韩剧", value: "15" }, { title: "海外剧", value: "16" },
      ]},
      { name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
        { title: "最新更新", value: "time" }, { title: "热播排行", value: "hits" }, { title: "评分最高", value: "score" },
      ]},
      { name: "page", title: "页码", type: "page" },
    ]},
    { id: "vodAnime", title: "动漫", functionName: "loadVodList", cacheDuration: 1800, params: [
      { name: "tid", title: "分类", type: "enumeration", value: "4", enumOptions: [
        { title: "全部", value: "4" }, { title: "国产动漫", value: "25" }, { title: "日韩动漫", value: "26" },
      ]},
      { name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
        { title: "最新更新", value: "time" }, { title: "热播排行", value: "hits" }, { title: "评分最高", value: "score" },
      ]},
      { name: "page", title: "页码", type: "page" },
    ]},
    { id: "vodShow", title: "综艺", functionName: "loadVodList", cacheDuration: 1800, params: [
      { name: "tid", title: "分类", type: "enumeration", value: "3", enumOptions: [
        { title: "全部", value: "3" }, { title: "大陆综艺", value: "21" }, { title: "日韩综艺", value: "22" },
      ]},
      { name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
        { title: "最新更新", value: "time" }, { title: "热播排行", value: "hits" }, { title: "评分最高", value: "score" },
      ]},
      { name: "page", title: "页码", type: "page" },
    ]},
    { id: "vodDuanju", title: "热门短剧", functionName: "loadVodList", cacheDuration: 1800, params: [
      { name: "tid", title: "分类", type: "constant", value: "5" },
      { name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
        { title: "最新更新", value: "time" }, { title: "热播排行", value: "hits" },
      ]},
      { name: "page", title: "页码", type: "page" },
    ]},
    { id: "loadResource", title: "播放资源", functionName: "loadResource", type: "stream", cacheDuration: 120, params: [] },
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [{ name: "keyword", title: "关键词", type: "input" }, { name: "page", title: "页码", type: "page" }],
  },
};

// ========== 常量配置 ==========
const BASE = "https://maihaolian.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PLATFORM_URLS = { qq: "/label/qq.html", youku: "/label/youku.html", bli: "/label/bli.html" };

// 解析接口映射：player_aaaa.from -> 解析器入口（末尾已带 ?url=）
const PARSE_MAP = {
  co: "https://zzrs.mfdyvip.com/player/?url=",
  BBA: "https://zzrs.mfdyvip.com/player/?url=",
  vwnet: "https://zzrs.mfdyvip.com/player/?url=",
  YYNB: "https://zzrs.mfdyvip.com/player/?url=",
  qiyi: "https://zzrs.mfdyvip.com/player/?url=",
  bilibili: "https://zzrs.mfdyvip.com/player/?url=",
  qq: "https://zzrs.mfdyvip.com/player/?url=",
  youku: "https://zzrs.mfdyvip.com/player/?url=",
  JD4K: "https://fgsrg.hzqingshan.com/player/?url=",
  JD2K: "https://fgsrg.hzqingshan.com/player/?url=",
};
// 去重后的解析器候选列表，用于 from 未知时逐个兜底
const PARSER_BASES = (function () {
  const out = [];
  for (const k in PARSE_MAP) { if (out.indexOf(PARSE_MAP[k]) < 0) out.push(PARSE_MAP[k]); }
  return out;
})();

const API_UID_FALLBACK = "DCC147D11943AF75";
const MAX_AGG_LINES = 6;
// 最后的兜底：把站点自带播放页交给 App 播放器（内含站点自己的解密/解析逻辑）。
// 若目标播放器不支持网页播放，可把它设为 false 关闭该兜底。
const ENABLE_WEB_PLAYER_FALLBACK = true;

// ========== 基础工具函数 ==========
async function httpGet(url, params) {
  const opt = { headers: { "User-Agent": UA, Referer: BASE + "/" } };
  if (params) opt.params = params;
  const res = await Widget.http.get(url, opt);
  return res.data;
}

async function httpPost(url, bodyObj) {
  const body = Object.keys(bodyObj)
    .map(k => k + "=" + encodeURIComponent(bodyObj[k]))
    .join("&");
  const res = await Widget.http.post(url, body, {
    headers: {
      "User-Agent": UA,
      Referer: BASE + "/",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.data;
}

function decodeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// 比 decodeHtml 更全：同时处理数字实体与 \/ 转义
function unescapeEntities(s) {
  return String(s == null ? "" : s)
    .replace(/&amp;/g, "&").replace(/&#0*38;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"').replace(/&#0*34;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(parseInt(d, 10)); });
}

// "\/" -> "/"（JSON 转义斜杠），解析器返回的 url 常见
function slashDecode(s) {
  return String(s == null ? "" : s).replace(/\\\//g, "/").replace(/\\u002[fF]/g, "/");
}

function stripTags(s) {
  return decodeHtml(String(s || "").replace(/<[^>]+>/g, "")).trim();
}

function makeItem(id, title, poster, remark) {
  const item = { id: String(id), type: "url", title: decodeHtml(title), link: "detail:" + id };
  if (poster) item.posterPath = decodeHtml(poster);
  if (remark) item.durationText = stripTags(remark);
  return item;
}

function vodToItem(v) {
  const item = makeItem(v.vod_id, v.vod_name, v.vod_pic, v.vod_remarks);
  const score = parseFloat(v.vod_score);
  if (score > 0) item.rating = score;
  if (v.vod_year) item.releaseDate = String(v.vod_year);
  if (v.vod_blurb) item.description = decodeHtml(v.vod_blurb);
  return item;
}

function parseCards(html) {
  const items = [], seen = {};
  const re = /<a[^>]*class="public-list-exp"[^>]*href="\/detail\/(\d+)\.html"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const id = m[1];
    if (seen[id]) continue;
    seen[id] = true;
    const body = m[3];
    const pm = body.match(/data-src="([^"]+)"/) || body.match(/src="(https?:[^"]+)"/);
    const rm = body.match(/class="ft2">([\s\S]*?)<\/i>/);
    items.push(makeItem(id, m[2], pm ? pm[1] : "", rm ? rm[1] : ""));
  }
  return items;
}

async function apiUid() {
  let uid = Widget.storage.get("mhl_api_uid");
  if (uid) return uid;
  try {
    const js = await httpGet(BASE + "/template/mp/js/app.js");
    const m = String(js).match(/Uid:"([0-9A-Fa-f]+)"/);
    uid = m ? m[1] : API_UID_FALLBACK;
  } catch (e) {
    uid = API_UID_FALLBACK;
  }
  Widget.storage.set("mhl_api_uid", uid);
  return uid;
}

// ========== 列表/搜索接口 ==========
async function loadVodList(params = {}) {
  try {
    const page = Number(params.page || 1);
    const by = params.by || "time";
    const time = Math.floor(Date.now() / 1000);
    const uid = await apiUid();

    const data = await httpPost(BASE + "/index.php/ajax/data", {
      mid: 1, tid: params.tid || "", page, by, time,
      key: md5("DS" + time + uid),
    });

    const json = typeof data === "string" ? JSON.parse(data) : data;
    if (!json || Number(json.code) !== 1) throw new Error("接口返回异常");
    const list = (json.list || []).map(vodToItem);
    if (!list.length) throw new Error("第 " + page + " 页已无数据");
    return list;
  } catch (e) {
    console.error("[loadVodList]", e.message);
    throw e;
  }
}

async function loadPlatform(params = {}) {
  try {
    const platform = params.platform || "qq";
    const page = parseInt(params.page || "1", 10);
    const basePath = PLATFORM_URLS[platform];
    if (!basePath) throw new Error("未知平台");
    const path = page > 1 ? basePath.replace(/\.html$/, `-${page}.html`) : basePath;
    const html = await httpGet(BASE + path);
    const items = parseCards(html);
    if (!items.length) throw new Error("榜单为空");
    return items;
  } catch (e) {
    console.error("[loadPlatform]", e.message);
    throw e;
  }
}

async function search(params = {}) {
  try {
    const keyword = (params.keyword || "").trim();
    const page = parseInt(params.page || "1", 10);
    if (!keyword) return [];
    const data = await httpGet(BASE + "/index.php/ajax/suggest", { mid: 1, wd: keyword, page });
    const json = typeof data === "string" ? JSON.parse(data) : data;
    return ((json && json.list) || []).map(v => makeItem(v.id, v.name, v.pic, ""));
  } catch (e) {
    console.error("[search]", e.message);
    throw e;
  }
}

// ========== 详情页解析 ==========
function isEpisodeTitle(name) {
  if (!name) return true;
  return /^第\s*\d+\s*[集部季]$/.test(name) ||
         /^正片$/.test(name) ||
         /^\d+集$/.test(name);
}

/**
 * 从详情页提取线路名称映射。
 * 网站真实结构：
 *   导航栏 .anthology-tab > .swiper-wrapper > N 个 <a class="swiper-slide">
 *   集数列表 .anthology-list > N 个 .anthology-list-box
 *   第 i 个导航名 对应 第 i 个 box 里的播放链接的 sid（不是按 sid 数字排序）
 */
function extractSourceNames(html) {
  const map = {};

  // 1. 导航标签名（限定在 anthology-tab 之后的一段窗口内，避免误匹配其它 swiper）
  const navNames = [];
  const tabIdx = String(html).search(/anthology-tab/i);
  if (tabIdx >= 0) {
    const seg = String(html).slice(tabIdx, tabIdx + 8000);
    const navRe = /<a[^>]*class="[^"]*swiper-slide[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    let nm;
    while ((nm = navRe.exec(seg))) {
      const n = stripTags(nm[1]).replace(/[（(]\d+[）)]\s*$/, "").trim();
      if (n && !isEpisodeTitle(n)) navNames.push(n);
    }
  }

  // 2. 按 box 出现顺序提取 sid
  const sids = [];
  const boxRe = /class="[^"]*anthology-list-box[^"]*"[\s\S]*?\/play\/\d+-(\d+)-\d+\.html/g;
  let m;
  while ((m = boxRe.exec(html))) {
    if (sids.indexOf(m[1]) === -1) sids.push(m[1]);
  }

  // 3. 按顺序一一对应
  for (let i = 0; i < sids.length && i < navNames.length; i++) {
    map[sids[i]] = navNames[i];
  }
  return map;
}

async function getVideoDetail(id) {
  const html = await httpGet(BASE + "/detail/" + id + ".html");
  if (!html || String(html).indexOf("slide-info-title") < 0) return null;

  const tm = String(html).match(/slide-info-title[^"]*"[^>]*>([^<]+)</);
  const title = tm ? decodeHtml(tm[1]) : id;
  const pm = String(html).match(/data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/);
  const poster = pm ? decodeHtml(pm[1]) : "";
  const dm = String(html).match(/id="height_limit"[^>]*>([\s\S]*?)<\/div>/);
  let description = dm ? stripTags(dm[1]) : "";
  description = description.replace(/^简介[:：]/, "").replace(/【[^】]*】/g, "").trim();
  const um = String(html).match(/<strong class="r6">更新<\/strong>([^<]*)</);
  const update = um ? decodeHtml(um[1]).trim() : "";

  const sourceNames = extractSourceNames(html);

  // 解析所有线路 + 集数
  const groups = {};
  const pre = new RegExp("/play/" + id + "-(\\d+)-(\\d+)\\.html", "g");
  let em;
  while ((em = pre.exec(html))) {
    const sid = em[1];
    const nid = Number(em[2]);
    if (!groups[sid]) groups[sid] = [];
    if (groups[sid].indexOf(nid) < 0) groups[sid].push(nid);
  }

  const lines = [];
  const sids = Object.keys(groups);
  for (let i = 0; i < sids.length; i++) {
    const sid = sids[i];
    const eps = groups[sid].sort(function (a, b) { return a - b; });
    if (!eps.length) continue;
    lines.push({ sid: sid, name: sourceNames[sid] || "", eps: eps });
  }
  // 集数多的线路优先（主线路），集数相同时保持文档顺序，避免每次结果抖动
  lines.sort(function (a, b) { return b.eps.length - a.eps.length; });

  const recIdx = String(html).indexOf("精彩推荐</h2>");
  const relatedItems = recIdx > 0 ? parseCards(String(html).slice(recIdx)) : [];

  // 电影判定：所有线路都只有 1 集才算电影（避免预告线路误判）
  const isMovie = lines.length > 0 && lines.every(function (l) { return l.eps.length === 1; });
  const mediaType = isMovie ? "movie" : "tv";

  return { title, poster, description, update, lines, relatedItems, mediaType };
}

async function loadDetail(link) {
  const key = String(link);
  try {
    if (key.indexOf("play:") === 0) {
      return await resolvePlay(key.slice(5));
    }
    const id = key.replace("detail:", "");
    const detail = await getVideoDetail(id);
    if (!detail) return null;

    const { title, poster, description, update, lines, relatedItems, mediaType } = detail;
    if (!lines.length) throw new Error("未找到播放线路");

    const primary = lines[0];
    const isMovie = mediaType === "movie";
    const episodeItems = primary.eps.map(function (_, idx) {
      return {
        id: `play:${id}#${idx}`,
        type: "url",
        title: isMovie ? "正片" : `第${idx + 1}集`,
        link: `play:${id}#${idx}`,
        mediaType: mediaType,
      };
    });

    return {
      id: String(id),
      type: "url",
      title,
      link: key,
      posterPath: poster,
      description,
      releaseDate: update,
      mediaType: mediaType,
      episodeItems: episodeItems,
      relatedItems: relatedItems,
      durationText: `共${lines.length}条线路`,
    };
  } catch (e) {
    console.error("[loadDetail]", link, e.message);
    throw e;
  }
}

// ========== 通用解码 / 提取工具 ==========
var B64CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// 纯 JS base64 解码（不依赖 atob，桥接环境可能没有）
function b64decode(input) {
  let str = String(input == null ? "" : input).replace(/[\s\r\n]/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!str) return null;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return null;
  while (str.length % 4) str += "=";
  const out = [];
  for (let i = 0; i < str.length; i += 4) {
    const e1 = B64CHARS.indexOf(str.charAt(i));
    const e2 = B64CHARS.indexOf(str.charAt(i + 1));
    const c3 = str.charAt(i + 2), c4 = str.charAt(i + 3);
    const e3 = c3 === "=" ? -1 : B64CHARS.indexOf(c3);
    const e4 = c4 === "=" ? -1 : B64CHARS.indexOf(c4);
    if (e1 < 0 || e2 < 0) return null;
    out.push((e1 << 2) | (e2 >> 4));
    if (e3 >= 0) out.push(((e2 & 15) << 4) | (e3 >> 2));
    if (e4 >= 0 && e3 >= 0) out.push(((e3 & 3) << 6) | e4);
  }
  let s = "";
  for (let i = 0; i < out.length; i++) s += String.fromCharCode(out[i] & 0xff);
  return s;
}

function hexDecode(s) {
  const t = String(s == null ? "" : s);
  if (!/^[0-9a-fA-F]+$/.test(t) || t.length % 2 !== 0 || t.length < 8) return null;
  let o = "";
  for (let i = 0; i < t.length; i += 2) o += String.fromCharCode(parseInt(t.substr(i, 2), 16));
  return o;
}

function percentDecode(s) {
  try { return decodeURIComponent(s); } catch (e) {}
  return String(s)
    .replace(/%u([0-9a-fA-F]{4})/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/%([0-9a-fA-F]{2})/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); });
}

function safeUnescape(s) {
  const t = String(s == null ? "" : s);
  if (/%u[0-9a-fA-F]{4}/.test(t) || /%[0-9a-fA-F]{2}/.test(t)) return percentDecode(t);
  return t;
}

function looksLikeMedia(u) {
  return /\.(m3u8|mp4|flv|mkv|m4v|ts|mov|webm)(\?|#|$)/i.test(u) ||
         /[?&](?:type|format)=(?:m3u8|mp4|flv)/i.test(u);
}

// 从候选串里挑最像播放地址的一个（优先媒体直链，其次任意绝对 URL）
function pickUrl(cands) {
  let abs = null;
  for (let i = 0; i < cands.length; i++) {
    let c = slashDecode(unescapeEntities(cands[i])).trim();
    if (!c) continue;
    if (/^\/\//.test(c)) c = "https:" + c;
    else if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(c)) c = "https://" + c;
    if (!/^https?:\/\//i.test(c)) continue;
    if (looksLikeMedia(c)) return c;
    if (!abs) abs = c;
  }
  return abs || "";
}

function originOf(url) {
  const m = String(url == null ? "" : url).match(/^(https?:\/\/[^\/]+)/i);
  return m ? m[1] + "/" : "";
}

// 播放地址请求头：Referer 用“真正吐出该地址的页面”所在域，而不是无脑 BASE
function headersFor(mediaUrl, playerPageUrl) {
  const h = { "User-Agent": UA };
  const ref = originOf(playerPageUrl) || originOf(mediaUrl) || (BASE + "/");
  if (ref) h.Referer = ref;
  return h;
}

// 花括号配平提取（正确处理字符串内的 } 和 \" 转义、嵌套对象）
function matchBrace(s, start) {
  let depth = 0, inStr = false, quote = "", esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s.charAt(i);
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function safeJsonParse(raw) {
  if (!raw) return null;
  const tries = [
    raw,
    slashDecode(unescapeEntities(raw)),
  ];
  for (let i = 0; i < tries.length; i++) {
    try {
      const o = JSON.parse(tries[i]);
      if (o && typeof o === "object") return o;
    } catch (e) {}
  }
  // 最后兜底：修常见非标准 JSON（单引号 / 裸键 / 尾逗号）
  try {
    const t = slashDecode(unescapeEntities(raw))
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*([}\]])/g, "$1");
    const o = JSON.parse(t);
    if (o && typeof o === "object") return o;
  } catch (e) {}
  return null;
}

/**
 * 提取 player_aaaa 对象。
 * 原实现用 /var player_aaaa=(\{[\s\S]*?\})<\/script>/：非贪婪会在第一个 } 处截断，
 * player_aaaa 里一旦含嵌套对象（如 vod_data），JSON.parse 必失败 -> 返回 null -> 黑屏。
 * 这里改为：定位 player_aaaa 后按花括号配平截取。
 */
function extractPlayerJson(html) {
  if (!html) return null;
  const src = String(html);
  const keys = ["player_aaaa", "player_data", "MacPlayer"];
  for (let k = 0; k < keys.length; k++) {
    let idx = src.indexOf(keys[k]);
    while (idx >= 0) {
      const bs = src.indexOf("{", idx);
      if (bs >= 0) {
        const be = matchBrace(src, bs);
        if (be > bs) {
          const obj = safeJsonParse(src.slice(bs, be + 1));
          if (obj) return obj;
        }
      }
      idx = src.indexOf(keys[k], idx + keys[k].length);
    }
  }
  return null;
}

/**
 * 解密 player_aaaa.url。
 * 苹果CMS 模板常见 encrypt:"1"，url 是 Base64 / unescape / hex / 百分号编码，
 * 也可能是 \/ 转义的 JSON 字符串。依次尝试并挑出最像 URL 的结果。
 */
function decodePlayerUrl(pj) {
  const raw = unescapeEntities(String(pj && pj.url != null ? pj.url : "")).trim();
  if (!raw) return "";
  const enc = String(pj && pj.encrypt != null ? pj.encrypt : "").trim();
  const isEncrypted = enc !== "" && enc !== "0" && enc !== "false";

  const cands = [];
  const push = function (v) {
    if (v == null) return;
    const s = slashDecode(unescapeEntities(String(v))).trim();
    if (s && cands.indexOf(s) < 0) cands.push(s);
  };

  // 原始值优先；合法 URL 天然不是合法 Base64/Hex，所以解码候选不会覆盖原始值
  push(raw);
  push(slashDecode(raw));
  if (/%[0-9a-fA-F]{2}/.test(raw)) push(percentDecode(raw));
  if (isEncrypted) push(safeUnescape(raw));

  // 即使 encrypt 未置位也尝试解码：部分模板 encrypt:"0" 却仍是 Base64
  const b1 = b64decode(raw);
  if (b1) {
    push(b1);
    push(safeUnescape(b1));
    const b2 = b64decode(b1);
    if (b2) { push(b2); push(safeUnescape(b2)); }
  }
  const h1 = hexDecode(raw);
  if (h1) push(h1);

  return pickUrl(cands);
}

// 带重定向处理的抓取；桥接层若不自动跟随 302，这里手动跟一次
async function fetchHtml(url, referer) {
  const headers = {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
  if (referer) headers.Referer = referer;
  let res = null;
  try {
    res = await Widget.http.get(url, { headers: headers, allow_redirects: true });
  } catch (e) {
    return { html: null, finalUrl: url };
  }
  let html = res && res.data;
  let finalUrl = (res && (res.url || res.responseUrl)) || url;

  const status = res && res.status;
  const hh = res && res.headers;
  const loc = hh && (hh.location || hh.Location);
  const isRedirect = status ? (status >= 300 && status < 400) : false;
  const bodyIsHtml = typeof html === "string" && /<html|<!doctype|<script|<body/i.test(html);
  if (loc && (isRedirect || (!bodyIsHtml && /^https?:\/\//i.test(loc)))) {
    try {
      finalUrl = /^https?:\/\//i.test(loc) ? loc : (originOf(url) + String(loc).replace(/^\//, ""));
      const r2 = await Widget.http.get(finalUrl, { headers: headers, allow_redirects: true });
      if (r2 && r2.data) html = r2.data;
    } catch (e) {}
  }
  return { html: html, finalUrl: finalUrl };
}

/**
 * 从解析器页面提取真实播放地址。
 * 返回 { url, headers, via }，失败返回 null。
 */
async function extractRealVideo(playerUrl, sourceUrl) {
  try {
    const parsed = await fetchHtml(playerUrl, originOf(sourceUrl) || BASE + "/");
    const html = parsed.html;
    if (!html) return null;

    // 1) 解析器内的 player_aaaa（同样可能带 encrypt / \/ 转义 / 嵌套对象）
    const pj = extractPlayerJson(html);
    if (pj) {
      const u = decodePlayerUrl(pj);
      if (u && /^https?:\/\//i.test(u)) {
        return { url: u, headers: headersFor(u, parsed.finalUrl || playerUrl), via: originOf(playerUrl) };
      }
    }

    // 2) 正则兜底
    const patterns = [
      /"url"\s*:\s*["']([^"']+\.(?:m3u8|mp4|flv)[^"']*)["']/i,
      /<video[^>]+src=["']([^"']+)["']/i,
      /(?:videoUrl|playUrl|main|url)\s*[:=]\s*["'](https?:\\?\/\\?\/[^"']+)["']/i,
      /(https?:\\?\/\\?\/[^\s"'<>\\]+\.(?:m3u8|mp4|flv)[^\s"'<>]*)/i,
    ];
    for (let i = 0; i < patterns.length; i++) {
      const m = String(html).match(patterns[i]);
      if (m) {
        const u = pickUrl([m[1]]);
        if (u && /^https?:\/\//i.test(u)) {
          return { url: u, headers: headersFor(u, parsed.finalUrl || playerUrl), via: originOf(playerUrl) };
        }
      }
    }
    return null;
  } catch (e) {
    console.error("[extractRealVideo] 失败:", e.message);
    return null;
  }
}

// from 已知则优先对应解析器，未知则依次尝试全部
function parserBasesFor(from) {
  const first = PARSE_MAP[from];
  if (!first) return PARSER_BASES.slice();
  const out = [first];
  for (let i = 0; i < PARSER_BASES.length; i++) {
    if (PARSER_BASES[i] !== first) out.push(PARSER_BASES[i]);
  }
  return out;
}

// ========== 缓存（内存 + Widget.storage，带 TTL） ==========
var _memCache = {};
function cacheGet(key) {
  const m = _memCache[key];
  if (m && m.exp > Date.now()) return m.v;
  try {
    const raw = Widget.storage.get(key);
    if (raw) {
      const o = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (o && o.exp > Date.now()) { _memCache[key] = o; return o.v; }
    }
  } catch (e) {}
  return null;
}
function cacheSet(key, value, ttlSec) {
  const o = { v: value, exp: Date.now() + ttlSec * 1000 };
  _memCache[key] = o;
  try { Widget.storage.set(key, JSON.stringify(o)); } catch (e) {}
}

// ========== 播放地址解析 ==========
async function resolvePlay(playKey) {
  try {
    const ck = "mhl_play_" + playKey;
    const cached = cacheGet(ck);
    if (cached) return cached;

    const html = await httpGet(BASE + "/play/" + playKey + ".html");
    if (!html) return null;
    const pj = extractPlayerJson(html);
    if (!pj) return null;

    const rawUrl = decodePlayerUrl(pj);
    const from = String(pj.from || pj.flag || "").trim();
    const playPage = BASE + "/play/" + playKey + ".html";
    let resolved = null;

    if (rawUrl && /^https?:\/\//i.test(rawUrl) && looksLikeMedia(rawUrl)) {
      // 直链
      resolved = { url: rawUrl, headers: headersFor(rawUrl, playPage), via: "direct", playerType: "system" };
    } else if (rawUrl) {
      // 需要走解析接口：url 必须编码，否则含 & ? 的参数会被截断
      const bases = parserBasesFor(from);
      for (let i = 0; i < bases.length && !resolved; i++) {
        const playerUrl = bases[i] + encodeURIComponent(rawUrl);
        const r = await extractRealVideo(playerUrl, rawUrl);
        if (r) resolved = { url: r.url, headers: r.headers, via: "parse", playerType: "system" };
      }
      // 兜底：交给 App 播放器打开站点播放页（页面内含站点自己的解密/解析逻辑）
      if (!resolved && ENABLE_WEB_PLAYER_FALLBACK) {
        resolved = {
          url: playPage,
          headers: { "User-Agent": UA, Referer: BASE + "/" },
          via: "web",
          playerType: "app",
        };
      }
    }

    if (!resolved || !resolved.url) return null;

    const out = {
      id: "play:" + playKey,
      type: "url",
      title: (pj.vod_data && pj.vod_data.vod_name) || pj.title || "播放",
      link: "play:" + playKey,
      videoUrl: resolved.url,
      from: from,
      playerType: resolved.playerType || "system",
      customHeaders: resolved.headers,
    };
    cacheSet(ck, out, 120);
    return out;
  } catch (e) {
    console.error("[resolvePlay] 失败:", playKey, e.message);
    return null;
  }
}

// ========== 多线路资源加载 ==========
async function getLineStreams(id, epIdx) {
  const detail = await getVideoDetail(id);
  if (!detail || !detail.lines.length) return [];

  // 并行解析所有线路，避免逐条串行把加载时间拖爆
  const jobs = detail.lines.map(function (line, i) {
    return (async function () {
      const nid = line.eps[epIdx];
      if (!nid) return null;
      const playKey = `${id}-${line.sid}-${nid}`;
      const r = await resolvePlay(playKey);
      if (!r || !r.videoUrl) {
        console.warn("[getLineStreams] 线路解析失败:", playKey, line.name || ("线路" + (i + 1)));
        return null;
      }
      return {
        name: line.name || r.from || `线路${i + 1}`,
        description: `第${epIdx + 1}集`,
        url: r.videoUrl,
        customHeaders: r.customHeaders || { Referer: BASE + "/", "User-Agent": UA },
        playerType: r.playerType || "system",
        _rank: r.playerType === "app" ? 2 : (r.via === "direct" ? 0 : 1),
        _idx: i,
      };
    })();
  });

  const results = await Promise.all(jobs);
  const streams = results.filter(Boolean);
  // 排序：直链 -> 解析 -> 网页兜底；同组保持线路顺序
  streams.sort(function (a, b) { return (a._rank - b._rank) || (a._idx - b._idx); });

  // 按 url 去重
  const seen = {}, out = [];
  for (let i = 0; i < streams.length; i++) {
    const s = streams[i];
    if (seen[s.url]) continue;
    seen[s.url] = 1;
    delete s._rank;
    delete s._idx;
    out.push(s);
  }
  return out;
}

async function loadResource(params = {}) {
  try {
    const linkStr = String(params.link || "").trim();

    if (linkStr.indexOf("play:") === 0) {
      const body = linkStr.slice(5);
      const parts = body.split("#");
      const id = parts[0];
      const epIdx = parseInt(parts[1] || "0", 10);
      return await getLineStreams(id, isNaN(epIdx) ? 0 : epIdx);
    }

    // 聚合搜索场景
    const multiSource = params.multiSource;
    const rawTitle = String(params.seriesName || params.title || "").trim();
    const wantEpisode = parseInt(params.episode, 10) || 0;

    if (multiSource === "disabled" || !rawTitle) return [];

    const wantBaseNorm = normalizeName(stripTitleMeta(rawTitle));
    const searchItems = await search({ keyword: rawTitle });
    if (!searchItems.length) return [];

    let best = null, bestScore = -1;
    for (let i = 0; i < searchItems.length; i++) {
      const score = scoreMatch(searchItems[i].title, wantBaseNorm);
      if (score > bestScore) { bestScore = score; best = searchItems[i]; }
    }
    if (!best || bestScore < 0) best = searchItems[0];

    const id = String(best.id).replace("detail:", "");
    const streams = await getLineStreams(id, Math.max(0, wantEpisode - 1));
    return streams.slice(0, MAX_AGG_LINES);
  } catch (e) {
    console.error("[loadResource]", e.message);
    return [];
  }
}

// ========== 辅助工具 ==========
function stripTitleMeta(text) {
  return String(text || "")
    .replace(/[\(（][^\)）]*[\)）]/g, "")
    .replace(/第[0-9一二三四五六七八九十]+[季部]/g, "")
    .replace(/season\s*\d+/gi, "")
    .replace(/\bs\d{1,2}\b/gi, "")
    .trim();
}

function normalizeName(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .replace(/[：:·・,，.。!！?？\-—_'’"“”()（）\[\]【】」『』]/g, "")
    .toLowerCase();
}

function scoreMatch(rawTitle, wantBaseNorm) {
  const rawBase = stripTitleMeta(rawTitle);
  const baseNorm = normalizeName(rawBase);
  if (baseNorm === wantBaseNorm) return 300;
  if (baseNorm.indexOf(wantBaseNorm) >= 0 || wantBaseNorm.indexOf(baseNorm) >= 0) return 150;
  return -1;
}

// ========== MD5 签名算法 ==========
function md5(s) { return hex(md51(s)); }
function md51(s) {
  var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
  for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
  s = s.substring(i - 64);
  var tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
  tail[14] = n * 8;
  md5cycle(state, tail);
  return state;
}
function md5cycle(x, k) {
  var a=x[0],b=x[1],c=x[2],d=x[3];
  a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
  a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,120080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
  a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
  a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
  a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
  a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
  a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
  a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
  a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
  a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
  a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
  a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
  a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
  a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
  a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
  a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
  x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3]);
}
function cmn(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b);}
function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
function md5blk(s) {
  var md5blks=[],i;
  for(i=0;i<64;i+=4) md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);
  return md5blks;
}
var hex_chr="0123456789abcdef".split("");
function rhex(n){var s="",j;for(j=0;j<4;j++)s+=hex_chr[(n>>(j*8+4))&0x0f]+hex_chr[(n>>(j*8))&0x0f];return s;}
function hex(x){for(var i=0;i<x.length;i++)x[i]=rhex(x[i]);return x.join("");}
function add32(a,b){return(a+b)&0xffffffff;}
