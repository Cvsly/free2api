WidgetMetadata = {
id: "fengye.movie",
title: "枫叶影院",
version: "2.0.8",
requiredVersion: "0.0.1",
description:
"枫叶4K影院（maihaolian.com）：全线路高清播放，支持分类筛选、热门排序、聚合搜索；2.0.8 修复加密线路无法播放与黑屏（解析接口故障转移、加密地址解密、多模式真实地址提取、防盗链 Referer 修正）",
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
{ title: "启用", value: "enabled"},
{ title: "禁用", value: "disabled"},
],
},
],
modules: [
{ id: "platformQQ", title: "腾讯SVIP热映", functionName: "loadPlatform", cacheDuration: 3600, params: [{ name: "platform", title: "平台", type: "constant", value: "qq"}, { name: "page", title: "页码", type: "page"}]},
{ id: "platformYouku", title: "优酷SVIP热映", functionName: "loadPlatform", cacheDuration: 3600, params: [{ name: "platform", title: "平台", type: "constant", value: "youku"}, { name: "page", title: "页码", type: "page"}]},
{ id: "platformBili", title: "B站SVIP热映", functionName: "loadPlatform", cacheDuration: 3600, params: [{ name: "platform", title: "平台", type: "constant", value: "bli"}, { name: "page", title: "页码", type: "page"}]},
{ id: "vodMovie", title: "电影", functionName: "loadVodList", cacheDuration: 1800, params: [
{ name: "tid", title: "分类", type: "enumeration", value: "1", enumOptions: [
{ title: "全部", value: "1"}, { title: "动作片", value: "6"}, { title: "喜剧片", value: "7"},
{ title: "恐怖片", value: "8"}, { title: "科幻片", value: "9"}, { title: "爱情片", value: "10"},
{ title: "剧情片", value: "11"}, { title: "战争片", value: "12"}, { title: "纪录片", value: "20"},
]},
{ name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
{ title: "最新更新", value: "time"}, { title: "热播排行", value: "hits"}, { title: "评分最高", value: "score"},
]},
{ name: "page", title: "页码", type: "page"},
]},
{ id: "vodTV", title: "电视剧", functionName: "loadVodList", cacheDuration: 1800, params: [
{ name: "tid", title: "分类", type: "enumeration", value: "2", enumOptions: [
{ title: "全部", value: "2"}, { title: "国产剧", value: "13"}, { title: "日韩剧", value: "15"}, { title: "海外剧", value: "16"},
]},
{ name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
{ title: "最新更新", value: "time"}, { title: "热播排行", value: "hits"}, { title: "评分最高", value: "score"},
]},
{ name: "page", title: "页码", type: "page"},
]},
{ id: "vodAnime", title: "动漫", functionName: "loadVodList", cacheDuration: 1800, params: [
{ name: "tid", title: "分类", type: "enumeration", value: "4", enumOptions: [
{ title: "全部", value: "4"}, { title: "国产动漫", value: "25"}, { title: "日韩动漫", value: "26"},
]},
{ name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
{ title: "最新更新", value: "time"}, { title: "热播排行", value: "hits"}, { title: "评分最高", value: "score"},
]},
{ name: "page", title: "页码", type: "page"},
]},
{ id: "vodShow", title: "综艺", functionName: "loadVodList", cacheDuration: 1800, params: [
{ name: "tid", title: "分类", type: "enumeration", value: "3", enumOptions: [
{ title: "全部", value: "3"}, { title: "大陆综艺", value: "21"}, { title: "日韩综艺", value: "22"},
]},
{ name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
{ title: "最新更新", value: "time"}, { title: "热播排行", value: "hits"}, { title: "评分最高", value: "score"},
]},
{ name: "page", title: "页码", type: "page"},
]},
{ id: "vodDuanju", title: "热门短剧", functionName: "loadVodList", cacheDuration: 1800, params: [
{ name: "tid", title: "分类", type: "constant", value: "5"},
{ name: "by", title: "排序", type: "enumeration", value: "time", enumOptions: [
{ title: "最新更新", value: "time"}, { title: "热播排行", value: "hits"},
]},
{ name: "page", title: "页码", type: "page"},
]},
{ id: "loadResource", title: "播放资源", functionName: "loadResource", type: "stream", cacheDuration: 120, params: []},
],
search: {
title: "搜索",
functionName: "search",
params: [{ name: "keyword", title: "关键词", type: "input"}, { name: "page", title: "页码", type: "page"}],
},
};

// ========== 常量配置 ==========
const BASE = "https://maihaolian.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PLATFORM_URLS = { qq: "/label/qq.html", youku: "/label/youku.html", bli: "/label/bli.html"};

// 解析接口池：同一来源可配置多个接口，按顺序故障转移。
// 未知来源（from 不在下表中）自动使用 DEFAULT_PARSE_APIS 兜底，不再直接丢弃该线路。
// 如新增可用解析接口，只需往对应数组追加即可。
const DEFAULT_PARSE_APIS = [
"https://zzrs.mfdyvip.com/player/?url=",
"https://fgsrg.hzqingshan.com/player/?url=",
];
const PARSE_MAP = {
co: ["https://zzrs.mfdyvip.com/player/?url="],
BBA: ["https://zzrs.mfdyvip.com/player/?url="],
vwnet: ["https://zzrs.mfdyvip.com/player/?url="],
YYNB: ["https://zzrs.mfdyvip.com/player/?url="],
qiyi: ["https://zzrs.mfdyvip.com/player/?url="],
bilibili: ["https://zzrs.mfdyvip.com/player/?url="],
qq: ["https://zzrs.mfdyvip.com/player/?url="],
youku: ["https://zzrs.mfdyvip.com/player/?url="],
JD4K: ["https://fgsrg.hzqingshan.com/player/?url="],
JD2K: ["https://fgsrg.hzqingshan.com/player/?url="],
};
const API_UID_FALLBACK = "DCC147D11943AF75";
const MAX_AGG_LINES = 6;

// 解析相关超时 / 缓存
const RESOLVE_TIMEOUT_MS = 12000; // 单次网络请求超时（毫秒）
const LINE_TIMEOUT_MS = 25000; // 单条线路整体解析超时（毫秒，含多接口尝试）
const PLAY_CACHE_TTL = 600; // 解析结果缓存（秒）：同一集短时间内重复点播不再重新解析
const DETAIL_CACHE_TTL = 300; // 详情页线路结构缓存（秒）

// ========== 基础工具函数 ==========
async function httpGet(url, params) {
const opt = { headers: { "User-Agent": UA, Referer: BASE + "/"}};
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

function stripTags(s) {
return decodeHtml(String(s || "").replace(/<[^>]+>/g, "")).trim();
}

function makeItem(id, title, poster, remark) {
const item = { id: String(id), type: "url", title: decodeHtml(title), link: "detail:" + id};
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
items.push(makeItem(id, m[2], pm? pm[1]: "", rm? rm[1]: ""));
}
return items;
}

async function apiUid() {
let uid = Widget.storage.get("mhl_api_uid");
if (uid) return uid;
try {
const js = await httpGet(BASE + "/template/mp/js/app.js");
const m = String(js).match(/Uid:"([0-9A-Fa-f]+)"/);
uid = m? m[1]: API_UID_FALLBACK;
} catch (e) {
uid = API_UID_FALLBACK;
}
Widget.storage.set("mhl_api_uid", uid);
return uid;
}

// ========== 播放解析通用工具 ==========

// Promise 超时包装：Widget.http 不保证支持 timeout 参数，用竞速实现单请求超时保护，
// 避免某条线路请求 hang 住拖慢全部线路。
function withTimeout(promise, ms, label) {
return new Promise((resolve, reject) => {
const timer = setTimeout(() => {
reject(new Error((label || "请求") + "超时(" + ms + "ms)"));
}, ms);
promise.then(
(v) => { clearTimeout(timer); resolve(v);},
(e) => { clearTimeout(timer); reject(e);}
);
});
}

// 无 atob 依赖的 base64 解码（部分运行环境没有 atob）
function b64Decode(input) {
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const str = String(input).replace(/[^A-Za-z0-9+/=]/g, "");
let out = "";
let i = 0;
while (i < str.length) {
const e1 = chars.indexOf(str.charAt(i++));
const e2 = chars.indexOf(str.charAt(i++));
const e3 = chars.indexOf(str.charAt(i++));
const e4 = chars.indexOf(str.charAt(i++));
if (e1 < 0 || e2 < 0) break;
const c1 = (e1 << 2) | (e2 >> 4);
const c2 = ((e2 & 15) << 4) | (e3 >> 2);
const c3 = ((e3 & 3) << 6) | e4;
out += String.fromCharCode(c1);
if (e3!== 64 && e3 >= 0) out += String.fromCharCode(c2);
if (e4!== 64 && e4 >= 0) out += String.fromCharCode(c3);
}
return out;
}

/**
* 容错提取 var player_aaaa = {...} 的 JSON。
* 旧正则 /var player_aaaa=(\{[\s\S]*?\})<\/script>/ 在以下情况会失效导致整条线路被丢弃：
* 1) 等号两侧有空格（var player_aaaa = {...}）
* 2) JSON 含嵌套对象（vod_data）时非贪婪匹配提前截断
* 改为按花括号配对提取，兼容嵌套与格式变化。
*/
function extractPlayerJson(html) {
html = String(html || "");
const key = "player_aaaa";
const idx = html.indexOf(key);
if (idx < 0) return null;
const eq = html.indexOf("=", idx + key.length);
if (eq < 0) return null;
const start = html.indexOf("{", eq);
if (start < 0) return null;
let depth = 0, inStr = false, quote = "", esc = false;
for (let i = start; i < html.length; i++) {
const ch = html[i];
if (inStr) {
if (esc) esc = false;
else if (ch === "\\") esc = true;
else if (ch === quote) inStr = false;
} else if (ch === '"' || ch === "'") {
inStr = true; quote = ch;
} else if (ch === "{") {
depth++;
} else if (ch === "}") {
depth--;
if (depth === 0) {
try { return JSON.parse(html.slice(start, i + 1));}
catch (e) { return null;}
}
}
}
return null;
}

/**
* 解密 player_aaaa.url 字段。
* 部分资源站返回的 url 是加密串（escape 编码 / URL 编码 / base64），旧代码直接拼到解析接口后，
* 解析服务无法识别导致该线路 100% 失败。这里按常见加密形态依次尝试还原，失败则原样返回
* 交给解析接口处理（解析服务通常兼容站点自身的加密格式）。
*/
function tryDecryptPlayerUrl(rawUrl, encryptFlag) {
let url = String(rawUrl || "").trim();
if (!url) return "";
if (/^https?:\/\//i.test(url)) return url; // 已经是直链
const attempts = [];
if (typeof unescape === "function") { try { attempts.push(unescape(url));} catch (e) {}}
try { attempts.push(decodeURIComponent(url));} catch (e) {}
const compact = url.replace(/\s+/g, "");
if (/^[A-Za-z0-9+/=]{24,}$/.test(compact)) {
try {
const d = b64Decode(compact);
attempts.push(d);
try { attempts.push(decodeURIComponent(d));} catch (e) {}
} catch (e) {}
}
for (let i = 0; i < attempts.length; i++) {
const m = String(attempts[i]).match(/(https?:\/\/[^\s"'<>\\]+)/i);
if (m) return m[1].replace(/\\+$/, "");
}
return url;
}

function looksLikeMedia(u) {
return /\.(m3u8|mp4|flv|m4v|mov|webm|ts|mkv)(\?|#|$)/i.test(String(u || ""));
}

function hostOf(u) {
const m = String(u || "").match(/^https?:\/\/([^/:?#]+)/i);
return m? m[1].toLowerCase(): "";
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

const json = typeof data === "string"? JSON.parse(data): data;
if (!json || Number(json.code)!== 1) throw new Error("接口返回异常");
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
const path = page > 1? basePath.replace(/\.html$/, `-${page}.html`): basePath;
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
const data = await httpGet(BASE + "/index.php/ajax/suggest", { mid: 1, wd: keyword, page});
const json = typeof data === "string"? JSON.parse(data): data;
return ((json && json.list) || []).map(v => makeItem(v.id, v.name, v.pic, ""));
} catch (e) {
console.error("[search]", e.message);
throw e;
}
}

// ========== 详情页线路名提取（保持原逻辑） ==========
function isEpisodeTitle(name) {
if (!name) return true;
return /^第\s*\d+\s*[集部季]$/.test(name) ||
/^正片$/.test(name) ||
/^\d+集$/.test(name);
}

/**
* 从详情页提取线路名称映射
* 网站真实结构：
* 导航栏.anthology-tab >.swiper-wrapper > 6个 <a class="swiper-slide">
* 集数列表.anthology-list > 6个.anthology-list-box div
* 第i个导航名 对应 第i个box里的播放链接的sid
* 注意：导航顺序和sid数字顺序不一致！必须按box出现顺序对应
*/
function extractSourceNames(html) {
const map = {};

// 1. 提取导航标签名（从.anthology-tab 区域的 <a class="swiper-slide">）
const navBlockMatch = html.match(/anthology-tab[\s\S]*?swiper-wrapper[\s\S]*?<\/div>/i);
let navNames = [];
if (navBlockMatch) {
const navLinks = navBlockMatch[0].match(/<a[^>]*class="swiper-slide"[^>]*>([\s\S]*?)<\/a>/gi);
if (navLinks && navLinks.length > 0) {
navNames = navLinks.map(a => {
return stripTags(a).replace(/\(\d+\)$/, "").trim();
}).filter(n => n &&!isEpisodeTitle(n));
}
}

// 2. 按box出现顺序提取sid（不是按sid数字排序！）
// 每个.anthology-list-box 里的第一个播放链接的sid，就是这个box对应的线路
const sids = [];
const boxRe = /anthology-list-box[^>]*>[\s\S]*?\/play\/\d+-(\d+)-\d+\.html/g;
let m;
while ((m = boxRe.exec(html))) {
if (sids.indexOf(m[1]) === -1) sids.push(m[1]);
}

// 3. 按顺序一一对应：第i个导航名 → 第i个box的sid
for (let i = 0; i < sids.length && i < navNames.length; i++) {
map[sids[i]] = navNames[i];
}

return map;
}

async function getVideoDetail(id) {
const html = await httpGet(BASE + "/detail/" + id + ".html");
if (!html || html.indexOf("slide-info-title") < 0) return null;

const tm = html.match(/slide-info-title[^"]*"[^>]*>([^<]+)</);
const title = tm? decodeHtml(tm[1]): id;
const pm = html.match(/data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/);
const poster = pm? decodeHtml(pm[1]): "";
const dm = html.match(/id="height_limit"[^>]*>([\s\S]*?)<\/div>/);
let description = dm? stripTags(dm[1]): "";
description = description.replace(/^简介[:：]/, "").replace(/]*】/g, "").trim();
const um = html.match(/<strong class="r6">更新<\/strong>([^<]*)</);
const update = um? decodeHtml(um[1]).trim(): "";

// 提取网站原生线路名（蓝光2k / 至臻4k / 自营t / 自营y / 自营r）
const sourceNames = extractSourceNames(html);

// 解析所有线路+集数
const groups = {};
const pre = new RegExp("/play/" + id + "-(\\d+)-(\\d+)\\.html", "g");
let em;
while ((em = pre.exec(html))) {
const sid = em[1];
const nid = Number(em[2]);
if (!groups[sid]) groups[sid] = [];
groups[sid].push(nid);
}

// 组装线路数组
const lines = [];
const sids = Object.keys(groups);
for (let i = 0; i < sids.length; i++) {
const sid = sids[i];
const eps = groups[sid].sort((a, b) => a - b);
if (!eps.length) continue;
lines.push({
sid: sid,
name: sourceNames[sid] || "", // 网站原生名
eps: eps,
});
}
// 按集数从多到少排序
lines.sort((a, b) => b.eps.length - a.eps.length);

// 相关推荐
const recIdx = html.indexOf("精彩推荐</h2>");
const relatedItems = recIdx > 0? parseCards(html.slice(recIdx)): [];

const isMovie = lines.length && lines[0].eps.length === 1;
const mediaType = isMovie? "movie": "tv";

return { title, poster, description, update, lines, relatedItems, mediaType};
}

// 详情页线路结构短时缓存：loadDetail 与 loadResource 会重复请求同一详情页，
// 缓存 5 分钟避免重复抓取，加快多线路解析。
async function getVideoDetailCached(id) {
const key = "mhl_detail_" + id;
try {
const c = Widget.storage.get(key);
if (c && c.detail && c.ts && Date.now() - c.ts < DETAIL_CACHE_TTL * 1000) {
return c.detail;
}
} catch (e) {}
const detail = await getVideoDetail(id);
if (detail) {
try { Widget.storage.set(key, { detail: detail, ts: Date.now()});} catch (e) {}
}
return detail;
}

async function loadDetail(link) {
const key = String(link);
try {
if (key.indexOf("play:") === 0) {
return await resolvePlayLink(key.slice(5));
}
const id = key.replace("detail:", "");
const detail = await getVideoDetailCached(id);
if (!detail) return null;

const { title, poster, description, update, lines, relatedItems, mediaType} = detail;
if (!lines.length) throw new Error("未找到播放线路");

const primary = lines[0];
const isMovie = mediaType === "movie";
const episodeItems = primary.eps.map((_, idx) => ({
id: `play:${id}#${idx}`,
type: "url",
title: isMovie? "正片": `第${idx + 1}集`,
link: `play:${id}#${idx}`,
mediaType: mediaType,
}));

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

// ========== 播放地址解析（2.0.8 重写） ==========

/**
* 从解析服务播放页提取真实媒体地址。
* 旧版只做静态正则且模式极少，解析页多为 JS 动态加载真实地址，
* 经常提取失败（线路被丢弃）或误提取到广告/占位地址（黑屏）。
* 新版策略：
* 1) 解析接口直接返回 JSON 的情况；
* 2) 解析页内嵌 player_aaaa（含解密）；
* 3) 多模式静态提取（url/file/src/source/video/data-url/unescape/decodeURIComponent）；
* 4) 候选地址按"像真实媒体"排序，优先返回带媒体扩展名的地址，避免黑屏；
* 5) 跟进一层 iframe（很多解析页把真实播放器放在 iframe 里）；
* 6) 宁可返回 null 让其他线路顶上，也不返回明显是页面的地址造成黑屏。
*/
async function extractRealVideo(playerUrl, depth) {
depth = depth || 0;
let text = "";
try {
const data = await withTimeout(
Widget.http.get(playerUrl, {
headers: {
"User-Agent": UA,
Referer: BASE + "/",
Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
},
}).then(r => r.data),
RESOLVE_TIMEOUT_MS,
"解析页请求"
);
text = String(data || "").trim();
} catch (e) {
console.error("[extractRealVideo] 请求失败:", e.message);
return null;
}
if (!text) return null;

// A. 解析接口直接返回 JSON（如 {"url":"https://...m3u8"}）
if (text.charAt(0) === "{") {
try {
const j = JSON.parse(text);
const u = j.url || j.data || (j.data && j.data.url);
if (u && /^https?:\/\//i.test(u)) return { url: u, referer: playerUrl};
} catch (e) { /* 继续走 HTML 提取 */}
}

// B. 解析页内嵌 player_aaaa（部分解析服务复用站点播放器结构）
const pj = extractPlayerJson(text);
if (pj && pj.url) {
const du = tryDecryptPlayerUrl(pj.url, pj.encrypt);
if (/^https?:\/\//i.test(du)) return { url: du, referer: playerUrl};
}

// C. 多模式提取候选地址
const seen = {};
const cands = [];
const push = (u) => {
u = String(u || "").replace(/&amp;/g, "&").trim();
if (!/^https?:\/\//i.test(u) || seen[u]) return;
if (/google-analytics|hm\.baidu|googletagmanager|doubleclick|adsystem/i.test(u)) return;
seen[u] = 1;
cands.push(u);
};
const grab = (re) => {
let m;
re.lastIndex = 0;
while ((m = re.exec(text))) push(m[1]);
};
grab(/["']url["']\s*:\s*["'](https?:\/\/[^"']+)["']/gi);
grab(/(?:var\s+)?\burl\s*=\s*["'](https?:\/\/[^"']+)["']/gi);
grab(/\bfile\s*:\s*["'](https?:\/\/[^"']+)["']/gi);
grab(/\bsrc\s*:\s*["'](https?:\/\/[^"']+)["']/gi);
grab(/<source[^>]+src=["'](https?:\/\/[^"']+)["']/gi);
grab(/<video[^>]+src=["'](https?:\/\/[^"']+)["']/gi);
grab(/\bdata-(?:url|src)=["'](https?:\/\/[^"']+)["']/gi);
// unescape / decodeURIComponent 包裹的真实地址（先解码再提取）
const grabEncoded = (re) => {
let m;
re.lastIndex = 0;
while ((m = re.exec(text))) {
let s = m[1];
if (typeof unescape === "function") { try { s = unescape(s);} catch (e) {}}
try { s = decodeURIComponent(s);} catch (e) {}
const um = String(s).match(/(https?:\/\/[^\s"'<>\\]+)/i);
if (um) push(um[1]);
}
};
grabEncoded(/unescape\(\s*["']([^"']+)["']\s*\)/gi);
grabEncoded(/decodeURIComponent\(\s*["']([^"']+)["']\s*\)/gi);

// D. 优先返回像真实媒体的地址，避免误拿广告/占位地址导致黑屏
const ranked = cands.slice().sort(
(a, b) => (looksLikeMedia(b)? 1: 0) - (looksLikeMedia(a)? 1: 0)
);
for (let i = 0; i < ranked.length; i++) {
if (looksLikeMedia(ranked[i])) return { url: ranked[i], referer: playerUrl};
}

// E. 跟进一层 iframe（很多解析页把真实播放器放在 iframe 里，静态抓第一层拿不到地址）
if (depth < 1) {
const ire = /<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
let m;
ire.lastIndex = 0;
while ((m = ire.exec(text))) {
if (/ads|google|baidu|doubleclick/i.test(m[1])) continue;
try {
const inner = await extractRealVideo(m[1], depth + 1);
if (inner && inner.url) return inner;
} catch (e) {}
}
}

// F. 退而求其次：非页面型、非解析站自身的候选地址（可能是无扩展名的 token 直链）
const pagey = /\.(html?|php|aspx|jsp)(\?|#|$)/i;
const selfHost = hostOf(playerUrl);
for (let i = 0; i < ranked.length; i++) {
if (!pagey.test(ranked[i]) && hostOf(ranked[i])!== selfHost) {
return { url: ranked[i], referer: playerUrl};
}
}
return null;
}

/**
* 解析单个播放 key（如 "12345-1-3"）为真实可播地址。
* 返回 { url, referer, direct, from, title}，失败返回 null。
* 关键修复点：
* 1) 未知 from 不再直接丢弃，走 DEFAULT_PARSE_APIS 兜底；
* 2) 同一 from 的多个解析接口按顺序故障转移；
* 3) player_aaaa.url 加密串先尝试解密；
* 4) 解析结果短时缓存，避免重复解析；
* 5) referer 指向实际提供媒体的解析页（防盗链校验的是解析域名，
* 旧版写死 maihaolian.com 会导致部分线路 403 → 黑屏）。
*/
async function resolvePlayUrl(playKey) {
playKey = String(playKey || "").trim();
if (!playKey) return null;

const cacheKey = "mhl_play_" + playKey;
try {
const c = Widget.storage.get(cacheKey);
if (c && c.url && c.ts && Date.now() - c.ts < PLAY_CACHE_TTL * 1000) {
return { url: c.url, referer: c.referer, direct: c.direct, from: c.from, title: c.title};
}
} catch (e) {}

let html = "";
try {
html = await withTimeout(httpGet(BASE + "/play/" + playKey + ".html"), RESOLVE_TIMEOUT_MS, "播放页加载");
} catch (e) {
console.error("[resolvePlayUrl] 播放页加载失败:", playKey, e.message);
return null;
}

const pj = extractPlayerJson(html || "");
if (!pj) {
console.error("[resolvePlayUrl] 未找到 player_aaaa:", playKey);
return null;
}

const from = pj.from || "";
const title = (pj.vod_data && pj.vod_data.vod_name) || "播放";
const url = tryDecryptPlayerUrl(pj.url, pj.encrypt);
if (!url) {
console.error("[resolvePlayUrl] 播放地址为空:", playKey, "from=" + from);
return null;
}

let videoUrl = null;
let referer = BASE + "/";
let direct = false;

if (/^https?:\/\//i.test(url)) {
// 站点直接给出可播地址：最可靠，优先直用
videoUrl = url;
direct = true;
} else {
// 需要过解析接口：按 from 取接口池，未知 from 用默认池兜底，逐个尝试直到成功
const apis = PARSE_MAP[from] || DEFAULT_PARSE_APIS;
for (let i = 0; i < apis.length; i++) {
const api = apis[i];
const playerUrl = api + url;
try {
const found = await extractRealVideo(playerUrl);
if (found && found.url) {
videoUrl = found.url;
referer = found.referer || playerUrl;
break;
}
} catch (e) {
console.error("[resolvePlayUrl] 解析接口异常:", api, e.message);
}
}
// 兜底：信任站点原始数据（解密前本身就是 http 的情况）
if (!videoUrl && pj.url && /^https?:\/\//i.test(String(pj.url).trim())) {
videoUrl = String(pj.url).trim();
direct = true;
}
}

if (!videoUrl) {
console.error("[resolvePlayUrl] 全部解析失败:", playKey, "from=" + from);
return null;
}

const result = { url: videoUrl, referer: referer, direct: direct, from: from, title: title};
try {
Widget.storage.set(cacheKey, {
url: videoUrl, referer: referer, direct: direct,
from: from, title: title, ts: Date.now(),
});
} catch (e) {}
return result;
}

// 供 loadDetail 使用：把解析结果包装成 VideoItem
async function resolvePlay(playKey) {
const r = await resolvePlayUrl(playKey);
if (!r) return null;
return {
id: "play:" + playKey,
type: "url",
title: r.title,
link: "play:" + playKey,
videoUrl: r.url,
from: r.from,
playerType: "system",
customHeaders: { Referer: r.referer, "User-Agent": UA},
};
}

/**
* 处理详情页选集链接 "12345#2"。
* 旧版直接把 "12345#2" 拼进 /play/ URL（# 后是 fragment，实际请求的是 /play/12345），
* 集数信息丢失导致播错集或播不了。这里先换算成首选线路的完整播放 key 再解析。
*/
async function resolvePlayLink(linkKey) {
const m = String(linkKey || "").match(/^(\d+)#(\d+)$/);
if (m) {
const id = m[1];
const epIdx = parseInt(m[2], 10);
try {
const detail = await getVideoDetailCached(id);
if (detail && detail.lines.length) {
const line = detail.lines[0];
const nid = line.eps[epIdx];
if (nid!= null) return await resolvePlay(id + "-" + line.sid + "-" + nid);
}
} catch (e) {
console.error("[resolvePlayLink] 失败:", linkKey, e.message);
}
return null;
}
return await resolvePlay(linkKey);
}

// ========== 多线路资源加载（2.0.8 重写） ==========
async function getLineStreams(id, epIdx) {
const detail = await getVideoDetailCached(id);
if (!detail ||!detail.lines.length) return [];

// 并行解析所有线路（旧版串行 await，一条卡住拖慢全部）；单线路整体超时保护，
// 失败的线路只记录日志并跳过，不影响其他线路。
const jobs = detail.lines.map((line, i) => {
const nid = line.eps[epIdx];
if (nid == null) return Promise.resolve(null);
const playKey = id + "-" + line.sid + "-" + nid;
const label = line.name || ("线路" + (i + 1));
return withTimeout(resolvePlayUrl(playKey), LINE_TIMEOUT_MS, "线路[" + label + "]解析")
.then(r => {
if (!r ||!r.url) return null;
return {
name: line.name || r.from || ("线路" + (i + 1)),
description: "第" + (epIdx + 1) + "集" + (r.direct? " · 直连": " · 解析"),
url: r.url,
customHeaders: { Referer: r.referer, "User-Agent": UA},
order: i,
direct: r.direct? 1: 0,
};
})
.catch(e => {
console.error("[getLineStreams] 线路失败:", line.sid, e.message);
return null;
});
});

const results = await Promise.all(jobs);
const ok = results.filter(Boolean);
// 直连线路最稳定，排在前面；其余保持站点原有线路顺序
ok.sort((a, b) => (b.direct - a.direct) || (a.order - b.order));
return ok.map(s => ({
name: s.name,
description: s.description,
url: s.url,
customHeaders: s.customHeaders,
}));
}

async function loadResource(params = {}) {
try {
const linkStr = String(params.link || "").trim();

if (linkStr.indexOf("play:") === 0) {
const body = linkStr.slice(5);
const [id, epStr] = body.split("#");
const epIdx = parseInt(epStr || "0", 10);
return await getLineStreams(id, epIdx);
}

// 聚合搜索场景
const multiSource = params.multiSource;
const rawTitle = String(params.seriesName || params.title || "").trim();
const wantEpisode = parseInt(params.episode, 10) || 0;

if (multiSource === "disabled" ||!rawTitle) return [];

const wantBaseNorm = normalizeName(stripTitleMeta(rawTitle));
const searchItems = await search({ keyword: rawTitle});
if (!searchItems.length) return [];

let best = null, bestScore = -1;
for (let i = 0; i < searchItems.length; i++) {
const score = scoreMatch(searchItems[i].title, wantBaseNorm);
if (score > bestScore) { bestScore = score; best = searchItems[i];}
}
if (!best || bestScore < 0) best = searchItems[0];

const id = best.id.replace("detail:", "");
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
.replace(/[：:·・,，.。!！?？\-—_'’"“”()（）\[\]」『』]/g, "")
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
function md5(s) { return hex(md51(s));}
function md51(s) {
var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
s = s.substring(i - 64);
var tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
tail[i >> 2] |= 0x80 << ((i % 4) << 3);
if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0;}
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
