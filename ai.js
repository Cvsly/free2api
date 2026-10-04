WidgetMetadata = {
  id: "forward.maihaolian",
  title: "枫叶影院",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description:
    "枫叶4K影院（maihaolian.com）：热播榜、腾讯/优酷/B站SVIP热映、红果短剧，以及电视剧、电影、动漫、综艺、短剧频道",
  author: "Forward",
  site: "https://maihaolian.com",
  detailCacheDuration: 300,

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
      {
        name: "page",
        title: "页码",
        type: "page",
        value: "1",
      },
    ],
  },
};

const BASE = "https://maihaolian.com";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/*
 * MacCMS 播放线路
 *
 * ps = 0
 *   url 通常就是最终播放地址
 *
 * ps = 1
 *   url 是需要交给解析器处理的地址
 */
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
      Accept:
        "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
    .replace(/&#x27;/gi, "'")
    .replace(/&#58;/gi, ":")
    .replace(/&#x2F;/gi, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/*
 * 去 HTML 标签
 */
function stripTags(s) {
  return decodeHtml(
    String(s || "").replace(/<[^>]+>/g, "")
  ).trim();
}

/*
 * 安全转换数字
 */
function safeNumber(value) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : undefined;
}

/*
 * 创建 VideoItem
 *
 * Skill 要求：
 * type=url
 * link=自己的 detail key
 */
function makeItem(id, title, poster, remark) {
  const cleanId = String(id || "").trim();

  const item = {
    id: cleanId,
    type: "url",
    mediaType: "tv",
    title: decodeHtml(title || ""),
    link: "detail:" + cleanId,
  };

  if (poster) {
    item.posterPath =
      decodeHtml(poster);
  }

  if (remark) {
    item.durationText =
      stripTags(remark);
  }

  return item;
}

/*
 * 解析站点通用卡片
 */
function parseCards(html) {
  const items = [];
  const seen = {};

  const source =
    String(html || "");

  const re =
    /<a[^>]*class="public-list-exp"[^>]*href="\/detail\/(\d+)\.html"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;

  let m;

  while ((m = re.exec(source))) {
    const id = m[1];

    if (!id || seen[id]) {
      continue;
    }

    seen[id] = true;

    const body = m[3];

    const pm =
      body.match(
        /data-src="([^"]+)"/
      ) ||
      body.match(
        /data-original="([^"]+)"/
      ) ||
      body.match(
        /src="(https?:[^"]+)"/
      );

    const rm =
      body.match(
        /class="ft2">([\s\S]*?)<\/i>/
      );

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
function sliceHomeSection(
  html,
  section
) {
  const source =
    String(html || "");

  const start =
    source.indexOf(
      ">" +
        section +
        "</h2>"
    );

  if (start < 0) {
    return "";
  }

  const rest =
    source.slice(start);

  const next =
    rest.indexOf(
      '<div class="box-width'
    );

  return next > 0
    ? rest.slice(0, next)
    : rest;
}

/*
 * 热播榜
 */
async function loadBanner(
  params = {}
) {
  try {
    const html =
      await httpGet(
        BASE + "/"
      );

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
        (
          body.indexOf(
            "slide-time-bj"
          ) < 0 &&
          body.indexOf(
            "slide-time-img"
          ) < 0
        )
      ) {
        continue;
      }

      const tm =
        body.match(
          /slide-info-types"><span>([^<]+)<\/span>/
        );

      if (!tm) {
        continue;
      }

      seen[id] = true;

      const bg =
        body.match(
          /background-image:\s*url\(([^)]+)\)/
        );

      const score =
        body.match(
          /ds-shoucang fa"><\/i>([\d.]+)/
        );

      const infos = [];

      const ire =
        /<span>([^<]{1,20})<\/span>/g;

      let im;

      while (
        (im = ire.exec(body))
      ) {
        if (
          im[1] !== tm[1] &&
          infos.length < 3
        ) {
          infos.push(
            im[1]
          );
        }
      }

      const item =
        makeItem(
          id,
          tm[1],
          "",
          infos.join(" · ")
        );

      if (bg) {
        item.backdropPath =
          decodeHtml(
            bg[1]
          );
      }

      if (score) {
        item.rating =
          Number(score[1]);
      }

      items.push(item);
    }

    if (!items.length) {
      throw new Error(
        "热播榜为空"
      );
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
 * 平台专区
 */
const PLATFORM_URLS = {
  qq: "/label/qq.html",
  youku: "/label/youku.html",
  bli: "/label/bli.html",
  duanju: "/label/duanju-1.html",
};

async function loadPlatform(
  params = {}
) {
  try {
    const path =
      PLATFORM_URLS[
        params.platform || "qq"
      ];

    if (!path) {
      throw new Error(
        "未知平台: " +
          params.platform
      );
    }

    const html =
      await httpGet(
        BASE + path
      );

    const items =
      parseCards(html);

    if (!items.length) {
      throw new Error(
        "榜单为空"
      );
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
async function loadHomeSection(
  params = {}
) {
  try {
    const section =
      params.section ||
      "电视剧";

    const html =
      await httpGet(
        BASE + "/"
      );

    const slice =
      sliceHomeSection(
        html,
        section
      );

    const items =
      parseCards(slice);

    if (!items.length) {
      throw new Error(
        "版块为空: " +
          section
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

/* =========================================================
 * 搜索
 * ========================================================= */

/*
 * 网站原生搜索接口
 *
 * https://maihaolian.com/index.php/ajax/suggest
 *
 * 参数：
 *
 * mid=1
 * wd=关键词
 * limit=500
 *
 * 不再使用其他搜索网站。
 */
const SEARCH_URL =
  BASE +
  "/index.php/ajax/suggest";

/*
 * 尝试 JSON 解析
 */
function parseJsonSafely(data) {
  if (
    data === null ||
    data === undefined
  ) {
    return null;
  }

  if (
    typeof data === "object"
  ) {
    return data;
  }

  const text =
    String(data).trim();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

/*
 * 获取搜索数组
 *
 * 兼容：
 *
 * {
 *   list: []
 * }
 *
 * {
 *   data: []
 * }
 *
 * {
 *   result: []
 * }
 *
 * {
 *   data: {
 *      list: []
 *   }
 * }
 */
function extractSearchList(
  json
) {
  if (!json) {
    return [];
  }

  if (
    Array.isArray(json)
  ) {
    return json;
  }

  const candidates = [
    json.list,
    json.data,
    json.result,

    json.data &&
      json.data.list,

    json.data &&
      json.data.result,

    json.data &&
      json.data.data,

    json.result &&
      json.result.list,

    json.result &&
      json.result.data,
  ];

  for (
    let i = 0;
    i < candidates.length;
    i++
  ) {
    if (
      Array.isArray(
        candidates[i]
      )
    ) {
      return candidates[i];
    }
  }

  return [];
}

/*
 * 获取字段
 */
function firstValue(
  obj,
  keys
) {
  if (!obj) {
    return "";
  }

  for (
    let i = 0;
    i < keys.length;
    i++
  ) {
    const key =
      keys[i];

    if (
      obj[key] !== undefined &&
      obj[key] !== null &&
      String(
        obj[key]
      ).trim() !== ""
    ) {
      return obj[key];
    }
  }

  return "";
}

/*
 * 搜索结果 ID
 */
function getSearchId(
  item
) {
  return firstValue(
    item,
    [
      "id",
      "vod_id",
      "vodId",
      "ID",
      "Id",
    ]
  );
}

/*
 * 搜索结果标题
 */
function getSearchTitle(
  item
) {
  return firstValue(
    item,
    [
      "name",
      "vod_name",
      "vodName",
      "title",
      "vod_title",
    ]
  );
}

/*
 * 搜索结果封面
 */
function getSearchPoster(
  item
) {
  return firstValue(
    item,
    [
      "pic",
      "vod_pic",
      "vodPic",
      "poster",
      "cover",
      "image",
      "vod_image",
    ]
  );
}

/*
 * 搜索结果副标题
 */
function getSearchRemark(
  item
) {
  return firstValue(
    item,
    [
      "note",
      "vod_remarks",
      "vodRemarks",
      "remarks",
      "remark",
      "subtitle",
      "vod_sub",
    ]
  );
}

/*
 * 搜索结果类型
 */
function getSearchType(
  item
) {
  return firstValue(
    item,
    [
      "type_name",
      "typeName",
      "vod_class",
      "class",
      "vod_type",
      "type",
    ]
  );
}

/*
 * 将一个原生搜索对象
 * 转换成 Forward VideoItem
 */
function makeSearchItem(
  raw
) {
  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return null;
  }

  const id =
    String(
      getSearchId(raw) || ""
    ).trim();

  const title =
    stripTags(
      getSearchTitle(raw)
    );

  if (!id || !title) {
    return null;
  }

  const poster =
    String(
      getSearchPoster(raw) ||
        ""
    ).trim();

  const remark =
    stripTags(
      getSearchRemark(raw)
    );

  const typeName =
    stripTags(
      getSearchType(raw)
    );

  const item =
    makeItem(
      id,
      title,
      poster,
      remark
    );

  /*
   * 搜索结果补充信息
   */
  if (typeName) {
    item.description =
      typeName;
  }

  /*
   * 年份
   */
  const year =
    firstValue(
      raw,
      [
        "year",
        "vod_year",
        "vodYear",
      ]
    );

  if (year) {
    item.releaseDate =
      String(year);
  }

  /*
   * 评分
   */
  const rating =
    firstValue(
      raw,
      [
        "score",
        "vod_score",
        "vodScore",
        "rating",
      ]
    );

  const numericRating =
    safeNumber(rating);

  if (
    numericRating !== undefined
  ) {
    item.rating =
      numericRating;
  }

  return item;
}

/*
 * 搜索接口可能直接返回 HTML。
 *
 * 这里提供 HTML 兼容解析，
 * 但不会主动请求第二个搜索地址。
 */
function parseSearchHtml(
  html
) {
  const source =
    String(html || "");

  if (!source) {
    return [];
  }

  /*
   * 优先使用正常站点卡片结构。
   */
  const cards =
    parseCards(source);

  if (cards.length) {
    return cards;
  }

  /*
   * 兼容搜索接口返回简化 HTML。
   */
  const items = [];
  const seen = {};

  const re =
    /<a[^>]*href=["']\/detail\/(\d+)\.html["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = re.exec(source))
  ) {
    const id =
      String(match[1]);

    if (seen[id]) {
      continue;
    }

    const block =
      match[2];

    const titleMatch =
      block.match(
        /title=["']([^"']+)["']/i
      );

    const imgMatch =
      block.match(
        /(?:data-src|data-original|src)=["']([^"']+)["']/i
      );

    const title =
      titleMatch
        ? titleMatch[1]
        : stripTags(block);

    if (!title) {
      continue;
    }

    seen[id] = true;

    items.push(
      makeItem(
        id,
        title,
        imgMatch
          ? imgMatch[1]
          : "",
        ""
      )
    );
  }

  return items;
}

/*
 * 网站原生聚合搜索
 *
 * 这里的“聚合”不是额外拼接第三方网站，
 * 而是直接使用 maihaolian 自己的 suggest
 * 接口，由网站本身返回搜索结果。
 *
 * limit=500：
 * 尽量一次获取完整搜索结果。
 *
 * page：
 * Forward 有分页参数时，
 * 在已经取得的结果上做本地分页。
 */
async function search(
  params = {}
) {
  const keyword =
    String(
      params.keyword ||
        params.wd ||
        params.query ||
        ""
    ).trim();

  if (!keyword) {
    return [];
  }

  const page =
    Math.max(
      parseInt(
        params.page,
        10
      ) || 1,
      1
    );

  try {
    /*
     * 直接调用网站自己的接口。
     *
     * 不使用：
     *
     * /search/
     * /vod/search
     * 第三方聚合 API
     *
     * 只使用：
     *
     * /index.php/ajax/suggest
     */
    const data =
      await httpGet(
        SEARCH_URL,
        {
          mid: 1,
          wd: keyword,
          limit: 500,
        }
      );

    /*
     * JSON
     */
    const json =
      parseJsonSafely(data);

    if (json) {
      const list =
        extractSearchList(
          json
        );

      if (list.length) {
        const items = [];
        const seen = {};

        for (
          let i = 0;
          i < list.length;
          i++
        ) {
          const item =
            makeSearchItem(
              list[i]
            );

          if (!item) {
            continue;
          }

          /*
           * ID 去重。
           *
           * 防止网站接口同时返回
           * 多个相同影片对象。
           */
          const key =
            String(
              item.id ||
                item.link
            );

          if (seen[key]) {
            continue;
          }

          seen[key] = true;

          items.push(item);
        }

        /*
         * 本地分页。
         *
         * 每页 20 个。
         *
         * 注意：
         * 这不是伪造网站分页，
         * 而是在接口已经返回的结果中分页。
         */
        const pageSize = 20;

        const start =
          (page - 1) *
          pageSize;

        return items.slice(
          start,
          start + pageSize
        );
      }
    }

    /*
     * 如果接口返回的是 HTML，
     * 使用 HTML 解析兜底。
     */
    const htmlItems =
      parseSearchHtml(data);

    if (htmlItems.length) {
      const pageSize = 20;

      const start =
        (page - 1) *
        pageSize;

      return htmlItems.slice(
        start,
        start + pageSize
      );
    }

    return [];
  } catch (error) {
    console.error(
      "[search] 网站原生搜索失败:",
      error &&
      error.message
        ? error.message
        : error
    );

    /*
     * 搜索失败直接返回空数组。
     *
     * 不切换到其他第三方搜索源，
     * 保证搜索始终基于网站自身接口。
     */
    return [];
  }
}

/* =========================================================
 * 播放相关核心代码
 * ========================================================= */

/*
 * 从 HTML 中安全提取：
 *
 * var player_aaaa = {...}
 *
 * 不再使用：
 *
 * (\{[\s\S]*?\})
 *
 * 因为 player_aaaa 可能包含嵌套对象 vod_data。
 */
function extractPlayerObject(
  html
) {
  if (!html) {
    return null;
  }

  const marker =
    "var player_aaaa";

  const start =
    html.indexOf(
      marker
    );

  if (start < 0) {
    return null;
  }

  const braceStart =
    html.indexOf(
      "{",
      start
    );

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
    const ch =
      html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (
        ch === "\\"
      ) {
        escaped = true;
        continue;
      }

      if (
        ch === '"'
      ) {
        inString = false;
      }

      continue;
    }

    if (
      ch === '"'
    ) {
      inString = true;
      continue;
    }

    if (
      ch === "{"
    ) {
      depth++;
      continue;
    }

    if (
      ch === "}"
    ) {
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

/*
 * 标准化播放地址
 */
function normalizePlayerUrl(
  url
) {
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

/*
 * 判断 ps
 *
 * ps=1 → 必须解析
 * ps=0 → 直接播放
 */
function isParseLine(
  pj
) {
  const ps =
    String(
      pj &&
      pj.ps != null
        ? pj.ps
        : ""
    ).trim();

  return ps === "1";
}

/*
 * 构造最终播放地址
 */
function buildVideoUrl(
  pj
) {
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

  /*
   * ps=1：
   * 交给对应解析器。
   */
  if (
    isParseLine(pj)
  ) {
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

  /*
   * ps=0：
   * url 本身就是最终播放地址。
   */
  if (
    /^https?:\/\//i.test(
      rawUrl
    )
  ) {
    return rawUrl;
  }

  /*
   * 某些站点 ps 缺失：
   * 如果线路存在对应解析器，
   * 尝试交给解析器。
   */
  if (
    PARSE_MAP[from]
  ) {
    return (
      PARSE_MAP[from] +
      encodeURIComponent(
        rawUrl
      )
    );
  }

  return null;
}

/*
 * 获取播放页 player_aaaa
 */
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
    await httpGet(
      playUrl
    );

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

/*
 * 探测线路
 */
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
      buildVideoUrl(
        pj
      );

    return {
      name:
        pj.from ||
        pj.player ||
        pj.show ||
        "",

      from:
        pj.from || "",

      ps:
        pj.ps,

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
    /*
     * loadDetail 接收字符串。
     */
    if (
      key.indexOf(
        "play:"
      ) === 0
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

  /*
   * 标题
   */
  const tm =
    html.match(
      /slide-info-title[^"]*"[^>]*>([^<]+)</
    );

  const title =
    tm
      ? decodeHtml(tm[1])
      : id;

  /*
   * 信息
   */
  const infos = {};

  const ire =
    /<strong class="r6">([^<]+)<\/strong>([^<]*)</g;

  let im;

  while (
    (im = ire.exec(html))
  ) {
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

  /*
   * 海报
   */
  const pm =
    html.match(
      /data-src="([^"]+)"[^>]*alt="[^"]*"[^>]*onerror/
    ) ||
    html.match(
      /data-original="([^"]+)"/
    );

  const poster =
    pm
      ? decodeHtml(pm[1])
      : "";

  /*
   * 简介
   */
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

  /*
   * 播放线路
   *
   * /play/{id}-{sid}-{nid}.html
   */
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

    groups[sid][nid] =
      true;
  }

  const sids =
    Object.keys(
      groups
    );

  if (!sids.length) {
    throw new Error(
      "未找到播放线路"
    );
  }

  /*
   * 选择可用线路
   */
  let picked =
    null;

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
          function (a, b) {
            return a - b;
          }
        );

    if (
      !epNums.length
    ) {
      continue;
    }

    /*
     * 不再固定 nid=1。
     */
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
      /*
       * 直链优先。
       */
      if (info.direct) {
        picked = {
          sid: sid,
          name: info.name,
          info: info,
        };

        break;
      }

      /*
       * 暂存解析线路。
       */
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

  /*
   * 当前选中线路的所有集数
   */
  const epNums =
    Object.keys(
      groups[picked.sid]
    )
      .map(Number)
      .sort(
        function (a, b) {
          return a - b;
        }
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

  /*
   * 推荐
   */
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

  /*
   * 标准 VideoItem
   */
  const item = {
    id: String(id),

    type: "url",

    mediaType: "tv",

    title: title,

    link: link,

    posterPath: poster,

    description:
      description,

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

  if (
    infos["更新"]
  ) {
    item.releaseDate =
      infos["更新"];
  }

  /*
   * 电影直接提供第一集播放地址。
   */
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
    /*
     * playKey：
     *
     * 123-1-1
     */
    const parts =
      String(playKey).split(
        "-"
      );

    if (
      parts.length < 3
    ) {
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
      buildVideoUrl(
        pj
      );

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