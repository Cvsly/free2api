// 常量定义
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
const ERROR_POSTER = "https://via.placeholder.com/500x750?text=暂无海报";

// 模块元数据（保留你原有的结构，仅优化描述）
var WidgetMetadata = {
  id: "movie_shows_standard",
  title: "热门榜单 (完整版)",
  description: "含电影/剧集/动漫/国内综艺，基于TMDB官方API，全局统一配置Key",
  author: "crush7s",
  version: "2.3.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 300,
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：支持 32位短 Key 或 v4 长 Token，全局仅需填写一次"
    }
  ],
  modules: [
    {
      title: "热门电影",
      description: "查看实时热门电影，支持排序",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 1800,
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "上映日期", value: "release_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门剧集",
      description: "查看实时热门剧集，支持排序",
      requiresWebView: false,
      functionName: "getTV",
      cacheDuration: 3600,
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "首播日期", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门动漫",
      description: "查看实时动漫番剧，支持排序和地区分类",
      requiresWebView: false,
      functionName: "getAnime",
      cacheDuration: 3600,
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "首播日期", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { 
          name: "genre", 
          title: "动漫分类", 
          type: "enumeration",
          enumOptions: [
            { title: "全部动漫", value: "16" },
            { title: "国产动画", value: "16_zh" },
            { title: "日本动画", value: "16_ja" },
            { title: "韩国动画", value: "16_ko" },
            { title: "美国动画", value: "16_en" },
            { title: "法国动画", value: "16_fr" },
            { title: "英国动画", value: "16_en_gb" }
          ],
          default: "16"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门综艺",
      description: "聚合国内主流平台综艺，TMDB官方数据",
      requiresWebView: false,
      functionName: "getDomesticVariety",
      cacheDuration: 1800,
      params: [
        { 
          name: "platform", 
          title: "平台", 
          type: "enumeration",
          enumOptions: [
            { title: "全部平台", value: "all" },
            { title: "爱奇艺", value: "iqiyi" },
            { title: "腾讯视频", value: "tencent" },
            { title: "芒果TV", value: "mango" },
            { title: "优酷", value: "youku" }
          ],
          default: "all"
        },
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "最新上线", value: "first_air_date.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    }
  ]
};

// 国内综艺配置（保留原有配置）
const DOMESTIC_VARIETY_CONFIG = {
  platforms: [
    { name: "爱奇艺", lang: "zh", country: "CN", genre: "10764" },
    { name: "腾讯视频", lang: "zh", country: "CN", genre: "10764,10767" },
    { name: "芒果TV", lang: "zh", country: "CN", genre: "10764" },
    { name: "优酷", lang: "zh", country: "CN", genre: "10764,10767" }
  ],
  tmdbGenreIds: "10764,10767"
};

// ==============================================
// 【核心修复】符合Forward规范的全局API Key读取
// ==============================================
function getGlobalApiKey() {
  // 唯一正确的全局参数读取方式：从Widget.globalParams中获取
  const apiKey = Widget.globalParams?.TMDB_API_KEY?.trim() || "";
  console.log("[全局参数读取] TMDB API Key 长度：", apiKey.length);
  return apiKey;
}

// --- 模块入口函数 ---
async function getMovies(params = {}) {
  return await fetchTmdbData('movie', params);
}

async function getTV(params = {}) {
  return await fetchTmdbData('tv', params);
}

async function getAnime(params = {}) {
  return await fetchTmdbData('anime', params);
}

async function getDomesticVariety(params = {}) {
  const apiKey = getGlobalApiKey();
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const platform = params.platform || "all";
  
  // 校验API Key
  if (!apiKey) {
    return [createErrorItem("请填写 TMDB API Key", "请在模块「全局设置」中配置你的TMDB API Key")];
  }

  // 匹配平台筛选条件
  let targetConfig = DOMESTIC_VARIETY_CONFIG.platforms;
  if (platform !== "all") {
    const platformMap = {
      "iqiyi": "爱奇艺",
      "tencent": "腾讯视频",
      "mango": "芒果TV",
      "youku": "优酷"
    };
    const platformName = platformMap[platform];
    targetConfig = DOMESTIC_VARIETY_CONFIG.platforms.filter(item => item.name === platformName);
  }

  // 并行请求数据
  const page = Math.floor(offset / 20) + 1;
  const tasks = targetConfig.map(config => {
    const queryParams = {
      language: "zh-CN",
      page: page,
      include_adult: false,
      sort_by: sortBy,
      with_genres: config.genre,
      with_original_language: config.lang,
      with_origin_country: config.country
    };
    return sendTmdbRequest("/discover/tv", queryParams);
  });

  // 合并去重
  const results = await Promise.all(tasks);
  const allItems = results.flat();
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

  return applySorting(uniqueItems, sortBy, 'variety');
}

// --- 核心数据获取函数（统一处理电影/剧集/动漫）---
async function fetchTmdbData(type, params = {}) {
  const apiKey = getGlobalApiKey();
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const page = Math.floor(offset / 20) + 1;

  // 校验API Key
  if (!apiKey) {
    return [createErrorItem("请填写 TMDB API Key", "请在模块「全局设置」中配置你的TMDB API Key")];
  }

  try {
    let endpoint = "";
    let queryParams = {
      language: "zh-CN",
      page: page,
      include_adult: false,
      sort_by: sortBy
    };

    // 按类型匹配接口和参数
    if (type === "movie") {
      endpoint = "/discover/movie";
    } else if (type === "tv") {
      endpoint = "/discover/tv";
      // 排除动画和综艺，只保留普通剧集
      queryParams.without_genres = "16,10764,10767";
    } else if (type === "anime") {
      endpoint = "/discover/tv";
      const genreParam = params.genre || "16";
      
      // 处理动漫分类和地区筛选
      if (genreParam.includes('_')) {
        const [genreIds, languageCode] = genreParam.split('_');
        queryParams.with_genres = genreIds;
        
        if (languageCode) {
          if (languageCode === 'zh') {
            queryParams.with_original_language = 'zh';
            queryParams.with_origin_country = 'CN';
          } else if (languageCode === 'ja') {
            queryParams.with_original_language = 'ja';
            queryParams.with_origin_country = 'JP';
          } else if (languageCode === 'ko') {
            queryParams.with_original_language = 'ko';
            queryParams.with_origin_country = 'KR';
          } else if (languageCode === 'fr') {
            queryParams.with_original_language = 'fr';
            queryParams.with_origin_country = 'FR';
          } else if (languageCode === 'en_gb') {
            queryParams.with_original_language = 'en';
            queryParams.with_origin_country = 'GB';
          } else if (languageCode === 'en') {
            queryParams.with_original_language = 'en';
            queryParams.with_origin_country = 'US';
          }
        }
      } else {
        queryParams.with_genres = genreParam;
      }
    }

    // 发送请求
    const dataList = await sendTmdbRequest(endpoint, queryParams);
    if (!dataList || dataList.length === 0) {
      return [createErrorItem("暂无数据", "当前分类暂无内容，请切换筛选条件重试")];
    }

    // 格式化并返回
    return applySorting(dataList, sortBy, type);

  } catch (error) {
    console.error(`[${type}模块请求失败]`, error);
    return [createErrorItem("数据获取失败", `错误：${error.message || "网络异常，请检查API Key和网络"}`)];
  }
}

// --- 统一TMDB请求封装 ---
async function sendTmdbRequest(path, queryParams = {}) {
  const apiKey = getGlobalApiKey();
  if (!apiKey) throw new Error("未配置TMDB API Key");

  const url = `https://api.themoviedb.org/3${path}`;
  const headers = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json"
  };
  const finalParams = { ...queryParams };

  // 兼容v3短Key和v4长Token
  if (apiKey.length > 50) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    finalParams.api_key = apiKey;
  }

  try {
    console.log("[TMDB请求] 接口：", path, "参数：", finalParams);
    const response = await Widget.http.get(url, {
      params: finalParams,
      headers: headers
    });

    if (response.data?.results) {
      // 统一格式化返回的条目
      return response.data.results.map(item => formatStandardItem(item, path));
    } else if (response.data) {
      return response.data; // 给详情页预留
    } else {
      throw new Error("接口返回数据格式异常");
    }
  } catch (error) {
    console.error(`[TMDB请求失败] 接口${path}：`, error);
    throw error;
  }
}

// --- 【必须实现】Forward详情页加载函数 ---
async function loadDetail(link) {
  try {
    console.log("[详情页加载] 链接：", link);
    if (!link) throw new Error("无效的内容链接");

    // 解析链接格式：tmdb://movie/123 或 tmdb://tv/123
    const [_, mediaType, id] = link.match(/tmdb:\/\/(\w+)\/(\d+)/) || [];
    if (!mediaType || !id) throw new Error("链接格式错误");

    const apiKey = getGlobalApiKey();
    if (!apiKey) throw new Error("未配置TMDB API Key，无法加载详情");

    // 获取详情+演职员+预告片
    const detailData = await sendTmdbRequest(`/${mediaType}/${id}`, {
      append_to_response: "credits,videos"
    });

    if (!detailData) throw new Error("获取详情失败");

    // 格式化符合Forward规范的详情数据
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
${releaseDate ? `上映/首播日期：${releaseDate}` : ""}
${genres.length > 0 ? `类型：${genres.join(" / ")}` : ""}
${duration ? `片长/单集时长：${formatDuration(duration * 60)}` : ""}
评分：${detailData.vote_average ? detailData.vote_average.toFixed(1) : "暂无"} 分（${detailData.vote_count || 0}人评价）

${detailData.overview || "暂无简介"}

演职人员：${cast.map(c => c.name).join(" / ")}
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

// --- 统一格式化列表项，符合Forward规范 ---
function formatStandardItem(item, path) {
  const isMovie = path.includes("movie");
  const isAnime = item.genre_ids?.includes(16);
  const isVariety = item.genre_ids?.some(id => DOMESTIC_VARIETY_CONFIG.tmdbGenreIds.split(',').includes(id.toString()));
  let tags = [];

  // 生成标签
  if (isAnime) {
    const lang = item.original_language;
    const country = item.origin_country?.[0] || "";
    let animeType = "";
    if (lang === 'zh' || country === 'CN') animeType = "国漫";
    else if (lang === 'ja' || country === 'JP') animeType = "日漫";
    else if (lang === 'ko' || country === 'KR') animeType = "韩漫";
    else if (lang === 'en') animeType = country === 'US' ? "美漫" : "英漫";
    tags = ["动画", animeType];
  } else if (isVariety) {
    const varietyType = item.genre_ids?.includes(10764) ? "真人秀" : "脱口秀";
    tags = ["综艺", varietyType, item.origin_country?.includes('CN') ? "国产" : ""];
  } else {
    tags = item.genre_ids?.slice(0, 2).map(id => getGenreName(id)) || [];
  }

  // 基础信息
  const title = item.title || item.name || "未知标题";
  const releaseDate = item.release_date || item.first_air_date || "";
  const rating = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0;

  return {
    id: `tmdb_${item.id}`,
    type: isMovie ? "movie" : "tv",
    title: title,
    description: `${releaseDate || "未知日期"} · 评分${rating || "暂无"}`,
    posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : ERROR_POSTER,
    backdropPath: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : "",
    releaseDate: releaseDate,
    rating: rating,
    mediaType: isMovie ? "movie" : "tv",
    popularity: item.popularity || 0,
    voteCount: item.vote_count || 0,
    tags: tags.filter(Boolean).slice(0, 3),
    link: `tmdb://${isMovie ? "movie" : "tv"}/${item.id}`,
    playUrl: "",
    seasons: []
  };
}

// --- 排序函数（保留原有逻辑）---
function applySorting(items, sortBy, type) {
  if (!items || items.length === 0) return items;
  
  const sortedItems = [...items];
  switch(sortBy) {
    case 'vote_average.desc':
      sortedItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'first_air_date.desc':
    case 'release_date.desc':
      sortedItems.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
      break;
    case 'popularity.desc':
    default:
      sortedItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      break;
  }
  
  return sortedItems.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

// --- 工具函数：生成错误提示项 ---
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
    10764: "真人秀", 10767: "脱口秀"
  };
  return genreMap[id] || "";
}

// --- 工具函数：格式化时长 ---
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0分钟";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
}