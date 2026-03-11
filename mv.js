const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

var WidgetMetadata = {
  id: "movie_shows",
  title: "热门榜单 (完整版)",
  description: "含电影/剧集/动漫/国内综艺",
  author: "crush7s",
  site: "",
  version: "2.3.0", // 版本号升级
  requiredVersion: "0.0.1",
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：支持 32位短 Key 或 v4 长 Token"
    },
    // 新增：豆瓣数据源开关，默认关闭（接口受限+时效性差）
    {
      name: "ENABLE_DOUBAN_SOURCE",
      title: "启用豆瓣数据源",
      type: "boolean",
      description: "不推荐开启，豆瓣接口访问受限，数据时效性远低于TMDB",
      default: false
    },
    // 新增：数据新鲜度控制
    {
      name: "DATA_FRESHNESS_DAYS",
      title: "最新数据时间范围(天)",
      type: "input",
      description: "选填：仅获取近N天内有更新的内容，不填则不限制",
      default: ""
    }
  ],
  modules: [
    {
      title: "热门电影",
      description: "查看实时热门电影，支持排序",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 1800, // 优化：缓存从1小时缩短为30分钟，提升新鲜度
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "上映日期", value: "primary_release_date.desc" }, // 优化：电影用专属上映日期字段，更精准
            { title: "最近更新", value: "updated_at.desc" } // 优化：直接使用TMDB原生更新字段，避免替换错误
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
      cacheDuration: 1800, // 优化：缓存缩短
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "首播日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated_at.desc" } // 优化：原生更新字段
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
      cacheDuration: 1800,
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "首播日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated_at.desc" }
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
            { title: "最新上线", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated_at.desc" }
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
    { name: "爱奇艺", lang: "zh", country: "CN", genre: "10764" },
    { name: "腾讯视频", lang: "zh", country: "CN", genre: "10764,10767" },
    { name: "芒果TV", lang: "zh", country: "CN", genre: "10764" },
    { name: "优酷", lang: "zh", country: "CN", genre: "10764,10767" }
  ],
  tmdbGenreIds: "10764,10767"
};

// --- 模块入口 ---
async function getMovies(params = {}) {
  return await getDataWithFallback('movie', params);
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

// --- 国内综艺模块：TMDB聚合主流平台 ---
async function fetchDomesticVariety(params = {}) {
  const apiKey = params.TMDB_API_KEY;
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const platform = params.platform || "all";
  const freshnessDays = params.DATA_FRESHNESS_DAYS;
  
  // 校验API Key
  if (!apiKey) {
    return [{ 
      id: "error_no_api_key",
      title: "请填写 TMDB API Key", 
      description: "在组件设置中配置", 
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

  // 计算新鲜度筛选日期
  let freshnessFilter = {};
  if (freshnessDays && !isNaN(freshnessDays)) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(freshnessDays));
    freshnessFilter["updated_at.gte"] = cutoffDate.toISOString().split('T')[0];
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
      with_origin_country: config.country,
      include_null_first_air_dates: false, // 优化：排除无首播日期的无效数据
      ...freshnessFilter // 新增：新鲜度筛选
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

// --- 核心逻辑：电影/剧集/动漫 优化：调整数据源优先级，修复排序逻辑 ---
async function getDataWithFallback(type, params) {
  const apiKey = params.TMDB_API_KEY;
  const enableDouban = params.ENABLE_DOUBAN_SOURCE || false;
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  
  let items = [];

  // 优化：默认优先使用TMDB（时效性、稳定性远高于豆瓣），仅当用户主动开启时才请求豆瓣
  if (enableDouban && ['movie', 'tv'].includes(type)) {
    try {
      console.log(`[尝试] 请求豆瓣 ${type} 数据...`);
      items = await fetchDouban(type, offset);
    } catch (e) {
      console.log(`[跳过] 豆瓣请求失败`, e.message);
    }
  }

  // 优先使用TMDB，豆瓣无数据时兜底TMDB
  if (!items || items.length === 0) {
    console.log(`[使用] TMDB 数据源 (${type})...`);
    
    if (!apiKey) {
      return [{ 
        id: "error_no_api_key",
        title: "请填写 TMDB API Key", 
        description: "在组件设置中配置", 
        type: "tmdb",
        mediaType: "text"
      }];
    }

    const tmdbData = await fetchTmdbDiscover(type, offset, apiKey, params);
    return applySorting(tmdbData, sortBy, type);
  }

  console.log(`[成功] 获取到 ${items.length} 条豆瓣数据，正在补全...`);
  const searchType = type === 'movie' ? 'movie' : 'tv';
  const tasks = items.map(item => searchTmdb(item.title, searchType, apiKey));
  const results = await Promise.all(tasks);
  const filteredResults = results.filter(r => r !== null);
  
  return applySorting(filteredResults, sortBy, type);
}

// --- 豆瓣数据源 优化：修复假更新时间字段，优化字段映射 ---
async function fetchDouban(type, offset) {
  let category = 'movie';
  if (type === 'tv') category = 'tv';
  
  const url = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/${category}?start=${offset}&limit=20`;
  
  const res = await Widget.http.get(url, {
    headers: {
      "Referer": "https://m.douban.com/",
      "User-Agent": USER_AGENT
    }
  });
  
  if (res.data && res.data.items) {
    return res.data.items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.card_subtitle || "",
      rating: item.rating?.value || 0,
      releaseDate: item.year || "",
      genres: item.genres || [],
      voteCount: item.rating?.count || 0,
      // 修复：原来用当前时间造假，导致排序完全错误，改为真实字段兜底
      lastUpdate: item?.update_time || item?.release_date || item.year || ""
    }));
  }
  return [];
}

// --- TMDB Discover 查询 核心修复：删除错误的排序替换逻辑，新增新鲜度筛选 ---
async function fetchTmdbDiscover(type, offset, apiKey, params) {
  const page = Math.floor(offset / 20) + 1;
  let endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
  const freshnessDays = params.DATA_FRESHNESS_DAYS;
  
  let queryParams = {
    language: "zh-CN",
    page: page,
    include_adult: false,
    sort_by: params.sort_by || "popularity.desc", // 修复：直接透传排序规则，不再错误替换
    include_null_first_air_dates: false, // 优化：排除无日期的无效数据
  };

  // 新增：新鲜度筛选，仅获取指定天数内更新的内容
  if (freshnessDays && !isNaN(freshnessDays)) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(freshnessDays));
    queryParams["updated_at.gte"] = cutoffDate.toISOString().split('T')[0];
  }

  // 动漫分类专属筛选
  if (type === 'anime') {
    endpoint = '/discover/tv';
    const genreParam = params.genre || "16";
    
    if (genreParam.includes('_')) {
      const [genreIds, languageCode] = genreParam.split('_');
      queryParams.with_genres = genreIds;
      
      if (languageCode) {
        if (languageCode === 'zh') {
          queryParams.with_original_language = 'zh';
        } else if (languageCode === 'ja') {
          queryParams.with_original_language = 'ja';
        } else if (languageCode === 'ko') {
          queryParams.with_original_language = 'ko';
        } else if (languageCode === 'fr') {
          queryParams.with_original_language = 'fr';
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
    // 剧集排除动画、综艺，保持分类纯净
    queryParams.without_genres = "16,10764,10767";
  }

  return await sendTmdbRequest(endpoint, queryParams, apiKey);
}

// --- 工具：TMDB 搜索 ---
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

// --- 核心：统一请求发送器 优化：完善更新时间字段映射 ---
async function sendTmdbRequest(path, params, apiKey) {
  if (!apiKey) return [];
  
  const url = `https://api.themoviedb.org/3${path}`;
  let headers = { "Content-Type": "application/json;charset=utf-8" };
  let finalParams = { ...params };

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
          if (item.original_language === 'zh' || item.original_language === 'zh-CN') animeType = "国漫";
          else if (item.original_language === 'ja') animeType = "日漫";
          else if (item.original_language === 'ko') animeType = "韩漫";
          else if (item.original_language === 'en') animeType = item.origin_country?.includes('US') ? "美漫" : "英漫";
          tags = ["动画", animeType];
        }
        
        // 综艺标签
        if (isVariety) {
          let varietyType = item.genre_ids?.includes(10764) ? "真人秀" : "脱口秀";
          tags = ["综艺", varietyType, item.origin_country?.includes('CN') ? "国产" : ""];
        }
        
        return {
          id: item.id,
          type: "tmdb",
          title: item.title || item.name,
          description: item.overview || "暂无简介",
          posterPath: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null,
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
          releaseDate: item.release_date || item.first_air_date || "",
          rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
          mediaType: path.includes('movie') ? 'movie' : 'tv',
          popularity: item.popularity || 0,
          voteCount: item.vote_count || 0,
          tags: tags.filter(Boolean).slice(0, 3),
          // 优化：优先使用TMDB原生更新时间，确保排序精准
          lastUpdate: item.updated_at || item.release_date || item.first_air_date || ""
        };
      });
    }
  } catch (err) {
    console.error(`TMDB 请求错误: ${err.message}`);
  }
  return [];
}

// --- 排序函数 核心修复：新增最近更新排序规则，修复排序逻辑 ---
function applySorting(items, sortBy, type) {
  if (!items || items.length === 0) return items;
  
  const sortedItems = [...items];
  
  switch(sortBy) {
    case 'vote_average.desc':
      sortedItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
      
    case 'first_air_date.desc':
    case 'release_date.desc':
    case 'primary_release_date.desc':
      sortedItems.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
      break;
    
    // 新增：适配最近更新排序，核心修复
    case 'updated.desc':
    case 'updated_at.desc':
      sortedItems.sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0));
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