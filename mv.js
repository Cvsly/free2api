const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

var WidgetMetadata = {
  id: "movie_shows",
  title: "热门榜单 (完整版)",
  description: "电影/剧集 豆瓣+TMDB双源合并 | 动漫/综艺 TMDB源",
  author: "crush7s",
  site: "",
  version: "2.8.0",
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
      description: "豆瓣 + TMDB 双源合并",
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
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门剧集",
      description: "豆瓣 + TMDB 双源合并",
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
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门动漫",
      description: "实时动漫番剧 完整元数据",
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
      description: "爱奇艺/腾讯/芒果/优酷 聚合",
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

// --- 综艺 ---
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

// --- 核心：电影/剧集 = 豆瓣 + TMDB 同时拉取 + 合并 + 去重 + TMDB兜底 ---
async function getDataWithFallback(type, params) {
  const apiKey = params.TMDB_API_KEY;
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";

  if (!apiKey) {
    return [{ 
      id: "error_no_api_key",
      title: "请填写 TMDB API Key", 
      description: "在组件设置中配置", 
      type: "text",
      mediaType: "text"
    }];
  }

  let doubanItems = [];
  let tmdbItems = [];

  // 1. 同时拉取 豆瓣 + TMDB
  if (type === 'movie' || type === 'tv') {
    try {
      doubanItems = await fetchDouban(type, offset);
    } catch (e) {}
    try {
      tmdbItems = await fetchTmdbDiscover(type, offset, apiKey, params);
    } catch (e) {}
  } else {
    tmdbItems = await fetchTmdbDiscover(type, offset, apiKey, params);
  }

  // 2. 合并数据
  let combined = [...doubanItems, ...tmdbItems];

  // 3. 按标题去重
  const titleMap = new Map();
  combined.forEach(item => {
    const key = (item.title || '').trim().toLowerCase();
    if (!titleMap.has(key)) titleMap.set(key, item);
  });
  let items = Array.from(titleMap.values());

  // 4. 全部用 TMDB 补全封面 & 元数据
  const searchType = type === 'movie' ? 'movie' : 'tv';
  const tasks = items.map(async (item) => {
    const match = await searchTmdb(item.title, searchType, apiKey);
    if (match) {
      return { ...item, ...match, type: match.type || 'tmdb' };
    }
    return item;
  });
  items = await Promise.all(tasks);
  items = items.filter(i => i && i.title);

  return applySorting(items, sortBy, type);
}

// --- 豆瓣基础数据 ---
async function fetchDouban(type, offset) {
  let url = '';
  const start = offset;
  const limit = 20;

  if (type === 'movie') {
    url = `https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items?start=${start}&count=${limit}`;
  } else if (type === 'tv') {
    url = `https://m.douban.com/rexxar/api/v2/subject_collection/tv_domestic/items?start=${start}&count=${limit}`;
  }

  try {
    const res = await Widget.http.get(url, {
      headers: { Referer: "https://m.douban.com/", "User-Agent": USER_AGENT }
    });
    if (res.data?.subject_collection_items) {
      return res.data.subject_collection_items.map(item => ({
        id: `douban_${item.id}`,
        title: item.title,
        releaseDate: item.year || ''
      }));
    }
  } catch (e) {}
  return [];
}

// --- TMDB 列表 ---
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
      const [g, lang] = genreParam.split('_');
      queryParams.with_genres = g;
      if (lang === 'zh') queryParams.with_original_language = 'zh';
      else if (lang === 'ja') queryParams.with_original_language = 'ja';
      else if (lang === 'ko') queryParams.with_original_language = 'ko';
      else if (lang === 'fr') queryParams.with_original_language = 'fr';
      else if (lang === 'en_gb') { queryParams.with_original_language = 'en'; queryParams.with_origin_country = 'GB'; }
      else if (lang === 'en') { queryParams.with_original_language = 'en'; queryParams.with_origin_country = 'US'; }
    } else {
      queryParams.with_genres = genreParam;
    }
  } else if (type === 'tv') {
    queryParams.without_genres = "16,10764,10767";
  }

  return await sendTmdbRequest(endpoint, queryParams, apiKey);
}

// --- TMDB 搜索匹配 ---
async function searchTmdb(keyword, mediaType, apiKey) {
  if (!keyword || !apiKey) return null;
  const clean = keyword.replace(/[（）()剧场版特别篇季\d]+/g, '').trim();
  const res = await sendTmdbRequest(`/search/${mediaType}`, {
    query: clean, language: "zh-CN"
  }, apiKey);
  return res?.[0] || null;
}

// --- TMDB 请求 ---
async function sendTmdbRequest(path, params, apiKey) {
  if (!apiKey) return [];
  const url = `https://api.themoviedb.org/3${path}`;
  let headers = { "Content-Type": "application/json;charset=utf-8" };
  let p = { ...params };

  if (apiKey.length > 50) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    p.api_key = apiKey;
  }

  try {
    const res = await Widget.http.get(url, { params: p, headers });
    if (res.data?.results) {
      return res.data.results.map(item => ({
        id: `tmdb_${item.id}`,
        type: "tmdb",
        title: item.title || item.name,
        description: item.overview || "暂无简介",
        posterPath: item.poster_path ? IMAGE_BASE + item.poster_path : null,
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
        releaseDate: item.release_date || item.first_air_date || "",
        rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
        mediaType: path.includes('movie') ? 'movie' : 'tv',
        popularity: item.popularity || 0,
        voteCount: item.vote_count || 0,
        lastUpdate: item.updated_at || item.release_date || item.first_air_date || ""
      }));
    }
  } catch (err) {}
  return [];
}

// --- 统一排序 ---
function applySorting(items, sortBy, type) {
  if (!items?.length) return [];
  const s = [...items];
  switch (sortBy) {
    case 'vote_average.desc':
      return s.sort((a,b) => (b.rating||0)-(a.rating||0));
    case 'primary_release_date.desc':
    case 'first_air_date.desc':
      return s.sort((a,b) => new Date(b.releaseDate||0) - new Date(a.releaseDate||0));
    case 'updated_at.desc':
      return s.sort((a,b) => new Date(b.lastUpdate||0) - new Date(a.lastUpdate||0));
    default:
      return s.sort((a,b) => (b.popularity||0)-(a.popularity||0));
  }
}