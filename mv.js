const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
const ERROR_POSTER = "https://via.placeholder.com/500x750?text=暂无封面";

// 模块元数据（完全对齐参考模块结构）
var WidgetMetadata = {
  id: "tmdb_globalseries",
  title: "TMDB 全球影视",
  description: "基于 TMDB 的全球电视剧/电影/动漫/综艺榜单，参考 Globalseries 实现",
  author: "Cvsly 参考版",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 300,
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：32位v3短Key 或 v4长Token，全局仅需填写一次"
    }
  ],
  modules: [
    {
      title: "热门剧集",
      description: "TMDB 全球热门电视剧榜单",
      requiresWebView: false,
      functionName: "getTvSeries",
      cacheDuration: 3600,
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popularity.desc" },
            { title: "高分经典", value: "vote_average.desc" },
            { title: "最新上线", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门电影",
      description: "TMDB 全球热门电影榜单",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 3600,
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门排行", value: "popularity.desc" },
            { title: "高分经典", value: "vote_average.desc" },
            { title: "最新上映", value: "release_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    }
  ]
};

// ==============================================
// 参考 Globalseries.js 的核心工具函数
// ==============================================
function getApiKey() {
  return Widget.globalParams?.TMDB_API_KEY?.trim() || "";
}

async function sendTmdbRequest(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("未配置 TMDB API Key");

  const url = `https://api.themoviedb.org/3${path}`;
  const headers = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json"
  };
  const finalParams = { ...params, language: "zh-CN", include_adult: false };

  if (apiKey.length > 50) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    finalParams.api_key = apiKey;
  }

  try {
    const res = await Widget.http.get(url, { params: finalParams, headers });
    if (res.data?.code === 200 || res.data?.code === 0) {
      return res.data.results || res.data;
    } else {
      throw new Error(res.data?.status_message || "接口请求失败");
    }
  } catch (err) {
    console.error("[TMDB 请求失败]", err);
    throw err;
  }
}

// ==============================================
// 模块入口函数（对齐参考模块）
// ==============================================
async function getTvSeries(params = {}) {
  const offset = Number(params.offset) || 0;
  const page = Math.floor(offset / 20) + 1;
  const data = await sendTmdbRequest("/discover/tv", {
    page,
    sort_by: params.sort_by || "popularity.desc",
    without_genres: "16,10764,10767"
  });
  return data.map((item, idx) => formatItem(item, "tv", offset + idx + 1));
}

async function getMovies(params = {}) {
  const offset = Number(params.offset) || 0;
  const page = Math.floor(offset / 20) + 1;
  const data = await sendTmdbRequest("/discover/movie", {
    page,
    sort_by: params.sort_by || "popularity.desc"
  });
  return data.map((item, idx) => formatItem(item, "movie", offset + idx + 1));
}

// ==============================================
// 【核心修复】参考 Globalseries 实现 loadDetail
// ==============================================
async function loadDetail(link) {
  try {
    // 解析链接格式：tmdb://tv/123 或 tmdb://movie/123
    const match = link.match(/tmdb:\/\/(tv|movie)\/(\d+)/);
    if (!match) throw new Error("无效链接格式");
    const [_, mediaType, id] = match;

    // 获取详情数据（参考 Globalseries 的 append_to_response 用法）
    const data = await sendTmdbRequest(`/${mediaType}/${id}`, {
      append_to_response: "credits,videos,external_ids"
    });

    if (!data) throw new Error("获取详情失败");

    // 格式化返回符合 Forward 规范的详情数据
    const isMovie = mediaType === "movie";
    const title = data.title || data.name || "未知标题";
    const releaseDate = data.release_date || data.first_air_date || "";
    const rating = data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : 0;
    const genres = data.genres?.map(g => g.name) || [];
    const cast = data.credits?.cast?.slice(0, 10).map(c => c.name) || [];
    const trailer = data.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");

    // 构建描述文本（参考 Globalseries 的排版）
    const desc = [
      `评分：${rating || "暂无"}（${data.vote_count || 0}人评价）`,
      `地区：${data.origin_country?.join(", ") || "未知"}`,
      `首播：${releaseDate || "未知"}`,
      `时长：${isMovie ? `${data.runtime}分钟` : data.episode_run_time?.[0] ? `${data.episode_run_time[0]}分钟/集` : "未知"}`,
      "",
      data.overview || "暂无简介",
      "",
      cast.length ? `主演：${cast.join(" / ")}` : ""
    ].filter(Boolean).join("\n");

    return {
      id: `tmdb_${id}`,
      type: isMovie ? "movie" : "tv",
      title: title,
      description: desc,
      posterPath: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : ERROR_POSTER,
      backdropPath: data.backdrop_path ? `${BACKDROP_BASE}${data.backdrop_path}` : "",
      mediaType: isMovie ? "movie" : "tv",
      releaseDate: releaseDate,
      rating: rating,
      tags: genres,
      link: link,
      playUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
      // 参考 Globalseries 实现分集列表
      seasons: isMovie ? [] : data.seasons?.map(s => ({
        id: s.id,
        title: s.name,
        episode: `共 ${s.episode_count} 集`,
        releaseDate: s.air_date || ""
      })) || []
    };
  } catch (err) {
    console.error("[详情页加载失败]", err);
    return {
      id: `error_${Date.now()}`,
      type: "text",
      title: "加载失败",
      description: err.message || "请检查 API Key 或网络",
      mediaType: "text",
      posterPath: ERROR_POSTER,
      link: ""
    };
  }
}

// ==============================================
// 格式化列表项（完全对齐 Globalseries 结构）
// ==============================================
function formatItem(item, type, rank) {
  const isMovie = type === "movie";
  const title = item.title || item.name || "未知标题";
  const releaseDate = item.release_date || item.first_air_date || "";
  const rating = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0;

  return {
    id: `tmdb_${item.id}`,
    type: isMovie ? "movie" : "tv",
    title: title,
    description: `#${rank} ${isMovie ? "电影" : "剧集"} · ${releaseDate || "未知日期"} · 评分: ${rating || "暂无"}`,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : ERROR_POSTER,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : "",
    releaseDate: releaseDate,
    rating: rating,
    mediaType: isMovie ? "movie" : "tv",
    popularity: item.popularity || 0,
    voteCount: item.vote_count || 0,
    tags: [isMovie ? "电影" : "剧集"],
    link: `tmdb://${type}/${item.id}`, // 关键：链接格式必须和 loadDetail 匹配
    playUrl: "",
    seasons: []
  };
}