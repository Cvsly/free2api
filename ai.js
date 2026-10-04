WidgetMetadata = {
  id: "forward.maihaolian",
  title: "枫叶影院",
  version: "1.3.0",
  requiredVersion: "0.0.1",
  description:
    "枫叶4K影院（maihaolian.com）：支持列表多页加载，包含热播榜、SVIP热映、红果短剧及各大影视频道",
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
        { name: "platform", title: "平台", type: "constant", value: "qq" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "platformYouku",
      title: "优酷SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        { name: "platform", title: "平台", type: "constant", value: "youku" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "platformBili",
      title: "B站SVIP热映",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        { name: "platform", title: "平台", type: "constant", value: "bli" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "platformDuanju",
      title: "红果短剧",
      functionName: "loadPlatform",
      cacheDuration: 3600,
      params: [
        { name: "platform", title: "平台", type: "constant", value: "duanju" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "homeTV",
      title: "电视剧",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        { name: "section", title: "版块", type: "constant", value: "电视剧" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "homeMovie",
      title: "电影",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        { name: "section", title: "版块", type: "constant", value: "电影" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "homeAnime",
      title: "动漫",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        { name: "section", title: "版块", type: "constant", value: "动漫" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "homeShow",
      title: "综艺",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        { name: "section", title: "版块", type: "constant", value: "综艺" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "homeDuanju",
      title: "热门短剧",
      functionName: "loadHomeSection",
      cacheDuration: 1800,
      params: [
        { name: "section", title: "版块", type: "constant", value: "热门短剧" },
        { name: "page", title: "页码", type: "page" },
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
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" },
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

const SECTION_TYPE_MAP = {
  电视剧: 2,
  电影: 1,
  动漫: 4,
  综艺: 3,
  热门短剧: 5,
};

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

  if (poster) {
    item.posterPath = decodeHtml(poster);
  }

  if (remark) {
    item.durationText = stripTags(remark);
  }

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

function sliceHomeSection(html, section) {
  const start = html.indexOf(">" + section + "</h2>");

  if (start < 0) {
    return "";
  }

  const rest = html.slice(start);
  const next = rest.indexOf('<div class="box-width');

  return next > 0 ? rest.slice(0, next) : rest;
}

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

const PLATFORM_URLS = {
  qq: "/label/qq.html",
  youku: "/label/youku.html",
  bli: "/label/bli.html",
};

/*
 * 支持分页的平台专区解析
 */
async function loadPlatform(params = {}) {
  try {
    const platform = params.platform || "qq";
    const page = parseInt(params.page || "1", 10);

    if (platform === "duanju") {
      const path = page > 1 ? `/type/5-${page}.html` : "/type/5.html";
      try {
        const html = await httpGet(BASE + path);
        const items = parseCards(html);
        if (items.length) return items;
      } catch (e) {}

      if (page === 1) {
        return await loadHomeSection({ section: "热门短剧" });
      }
      return [];
    }

    const basePath = PLATFORM_URLS[platform];
    if (!basePath) {
      throw new Error("未知平台: " + platform);
    }

    const path = page > 1 ? basePath.replace(/\.html$/, `-${page}.html`) : basePath;
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
 * 支持分页的首页/分类版块解析
 */
async function loadHomeSection(params = {}) {
  try {
    const section = params.section || "电视剧";
    const page = parseInt(params.page || "1", 10);

    // 第 1 页优先抓取首页快捷版块
    if (page === 1) {
      const html = await httpGet(BASE + "/");
      const slice = sliceHomeSection(html, section);
      const items = parseCards(slice);
      if (items.length) return items;
    }

    // 第 2 页及以后（或首页未找到时），自动按分类 ID 翻页
    const typeId = SECTION_TYPE_MAP[section] || 2;
    const path = `/type/${typeId}-${page}.html`;
    const html = await httpGet(BASE + path);
    const items = parseCards(html);

    if (!items.length) {
      throw new Error("版块为空: " + section);
    }

    return items;
  } catch (error) {
    console.error("[loadHomeSection] 失败:", error.message || error);
    throw error;
  }
}

async function search(params = {}) {
  try {
    const keyword = (params.keyword || "").trim();
    const page = parseInt(params.page || "1", 10);

    if (!keyword) {
      return [];
    }

    const data = await httpGet(BASE + "/index.php/ajax/suggest", {
      mid: 1,
      wd: keyword,
      page: page,
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

function extractPlayerObject(html) {
  if (!html) return null;
  const marker = "var player_aaaa";
  const start = html.indexOf(marker);
  if (start < 0) return null;

  const braceStart = html.indexOf("{", start);
  if (braceStart < 0) return null;

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
          return null;
        }
      }
    }
  }

  return null;
}

function normalizePlayerUrl(url) {
  if (!url) return "";
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
  if (!pj) return null;
  const rawUrl = normalizePlayerUrl(pj.url);
  if (!rawUrl) return null;

  const from = String(pj.from || "").trim();

  if (isParseLine(pj)) {
    const parser = PARSE_MAP[from];
    if (!parser) return null;
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
  if (!html) return null;
  return extractPlayerObject(html);
}

async function probePlay(id, sid, nid) {
  try {
    const pj = await getPlayerData(id, sid, nid);
    if (!pj) return null;

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
    return null;
  }
}

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

    const multiSource = params.multiSource;
    const rawTitle = String(params.seriesName || params.title || "").trim();
    const wantEpisode = parseInt(params.episode, 10) || 0;

    if (multiSource === "disabled" || !rawTitle) {
      return [];
    }

    const wantBaseNorm = normalizeName(stripTitleMeta(rawTitle));

    const searchItems = await search({ keyword: rawTitle });

    if (!searchItems.length) {
      return [];
    }

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

    const vodDetail = await loadVodDetail(best.id, "detail:" + best.id);

    if (!vodDetail || !vodDetail.episodeItems || !vodDetail.episodeItems.length) {
      return [];
    }

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
