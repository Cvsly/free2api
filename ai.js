WidgetMetadata = {
  id: "forward.maihaolian",
  title: "枫叶影院",
  version: "1.0.2",
  requiredVersion: "0.0.1",
  description: "枫叶4K影院（maihaolian.com）：全平台热映、短剧及各分类频道高码率解析模块",
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
    // ===== 平台专区 =====
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
    // ===== 频道 =====
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
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const PLATFORM_URLS = {
  qq: "/label/qq.html",
  youku: "/label/youku.html",
  bli: "/label/bli.html",
  duanju: "/label/duanju-1.html",
};

// 后备通用解析接口前缀
const DEFAULT_PARSER = "https://zzrs.mfdyvip.com/player/?url=";

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

function sliceHomeSection(html, section) {
  const start = html.indexOf(">" + section + "</h2>");
  if (start < 0) return "";
  const rest = html.slice(start);
  const next = rest.indexOf('<div class="box-width');
  return next > 0 ? rest.slice(0, next) : rest;
}

// ===== 首页·热播榜 =====
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
      if (seen[id] || (body.indexOf("slide-time-bj") < 0 && body.indexOf("slide-time-img") < 0)) continue;
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

// ===== 平台专区 =====
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

// ===== 频道 =====
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

// ===== 搜索 =====
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

// ===== 详情与播放（link 机制）=====
async function loadDetail(link) {
  const key = String(link || "");
  try {
    if (key.startsWith("play:")) {
      return await resolvePlay(key.slice(5));
    }
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

  const infos = {};
  const ire = /<strong class="r6">([^<]+)<\/strong>([^<]*)</g;
  let im;
  while ((im = ire.exec(html))) infos[im[1].replace(/[::\s]/g, "")] = decodeHtml(im[2]).trim();

  const pm = html.match(/data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/);
  const poster = pm ? decodeHtml(pm[1]) : "";

  const dm = html.match(/id="height_limit"[^>]*>([\s\S]*?)<\/div>/);
  let description = dm ? stripTags(dm[1]) : "";
  description = description.replace(/^简介[:：]/, "").replace(/【[^】]*】/g, "").trim();

  // 匹配所有线路下的选集组
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

  const pickedSid = sids[0];
  const epNums = Object.keys(groups[pickedSid])
    .map(Number)
    .sort((a, b) => a - b);
  const isMovie = epNums.length === 1;

  // 构建剧集列表
  const episodeItems = epNums.map((n) => ({
    id: `play:${id}-${pickedSid}-${n}`,
    type: "url",
    title: isMovie ? "正片" : `第${n}集`,
    link: `play:${id}-${pickedSid}-${n}`,
  }));

  const recIdx = html.indexOf("精彩推荐</h2>");
  const relatedItems = recIdx > 0 ? parseCards(html.slice(recIdx)) : [];

  return {
    id: String(id),
    type: "url",
    title: title,
    link: link,
    posterPath: poster,
    description: description,
    episodeItems: episodeItems,
    relatedItems: relatedItems,
    durationText: infos["连载"] || "",
    releaseDate: infos["更新"] || "",
  };
}

// ===== 核心：强化的播放资源解析逻辑 =====
async function resolvePlay(playKey) {
  const targetUrl = BASE + "/play/" + playKey + ".html";
  const html = await httpGet(targetUrl);
  if (!html) return null;

  const $ = Widget.html.load(html);
  let finalVideoUrl = "";

  // 1. 优先抓取页面直接渲染的 iframe 播放源地址
  const iframeSrc = $(".player-box iframe").attr("src") \vert{}\vert{} $("iframe").attr("src") || "";
  if (iframeSrc) {
    finalVideoUrl = iframeSrc.startsWith("//")
      ? "https:" + iframeSrc
      : iframeSrc.startsWith("/")
      ? BASE + iframeSrc
      : iframeSrc;
  }

  // 2. 若无直接 iframe，降级提取 MacCMS 的 player_aaaa JSON 变量
  if (!finalVideoUrl) {
    const m = html.match(/var player_aaaa=(\{[\s\S]*?\})<\/script>/);
    if (m && m[1]) {
      try {
        const pj = JSON.parse(m[1]);
        const rawUrl = pj.url || "";

        if (/^https?:\/\/.*\.m3u8/i.test(rawUrl) || /^https?:\/\/.*\.mp4/i.test(rawUrl)) {
          // 直接可播的 m3u8/mp4 媒体直链
          finalVideoUrl = rawUrl;
        } else if (/^https?:\/\//i.test(rawUrl)) {
          // 普通解析页面链接
          finalVideoUrl = rawUrl;
        } else if (rawUrl) {
          // 相对路径/加密流：拼装网页默认解析前缀
          finalVideoUrl = DEFAULT_PARSER + encodeURIComponent(rawUrl);
        }
      } catch (e) {
        console.error("解析 player_aaaa 失败:", e);
      }
    }
  }

  if (!finalVideoUrl) return null;

  return {
    id: "play:" + playKey,
    type: "url",
    title: "播放中",
    link: "play:" + playKey,
    videoUrl: finalVideoUrl,
    // 将 playerType 设为 app，让 App 的 Webview/内置播放引擎接管 HTML 网页播放解析
    playerType: finalVideoUrl.indexOf(".m3u8") > -1 ? "system" : "app",
  };
}
