WidgetMetadata = {
  id: "fengye.movie",
  title: "枫叶影院",
  version: "2.0.4",
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
// 解析源 → 友好名称映射（可自行补充）
const SOURCE_NAME_MAP = {
  "JD4K": "4K超清",
  "JD2K": "2K蓝光",
  "dyttm3u8": "电影天堂",
  "co": "高清线路",
  "BBA": "蓝光线路",
  "vwnet": "极速线路",
  "YYNB": "云播线路",
  "qiyi": "爱奇艺线",
  "bilibili": "B站线路",
  "qq": "腾讯线路",
  "youku": "优酷线路",
  "蓝光2k": "2K蓝光",
  "至臻4k": "4K至臻",
  "自营t": "独享线路",
};
const API_UID_FALLBACK = "DCC147D11943AF75";
const MAX_AGG_LINES = 5;

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

// ========== 增强版：线路名称提取 ==========
function extractSourceNames(html) {
  const map = {};

  // 模式1：标准 data-sid 属性（任意标签）
  const re1 = /data-sid\s*=\s*["'](\d+)["'][^>]*>([\s\S]*?)<\//gi;
  let m;
  while ((m = re1.exec(html))) {
    const sid = m[1];
    const name = stripTags(m[2]).replace(/\(\d+\)$/, "").trim();
    if (name && !map[sid]) map[sid] = name;
  }

  // 模式2：从播放链接反向提取（兼容无data-sid的模板）
  if (Object.keys(map).length === 0) {
    const re2 = /href=["']\/play\/[^"']+-(\d+)-\d+\.html["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = re2.exec(html))) {
      const sid = m[1];
      const name = stripTags(m[2]).replace(/\(\d+\)$/, "").trim();
      if (name && !map[sid]) map[sid] = name;
    }
  }

  // 模式3：匹配vod_source容器下的li（苹果CMS标准结构）
  if (Object.keys(map).length === 0) {
    const block = html.match(/class=["'][^"']*vod_source[^"']*["'][^>]*>([\s\S]*?)<\/(div|ul)>/i);
    if (block) {
      const lis = block[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (lis) {
        lis.forEach((li, idx) => {
          const sid = String(idx + 1);
          const name = stripTags(li).replace(/\(\d+\)$/, "").trim();
          if (name && !map[sid]) map[sid] = name;
        });
      }
    }
  }

  return map;
}

async function getVideoDetail(id) {
  const html = await httpGet(BASE + "/detail/" + id + ".html");
  if (!html || html.indexOf("slide-info-title") < 0) return null;

  // 基础信息
  const tm = html.match(/slide-info-title[^"]*"[^>]*>([^<]+)</);
  const title = tm ? decodeHtml(tm[1]) : id;
  const pm = html.match(/data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/);
  const poster = pm ? decodeHtml(pm[1]) : "";
  const dm = html.match(/id="height_limit"[^>]*>([\s\S]*?)<\/div>/);
  let description = dm ? stripTags(dm[1]) : "";
  description = description.replace(/^简介[:：]/, "").replace(/【[^】]*】/g, "").trim();
  const um = html.match(/<strong class="r6">更新<\/strong>([^<]*)</);
  const update = um ? decodeHtml(um[1]).trim() : "";

  // 线路名称
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
      name: sourceNames[sid] || `线路${i + 1}`,
      eps: eps,
    });
  }
  lines.sort((a, b) => b.eps.length - a.eps.length);

  // 相关推荐
  const recIdx = html.indexOf("精彩推荐</h2>");
  const relatedItems = recIdx > 0 ? parseCards(html.slice(recIdx)) : [];

  const isMovie = lines.length && lines[0].eps.length === 1;
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
    const episodeItems = primary.eps.map((_, idx) => ({
      id: `play:${id}#${idx}`,
      type: "url",
      title: isMovie ? "正片" : `第${idx + 1}集`,
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

// ========== 播放地址解析 ==========
async function extractRealVideo(playerUrl) {
  try {
    const html = await Widget.http.get(playerUrl, {
      headers: {
        "User-Agent": UA,
        Referer: BASE + "/",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    }).then(r => r.data);

    if (!html) return null;

    // 1. player_aaaa 格式
    let m = html.match(/var player_aaaa\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
    if (m) {
      try {
        const pj = JSON.parse(m[1]);
        if (pj.url && /^https?:\/\//.test(pj.url)) return pj.url;
      } catch (e) {}
    }

    // 2. 通用 "url":"xxx.m3u8"
    m = html.match(/"url"\s*:\s*["'](https?:\/\/[^"']+\.(m3u8|mp4|flv)[^"']*)["']/i);
    if (m) return m[1];

    // 3. video 标签
    m = html.match(/<video[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (m) return m[1];

    // 4. var videoUrl
    m = html.match(/var\s+(?:videoUrl|url|playUrl)\s*=\s*["'](https?:\/\/[^"']+)["']/i);
    if (m) return m[1];

    return null;
  } catch (e) {
    console.error("[extractRealVideo] 失败:", playerUrl, e.message);
    return null;
  }
}

async function resolvePlay(playKey) {
  try {
    const html = await httpGet(BASE + "/play/" + playKey + ".html");
    const m = html.match(/var player_aaaa=(\{[\s\S]*?\})<\/script>/);
    if (!m) return null;
    const pj = JSON.parse(m[1]);
    const url = pj.url || "";
    let videoUrl = null;

    if (/^https?:\/\//.test(url)) {
      videoUrl = url;
    } else if (PARSE_MAP[pj.from]) {
      const playerUrl = PARSE_MAP[pj.from] + url;
      videoUrl = await extractRealVideo(playerUrl);
    }

    if (!videoUrl) return null;

    return {
      id: "play:" + playKey,
      type: "url",
      title: (pj.vod_data && pj.vod_data.vod_name) || "播放",
      link: "play:" + playKey,
      videoUrl,
      from: pj.from || "",
      playerType: "system",
    };
  } catch (e) {
    console.error("[resolvePlay] 失败:", playKey, e.message);
    return null;
  }
}

// ========== 多线路资源加载（命名修复） ==========
async function getLineStreams(id, epIdx) {
  const detail = await getVideoDetail(id);
  if (!detail || !detail.lines.length) return [];

  const streams = [];
  for (let i = 0; i < detail.lines.length; i++) {
    const line = detail.lines[i];
    const nid = line.eps[epIdx];
    if (!nid) continue;

    const playRes = await resolvePlay(`${id}-${line.sid}-${nid}`);
    if (playRes && playRes.videoUrl) {
      let showName = line.name;

      // 核心修复：如果是默认编号，优先用映射名，再用from原始值，绝不退回编号
      if (/^线路\d+$/.test(showName)) {
        if (playRes.from) {
          showName = SOURCE_NAME_MAP[playRes.from] || playRes.from;
        }
      }

      streams.push({
        name: showName,
        description: `第${epIdx + 1}集`,
        url: playRes.videoUrl,
        customHeaders: { Referer: BASE + "/", "User-Agent": UA },
      });
    }
  }
  return streams;
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