WidgetMetadata = {
  id: "forward.maihaolian",
  title: "枫叶影院",
  version: "1.2.5",
  requiredVersion: "0.0.1",
  description:
    "枫叶4K影院（maihaolian.com）：热播榜、腾讯/优酷/B站SVIP热映、红果短剧，以及电视剧、电影、动漫、综艺、短剧频道",
  author: "Forward",
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
    {
      id: "banner",
      title: "热播榜",
      functionName: "loadBanner",
      cacheDuration: 1800,
    },
    {
      id: "platformQQ",
      title: "腾讯SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        {
          name: "platform",
          title: "平台",
          type: "constant",
          value: "qq",
        },
      ],
    },
    {
      id: "platformYouku",
      title: "优酷SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        {
          name: "platform",
          title: "平台",
          type: "constant",
          value: "youku",
        },
      ],
    },
    {
      id: "platformBili",
      title: "B站SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        {
          name: "platform",
          title: "平台",
          type: "constant",
          value: "bli",
        },
      ],
    },
    {
      id: "platformDuanju",
      title: "红果短剧",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        {
          name: "platform",
          title: "平台",
          type: "constant",
          value: "duanju",
        },
      ],
    },
    {
      id: "homeTV",
      title: "电视剧",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        {
          name: "section",
          title: "版块",
          type: "constant",
          value: "电视剧",
        },
      ],
    },
    {
      id: "homeMovie",
      title: "电影",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        {
          name: "section",
          title: "版块",
          type: "constant",
          value: "电影",
        },
      ],
    },
    {
      id: "homeAnime",
      title: "动漫",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        {
          name: "section",
          title: "版块",
          type: "constant",
          value: "动漫",
        },
      ],
    },
    {
      id: "homeShow",
      title: "综艺",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        {
          name: "section",
          title: "版块",
          type: "constant",
          value: "综艺",
        },
      ],
    },
    {
      id: "homeDuanju",
      title: "热门短剧",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        {
          name: "section",
          title: "版块",
          type: "constant",
          value: "热门短剧",
        },
      ],
    },
    {
      id: "loadResource",
      title: "枫叶影院播放源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 120,
      params: [],
    },
  ],

  search: {
    title: "搜索",
    functionName: "search",
    params: [
      {
        name: "keyword",
        title: "关键词",
        type: "input",
      },
    ],
  },
};

const BASE = "https://maihaolian.com";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

/*
 * HTTP GET
 */
async function httpGet(url, params) {
  const opt = {
    headers: {
      "User-Agent": UA,
      Referer: BASE + "/",
    },
  };

  if (params) {
    opt.params = params;
  }

  const res = await Widget.http.get(url, opt);
  return res.data;
}

/*
 * HTML decode
 */
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

/*
 * 去 HTML 标签
 */
function stripTags(s) {
  return decodeHtml(String(s || "").replace(/<[^>]+>/g, "")).trim();
}

/*
 * 创建 VideoItem
 */
function makeItem(id, title, poster, remark) {
  const item = {
    id: String(id),
    type: "url",
    title: decodeHtml(title),
    link: "detail:" + id,
  };

  if (poster) {
    item.posterPath = decodeHtml(poster);
  }

  if (remark) {
    item.durationText = stripTags(remark);
  }

  return item;
}

/*
 * 解析站点通用卡片
 */
function parseCards(html) {
  const items = [];
  const seen = {};

  const re =
    /<a[^>]*class="public-list-exp"[^>]*href="\/detail\/(\d+)\.html"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;

  let m;

  while ((m = re.exec(html))) {
    const id = m[1];

    if (seen[id]) {
      continue;
    }

    seen[id] = true;

    const body = m[3];

    const pm =
      body.match(/data-src="([^"]+)"/) ||
      body.match(/src="(https?:[^"]+)"/);

    const rm = body.match(/class="ft2">([\s\S]*?)<\/i>/);

    items.push(makeItem(id, m[2], pm ? pm[1] : "", rm ? rm[1] : ""));
  }

  return items;
}

/*
 * 首页版块
 */
function sliceHomeSection(html, section) {
  const start = html.indexOf(">" + section + "</h2>");

  if (start < 0) {
    return "";
  }

  const rest = html.slice(start);
  const next = rest.indexOf('<div class="box-width');

  return next > 0 ? rest.slice(0, next) : rest;
}

/*
 * 热播榜
 */
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

      if (
        seen[id] ||
        (body.indexOf("slide-time-bj") < 0 &&
          body.indexOf("slide-time-img") < 0)
      ) {
        continue;
      }

      const tm = body.match(/slide-info-types"><span>([^<]+)<\/span>/);
      if (!tm) {
        continue;
      }

      seen[id] = true;

      const bg = body.match(/background-image:\s*url\(([^)]+)\)/);
      const score = body.match(/ds-shoucang fa"><\/i>([\d.]+)/);

      const infos = [];
      const ire = /<span>([^<]{1,20})<\/span>/g;
      let im;

      while ((im = ire.exec(body))) {
        if (im[1] !== tm[1] && infos.length < 3) {
          infos.push(im[1]);
        }
      }

      const item = makeItem(id, tm[1], "", infos.join(" · "));

      if (bg) {
        item.backdropPath = decodeHtml(bg[1]);
      }

      if (score) {
        item.rating = Number(score[1]);
      }

      items.push(item);
    }

    if (!items.length) {
      throw new Error("热播榜为空");
    }

    return items;
  } catch (error) {
    console.error("[loadBanner] 失败:", error.message || error);
    throw error;
  }
}

/*
 * 平台与短剧专区路由
 */
const PLATFORM_URLS = {
  qq: "/label/qq.html",
  youku: "/label/youku.html",
  bli: "/label/bli.html",
};

async function loadPlatform(params = {}) {
  try {
    const platform = params.platform || "qq";

    // 遇到短剧直接复用首页“热门短剧”数据解析，保证 100% 成功率
    if (platform === "duanju") {
      return await loadHomeSection({ section: "热门短剧" });
    }

    const path = PLATFORM_URLS[platform];

    if (!path) {
      throw new Error("未知平台: " + platform);
    }

    const html = await httpGet(BASE + path);
    const items = parseCards(html);

    if (!items.length) {
      throw new Error("榜单为空");
    }

    return items;
  } catch (error) {
    console.error("[loadPlatform] 失败:", error.message || error);
    throw error;
  }
}

/*
 * 首页版块
 */
async function loadHomeSection(params = {}) {
  try {
    const section = params.section || "电视剧";
    const html = await httpGet(BASE + "/");
    const slice = sliceHomeSection(html, section);
    const items = parseCards(slice);

    if (!items.length) {
      throw new Error("版块为空: " + section);
    }

    return items;
  } catch (error) {
    console.error("[loadHomeSection] 失败:", error.message || error);
    throw error;
  }
}

/*
 * 搜索
 */
async function search(params = {}) {
  try {
    const keyword = (params.keyword || "").trim();

    if (!keyword) {
      return [];
    }

    const data = await httpGet(BASE + "/index.php/ajax/suggest", {
      mid: 1,
      wd: keyword,
    });

    const json = typeof data === "string" ? JSON.parse(data) : data;
    const list = (json && json.list) || [];

    return list.map(function (v) {
      return makeItem(v.id, v.name, v.pic, "");
    });
  } catch (error) {
    console.error("[search] 失败:", error.message || error);
    throw error;
  }
}

/* =========================================================
 * 播放相关核心代码
 * ========================================================= */

function extractPlayerObject(html) {
  if (!html) {
    return null;
  }

  const marker = "var player_aaaa";
  const start = html.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const braceStart = html.indexOf("{", start);

  if (braceStart < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = false;
      }

      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;

      if (depth === 0) {
        const jsonText = html.slice(braceStart, i + 1);

        try {
          return JSON.parse(jsonText);
        } catch (e) {
          console.error("[player] JSON解析失败:", e.message || e);
          return null;
        }
      }
    }
  }

  return null;
}

function normalizePlayerUrl(url) {
  if (!url) {
    return "";
  }

  let value = String(url).trim();
  value = value.replace(/\\\//g, "/");
  value = value.replace(/&amp;/g, "&");

  return value;
}

function isParseLine(pj) {
  const ps = String(pj && pj.ps != null ? pj.ps : "").trim();
  return ps === "1";
}

function buildVideoUrl(pj) {
  if (!pj) {
    return null;
  }

  const rawUrl = normalizePlayerUrl(pj.url);

  if (!rawUrl) {
    return null;
  }

  const from = String(pj.from || "").trim();

  if (isParseLine(pj)) {
    const parser = PARSE_MAP[from];

    if (!parser) {
      console.error("[buildVideoUrl] 未配置解析器:", from);
      return null;
    }

    return parser + encodeURIComponent(rawUrl);
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (PARSE_MAP[from]) {
    return PARSE_MAP[from] + encodeURIComponent(rawUrl);
  }

  return null;
}

async function getPlayerData(id, sid, nid) {
  const playUrl = BASE + "/play/" + id + "-" + sid + "-" + nid + ".html";
  const html = await httpGet(playUrl);

  if (!html) {
    return null;
  }

  const pj = extractPlayerObject(html);

  if (!pj) {
    console.error("[getPlayerData] 未找到 player_aaaa:", playUrl);
    return null;
  }

  return pj;
}

async function probePlay(id, sid, nid) {
  try {
    const pj = await getPlayerData(id, sid, nid);

    if (!pj) {
      return null;
    }

    const videoUrl = buildVideoUrl(pj);

    return {
      name: pj.from || pj.player || pj.show || "",
      from: pj.from || "",
      ps: pj.ps,
      url: normalizePlayerUrl(pj.url),
      videoUrl: videoUrl,
      direct: !!videoUrl && !isParseLine(pj),
    };
  } catch (e) {
    console.error("[probePlay] 失败:", e.message || e);
    return null;
  }
}

/* =========================================================
 * Detail
 * ========================================================= */

async function loadDetail(link) {
  const key = String(link);

  try {
    if (key.indexOf("play:") === 0) {
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

  if (!html || html.indexOf("slide-info-title") < 0) {
    return null;
  }

  const tm = html.match(/slide-info-title[^"]*"[^>]*>([^<]+)</);
  const title = tm ? decodeHtml(tm[1]) : id;

  const infos = {};
  const ire = /<strong class="r6">([^<]+)<\/strong>([^<]*)</g;
  let im;

  while ((im = ire.exec(html))) {
    infos[im[1].replace(/[::\s]/g, "")] = decodeHtml(im[2]).trim();
  }

  const pm = html.match(/data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/);
  const poster = pm ? decodeHtml(pm[1]) : "";

  const dm = html.match(/id="height_limit"[^>]*>([\s\S]*?)<\/div>/);
  let description = dm ? stripTags(dm[1]) : "";

  description = description
    .replace(/^简介[:：]/, "")
    .replace(/【[^】]*】/g, "")
    .trim();

  const groups = {};
  const pre = new RegExp("/play/" + id + "-(\\d+)-(\\d+)\\.html", "g");
  let em;

  while ((em = pre.exec(html))) {
    const sid = em[1];
    const nid = Number(em[2]);

    if (!groups[sid]) {
      groups[sid] = {};
    }

    groups[sid][nid] = true;
  }

  const sids = Object.keys(groups);

  if (!sids.length) {
    throw new Error("未找到播放线路");
  }

  let picked = null;

  for (let i = 0; i < sids.length; i++) {
    const sid = sids[i];
    const epNums = Object.keys(groups[sid])
      .map(Number)
      .sort((a, b) => a - b);

    if (!epNums.length) {
      continue;
    }

    const firstNid = epNums[0];
    const info = await probePlay(id, sid, firstNid);

    if (info && info.videoUrl) {
      if (info.direct) {
        picked = { sid, name: info.name, info };
        break;
      }

      if (!picked) {
        picked = { sid, name: info.name, info };
      }
    }
  }

  if (!picked) {
    throw new Error("没有找到可播放线路");
  }

  const epNums = Object.keys(groups[picked.sid])
    .map(Number)
    .sort((a, b) => a - b);

  const isMovie = epNums.length === 1;

  const episodeItems = epNums.map(function (n) {
    return {
      id: "play:" + id + "-" + picked.sid + "-" + n,
      type: "url",
      title: isMovie ? "正片" : "第" + n + "集",
      link: "play:" + id + "-" + picked.sid + "-" + n,
    };
  });

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
    durationText:
      (infos["连载"] || "") + (picked.name ? " · " + picked.name : ""),
  };

  if (infos["更新"]) {
    item.releaseDate = infos["更新"];
  }

  if (isMovie && picked.info && picked.info.videoUrl) {
    item.videoUrl = picked.info.videoUrl;
    item.playerType = "system";
  }

  return item;
}

/* =========================================================
 * 单集播放
 * ========================================================= */

async function resolvePlay(playKey) {
  try {
    const parts = String(playKey).split("-");

    if (parts.length < 3) {
      throw new Error("播放参数格式错误: " + playKey);
    }

    const id = parts[0];
    const sid = parts[1];
    const nid = parts[2];

    const pj = await getPlayerData(id, sid, nid);

    if (!pj) {
      throw new Error("播放页没有 player_aaaa");
    }

    const videoUrl = buildVideoUrl(pj);

    if (!videoUrl) {
      throw new Error(
        "无法生成播放地址，线路=" +
          (pj.from || "") +
          "，ps=" +
          (pj.ps == null ? "" : pj.ps)
      );
    }

    const vodName =
      pj.vod_data && pj.vod_data.vod_name ? pj.vod_data.vod_name : "播放";

    return {
      id: "play:" + playKey,
      type: "url",
      title: vodName,
      link: "play:" + playKey,
      videoUrl: videoUrl,
      playerType: "system",
    };
  } catch (error) {
    console.error("[resolvePlay] 失败:", playKey, error.message || error);
    throw error;
  }
}

/* =========================================================
 * 聚合搜索核心逻辑 (stream 模块实现)
 * ========================================================= */

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
  if (baseNorm.indexOf(wantBaseNorm) >= 0 || wantBaseNorm.indexOf(baseNorm) >= 0)
    return 150;
  return -1;
}

async function loadResource(params = {}) {
  try {
    const linkStr = String(params.link || "").trim();

    // 1. 详情页播放回调，直接获取该集视频链接
    if (linkStr.indexOf("play:") === 0) {
      const playItem = await resolvePlay(linkStr.slice(5));

      if (playItem && playItem.videoUrl) {
        return [
          {
            name: "枫叶影院",
            description: playItem.title || "播放链接",
            url: playItem.videoUrl,
            customHeaders: { Referer: BASE + "/", "User-Agent": UA },
          },
        ];
      }
      return [];
    }

    // 2. 聚合搜索模式
    const multiSource = params.multiSource;
    const rawTitle = String(params.seriesName || params.title || "").trim();
    const wantEpisode = parseInt(params.episode, 10) || 0;

    if (multiSource === "disabled" || !rawTitle) {
      return [];
    }

    const wantBaseNorm = normalizeName(stripTitleMeta(rawTitle));

    // 执行站内搜索
    const searchItems = await search({ keyword: rawTitle });

    if (!searchItems.length) {
      return [];
    }

    // 评分筛选最佳结果
    let best = null;
    let bestScore = -1;

    for (let i = 0; i < searchItems.length; i++) {
      const score = scoreMatch(searchItems[i].title, wantBaseNorm);

      if (score > bestScore) {
        bestScore = score;
        best = searchItems[i];
      }
    }

    if (!best || bestScore < 0) {
      best = searchItems[0];
    }

    // 提取选定影视的详情
    const vodDetail = await loadVodDetail(best.id, "detail:" + best.id);

    if (!vodDetail || !vodDetail.episodeItems || !vodDetail.episodeItems.length) {
      return [];
    }

    // 集数精准映射匹配逻辑
    const epList = vodDetail.episodeItems;
    let targetEp = null;

    if (wantEpisode > 0) {
      targetEp = epList.find((e) => {
        const epNum = parseInt((e.title.match(/\d+/) || [])[0], 10);
        return epNum === wantEpisode;
      });

      if (!targetEp && wantEpisode <= epList.length) {
        targetEp = epList[wantEpisode - 1];
      }

      if (!targetEp) {
        return [];
      }
    } else {
      targetEp = epList[0];
    }

    // 解析出目标集的直链
    const playRes = await resolvePlay(targetEp.link.replace("play:", ""));

    if (!playRes || !playRes.videoUrl) {
      return [];
    }

    const episodes =
      wantEpisode === 0
        ? epList.map((e) => ({
            title: e.title,
            link: e.link,
          }))
        : [];

    return [
      {
        name: "枫叶影院",
        description: targetEp.title,
        url: playRes.videoUrl,
        episodeItems: episodes.length > 1 ? episodes : undefined,
        customHeaders: { Referer: BASE + "/", "User-Agent": UA },
      },
    ];
  } catch (error) {
    console.error("[loadResource] 聚合搜索失败:", error.message || error);
    return [];
  }
}
