WidgetMetadata = {
  id: "fengy.movie",
  title: "枫叶影院",
  version: "1.2.5",
  requiredVersion: "0.0.1",
  description:
    "枫叶4K影院（maihaolian.com）：热播榜、腾讯/优酷/B站SVIP热映、红果短剧，以及电视剧、电影、动漫、综艺、短剧频道",
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

    items.push(
      makeItem(
        id,
        m[2],
        pm ? pm[1] : "",
        rm ? rm[1] : ""
      )
    );
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

    const re =
      /<a href="\/detail\/(\d+)\.html">([\s\S]*?)<\/a>/g;

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

      const tm = body.match(
        /slide-info-types"><span>([^<]+)<\/span>/
      );

      if (!tm) {
        continue;
      }

      seen[id] = true;

      const bg = body.match(
        /background-image:\s*url\(([^)]+)\)/
      );

      const score = body.match(
        /ds-shoucang fa"><\/i>([\d.]+)/
      );

      const infos = [];
      const ire = /<span>([^<]{1,20})<\/span>/g;

      let im;

      while ((im = ire.exec(body))) {
        if (
          im[1] !== tm[1] &&
          infos.length < 3
        ) {
          infos.push(im[1]);
        }
      }

      const item = makeItem(
        id,
        tm[1],
        "",
        infos.join(" · ")
      );

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
    console.error(
      "[loadBanner] 失败:",
      error.message || error
    );

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
    const platform =
      params.platform || "qq";

    if (platform === "duanju") {
      return await loadHomeSection({
        section: "热门短剧",
      });
    }

    const path =
      PLATFORM_URLS[platform];

    if (!path) {
      throw new Error(
        "未知平台: " + platform
      );
    }

    const html =
      await httpGet(BASE + path);

    const items =
      parseCards(html);

    if (!items.length) {
      throw new Error("榜单为空");
    }

    return items;
  } catch (error) {
    console.error(
      "[loadPlatform] 失败:",
      error.message || error
    );

    throw error;
  }
}

/*
 * 首页版块
 */
async function loadHomeSection(params = {}) {
  try {
    const section =
      params.section || "电视剧";

    const html =
      await httpGet(BASE + "/");

    const slice =
      sliceHomeSection(
        html,
        section
      );

    const items =
      parseCards(slice);

    if (!items.length) {
      throw new Error(
        "版块为空: " + section
      );
    }

    return items;
  } catch (error) {
    console.error(
      "[loadHomeSection] 失败:",
      error.message || error
    );

    throw error;
  }
}

/*
 * 搜索
 */
async function search(params = {}) {
  try {
    const keyword =
      (params.keyword || "").trim();

    if (!keyword) {
      return [];
    }

    const data =
      await httpGet(
        BASE + "/index.php/ajax/suggest",
        {
          mid: 1,
          wd: keyword,
        }
      );

    const json =
      typeof data === "string"
        ? JSON.parse(data)
        : data;

    const list =
      (json && json.list) || [];

    return list.map(function (v) {
      return makeItem(
        v.id,
        v.name,
        v.pic,
        ""
      );
    });
  } catch (error) {
    console.error(
      "[search] 失败:",
      error.message || error
    );

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

  const marker =
    "var player_aaaa";

  const start =
    html.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const braceStart =
    html.indexOf("{", start);

  if (braceStart < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let i = braceStart;
    i < html.length;
    i++
  ) {
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
        const jsonText =
          html.slice(
            braceStart,
            i + 1
          );

        try {
          return JSON.parse(
            jsonText
          );
        } catch (e) {
          console.error(
            "[player] JSON解析失败:",
            e.message || e
          );

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

  let value =
    String(url).trim();

  value =
    value.replace(
      /\\\//g,
      "/"
    );

  value =
    value.replace(
      /&amp;/g,
      "&"
    );

  return value;
}

function isParseLine(pj) {
  const ps =
    String(
      pj && pj.ps != null
        ? pj.ps
        : ""
    ).trim();

  return ps === "1";
}

function buildVideoUrl(pj) {
  if (!pj) {
    return null;
  }

  const rawUrl =
    normalizePlayerUrl(
      pj.url
    );

  if (!rawUrl) {
    return null;
  }

  const from =
    String(
      pj.from || ""
    ).trim();

  if (isParseLine(pj)) {
    const parser =
      PARSE_MAP[from];

    if (!parser) {
      console.error(
        "[buildVideoUrl] 未配置解析器:",
        from
      );

      return null;
    }

    return (
      parser +
      encodeURIComponent(
        rawUrl
      )
    );
  }

  if (
    /^https?:\/\//i.test(
      rawUrl
    )
  ) {
    return rawUrl;
  }

  if (PARSE_MAP[from]) {
    return (
      PARSE_MAP[from] +
      encodeURIComponent(
        rawUrl
      )
    );
  }

  return null;
}

async function getPlayerData(
  id,
  sid,
  nid
) {
  const playUrl =
    BASE +
    "/play/" +
    id +
    "-" +
    sid +
    "-" +
    nid +
    ".html";

  const html =
    await httpGet(playUrl);

  if (!html) {
    return null;
  }

  const pj =
    extractPlayerObject(
      html
    );

  if (!pj) {
    console.error(
      "[getPlayerData] 未找到 player_aaaa:",
      playUrl
    );

    return null;
  }

  return pj;
}

async function probePlay(
  id,
  sid,
  nid
) {
  try {
    const pj =
      await getPlayerData(
        id,
        sid,
        nid
      );

    if (!pj) {
      return null;
    }

    const videoUrl =
      buildVideoUrl(pj);

    return {
      name:
        pj.from ||
        pj.player ||
        pj.show ||
        "",

      from:
        pj.from || "",

      ps: pj.ps,

      url:
        normalizePlayerUrl(
          pj.url
        ),

      videoUrl:
        videoUrl,

      direct:
        !!videoUrl &&
        !isParseLine(pj),
    };
  } catch (e) {
    console.error(
      "[probePlay] 失败:",
      e.message || e
    );

    return null;
  }
}

/* =========================================================
 * Detail
 * ========================================================= */

async function loadDetail(
  link
) {
  const key =
    String(link);

  try {
    if (
      key.indexOf("play:") === 0
    ) {
      return await resolvePlay(
        key.slice(5)
      );
    }

    const id =
      key.replace(
        "detail:",
        ""
      );

    return await loadVodDetail(
      id,
      key
    );
  } catch (error) {
    console.error(
      "[loadDetail] 失败:",
      link,
      error.message || error
    );

    throw error;
  }
}

async function loadVodDetail(
  id,
  link
) {
  const html =
    await httpGet(
      BASE +
        "/detail/" +
        id +
        ".html"
    );

  if (
    !html ||
    html.indexOf(
      "slide-info-title"
    ) < 0
  ) {
    return null;
  }

  const tm =
    html.match(
      /slide-info-title[^"]*"[^>]*>([^<]+)/
    );

  const title =
    tm
      ? decodeHtml(tm[1])
      : id;

  const infos = {};

  const ire =
    /<strong class="r6">([^<]+)<\/strong>([^<]*)</g;

  let im;

  while ((im = ire.exec(html))) {
    infos[
      im[1].replace(
        /[::\s]/g,
        ""
      )
    ] =
      decodeHtml(
        im[2]
      ).trim();
  }

  const pm =
    html.match(
      /data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/
    );

  const poster =
    pm
      ? decodeHtml(pm[1])
      : "";

  const dm =
    html.match(
      /id="height_limit"[^>]*>([\s\S]*?)<\/div>/
    );

  let description =
    dm
      ? stripTags(dm[1])
      : "";

  description =
    description
      .replace(
        /^简介[:：]/,
        ""
      )
      .replace(
        /【[^】]*】/g,
        ""
      )
      .trim();

  const groups = {};

  const pre =
    new RegExp(
      "/play/" +
        id +
        "-(\\d+)-(\\d+)\\.html",
      "g"
    );

  let em;

  while (
    (em = pre.exec(html))
  ) {
    const sid =
      em[1];

    const nid =
      Number(em[2]);

    if (!groups[sid]) {
      groups[sid] = {};
    }

    groups[sid][nid] = true;
  }

  const sids =
    Object.keys(groups);

  if (!sids.length) {
    throw new Error(
      "未找到播放线路"
    );
  }

  let picked = null;

  for (
    let i = 0;
    i < sids.length;
    i++
  ) {
    const sid =
      sids[i];

    const epNums =
      Object.keys(
        groups[sid]
      )
        .map(Number)
        .sort(
          (a, b) => a - b
        );

    if (!epNums.length) {
      continue;
    }

    const firstNid =
      epNums[0];

    const info =
      await probePlay(
        id,
        sid,
        firstNid
      );

    if (
      info &&
      info.videoUrl
    ) {
      if (info.direct) {
        picked = {
          sid: sid,
          name: info.name,
          info: info,
        };

        break;
      }

      if (!picked) {
        picked = {
          sid: sid,
          name: info.name,
          info: info,
        };
      }
    }
  }

  if (!picked) {
    throw new Error(
      "没有找到可播放线路"
    );
  }

  const epNums =
    Object.keys(
      groups[picked.sid]
    )
      .map(Number)
      .sort(
        (a, b) => a - b
      );

  const isMovie =
    epNums.length === 1;

  const episodeItems =
    epNums.map(
      function (n) {
        return {
          id:
            "play:" +
            id +
            "-" +
            picked.sid +
            "-" +
            n,

          type: "url",

          title:
            isMovie
              ? "正片"
              : "第" +
                n +
                "集",

          link:
            "play:" +
            id +
            "-" +
            picked.sid +
            "-" +
            n,
        };
      }
    );

  const recIdx =
    html.indexOf(
      "精彩推荐</h2>"
    );

  const relatedItems =
    recIdx > 0
      ? parseCards(
          html.slice(recIdx)
        )
      : [];

  const item = {
    id: String(id),
    type: "url",
    title: title,
    link: link,
    posterPath: poster,
    description: description,
    episodeItems:
      episodeItems,
    relatedItems:
      relatedItems,

    durationText:
      (infos["连载"] || "") +
      (
        picked.name
          ? " · " +
            picked.name
          : ""
      ),
  };

  if (infos["更新"]) {
    item.releaseDate =
      infos["更新"];
  }

  if (
    isMovie &&
    picked.info &&
    picked.info.videoUrl
  ) {
    item.videoUrl =
      picked.info.videoUrl;

    item.playerType =
      "system";
  }

  return item;
}

/* =========================================================
 * 单集播放
 * ========================================================= */

async function resolvePlay(
  playKey
) {
  try {
    const parts =
      String(playKey).split(
        "-"
      );

    if (parts.length < 3) {
      throw new Error(
        "播放参数格式错误: " +
          playKey
      );
    }

    const id =
      parts[0];

    const sid =
      parts[1];

    const nid =
      parts[2];

    const pj =
      await getPlayerData(
        id,
        sid,
        nid
      );

    if (!pj) {
      throw new Error(
        "播放页没有 player_aaaa"
      );
    }

    const videoUrl =
      buildVideoUrl(pj);

    if (!videoUrl) {
      throw new Error(
        "无法生成播放地址，线路=" +
          (pj.from || "") +
          "，ps=" +
          (pj.ps == null
            ? ""
            : pj.ps)
      );
    }

    const vodName =
      pj.vod_data &&
      pj.vod_data.vod_name
        ? pj.vod_data.vod_name
        : "播放";

    return {
      id:
        "play:" +
        playKey,

      type: "url",

      title:
        vodName,

      link:
        "play:" +
        playKey,

      videoUrl:
        videoUrl,

      playerType:
        "system",
    };
  } catch (error) {
    console.error(
      "[resolvePlay] 失败:",
      playKey,
      error.message || error
    );

    throw error;
  }
}


/* =========================================================
 * Forward 聚合搜索优化
 *
 * 枫叶影院作为 Forward 的一个独立资源站
 *
 * Forward
 *   ↓
 * loadResource()
 *   ↓
 * 枫叶影院站内搜索
 *   ↓
 * 智能标题匹配
 *   ↓
 * 获取详情
 *   ↓
 * 匹配集数
 *   ↓
 * 原有播放线路解析
 *   ↓
 * 返回一个播放资源
 * ========================================================= */


/*
 * 去掉标题中的资源信息
 *
 * 示例：
 *
 * 庆余年 2024
 * 庆余年 S02
 * 庆余年 第二季
 * 庆余年 第2季
 * 庆余年（2024）
 * 庆余年 4K 高清
 *
 * 最终尽可能得到：
 *
 * 庆余年
 */
function stripTitleMeta(text) {
  let value =
    String(text || "")
      .trim();

  if (!value) {
    return "";
  }

  /*
   * 去括号信息
   */
  value =
    value.replace(
      /[\(（][^\)）]*[\)）]/g,
      " "
    );

  /*
   * 去年份
   */
  value =
    value.replace(
      /(?:19|20)\d{2}/g,
      " "
    );

  /*
   * 去季数
   */
  value =
    value.replace(
      /第[0-9一二三四五六七八九十百]+[季部]/g,
      " "
    );

  value =
    value.replace(
      /\bS\d{1,2}\b/gi,
      " "
    );

  value =
    value.replace(
      /\bSeason\s*\d+\b/gi,
      " "
    );

  /*
   * 去常见资源标签
   */
  value =
    value.replace(
      /\b(?:4K|8K|2K|1080P|720P|2160P|HD|FHD|UHD|HDR|WEB-DL|WEBRip|BluRay|BDRip)\b/gi,
      " "
    );

  value =
    value.replace(
      /(?:高清|超清|蓝光|全集|完整版|抢先版|中字|国语|粤语|英语|日语|韩语)/g,
      " "
    );

  /*
   * 清理分隔符
   */
  value =
    value.replace(
      /[._\-]+/g,
      " "
    );

  /*
   * 合并空格
   */
  value =
    value.replace(
      /\s+/g,
      " "
    )
    .trim();

  return value;
}


/*
 * 标准化标题
 */
function normalizeName(text) {
  return stripTitleMeta(text)
    .toLowerCase()
    .replace(
      /[\s\u3000]+/g,
      ""
    )
    .replace(
      /[：:·・,，.。!！?？、\-—_'’"“”()（）\[\]【】「」『』]/g,
      ""
    );
}


/*
 * 提取年份
 */
function extractYear(text) {
  const match =
    String(text || "").match(
      /(?:19|20)\d{2}/
    );

  if (!match) {
    return 0;
  }

  return parseInt(
    match[0],
    10
  );
}


/*
 * 中文数字转阿拉伯数字
 *
 * 第一 -> 1
 * 第十 -> 10
 * 第二十 -> 20
 */
function chineseNumberToInt(text) {
  const value =
    String(text || "").trim();

  if (!value) {
    return 0;
  }

  if (/^\d+$/.test(value)) {
    return parseInt(
      value,
      10
    );
  }

  const map = {
    "零": 0,
    "一": 1,
    "二": 2,
    "两": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
  };

  if (value === "十") {
    return 10;
  }

  const tenIndex =
    value.indexOf("十");

  if (tenIndex === 0) {
    const right =
      value.substring(1);

    return (
      10 +
      (
        map[right] !== undefined
          ? map[right]
          : 0
      )
    );
  }

  if (tenIndex > 0) {
    const left =
      value.substring(
        0,
        tenIndex
      );

    const right =
      value.substring(
        tenIndex + 1
      );

    return (
      (map[left] || 0) * 10 +
      (
        right
          ? (map[right] || 0)
          : 0
      )
    );
  }

  return map[value] || 0;
}


/*
 * 提取季数
 */
function extractSeason(text) {
  const value =
    String(text || "");

  /*
   * S01
   */
  let match =
    value.match(
      /\bS(\d{1,2})\b/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  /*
   * Season 2
   */
  match =
    value.match(
      /\bSeason\s*(\d{1,2})\b/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  /*
   * 第2季 / 第二季
   */
  match =
    value.match(
      /第([0-9一二三四五六七八九十百]+)季/
    );

  if (match) {
    return chineseNumberToInt(
      match[1]
    );
  }

  return 0;
}


/*
 * 标题匹配评分
 *
 * 分数越高越优先。
 */
function scoreMatch(
  targetTitle,
  candidateTitle
) {
  const targetRaw =
    String(
      targetTitle || ""
    ).trim();

  const candidateRaw =
    String(
      candidateTitle || ""
    ).trim();

  if (
    !targetRaw ||
    !candidateRaw
  ) {
    return -99999;
  }

  const target =
    normalizeName(
      targetRaw
    );

  const candidate =
    normalizeName(
      candidateRaw
    );

  if (
    !target ||
    !candidate
  ) {
    return -99999;
  }

  let score = 0;

  /*
   * 1. 完全一致
   */
  if (target === candidate) {
    score += 1000;
  }

  /*
   * 2. 标题包含
   */
  if (
    candidate.indexOf(
      target
    ) >= 0
  ) {
    score += 500;
  }

  if (
    target.indexOf(
      candidate
    ) >= 0
  ) {
    score += 300;
  }

  /*
   * 3. 长度越接近越好
   */
  const lengthDiff =
    Math.abs(
      target.length -
        candidate.length
    );

  score -=
    lengthDiff * 5;

  /*
   * 4. 原始标题包含
   */
  if (
    candidateRaw.indexOf(
      targetRaw
    ) >= 0
  ) {
    score += 120;
  }

  /*
   * 5. 年份
   */
  const targetYear =
    extractYear(
      targetRaw
    );

  const candidateYear =
    extractYear(
      candidateRaw
    );

  if (
    targetYear &&
    candidateYear
  ) {
    if (
      targetYear ===
      candidateYear
    ) {
      score += 180;
    } else {
      score -= 120;
    }
  }

  /*
   * 6. 季数
   */
  const targetSeason =
    extractSeason(
      targetRaw
    );

  const candidateSeason =
    extractSeason(
      candidateRaw
    );

  if (
    targetSeason &&
    candidateSeason
  ) {
    if (
      targetSeason ===
      candidateSeason
    ) {
      score += 220;
    } else {
      score -= 180;
    }
  }

  /*
   * 7. 如果用户明确指定季数，
   *    候选没有季数，不直接扣分。
   *
   * 这样：
   *
   * 用户：
   *   庆余年第二季
   *
   * 网站：
   *   庆余年
   *
   * 仍然可以被选中。
   */
  return score;
}


/*
 * 搜索结果去重
 */
function dedupeAggregateResults(
  list
) {
  const result = [];
  const seen = {};

  if (!Array.isArray(list)) {
    return result;
  }

  for (
    let i = 0;
    i < list.length;
    i++
  ) {
    const item =
      list[i];

    if (!item) {
      continue;
    }

    const id =
      String(
        item.id ||
          item.vod_id ||
          ""
      );

    const title =
      String(
        item.title ||
          item.name ||
          item.vod_name ||
          ""
      );

    const key =
      id ||
      normalizeName(
        title
      );

    if (!key) {
      continue;
    }

    if (seen[key]) {
      continue;
    }

    seen[key] = true;

    result.push(item);
  }

  return result;
}


/*
 * 从搜索结果选择最佳影视
 */
function pickBestAggregateResult(
  targetTitle,
  list
) {
  list =
    dedupeAggregateResults(
      list
    );

  if (!list.length) {
    return null;
  }

  let best =
    null;

  let bestScore =
    -999999;

  for (
    let i = 0;
    i < list.length;
    i++
  ) {
    const item =
      list[i];

    const candidateTitle =
      item.title ||
      item.name ||
      item.vod_name ||
      "";

    const score =
      scoreMatch(
        targetTitle,
        candidateTitle
      );

    if (
      score >
      bestScore
    ) {
      bestScore =
        score;

      best =
        item;
    }
  }

  if (!best) {
    return null;
  }

  /*
   * 对很短的搜索词提高门槛。
   *
   * 例如：
   * “庆余”
   * 不应该随便匹配一个完全无关的标题。
   */
  const normalizedTarget =
    normalizeName(
      targetTitle
    );

  if (
    normalizedTarget.length <= 2 &&
    bestScore < 300
  ) {
    return null;
  }

  /*
   * 普通标题至少需要有一定匹配度。
   */
  if (
    normalizedTarget.length > 2 &&
    bestScore < 100
  ) {
    return null;
  }

  return best;
}


/*
 * 提取集数
 */
function extractEpisodeNumber(
  text
) {
  const value =
    String(text || "");

  /*
   * 第12集
   */
  let match =
    value.match(
      /第\s*(\d+)\s*集/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  /*
   * EP12 / EP 12
   */
  match =
    value.match(
      /\bEP\s*[-_. ]?\s*(\d+)\b/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  /*
   * E12
   */
  match =
    value.match(
      /\bE\s*[-_. ]?\s*(\d+)\b/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  /*
   * Episode 12
   */
  match =
    value.match(
      /\bEpisode\s*(\d+)\b/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  /*
   * 普通“12集”
   */
  match =
    value.match(
      /\b(\d+)\s*集\b/i
    );

  if (match) {
    return parseInt(
      match[1],
      10
    );
  }

  return 0;
}


/*
 * 获取 Forward 聚合请求中的标题
 */
function getAggregateTitle(
  params
) {
  params =
    params || {};

  const title =
    params.seriesName ||
    params.title ||
    params.name ||
    params.vodName ||
    "";

  return String(
    title
  ).trim();
}


/*
 * 获取 Forward 聚合请求中的集数
 */
function getAggregateEpisode(
  params
) {
  params =
    params || {};

  const value =
    params.episode ||
    params.episodeNumber ||
    params.ep ||
    params.e ||
    "";

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  /*
   * 兼容：
   *
   * 12
   * 第12集
   * EP12
   */
  const match =
    String(value).match(
      /\d+/
    );

  if (!match) {
    return 0;
  }

  const number =
    parseInt(
      match[0],
      10
    );

  return isNaN(number)
    ? 0
    : number;
}


/*
 * 判断聚合源是否开启
 *
 * 只有明确 disabled 才关闭。
 */
function isAggregateEnabled(
  params
) {
  params =
    params || {};

  const value =
    String(
      params.multiSource ||
        ""
    ).toLowerCase();

  return value !==
    "disabled";
}


/*
 * 获取枫叶影院站内搜索结果
 *
 * 这里不调用 Forward 的 search()，
 * 而是直接调用站点接口，
 * 避免不同 Forward 版本参数结构差异。
 */
async function aggregateSearch(
  keyword
) {
  keyword =
    String(
      keyword || ""
    ).trim();

  if (!keyword) {
    return [];
  }

  try {
    const data =
      await httpGet(
        BASE +
          "/index.php/ajax/suggest",
        {
          mid: 1,
          wd: keyword,
        }
      );

    const json =
      typeof data === "string"
        ? JSON.parse(data)
        : data;

    const list =
      json &&
      Array.isArray(
        json.list
      )
        ? json.list
        : [];

    /*
     * 统一成 makeItem 格式，
     * 这样后面标题匹配逻辑结构统一。
     */
    const result = [];

    for (
      let i = 0;
      i < list.length;
      i++
    ) {
      const item =
        list[i];

      if (!item) {
        continue;
      }

      if (
        !item.id &&
        !item.vod_id
      ) {
        continue;
      }

      const id =
        item.id ||
        item.vod_id;

      const title =
        item.name ||
        item.vod_name ||
        "";

      if (!title) {
        continue;
      }

      result.push({
        id: String(id),
        title: decodeHtml(
          title
        ),
        posterPath:
          item.pic ||
          item.vod_pic ||
          "",
        link:
          "detail:" +
          id,
      });
    }

    return dedupeAggregateResults(
      result
    );
  } catch (error) {
    console.error(
      "[aggregateSearch] 失败:",
      error.message || error
    );

    return [];
  }
}


/*
 * 根据 episodeItems 找目标集
 *
 * 不使用 Array.find，
 * 兼容旧 JSCore。
 */
function findAggregateEpisode(
  episodeItems,
  wantedEpisode
) {
  if (
    !Array.isArray(
      episodeItems
    ) ||
    !episodeItems.length
  ) {
    return null;
  }

  /*
   * 未指定集数：
   * 默认第一集。
   */
  if (
    !wantedEpisode ||
    wantedEpisode <= 0
  ) {
    return episodeItems[0];
  }

  /*
   * 第一优先级：
   * 根据“第N集”标题精确匹配。
   */
  for (
    let i = 0;
    i < episodeItems.length;
    i++
  ) {
    const item =
      episodeItems[i];

    if (!item) {
      continue;
    }

    const ep =
      extractEpisodeNumber(
        item.title
      );

    if (
      ep ===
      wantedEpisode
    ) {
      return item;
    }
  }

  /*
   * 第二优先级：
   * 播放列表位置匹配。
   *
   * 第1集 -> episodeItems[0]
   * 第2集 -> episodeItems[1]
   */
  if (
    wantedEpisode >= 1 &&
    wantedEpisode <=
      episodeItems.length
  ) {
    return episodeItems[
      wantedEpisode - 1
    ];
  }

  return null;
}


/*
 * 聚合搜索主流程
 */
async function aggregateResolve(
  params
) {
  params =
    params || {};

  const rawTitle =
    getAggregateTitle(
      params
    );

  if (!rawTitle) {
    return null;
  }

  const wantEpisode =
    getAggregateEpisode(
      params
    );

  console.log(
    "[aggregate] 请求:",
    rawTitle,
    wantEpisode
      ? "第" +
        wantEpisode +
        "集"
      : "默认第一集"
  );


  /*
   * -------------------------------------------------------
   * 1. 枫叶影院站内搜索
   * -------------------------------------------------------
   */
  const searchItems =
    await aggregateSearch(
      rawTitle
    );

  if (!searchItems.length) {
    console.log(
      "[aggregate] 搜索无结果:",
      rawTitle
    );

    return null;
  }


  /*
   * -------------------------------------------------------
   * 2. 智能选择最佳影视
   * -------------------------------------------------------
   */
  const best =
    pickBestAggregateResult(
      rawTitle,
      searchItems
    );

  if (!best) {
    console.log(
      "[aggregate] 没有匹配结果:",
      rawTitle
    );

    return null;
  }

  const vodId =
    String(
      best.id ||
        ""
    );

  const vodName =
    best.title ||
    rawTitle;

  if (!vodId) {
    return null;
  }

  console.log(
    "[aggregate] 匹配:",
    vodName,
    "ID:",
    vodId
  );


  /*
   * -------------------------------------------------------
   * 3. 获取详情
   *
   * 继续复用原来的 loadVodDetail，
   * 不重新实现播放线路。
   * -------------------------------------------------------
   */
  let vodDetail = null;

  try {
    vodDetail =
      await loadVodDetail(
        vodId,
        "detail:" +
          vodId
      );
  } catch (error) {
    console.error(
      "[aggregate] 获取详情失败:",
      error.message || error
    );

    return null;
  }

  if (!vodDetail) {
    return null;
  }


  /*
   * -------------------------------------------------------
   * 4. 获取播放列表
   * -------------------------------------------------------
   */
  const episodeItems =
    Array.isArray(
      vodDetail.episodeItems
    )
      ? vodDetail.episodeItems
      : [];

  if (!episodeItems.length) {
    console.log(
      "[aggregate] 没有播放集:",
      vodName
    );

    return null;
  }


  /*
   * -------------------------------------------------------
   * 5. 匹配指定集数
   * -------------------------------------------------------
   */
  const targetEpisode =
    findAggregateEpisode(
      episodeItems,
      wantEpisode
    );

  if (!targetEpisode) {
    console.log(
      "[aggregate] 找不到目标集:",
      wantEpisode
    );

    return null;
  }


  /*
   * -------------------------------------------------------
   * 6. 获取真实播放地址
   *
   * 继续使用现有 resolvePlay。
   * -------------------------------------------------------
   */
  const playLink =
    String(
      targetEpisode.link ||
        targetEpisode.id ||
        ""
    );

  if (
    playLink.indexOf(
      "play:"
    ) !== 0
  ) {
    console.error(
      "[aggregate] 无效播放链接:",
      playLink
    );

    return null;
  }

  let playResult = null;

  try {
    playResult =
      await resolvePlay(
        playLink.substring(5)
      );
  } catch (error) {
    console.error(
      "[aggregate] 播放解析失败:",
      error.message || error
    );

    return null;
  }

  if (
    !playResult ||
    !playResult.videoUrl
  ) {
    console.log(
      "[aggregate] 没有得到播放地址:",
      vodName
    );

    return null;
  }


  /*
   * -------------------------------------------------------
   * 7. 返回 Forward 聚合资源
   * -------------------------------------------------------
   */
  const resource = {
    name: "枫叶影院",

    description:
      vodName +
      (
        targetEpisode.title
          ? " · " +
            targetEpisode.title
          : ""
      ),

    url:
      playResult.videoUrl,

    customHeaders: {
      Referer:
        BASE + "/",

      "User-Agent":
        UA,
    },
  };


  /*
   * 如果没有指定集数，
   * 保留完整集数列表。
   *
   * 这样 Forward 后续如果需要，
   * 仍然可以继续使用该资源的集数信息。
   */
  if (
    !wantEpisode &&
    episodeItems.length > 1
  ) {
    resource.episodeItems =
      episodeItems.map(
        function (item) {
          return {
            title:
              item.title,

            link:
              item.link,
          };
        }
      );
  }

  return resource;
}


/* =========================================================
 * Forward Stream 聚合入口
 * ========================================================= */

async function loadResource(
  params = {}
) {
  try {
    params =
      params || {};


    /*
     * -------------------------------------------------------
     * 1. 处理 Forward 传入的 play:
     *
     * 这种情况不是搜索，
     * 直接解析指定播放集。
     * -------------------------------------------------------
     */
    const linkStr =
      String(
        params.link ||
          params.url ||
          ""
      ).trim();

    if (
      linkStr.indexOf(
        "play:"
      ) === 0
    ) {
      const playKey =
        linkStr.substring(5);

      if (!playKey) {
        return [];
      }

      const playItem =
        await resolvePlay(
          playKey
        );

      if (
        !playItem ||
        !playItem.videoUrl
      ) {
        return [];
      }

      return [
        {
          name: "枫叶影院",

          description:
            playItem.title ||
            "播放链接",

          url:
            playItem.videoUrl,

          customHeaders: {
            Referer:
              BASE + "/",

            "User-Agent":
              UA,
          },
        },
      ];
    }


    /*
     * -------------------------------------------------------
     * 2. 判断是否开启 Forward 聚合源
     *
     * 只有明确 disabled 才关闭。
     *
     * 这样即使部分 Forward 版本没有把
     * globalParams 正确传入，也不会导致
     * 枫叶影院聚合源完全失效。
     * -------------------------------------------------------
     */
    if (
      !isAggregateEnabled(
        params
      )
    ) {
      return [];
    }


    /*
     * -------------------------------------------------------
     * 3. 执行聚合搜索
     * -------------------------------------------------------
     */
    const resource =
      await aggregateResolve(
        params
      );

    if (!resource) {
      return [];
    }


    /*
     * -------------------------------------------------------
     * 4. 返回一个 Forward 资源站
     *
     * 注意：
     *
     * 这里返回的是“枫叶影院”这个独立源，
     * 不负责聚合其他电影网站。
     * -------------------------------------------------------
     */
    return [
      resource
    ];

  } catch (error) {
    /*
     * 聚合源发生任何异常，
     * 都不能影响 Forward 其他资源站。
     */
    console.error(
      "[loadResource] 枫叶影院聚合源失败:",
      error.message || error
    );

    return [];
  }
}