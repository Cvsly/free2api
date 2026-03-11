const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

var WidgetMetadata = {
  id: "movie_shows",
  title: "热门榜单 (完整版)",
  description: "含电影/剧集/动漫/国内综艺",
  author: "crush7s",
  site: "",
  version: "2.4.1",
  requiredVersion: "0.0.1",
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：支持 32位短 Key 或 v4 长 Token"
    }
  ],
  modules: [
    {
      title: "热门电影",
      description: "查看实时热门电影，支持排序",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 3600,
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热门优先", value: "popularity.desc" },
            { title: "高分优先", value: "vote_average.desc" },
            { title: "最新上映", value: "primary_release_date.desc" },
            { title: "最近更新", value: "updated_at.desc" }
          ],
          default: "popularity.desc"
        },
        {
          name: "region",
          title: "地区",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "国内电影", value: "CN" },
            { title: "国外电影", value: "foreign" }
          ],
          default: "all"
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
            { title: "热门优先", value: "popularity.desc" },
            { title: "高分优先", value: "vote_average.desc" },
            { title: "最新上线", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated_at.desc" }
          ],
          default: "popularity.desc"
        },
        {
          name: "region",
          title: "地区",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "国内剧集", value: "CN" },
            { title: "国外剧集", value: "foreign" }
          ],
          default: "all"
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
            { title: "热门优先", value: "popularity.desc" },
            { title: "高分优先", value: "vote_average.desc" },
            { title: "最新上线", value: "first_air_date.desc" },
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
            { title: "热门优先", value: "popularity.desc" },
            { title: "高分优先", value: "vote_average.desc" },
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

// --- 国内综艺 ---
async function fetchDomesticVariety(params = {}) {
  const apiKey = params.TMDB_API_KEY;
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const platform = params.platform || "all";
  
  if (!apiKey) {
    return [{ 
      id: "error_no_api_key",
      title: "请填写 TMDB API Key", 
      description: "在组件设置中配置", 
      type: "text",
      mediaType: "text"
    }];
  }

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

  const results = await Promise.all(tasks);
  const allItems = results.flat();
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

  return applySorting(uniqueItems, sortBy, 'variety');
}

// --- 核心逻辑 ---
async function getDataWithFallback(type, params) {
  const apiKey = params.TMDB_API_KEY;
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  
  let items = [];
  if (['movie', 'tv'].includes(type)) {
    try {
      console.log(`[尝试] 请求豆瓣 ${type} 数据...`);
      items = await fetchDouban(type, offset);
    } catch (e) {
      console.log(`[跳过] 豆瓣请求失败`);
    }
  }

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

// --- 可用豆瓣接口 ---
async function fetchDouban(type, offset) {
  let url = "";
  const start = offset;
  const limit = 20;

  if (type === 'movie') {
    url = `https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items?start=${start}&count=${limit}`;
  } else if (type === 'tv') {
    url = `https://m.douban.com/rexxar/api/v2/subject_collection/tv_domestic/items?start=${start}&count=${limit}`;
  }

  const res = await Widget.http.get(url, {
    headers: {
      "Referer": "https://m.douban.com/",
      "User-Agent": USER_AGENT
    }
  });
  
  if (res.data && res.data.subject_collection_items) {
    return res.data.subject_collection_items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.card_subtitle || "",
      rating: (item.rating && item.rating.value) ? item.rating.value : 0,
      releaseDate: item.year || "",
      genres: item.genres || [],
      voteCount: (item.rating && item.rating.count) ? item.rating.count : 0,
      lastUpdate: new Date().toISOString().split('T')[0]
    }));
  }
  return [];
}

// --- TMDB Discover（已修复地区筛选）---
async function fetchTmdbDiscover(type, offset, apiKey, params) {
  const page = Math.floor(offset / 20) + 1;
  let endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
  
  let queryParams = {
    language: "zh-CN",
    page: page,
    include_adult: false,
    sort_by: params.sort_by || "popularity.desc"
  };

  // ==================== 修复：电影/剧集 地区筛选 100% 生效 ====================
  if (type === 'movie' || type === 'tv') {
    const region = params.region || "all";
    if (region === "CN") {
      queryParams.with_origin_country = "CN";
    } else if (region === "foreign") {
      queryParams.without_origin_country = "CN";
    }
  }

  if (type === 'anime') {
    endpoint = '/discover/tv';
    const genreParam = params.genre || "16";
    
    if (genreParam.includes('_')) {
      const [genreIds, languageCode] = genreParam.split('_');
      queryParams.with_genres = genreIds;
      
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
      }
    } else {
      queryParams.with_genres = genreParam;
    }
  } else if (type === 'tv') {
    queryParams.without_genres = "16,10764,10767";
  }

  return await sendTmdbRequest(endpoint, queryParams, apiKey);
}

// --- TMDB 搜索 ---
async function searchTmdb(keyword, mediaType, apiKey) {
  if (!keyword || !apiKey) return null;
  
  const yearMatch = keyword.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : null;
  const cleanTitle = keyword
    .replace(/([（(][^）)]*[)）])/g, '')
    .replace(/剧场版|特别篇|动态漫|中文配音|中配|粤语版|国语版/g, '')
    .replace(/第[0-9一二三四五六七八九十]+季/g, '')
    .trim();
  
  const query = {
    query: cleanTitle,
    language: "zh-CN",
    page: 1
  };
  if (year) query.year = year;

  const results = await sendTmdbRequest(`/search/${mediaType}`, query, apiKey);

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

// --- TMDB 请求 ---
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
        const genre_ids = item.genre_ids || [];
        const isAnime = genre_ids.includes(16);
        const isVariety = genre_ids.some(id => 
          DOMESTIC_VARIETY_CONFIG.tmdbGenreIds.split(',').includes(id.toString())
        );
        let tags = [];
        
        if (isAnime) {
          let animeType = "";
          if (item.original_language === 'zh' || item.original_language === 'zh-CN') {
            animeType = "国漫";
          } else if (item.original_language === 'ja') {
            animeType = "日漫";
          } else if (item.original_language === 'ko') {
            animeType = "韩漫";
          } else if (item.original_language === 'en') {
            animeType = (item.origin_country && item.origin_country.includes('US')) ? "美漫" : "英漫";
          }
          tags = ["动画", animeType];
        }
        
        if (isVariety) {
          const varietyType = genre_ids.includes(10764) ? "真人秀" : "脱口秀";
          const isCN = item.origin_country && item.origin_country.includes('CN');
          tags = ["综艺", varietyType, isCN ? "国产" : ""];
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
          lastUpdate: item.updated_at || item.release_date || item.first_air_date || ""
        };
      });
    }
  } catch (err) {
    console.error(`TMDB 请求错误: ${err.message}`);
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
    case 'primary_release_date.desc':
    case 'first_air_date.desc':
      sortedItems.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      break;
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