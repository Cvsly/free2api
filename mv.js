// 常量定义
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const ERROR_POSTER = "https://via.placeholder.com/500x750?text=暂无海报";

// 模块元数据
var WidgetMetadata = {
  id: "tmdb_movie_shows_global",
  title: "TMDB影视榜单",
  description: "电影/剧集/动漫/综艺全品类榜单，基于TMDB官方API，全局统一配置Key",
  author: "Forward优化版",
  version: "2.4.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 300,
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：TMDB官网申请的32位v3 Key 或 v4长Token，全局仅需填写一次",
      placeholders: [
        { title: "示例v3 Key", value: "1234567890abcdef1234567890abcdef" }
      ]
    }
  ],
  modules: [
    {
      title: "热门电影",
      description: "实时更新院线/流媒体最新电影，多分类可选",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 1800, // 30分钟缓存，保证数据最新
      params: [
        {
          name: "category",
          title: "片单分类",
          type: "enumeration",
          enumOptions: [
            { title: "国内正在热映", value: "now_playing_cn" },
            { title: "全球正在热映", value: "now_playing_global" },
            { title: "即将上映", value: "upcoming" },
            { title: "今日热门", value: "trending_day" },
            { title: "本周趋势", value: "trending_week" },
            { title: "豆瓣高分", value: "top_rated" },
            { title: "自定义筛选", value: "discover" }
          ],
          default: "now_playing_cn"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度优先", value: "popularity.desc" },
            { title: "评分优先", value: "vote_average.desc" },
            { title: "上映日期优先", value: "release_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "分页", type: "offset" }
      ]
    },
    {
      title: "热门剧集",
      description: "全球热门剧集，实时更新",
      requiresWebView: false,
      functionName: "getTVShows",
      cacheDuration: 3600,
      params: [
        {
          name: "category",
          title: "剧集分类",
          type: "enumeration",
          enumOptions: [
            { title: "今日热门", value: "trending_day" },
            { title: "本周趋势", value: "trending_week" },
            { title: "正在播出", value: "on_the_air" },
            { title: "热门排行", value: "popular" },
            { title: "高分经典", value: "top_rated" }
          ],
          default: "trending_week"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度优先", value: "popularity.desc" },
            { title: "评分优先", value: "vote_average.desc" },
            { title: "首播日期优先", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "分页", type: "offset" }
      ]
    },
    {
      title: "热门动漫",
      description: "全球动漫番剧，支持地区分类",
      requiresWebView: false,
      functionName: "getAnime",
      cacheDuration: 3600,
      params: [
        {
          name: "region",
          title: "地区分类",
          type: "enumeration",
          enumOptions: [
            { title: "全部动漫", value: "all" },
            { title: "国产动画", value: "cn" },
            { title: "日本动画", value: "jp" },
            { title: "韩国动画", value: "kr" },
            { title: "欧美动画", value: "us" }
          ],
          default: "all"
        },
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度优先", value: "popularity.desc" },
            { title: "评分优先", value: "vote_average.desc" },
            { title: "首播日期优先", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "分页", type: "offset" }
      ]
    },
    {
      title: "国产综艺",
      description: "国内主流平台综艺，实时更新",
      requiresWebView: false,
      functionName: "getVariety",
      cacheDuration: 1800,
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度优先", value: "popularity.desc" },
            { title: "评分优先", value: "vote_average.desc" },
            { title: "上线日期优先", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "分页", type: "offset" }
      ]
    }
  ]
};

// --- 核心工具：统一读取全局TMDB API Key ---
function getGlobalApiKey() {
  const apiKey = Widget.globalParams?.TMDB_API_KEY?.trim() || "";
  console.log("[全局Key读取] 长度：", apiKey.length);
  return apiKey;
}

// --- 核心工具：统一TMDB请求封装 ---
async function sendTmdbRequest(endpoint, queryParams = {}) {
  const apiKey = getGlobalApiKey();
  if (!apiKey) throw new Error("未获取到全局TMDB API Key，请先在模块设置中填写");

  const url = `${TMDB_API_BASE}${endpoint}`;
  const headers = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json"
  };
  const finalParams = {
    language: "zh-CN",
    include_adult: false,
    ...queryParams
  };

  // 兼容v3 Key和v4 Token
  if (apiKey.length > 50) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    finalParams.api_key = apiKey;
  }

  try {
    console.log("[TMDB请求] 接口：", endpoint, "参数：", finalParams);
    const response = await Widget.http.get(url, {
      params: finalParams,
      headers: headers
    });

    if (response.data?.results) {
      return response.data.results;
    } else if (response.data) {
      return response.data; // 详情接口返回单条数据
    } else {
      throw new Error("接口返回数据格式异常");
    }
  } catch (error) {
    console.error("[TMDB请求失败] 接口：", endpoint, "错误：", error);
    throw new Error(`请求失败：${error.response?.status || error.message}`);
  }
}

// --- 模块1：电影入口 ---
async function getMovies(params = {}) {
  try {
    const apiKey = getGlobalApiKey();
    if (!apiKey) {
      return [createErrorItem("未配置TMDB API Key", "请先打开模块全局设置，填写你的TMDB API Key")];
    }

    const { category = "now_playing_cn", sort_by = "popularity.desc", offset = 0 } = params;
    const page = Math.floor(offset / 20) + 1;
    let endpoint = "";
    let queryParams = { page: page, sort_by: sort_by };

    // 分类匹配接口
    switch (category) {
      case "now_playing_cn":
        endpoint = "/movie/now_playing";
        queryParams.region = "CN";
        break;
      case "now_playing_global":
        endpoint = "/movie/now_playing";
        break;
      case "upcoming":
        endpoint = "/movie/upcoming";
        queryParams.region = "CN";
        queryParams.sort_by = "release_date.asc";
        break;
      case "trending_day":
        endpoint = "/trending/movie/day";
        break;
      case "trending_week":
        endpoint = "/trending/movie/week";
        break;
      case "top_rated":
        endpoint = "/movie/top_rated";
        queryParams.region = "CN";
        break;
      case "discover":
        endpoint = "/discover/movie";
        break;
    }

    // 自定义筛选保留用户选择的排序，其他分类适配特性
    if (category !== "discover" && category !== "upcoming") {
      queryParams.sort_by = sort_by;
    }

    const movieList = await sendTmdbRequest(endpoint, queryParams);
    if (!movieList || movieList.length === 0) {
      return [createErrorItem("暂无数据", "当前分类暂无电影数据，请切换分类重试")];
    }

    // 格式化Forward标准列表项
    return movieList.map(item => formatMovieItem(item));

  } catch (error) {
    console.error("[电影模块错误]", error);
    return [createErrorItem("数据获取失败", error.message || "未知错误，请查看运行日志")];
  }
}

// --- 模块2：剧集入口 ---
async function getTVShows(params = {}) {
  try {
    const apiKey = getGlobalApiKey();
    if (!apiKey) {
      return [createErrorItem("未配置TMDB API Key", "请先打开模块全局设置，填写你的TMDB API Key")];
    }

    const { category = "trending_week", sort_by = "popularity.desc", offset = 0 } = params;
    const page = Math.floor(offset / 20) + 1;
    let endpoint = "";
    let queryParams = { page: page, sort_by: sort_by };

    switch (category) {
      case "trending_day":
        endpoint = "/trending/tv/day";
        break;
      case "trending_week":
        endpoint = "/trending/tv/week";
        break;
      case "on_the_air":
        endpoint = "/tv/on_the_air";
        break;
      case "popular":
        endpoint = "/tv/popular";
        break;
      case "top_rated":
        endpoint = "/tv/top_rated";
        break;
    }

    // 排除动画和综艺，只保留普通剧集
    if (category !== "trending_day" && category !== "trending_week") {
      queryParams.without_genres = "16,10764,10767";
    }

    const tvList = await sendTmdbRequest(endpoint, queryParams);
    if (!tvList || tvList.length === 0) {
      return [createErrorItem("暂无数据", "当前分类暂无剧集数据，请切换分类重试")];
    }

    return tvList.map(item => formatTVItem(item));

  } catch (error) {
    console.error("[剧集模块错误]", error);
    return [createErrorItem("数据获取失败", error.message || "未知错误，请查看运行日志")];
  }
}

// --- 模块3：动漫入口 ---
async function getAnime(params = {}) {
  try {
    const apiKey = getGlobalApiKey();
    if (!apiKey) {
      return [createErrorItem("未配置TMDB API Key", "请先打开模块全局设置，填写你的TMDB API Key")];
    }

    const { region = "all", sort_by = "popularity.desc", offset = 0 } = params;
    const page = Math.floor(offset / 20) + 1;
    const endpoint = "/discover/tv";
    const queryParams = {
      page: page,
      sort_by: sort_by,
      with_genres: "16" // 动画类型ID
    };

    // 地区筛选
    if (region === "cn") {
      queryParams.with_original_language = "zh";
      queryParams.with_origin_country = "CN";
    } else if (region === "jp") {
      queryParams.with_original_language = "ja";
      queryParams.with_origin_country = "JP";
    } else if (region === "kr") {
      queryParams.with_original_language = "ko";
      queryParams.with_origin_country = "KR";
    } else if (region === "us") {
      queryParams.with_original_language = "en";
      queryParams.with_origin_country = "US";
    }

    const animeList = await sendTmdbRequest(endpoint, queryParams);
    if (!animeList || animeList.length === 0) {
      return [createErrorItem("暂无数据", "当前分类暂无动漫数据，请切换分类重试")];
    }

    return animeList.map(item => formatAnimeItem(item, region));

  } catch (error) {
    console.error("[动漫模块错误]", error);
    return [createErrorItem("数据获取失败", error.message || "未知错误，请查看运行日志")];
  }
}

// --- 模块4：综艺入口 ---
async function getVariety(params = {}) {
  try {
    const apiKey = getGlobalApiKey();
    if (!apiKey) {
      return [createErrorItem("未配置TMDB API Key", "请先打开模块全局设置，填写你的TMDB API Key")];
    }

    const { sort_by = "popularity.desc", offset = 0 } = params;
    const page = Math.floor(offset / 20) + 1;
    const endpoint = "/discover/tv";
    const queryParams = {
      page: page,
      sort_by: sort_by,
      with_genres: "10764,10767", // 真人秀+脱口秀
      with_original_language: "zh",
      with_origin_country: "CN"
    };

    const varietyList = await sendTmdbRequest(endpoint, queryParams);
    if (!varietyList || varietyList.length === 0) {
      return [createErrorItem("暂无数据", "暂无综艺数据，请重试")];
    }

    return varietyList.map(item => formatVarietyItem(item));

  } catch (error) {
    console.error("[综艺模块错误]", error);
    return [createErrorItem("数据获取失败", error.message || "未知错误，请查看运行日志")];
  }
}

// --- 详情页加载函数（点击条目进入详情必须实现）---
async function loadDetail(link) {
  try {
    console.log("[详情页] 链接：", link);
    if (!link) throw new Error("无效的内容链接");

    // 解析链接格式：tmdb://movie/123456 或 tmdb://tv/123456
    const [_, mediaType, id] = link.match(/tmdb:\/\/(\w+)\/(\d+)/) || [];
    if (!mediaType || !id) throw new Error("链接格式错误，无法加载详情");

    const apiKey = getGlobalApiKey();
    if (!apiKey) throw new Error("未配置TMDB API Key，无法加载详情");

    // 获取基础详情
    const detailData = await sendTmdbRequest(`/${mediaType}/${id}`, {
      append_to_response: "credits,videos"
    });

    if (!detailData) throw new Error("获取详情失败");

    // 格式化详情数据，符合Forward规范
    const isMovie = mediaType === "movie";
    const title = detailData.title || detailData.name || "未知标题";
    const releaseDate = detailData.release_date || detailData.first_air_date || "";
    const duration = detailData.runtime || detailData.episode_run_time?.[0] || 0;
    const genres = detailData.genres?.map(g => g.name) || [];
    const cast = detailData.credits?.cast?.slice(0, 10) || [];
    const videos = detailData.videos?.results || [];
    const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || videos[0];

    return {
      id: `detail_${mediaType}_${id}`,
      type: isMovie ? "movie" : "tv",
      title: title,
      description: `
${releaseDate ? `上映日期：${releaseDate}` : ""}
${genres.length > 0 ? `类型：${genres.join(" / ")}` : ""}
${duration ? `片长：${formatDuration(duration * 60)}` : ""}
评分：${detailData.vote_average ? detailData.vote_average.toFixed(1) : "暂无"} 分（${detailData.vote_count || 0}人评价）
${detailData.overview || "暂无简介"}

演员：${cast.map(c => c.name).join(" / ")}
      `.trim(),
      posterPath: detailData.poster_path ? `${IMAGE_BASE}${detailData.poster_path}` : ERROR_POSTER,
      backdropPath: detailData.backdrop_path ? `${BACKDROP_BASE}${detailData.backdrop_path}` : "",
      mediaType: isMovie ? "movie" : "tv",
      releaseDate: releaseDate,
      duration: duration * 60,
      durationText: formatDuration(duration * 60),
      rating: detailData.vote_average ? parseFloat(detailData.vote_average.toFixed(1)) : 0,
      tags: genres,
      playUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
      source: "TMDB",
      seasons: [],
      extra: {
        id: id,
        mediaType: mediaType,
        imdbId: detailData.imdb_id || ""
      }
    };

  } catch (error) {
    console.error("[详情页加载失败]", error);
    return createErrorItem("详情加载失败", error.message || "未知错误");
  }
}

// --- 格式化工具：电影列表项 ---
function formatMovieItem(item) {
  return {
    id: `movie_${item.id}`,
    type: "movie",
    title: item.title || "未知电影",
    description: `${item.release_date || "未知日期"} · 评分${item.vote_average ? item.vote_average.toFixed(1) : "暂无"}`,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : ERROR_POSTER,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : "",
    mediaType: "movie",
    releaseDate: item.release_date || "",
    duration: 0,
    durationText: "",
    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
    tags: item.genre_ids?.slice(0, 2).map(id => getGenreName(id)) || [],
    link: `tmdb://movie/${item.id}`,
    playUrl: "",
    source: "TMDB",
    seasons: []
  };
}

// --- 格式化工具：剧集列表项 ---
function formatTVItem(item) {
  return {
    id: `tv_${item.id}`,
    type: "tv",
    title: item.name || "未知剧集",
    description: `${item.first_air_date || "未知日期"} · 评分${item.vote_average ? item.vote_average.toFixed(1) : "暂无"}`,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : ERROR_POSTER,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : "",
    mediaType: "tv",
    releaseDate: item.first_air_date || "",
    duration: 0,
    durationText: "",
    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
    tags: item.genre_ids?.slice(0, 2).map(id => getGenreName(id)) || [],
    link: `tmdb://tv/${item.id}`,
    playUrl: "",
    source: "TMDB",
    seasons: []
  };
}

// --- 格式化工具：动漫列表项 ---
function formatAnimeItem(item, region) {
  const regionTagMap = {
    cn: "国漫",
    jp: "日漫",
    kr: "韩漫",
    us: "欧美动画",
    all: "动画"
  };
  return {
    id: `anime_${item.id}`,
    type: "tv",
    title: item.name || "未知动漫",
    description: `${item.first_air_date || "未知日期"} · 评分${item.vote_average ? item.vote_average.toFixed(1) : "暂无"}`,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : ERROR_POSTER,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : "",
    mediaType: "tv",
    releaseDate: item.first_air_date || "",
    duration: 0,
    durationText: "",
    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
    tags: [regionTagMap[region] || "动画"],
    link: `tmdb://tv/${item.id}`,
    playUrl: "",
    source: "TMDB",
    seasons: []
  };
}

// --- 格式化工具：综艺列表项 ---
function formatVarietyItem(item) {
  return {
    id: `variety_${item.id}`,
    type: "tv",
    title: item.name || "未知综艺",
    description: `${item.first_air_date || "未知日期"} · 评分${item.vote_average ? item.vote_average.toFixed(1) : "暂无"}`,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : ERROR_POSTER,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : "",
    mediaType: "tv",
    releaseDate: item.first_air_date || "",
    duration: 0,
    durationText: "",
    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
    tags: ["综艺", "国产"],
    link: `tmdb://tv/${item.id}`,
    playUrl: "",
    source: "TMDB",
    seasons: []
  };
}

// --- 工具函数：生成错误项 ---
function createErrorItem(title, description) {
  return {
    id: `error_${Date.now()}`,
    type: "text",
    title: title,
    description: description,
    mediaType: "text",
    posterPath: ERROR_POSTER,
    link: ""
  };
}

// --- 工具函数：类型名称映射 ---
function getGenreName(id) {
  const genreMap = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪",
    99: "纪录", 18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史",
    27: "恐怖", 10402: "音乐", 9648: "悬疑", 10749: "爱情", 878: "科幻",
    10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部",
    10759: "纪实", 10762: "儿童", 10763: "新闻", 10764: "真人秀", 10767: "脱口秀"
  };
  return genreMap[id] || "";
}

// --- 工具函数：格式化时长 ---
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0分钟";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}