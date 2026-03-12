const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
const IMAGE_BASE = "https://i0.hdslb.com/bfs/archive/";
const ERROR_POSTER = "https://via.placeholder.com/500x750?text=暂无封面";

// 模块元数据
var WidgetMetadata = {
  id: "bilibili_pgc_rank",
  title: "Bilibili PGC 榜单",
  description: "B站番剧/国创/纪录片/综艺/电影/电视剧 全品类榜单，支持时间/地区筛选",
  author: "Forward 定制版",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 300,
  globalParams: [
    {
      name: "BILIBILI_COOKIE",
      title: "Bilibili Cookie（可选）",
      type: "input",
      description: "部分榜单需要登录，可在浏览器复制 Cookie 粘贴，无需登录可不填"
    }
  ],
  modules: [
    {
      title: "番剧榜单",
      description: "Bilibili 正版番剧热度/评分/追番排行",
      requiresWebView: false,
      functionName: "getAnimeRank",
      cacheDuration: 1800,
      params: [
        {
          name: "rank_type",
          title: "榜单类型",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popular" },
            { title: "新番连载", value: "new" },
            { title: "高分经典", value: "high_score" }
          ],
          default: "popular"
        },
        {
          name: "region",
          title: "地区",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "日本", value: "jp" },
            { title: "欧美", value: "us" },
            { title: "其他", value: "other" }
          ],
          default: ""
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "国创榜单",
      description: "国产动画/国漫热度/评分/追番排行",
      requiresWebView: false,
      functionName: "getGuochuangRank",
      cacheDuration: 1800,
      params: [
        {
          name: "rank_type",
          title: "榜单类型",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popular" },
            { title: "新作连载", value: "new" },
            { title: "高分经典", value: "high_score" }
          ],
          default: "popular"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "纪录片榜单",
      description: "Bilibili 正版纪录片热度/评分排行",
      requiresWebView: false,
      functionName: "getDocumentaryRank",
      cacheDuration: 3600,
      params: [
        {
          name: "rank_type",
          title: "榜单类型",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popular" },
            { title: "高分经典", value: "high_score" }
          ],
          default: "popular"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "综艺榜单",
      description: "Bilibili 正版综艺热度/评分排行",
      requiresWebView: false,
      functionName: "getVarietyRank",
      cacheDuration: 3600,
      params: [
        {
          name: "rank_type",
          title: "榜单类型",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popular" },
            { title: "高分经典", value: "high_score" }
          ],
          default: "popular"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "电影榜单",
      description: "Bilibili 正版电影热度/评分排行",
      requiresWebView: false,
      functionName: "getMovieRank",
      cacheDuration: 3600,
      params: [
        {
          name: "rank_type",
          title: "榜单类型",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popular" },
            { title: "高分经典", value: "high_score" }
          ],
          default: "popular"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "电视剧榜单",
      description: "Bilibili 正版电视剧热度/评分排行",
      requiresWebView: false,
      functionName: "getTvSeriesRank",
      cacheDuration: 3600,
      params: [
        {
          name: "rank_type",
          title: "榜单类型",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popular" },
            { title: "高分经典", value: "high_score" }
          ],
          default: "popular"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    }
  ]
};

// ==============================================
// 全局工具函数
// ==============================================
function getGlobalCookie() {
  return Widget.globalParams?.BILIBILI_COOKIE?.trim() || "";
}

async function sendBilibiliRequest(url, params = {}) {
  const cookie = getGlobalCookie();
  const headers = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Referer": "https://www.bilibili.com/"
  };
  if (cookie) headers["Cookie"] = cookie;

  try {
    console.log("[B站请求] URL:", url, "参数:", params);
    const res = await Widget.http.get(url, { params, headers });
    if (res.data?.code === 0) {
      return res.data.data || res.data.result || [];
    } else {
      throw new Error(`接口错误: ${res.data?.message || "未知错误"}`);
    }
  } catch (err) {
    console.error("[B站请求失败]", err);
    throw err;
  }
}

// ==============================================
// 模块入口函数
// ==============================================
async function getAnimeRank(params = {}) {
  return await fetchPgcRank("anime", params);
}

async function getGuochuangRank(params = {}) {
  return await fetchPgcRank("guochuang", params);
}

async function getDocumentaryRank(params = {}) {
  return await fetchPgcRank("documentary", params);
}

async function getVarietyRank(params = {}) {
  return await fetchPgcRank("variety", params);
}

async function getMovieRank(params = {}) {
  return await fetchPgcRank("movie", params);
}

async function getTvSeriesRank(params = {}) {
  return await fetchPgcRank("tv", params);
}

// ==============================================
// 核心榜单获取逻辑
// ==============================================
async function fetchPgcRank(type, params = {}) {
  const offset = Number(params.offset) || 0;
  const rankType = params.rank_type || "popular";
  const region = params.region || "";
  const page = Math.floor(offset / 20) + 1;

  try {
    let url = "";
    let queryParams = { page, page_size: 20 };

    switch (type) {
      case "anime":
        url = "https://api.bilibili.com/pgc/season/rank/list";
        queryParams.season_type = 1; // 番剧
        if (region) queryParams.region = region;
        if (rankType === "new") queryParams.rank_type = 3; // 新番
        else if (rankType === "high_score") queryParams.rank_type = 2; // 高分
        else queryParams.rank_type = 0; // 热门
        break;

      case "guochuang":
        url = "https://api.bilibili.com/pgc/season/rank/list";
        queryParams.season_type = 4; // 国创
        if (rankType === "new") queryParams.rank_type = 3;
        else if (rankType === "high_score") queryParams.rank_type = 2;
        else queryParams.rank_type = 0;
        break;

      case "documentary":
        url = "https://api.bilibili.com/pgc/season/rank/list";
        queryParams.season_type = 3; // 纪录片
        queryParams.rank_type = rankType === "high_score" ? 2 : 0;
        break;

      case "variety":
        url = "https://api.bilibili.com/pgc/season/rank/list";
        queryParams.season_type = 7; // 综艺
        queryParams.rank_type = rankType === "high_score" ? 2 : 0;
        break;

      case "movie":
        url = "https://api.bilibili.com/pgc/season/rank/list";
        queryParams.season_type = 2; // 电影
        queryParams.rank_type = rankType === "high_score" ? 2 : 0;
        break;

      case "tv":
        url = "https://api.bilibili.com/pgc/season/rank/list";
        queryParams.season_type = 5; // 电视剧
        queryParams.rank_type = rankType === "high_score" ? 2 : 0;
        break;
    }

    const data = await sendBilibiliRequest(url, queryParams);
    if (!data?.list?.length) {
      return [createErrorItem("暂无数据", "当前筛选条件下暂无内容，请重试")];
    }

    return data.list.map((item, idx) => formatBilibiliItem(item, type, offset + idx + 1));
  } catch (err) {
    console.error(`[${type}榜单请求失败]`, err);
    return [createErrorItem("数据获取失败", err.message || "网络异常，请检查Cookie或网络")];
  }
}

// ==============================================
// 详情页加载函数（Forward 必须实现）
// ==============================================
async function loadDetail(link) {
  try {
    const match = link.match(/bilibili:\/\/pgc\/(\d+)/);
    if (!match) throw new Error("无效链接格式");
    const seasonId = match[1];

    const data = await sendBilibiliRequest(
      "https://api.bilibili.com/pgc/view/web/season",
      { season_id: seasonId }
    );

    if (!data) throw new Error("获取详情失败");

    const { title, cover, rating, stat, new_ep, episodes, staff, publish } = data;
    const desc = [
      `评分：${rating?.score || "暂无"}（${rating?.count || 0}人评价）`,
      `播放：${formatNumber(stat?.view || 0)}`,
      `追番/收藏：${formatNumber(stat?.follow || 0)} / ${formatNumber(stat?.collect || 0)}`,
      `地区：${publish?.area || "未知"}`,
      `最新：${new_ep?.desc || "暂无更新"}`,
      "",
      data.evaluate || "暂无简介",
      "",
      staff?.creator ? `制作团队：${staff.creator.map(c => c.name).join(" / ")}` : ""
    ].filter(Boolean).join("\n");

    return {
      id: `bili_pgc_${seasonId}`,
      type: "tv",
      title: title,
      description: desc,
      posterPath: cover || ERROR_POSTER,
      backdropPath: cover || "",
      mediaType: "tv",
      releaseDate: publish?.pub_date || "",
      rating: rating?.score ? parseFloat(rating.score) : 0,
      tags: data.type_name ? [data.type_name] : [],
      link: `bilibili://pgc/${seasonId}`,
      playUrl: `https://www.bilibili.com/bangumi/play/ss${seasonId}`,
      seasons: episodes?.map(e => ({
        id: e.id,
        title: e.long_title || e.title,
        episode: e.ep_title,
        playUrl: `https://www.bilibili.com/bangumi/play/ep${e.id}`
      })) || []
    };
  } catch (err) {
    console.error("[详情页加载失败]", err);
    return createErrorItem("详情加载失败", err.message || "未知错误");
  }
}

// ==============================================
// 格式化工具函数
// ==============================================
function formatBilibiliItem(item, type, rank) {
  const { title, cover, rating, stat, season_id, new_ep, publish } = item;
  const typeLabel = {
    anime: "番剧",
    guochuang: "国创",
    documentary: "纪录片",
    variety: "综艺",
    movie: "电影",
    tv: "电视剧"
  }[type] || "PGC";

  return {
    id: `bili_pgc_${season_id}`,
    type: "tv",
    title: title,
    description: [
      `#${rank} ${typeLabel}`,
      `评分：${rating?.score || "暂无"}`,
      new_ep?.desc ? `最新：${new_ep.desc}` : publish?.pub_date || ""
    ].filter(Boolean).join(" · "),
    posterPath: cover || ERROR_POSTER,
    backdropPath: cover || "",
    releaseDate: publish?.pub_date || "",
    rating: rating?.score ? parseFloat(rating.score) : 0,
    mediaType: "tv",
    popularity: stat?.view || 0,
    voteCount: rating?.count || 0,
    tags: [typeLabel],
    link: `bilibili://pgc/${season_id}`,
    playUrl: `https://www.bilibili.com/bangumi/play/ss${season_id}`,
    seasons: []
  };
}

function createErrorItem(title, desc) {
  return {
    id: `error_${Date.now()}`,
    type: "text",
    title: title,
    description: desc,
    mediaType: "text",
    posterPath: ERROR_POSTER,
    link: ""
  };
}

function formatNumber(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + "亿";
  if (num >= 10000) return (num / 10000).toFixed(1) + "万";
  return num.toString();
}