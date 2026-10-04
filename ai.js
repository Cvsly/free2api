WidgetMetadata = {
  id: "forward.maihaolian",
  title: "枫叶影院",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "枫叶4K影院（maihaolian.com）：热播榜、腾讯/优酷/B站SVIP热映、红果短剧，以及电视剧、电影、动漫、综艺、短剧频道",
  author: "Forward",
  site: "https://maihaolian.com",
  detailCacheDuration: 300,
  modules: [
    // ===== 首页 =====
    {
      id: "banner",
      title: "热播榜",
      functionName: "loadBanner",
      cacheDuration: 1800,
    },
    // ===== 平台专区（/label/*.html 榜单页）=====
    {
      id: "platformQQ",
      title: "腾讯SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [{ name: "platform", title: "平台", type: "constant", value: "qq" }],
    },
    {
      id: "platformYouku",
      title: "优酷SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [{ name: "platform", title: "平台", type: "constant", value: "youku" }],
    },
    {
      id: "platformBili",
      title: "B站SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [{ name: "platform", title: "平台", type: "constant", value: "bli" }],
    },
    {
      id: "platformDuanju",
      title: "红果短剧",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [{ name: "platform", title: "平台", type: "constant", value: "duanju" }],
    },
    // ===== 频道（首页版块）=====
    {
      id: "homeTV",
      title: "电视剧",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [{ name: "section", title: "版块", type: "constant", value: "电视剧" }],
    },
    {
      id: "homeMovie",
      title: "电影",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [{ name: "section", title: "版块", type: "constant", value: "电影" }],
    },
    {
      id: "homeAnime",
      title: "动漫",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [{ name: "section", title: "版块", type: "constant", value: "动漫" }],
    },
    {
      id: "homeShow",
      title: "综艺",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [{ name: "section", title: "版块", type: "constant", value: "综艺" }],
    },
    {
      id: "homeDuanju",
      title: "热门短剧",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [{ name: "section", title: "版块", type: "constant", value: "热门短剧" }],
    },
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [{ name: "keyword", title: "关键词", type: "input" }],
  },
};

const BASE = "https://maihaolian.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 平台专区榜单地址（注意：/label/duanju.html 是错误页，短剧真实地址带 -1 后缀）
const PLATFORM_URLS = {
  qq: "/label/qq.html",
  youku: "/label/youku.html",
  bli: "/label/bli.html",
  duanju: "/label/duanju-1.html",
};

// playerconfig.js 中 ps=1（需解析）的线路 -> 解析器地址；ps=0 线路的 url 本身就是 m3u8 直连
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

async function httpGet(url, params) {
  const opt = { headers: { "User-Agent": UA, Referer: BASE + "/" } };
  if (params) opt.params = params;
  const res = await Widget.http.get(url, opt);
  return res.data;
}

function decodeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(s) {
  return decodeHtml(String(s || "").replace(/<[^>]+>/g, "")).trim();
}

function makeItem(id, title, poster, remark) {
  const item = {
    id: String(id),
    type: "url",
    title: decodeHtml(title),
    link: "detail:" + id,
  };
  if (poster) item.posterPath = decodeHtml(poster);
  if (remark) item.durationText = stripTags(remark);
  return item;
}

// 站点通用的卡片列表：public-list-exp 块（首页各版块、label 榜单、详情页推荐都是同一结构）
function parseCards(html) {
  const items = [];
  const seen = {};
  const re =
    /<a[^>]*class="public-list-exp"[^>]*href="\/detail\/(\d+)\.html"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
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

// 首页版块切片：从「<h2 ...>版块名</h2>」切到下一个版块容器
function sliceHomeSection(html, section) {
  const start = html.indexOf(">" + section + "</h2>");
  if (start < 0) return "";
  const rest = html.slice(start);
  const next = rest.indexOf('<div class="box-width');
  return next > 0 ? rest.slice(0, next) : rest;
}

// ===== 首页·热播榜（顶部轮播）=====
async function loadBanner(params = {}) {
  try {
    const html = await httpGet(BASE + "/");
    const items = [];
    const seen = {};
    const re = /<a href="\/detail\/(\d+)\.html">([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html))) {
      const id = m[1];
      const body = m[2];
      if (seen[id] || body.indexOf("slide-time-bj") < 0 && body.indexOf("slide-time-img") < 0) continue;
      const tm = body.match(/slide-info-types"><span>([^<]+)<\/span>/);
      if (!tm) continue;
      seen[id] = true;
      const bg = body.match(/background-image:\s*url\(([^)]+)\)/);
      const score = body.match(/ds-shoucang fa"><\/i>([\d.]+)/);
      const infos = [];
      const ire = /<span>([^<]{1,20})<\/span>/g;
      let im;
      while ((im = ire.exec(body))) {
        if (im[1] !== tm[1] && infos.length < 3) infos.push(im[1]);
      }
      const item = makeItem(id, tm[1], "", infos.join(" · "));
      if (bg) item.backdropPath = decodeHtml(bg[1]);
      if (score) item.rating = Number(score[1]);
      items.push(item);
    }
    if (!items.length) throw new Error("热播榜为空");
    return items;
  } catch (error) {
    console.error("[loadBanner] 失败:", error.message || error);
    throw error;
  }
}

// ===== 平台专区（腾讯 / 优酷 / B站 / 红果短剧）=====
async function loadPlatform(params = {}) {
  try {
    const path = PLATFORM_URLS[params.platform || "qq"];
    if (!path) throw new Error("未知平台: " + params.platform);
    const html = await httpGet(BASE + path);
    const items = parseCards(html);
    if (!items.length) throw new Error("榜单为空");
    return items;
  } catch (error) {
    console.error("[loadPlatform] 失败:", error.message || error);
    throw error;
  }
}

// ===== 频道（首页版块：电视剧 / 电影 / 动漫 / 综艺 / 热门短剧）=====
async function loadHomeSection(params = {}) {
  try {
    const section = params.section || "电视剧";
    const html = await httpGet(BASE + "/");
    const slice = sliceHomeSection(html, section);
    const items = parseCards(slice);
    if (!items.length) throw new Error("版块为空: " + section);
    return items;
  } catch (error) {
    console.error("[loadHomeSection] 失败:", error.message || error);
    throw error;
  }
}

// ===== 搜索（maccms ajax suggest 接口，JSON）=====
async function search(params = {}) {
  try {
    const keyword = (params.keyword || "").trim();
    if (!keyword) return [];
    const data = await httpGet(BASE + "/index.php/ajax/suggest", { mid: 1, wd: keyword });
    const json = typeof data === "string" ? JSON.parse(data) : data;
    const list = (json && json.list) || [];
    return list.map((v) => makeItem(v.id, v.name, v.pic, ""));
  } catch (error) {
    console.error("[search] 失败:", error.message || error);
    throw error;
  }
}

// ===== 详情与播放（link + loadDetail 机制）=====
// link 约定："detail:{vodId}" -> 详情；"play:{vodId}-{sid}-{nid}" -> 单集播放地址
async function loadDetail(link) {
  const key = String(link);
  try {
    if (key.indexOf("play:") === 0) return await resolvePlay(key.slice(5));
    const id = key.replace("detail:", "");
    return await loadVodDetail(id, key);
  } catch (error) {
    console.error("[loadDetail] 失败:", link, error.message || error);
    throw error;
  }
}

async function loadVodDetail(id, link) {
  const html = await httpGet(BASE + "/detail/" + id + ".html");
  if (!html || html.indexOf("slide-info-title") < 0) return null;

  const tm = html.match(/slide-info-title[^"]*"[^>]*>([^<]+)</);
  const title = tm ? decodeHtml(tm[1]) : id;

  // 信息行：类型 / 演员 / 更新 / 连载
  const infos = {};
  const ire = /<strong class="r6">([^<]+)<\/strong>([^<]*)</g;
  let im;
  while ((im = ire.exec(html))) infos[im[1].replace(/[::\s]/g, "")] = decodeHtml(im[2]).trim();

  // 海报：取 alt 含片名的那张图
  const pm = html.match(/data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/);
  const poster = pm ? decodeHtml(pm[1]) : "";

  // 简介
  const dm = html.match(/id="height_limit"[^>]*>([\s\S]*?)<\/div>/);
  let description = dm ? stripTags(dm[1]) : "";
  description = description.replace(/^简介[:：]/, "").replace(/【[^】]*】/g, "").trim();

  // 选集：/play/{id}-{sid}-{nid}.html 按线路分组
  const groups = {};
  const pre = new RegExp("/play/" + id + "-(\\d+)-(\\d+)\\.html", "g");
  let em;
  while ((em = pre.exec(html))) {
    const sid = em[1];
    const nid = Number(em[2]);
    if (!groups[sid]) groups[sid] = {};
    groups[sid][nid] = true;
  }
  const sids = Object.keys(groups);
  if (!sids.length) throw new Error("未找到播放线路");

  // 逐线路探测第一集，优先 url 直连（m3u8）的线路
  let picked = null;
  for (let i = 0; i < sids.length; i++) {
    const sid = sids[i];
    const info = await probePlay(id, sid, 1);
    if (info && info.direct) {
      picked = { sid: sid, name: info.name };
      break;
    }
    if (info && !picked) picked = { sid: sid, name: info.name };
  }
  if (!picked) throw new Error("线路探测失败");

  const epNums = Object.keys(groups[picked.sid])
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    });
  const isMovie = epNums.length === 1;
  const episodeItems = epNums.map(function (n) {
    return {
      id: "play:" + id + "-" + picked.sid + "-" + n,
      type: "url",
      title: isMovie ? "正片" : "第" + n + "集",
      link: "play:" + id + "-" + picked.sid + "-" + n,
    };
  });

  // 精彩推荐
  const recIdx = html.indexOf("精彩推荐</h2>");
  const relatedItems = recIdx > 0 ? parseCards(html.slice(recIdx)) : [];

  const item = {
    id: String(id),
    type: "url",
    title: title,
    link: link,
    posterPath: poster,
    description: description,
    episodeItems: episodeItems,
    relatedItems: relatedItems,
    durationText: (infos["连载"] || "") + (picked.name ? " · " + picked.name : ""),
  };
  if (infos["更新"]) item.releaseDate = infos["更新"];
  return item;
}

// 读取播放页 player_aaaa，判断线路类型
async function probePlay(id, sid, nid) {
  try {
    const html = await httpGet(BASE + "/play/" + id + "-" + sid + "-" + nid + ".html");
    const m = html.match(/var player_aaaa=(\{[\s\S]*?\})<\/script>/);
    if (!m) return null;
    const pj = JSON.parse(m[1]);
    const direct = /^https?:\/\//.test(pj.url || "");
    return { name: pj.from || "", from: pj.from, url: pj.url, direct: direct };
  } catch (e) {
    return null;
  }
}

// 单集播放：直连 m3u8 直接给系统播放器；解析型线路退化为解析页地址
async function resolvePlay(playKey) {
  const html = await httpGet(BASE + "/play/" + playKey + ".html");
  const m = html.match(/var player_aaaa=(\{[\s\S]*?\})<\/script>/);
  if (!m) return null;
  const pj = JSON.parse(m[1]);
  const url = pj.url || "";
  let videoUrl;
  if (/^https?:\/\//.test(url)) {
    videoUrl = url; // 自营线路：url 即 m3u8
  } else if (PARSE_MAP[pj.from]) {
    videoUrl = PARSE_MAP[pj.from] + url; // 解析型线路（至臻4k / 蓝光2k 等）
  } else {
    return null;
  }
  return {
    id: "play:" + playKey,
    type: "url",
    title: (pj.vod_data && pj.vod_data.vod_name) || "播放",
    link: "play:" + playKey,
    videoUrl: videoUrl,
    playerType: "system",
  };
}
