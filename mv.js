const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

var WidgetMetadata = {
  id: "movie_shows_optimized",
  title: "热门榜单 (最新片源优化版)",
  description: "含电影/剧集/动漫/国内综艺，电影数据源优化，实时更新院线/新片数据",
  author: "crush7s",
  site: "",
  version: "2.3.0",
  requiredVersion: "0.0.1",
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：支持 32位短 Key 或 v4 长 Token，申请地址：https://www.themoviedb.org/settings/api"
    },
  ],
  modules: [
    {
      title: "热门电影",
      description: "实时更新：正在热映/即将上映/今日热门，支持排序",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 1800, // 缩短缓存到30分钟，保证数据最新
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
            { title: "高分经典", value: "top_rated" },
            { title: "自定义筛选", value: "discover" }
          ],
          default: "now_playing_cn"
        },
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
            { title: "首播日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "last_air_date.desc" }
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
            { title: "首播日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "last_air_date.desc" }
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
      description: "聚合爱奇艺/腾讯/芒果TV/优酷综艺，TMDB匹配元数据",
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

// 国内主流综艺平台对应的TMDB筛选条件
const DOMESTIC_VARIETY_CONFIG = {
  platforms: [
    { name: "爱奇艺", lang: "zh", country: "CN", genre: "10764" }, // 真人秀
    { name: "腾讯视频", lang: "zh", country: "CN", genre: "10764,10767" }, // 真人秀+脱口秀
    { name: "芒果TV", lang: "zh", country: "CN", genre: "10764" },
    { name: "优酷", lang: "zh", country: "CN", genre: "10764,10767" }
  ],
  tmdbGenreIds: "10764,10767" // 综艺类型ID：真人秀+脱口秀
};

// --- 【修复】统一获取API Key，解决全局参数读取失败问题 ---
function getApiKey() {
  return Widget.globalParams?.TMDB_API_KEY?.trim() || "";
}

// --- 模块入口 ---
async function getMovies(params = {}) {
  return await fetchOptimizedMovies(params);
}

async function getTV(params = {}) {
  return await getDataWithFallback('tv', params);
}

async function getAnime(params = {}) {
  return await getDataWithFallback('anime', params);
}

async function getDomesticVariety(params = {}) {
  return await fetchDomesticVariety(params);
}

// --- 【核心优化】电影模块：全新数据源，保证最新 ---
async function fetchOptimizedMovies(params = {}) {
  const apiKey = getApiKey();
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const category = params.category || "now_playing_cn";
  const page = Math.floor(offset / 20) + 1;

  // 校验API Key
  if (!apiKey) {
    return [{ 
      id: "error_no_api_key",
      title: "请填写 TMDB API Key", 
      description: "在模块全局设置中配置你的TMDB API Key", 
      type: "text",
      mediaType: "text"
    }];
  }

  try {
    let endpoint = "";
    let queryParams = {
      language: "zh-CN",
      page: page,
      include_adult: false
    };

    // 根据分类匹配TMDB官方接口，精准获取最新数据
    switch (category) {
      case "now_playing_cn":
        endpoint = "/movie/now_playing";
        queryParams.region = "CN"; // 限定国内正在热映
        break;
      case "now_playing_global":
        endpoint = "/movie/now_playing";
        break;
      case "upcoming":
        endpoint = "/movie/upcoming";
        queryParams.region = "CN";
        queryParams.sort_by = "release_date.asc"; // 即将上映按上映时间正序
        break;
      case "trending_day":
        endpoint = "/trending/movie/day"; // 今日热门，实时更新
        break;
      case "trending_week":
        endpoint = "/trending/movie/week"; // 本周趋势
        break;
      case "top_rated":
        endpoint = "/movie/top_rated";
        queryParams.region = "CN";
        break;
      case "discover":
        endpoint = "/discover/movie";
        queryParams.sort_by = sortBy;
        break;
    }

    // 自定义筛选时，用用户选的排序；其他分类优先适配分类特性
    if (category !== "discover" && category !== "upcoming") {
      queryParams.sort_by = sortBy;
    }

    console.log(`[电影请求] 分类：${category}，接口：${endpoint}，参数：`, queryParams);
    const movieData = await sendTmdbRequest(endpoint, queryParams, apiKey);

    if (!movieData || movieData.length === 0) {
      return [{
        id: "error_no_data",
        title: "暂无数据",
        description: "当前分类暂无电影数据，请切换分类重试",
        type: "text",
        mediaType: "text"
      }];
    }

    // 排序+格式化返回
    return applySorting(movieData, sortBy, 'movie');

  } catch (error) {
    console.error("[电影数据获取失败]", error);
    return [{
      id: "error_request_fail",
      title: "数据获取失败",
      description: `错误详情：${error.message || "网络异常，请检查API Key和网络"}`,
      type: "text",
      mediaType: "text"
    }];
  }
}

// --- 国内综艺模块：修复API Key读取问题 ---
async function fetchDomesticVariety(params = {}) {
  const apiKey = getApiKey();
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const platform = params.platform || "all";
  
  // 校验API Key
  if (!apiKey) {
    return [{ 
      id: "error_no_api_key",
      title: "请填写 TMDB API Key", 
      description: "在模块全局设置中配置", 
      type: "text",
      mediaType: "text"
    }];
  }

  // 匹配平台对应的筛选条件
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

  // 并行请求各平台综艺数据
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
    return sendTmdbRequest("/discover/tv", queryParams, apiKey);
  });

  // 合并数据并去重
  const results = await Promise.all(tasks);
  const allItems = results.flat();
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

  // 应用排序
  return applySorting(uniqueItems, sortBy, 'variety');
}

// --- 剧集/动漫通用逻辑：修复API Key读取，移除失效豆瓣逻辑 ---
async function getDataWithFallback(type, params) {
  const apiKey = getApiKey();
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  
  // 校验API Key
  if (!apiKey) {
    return [{ 
      id: "error_no_api_key",
      title: "请填写 TMDB API Key", 
      description: "在模块全局设置中配置", 
      type: "text",
      mediaType: "text"
    }];
  }

  // 直接使用TMDB数据源，移除失效的豆瓣请求
  console.log(`[使用] TMDB 数据源 (${type})`);
  const tmdbData = await fetchTmdbDiscover(type, offset, apiKey, params);
  return applySorting(tmdbData, sortBy, type);
}

// --- TMDB Discover 查询：修复参数逻辑 ---
async function fetchTmdbDiscover(type, offset, apiKey, params) {
  const page = Math.floor(offset / 20) + 1;
  let endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
  
  let queryParams = {
    language: "zh-CN",
    page: page,
    include_adult: false,
    sort_by: params.sort_by || "popularity.desc"
  };

  if (type === 'anime') {
    endpoint = '/discover/tv';
    const genreParam = params.genre || "16";
    
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
        } else {
          queryParams.with_original_language = languageCode;
        }
      }
    } else {
      queryParams.with_genres = genreParam;
    }
  } else if (type === 'tv') {
    // 排除动画、综艺，只保留普通剧集
    queryParams.without_genres = "16,10764,10767";
  }

  return await sendTmdbRequest(endpoint, queryParams, apiKey);
}

// --- 工具：TMDB 搜索（保留备用）---
async function searchTmdb(keyword, mediaType, apiKey) {
  if (!keyword || !apiKey) return null;
  
  const yearMatch = keyword.match(/\b(19|20)\d{2}\b/)?.[0];
  const cleanTitle = keyword
    .replace(/([（(][^）)]*[)）])/g, '')
    .replace(/剧场版|特别篇|动态漫|中文配音|中配|粤语版|国语版/g, '')
    .replace(/第[0-9一二三四五六七八九十]+季/g, '')
    .trim();
  
  const results = await sendTmdbRequest(`/search/${mediaType}`, {
    query: cleanTitle,
    language: "zh-CN",
    page: 1,
    ...(yearMatch ? { year: yearMatch } : {})
  }, apiKey);

  if (results && results.length > 0) {
    const exactMatch = results.find(
      item => 
        (item.title === cleanTitle || item.name === cleanTitle) ||
        (item.original_title === cleanTitle || item.original_name === cleanTitle)
    );
    return exactMatch || results[0];
  }
  return null;
}

// --- 核心：统一请求发送器，修复异常处理 ---
async function sendTmdbRequest(path, params, apiKey) {
  if (!apiKey) return [];
  
  const url = `https://api.themoviedb.org/3${path}`;
  let headers = { 
    "User-Agent": USER_AGENT,
    "Accept": "application/json"
  };
  let finalParams = { ...params };

  // 兼容v4 Token和v3 Key
  if (apiKey.length > 50) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else {
    finalParams["api_key"] = apiKey;
  }

  try {
    const res = await Widget.http.get(url, { params: finalParams, headers: headers });
    
    if (res.data && res.data.results) {
      return res.data.results.map(item => {
        const isAnime = item.genre_ids?.includes(16);
        const isVariety = item.genre_ids?.some(id => DOMESTIC_VARIETY_CONFIG.tmdbGenreIds.split(',').includes(id.toString()));
        let tags = [];
        
        // 动漫标签
        if (isAnime) {
          let animeType = "";
          const lang = item.original_language;
          const country = item.origin_country?.[0] || "";
          if (lang === 'zh' || lang === 'zh-CN' || country === 'CN') animeType = "国漫";
          else if (lang === 'ja' || country === 'JP') animeType = "日漫";
          else if (lang === 'ko' || country === 'KR') animeType = "韩漫";
          else if (lang === 'en') animeType = country === 'US' ? "美漫" : "英漫";
          tags = ["动画", animeType];
        }
        
        // 综艺标签
        if (isVariety) {
          let varietyType = item.genre_ids?.includes(10764) ? "真人秀" : "脱口秀";
          tags = ["综艺", varietyType, item.origin_country?.includes('CN') ? "国产" : ""];
        }

        // 电影标签
        const isMovie = path.includes('movie') || item.media_type === 'movie';
        if (isMovie && !isAnime && !isVariety) {
          tags = ["电影", ...(item.genre_ids?.slice(0,2).map(g => getGenreName(g)) || [])];
        }
        
        return {
          id: item.id,
          type: isMovie ? "movie" : "tv",
          title: item.title || item.name || "未知标题",
          description: item.overview || "暂无简介",
          posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : "https://via.placeholder.com/500x750?text=无海报",
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "",
          releaseDate: item.release_date || item.first_air_date || "",
          rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
          mediaType: isMovie ? 'movie' : 'tv',
          popularity: item.popularity || 0,
          voteCount: item.vote_count || 0,
          tags: tags.filter(Boolean).slice(0, 3),
          lastUpdate: item.updated_at || item.release_date || item.first_air_date || ""
        };
      });
    }
  } catch (err) {
    console.error(`TMDB 请求失败 [${path}]：`, err.message);
    throw new Error(`接口请求失败：${err.response?.status || err.message}`);
  }
  return [];
}

// --- 排序函数 ---
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

// --- 工具：类型名称映射 ---
function getGenreName(id) {
  const genreMap = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪",
    99: "纪录", 18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史",
    27: "恐怖", 10402: "音乐", 9648: "悬疑", 10749: "爱情", 878: "科幻",
    10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部"
  };
  return genreMap[id] || "";
}