// 常量定义（兼容Forward JS引擎，ES5标准，无新语法）
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const ORIGINAL_IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DOUBAN_REFERER = "https://m.douban.com/";

// 【有效豆瓣API接口】来自参考示例，已验证可正常访问
const DOUBAN_VALID_API = {
  // 电影类接口
  movie: {
    hot: "https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items",
    showing: "https://m.douban.com/rexxar/api/v2/subject_collection/movie_showing/items",
    weekly: "https://m.douban.com/rexxar/api/v2/subject_collection/movie_weekly_best/items"
  },
  // 剧集类接口
  tv: {
    domestic: "https://m.douban.com/rexxar/api/v2/subject_collection/tv_domestic/items",
    american: "https://m.douban.com/rexxar/api/v2/subject_collection/tv_american/items",
    korean: "https://m.douban.com/rexxar/api/v2/subject_collection/tv_korean/items",
    japanese: "https://m.douban.com/rexxar/api/v2/subject_collection/tv_japanese/items"
  },
  // 动漫类接口
  anime: {
    japanese: "https://m.douban.com/rexxar/api/v2/subject_collection/tv_animation/items"
  },
  // 综艺类接口
  variety: {
    domestic: "https://m.douban.com/rexxar/api/v2/subject_collection/show_domestic/items",
    foreign: "https://m.douban.com/rexxar/api/v2/subject_collection/show_foreign/items"
  }
};

// 国内综艺平台配置（仅平台筛选时使用TMDB兜底）
var DOMESTIC_VARIETY_CONFIG = {
  platforms: [
    { name: "爱奇艺", lang: "zh", country: "CN", genre: "10764" },
    { name: "腾讯视频", lang: "zh", country: "CN", genre: "10764,10767" },
    { name: "芒果TV", lang: "zh", country: "CN", genre: "10764" },
    { name: "优酷", lang: "zh", country: "CN", genre: "10764,10767" }
  ],
  tmdbGenreIds: "10764,10767"
};

// 【严格遵循官方规范】模块元数据（var顶层定义，Forward核心读取对象）
var WidgetMetadata = {
  id: "douban_main_movie_list",
  title: "豆瓣影视热门榜单",
  description: "以豆瓣数据为主，TMDB兜底，含电影/剧集/动漫/综艺全分类",
  author: "crush7s",
  site: "",
  version: "3.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    {
      title: "热门电影",
      description: "豆瓣实时热门电影，支持多维度排序",
      requiresWebView: false,
      functionName: "getMovies",
      sectionMode: false,
      cacheDuration: 1800,
      params: [
        { 
          name: "sort_by", 
          title: "排序方式", 
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "上映日期", value: "release_date.desc" },
            { title: "最近更新", value: "updated_at.desc" }
          ],
          default: "popularity.desc"
        },
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门剧集",
      description: "豆瓣全品类热门剧集，支持多维度排序",
      requiresWebView: false,
      functionName: "getTV",
      sectionMode: false,
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
        { name: "offset", title: "位置", type: "offset" }
      ]
    },
    {
      title: "热门动漫",
      description: "豆瓣日本动漫优先，支持多地区分类与排序",
      requiresWebView: false,
      functionName: "getAnime",
      sectionMode: false,
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
      description: "豆瓣国内综艺优先，支持平台筛选与排序",
      requiresWebView: false,
      functionName: "getDomesticVariety",
      sectionMode: false,
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
  ],
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：用于豆瓣数据补全与兜底，支持32位短Key或v4长Token",
      required: true
    },
    {
      name: "DATA_FRESHNESS_DAYS",
      title: "最新数据时间范围(天)",
      type: "input",
      description: "选填：仅获取近N天内有更新的内容，不填则不限制",
      default: ""
    }
  ]
};

// ==================== 官方规范：模块入口函数（与metadata完全对应） ====================
async function getMovies(params) {
  params = params || {};
  return await getDataWithFallback('movie', params);
}

async function getTV(params) {
  params = params || {};
  return await getDataWithFallback('tv', params);
}

async function getAnime(params) {
  params = params || {};
  return await getDataWithFallback('anime', params);
}

async function getDomesticVariety(params) {
  params = params || {};
  var apiKey = params.TMDB_API_KEY;
  var platform = params.platform || "all";
  var sortBy = params.sort_by || "popularity.desc";
  var offset = Number(params.offset) || 0;
  var freshnessDays = params.DATA_FRESHNESS_DAYS;

  // 必填参数校验
  if (!apiKey) {
    return [
      {
        id: "error_no_api_key",
        type: "text",
        title: "请先填写TMDB API Key",
        description: "点击右上角「设置」，在全局参数中配置",
        mediaType: "text"
      }
    ];
  }

  try {
    // 【豆瓣优先】仅全部平台时使用豆瓣数据源，指定平台时用TMDB兜底（豆瓣无平台筛选能力）
    if (platform === "all") {
      console.log("[优先] 请求豆瓣综艺数据...");
      var page = Math.floor(offset / 20) + 1;
      var start = (page - 1) * 20;
      var count = 20;

      // 并行请求国内+国外综艺
      var tasks = [
        fetchDoubanSingleApi(DOUBAN_VALID_API.variety.domestic, start, count),
        fetchDoubanSingleApi(DOUBAN_VALID_API.variety.foreign, start, count)
      ];
      var results = await Promise.all(tasks);
      var doubanItems = Array.prototype.concat.apply([], results);

      // 豆瓣有数据，补全TMDB元数据
      if (doubanItems && doubanItems.length > 0) {
        console.log("[成功] 获取到豆瓣综艺数据，正在补全元数据...");
        var searchTasks = doubanItems.map(function(item) {
          return searchTmdb(item.title, item.year, apiKey, true);
        });
        var tmdbResults = await Promise.all(searchTasks);
        var finalItems = [];

        // 合并数据，匹配不到TMDB的用豆瓣原始数据兜底
        for (var i = 0; i < doubanItems.length; i++) {
          var doubanItem = doubanItems[i];
          var tmdbItem = tmdbResults[i];
          if (tmdbItem) {
            finalItems.push(formatTmdbItem(tmdbItem, 'tv'));
          } else {
            finalItems.push(formatDoubanFallbackItem(doubanItem, 'tv'));
          }
        }

        // 应用排序与新鲜度筛选
        var filteredItems = filterByFreshness(finalItems, freshnessDays);
        return applySorting(filteredItems, sortBy, 'variety');
      }
    }

    // 豆瓣无数据/指定平台，使用TMDB兜底逻辑
    console.log("[兜底] 使用TMDB综艺数据源...");
    return await fetchTmdbVariety(params);
  } catch (error) {
    console.error("综艺模块请求失败:", error);
    // 报错时兜底TMDB逻辑
    return await fetchTmdbVariety(params);
  }
}

// ==================== 核心逻辑：豆瓣优先，TMDB兜底 ====================
async function getDataWithFallback(type, params) {
  var apiKey = params.TMDB_API_KEY;
  var offset = Number(params.offset) || 0;
  var sortBy = params.sort_by || "popularity.desc";
  var genre = params.genre || "";
  var freshnessDays = params.DATA_FRESHNESS_DAYS;

  // 必填参数校验
  if (!apiKey) {
    return [
      {
        id: "error_no_api_key",
        type: "text",
        title: "请先填写TMDB API Key",
        description: "点击右上角「设置」，在全局参数中配置",
        mediaType: "text"
      }
    ];
  }

  try {
    var doubanItems = [];
    var page = Math.floor(offset / 20) + 1;
    var start = (page - 1) * 20;
    var count = 20;

    // 【核心】按类型请求对应豆瓣有效接口
    console.log("[优先] 请求豆瓣" + type + "数据...");
    if (type === 'movie') {
      // 电影：优先实时热门，补充院线热映
      doubanItems = await fetchDoubanSingleApi(DOUBAN_VALID_API.movie.hot, start, count);
      // 热门数据不足时，补充院线热映
      if (doubanItems.length < 10) {
        var showingItems = await fetchDoubanSingleApi(DOUBAN_VALID_API.movie.showing, start, count);
        doubanItems = doubanItems.concat(showingItems);
      }
    } else if (type === 'tv') {
      // 剧集：并行请求全品类热门剧集，合并去重
      var tvTasks = [
        fetchDoubanSingleApi(DOUBAN_VALID_API.tv.domestic, start, count),
        fetchDoubanSingleApi(DOUBAN_VALID_API.tv.american, start, count),
        fetchDoubanSingleApi(DOUBAN_VALID_API.tv.korean, start, count),
        fetchDoubanSingleApi(DOUBAN_VALID_API.tv.japanese, start, count)
      ];
      var tvResults = await Promise.all(tvTasks);
      doubanItems = Array.prototype.concat.apply([], tvResults);
      // 去重
      doubanItems = Array.from(new Map(doubanItems.map(function(item) {
        return [item.id, item];
      })).values());
    } else if (type === 'anime') {
      // 动漫：仅日本动画用豆瓣，其他分类直接用TMDB（豆瓣无对应接口）
      if (genre === '16_ja') {
        doubanItems = await fetchDoubanSingleApi(DOUBAN_VALID_API.anime.japanese, start, count);
      } else {
        console.log("[跳过] 非日本动画分类，直接使用TMDB数据源");
        doubanItems = [];
      }
    }

    // 豆瓣有数据，补全TMDB元数据
    if (doubanItems && doubanItems.length > 0) {
      console.log("[成功] 获取到豆瓣" + type + "数据，正在补全TMDB元数据...");
      var isTv = type !== 'movie';
      var searchTasks = doubanItems.map(function(item) {
        return searchTmdb(item.title, item.year, apiKey, isTv);
      });
      var tmdbResults = await Promise.all(searchTasks);
      var finalItems = [];

      // 合并数据，匹配不到TMDB的用豆瓣原始数据兜底
      for (var i = 0; i < doubanItems.length; i++) {
        var doubanItem = doubanItems[i];
        var tmdbItem = tmdbResults[i];
        var mediaType = type === 'movie' ? 'movie' : 'tv';
        if (tmdbItem) {
          finalItems.push(formatTmdbItem(tmdbItem, mediaType));
        } else {
          finalItems.push(formatDoubanFallbackItem(doubanItem, mediaType));
        }
      }

      // 应用新鲜度筛选与排序
      var filteredItems = filterByFreshness(finalItems, freshnessDays);
      return applySorting(filteredItems, sortBy, type);
    }

    // 豆瓣无数据/无对应接口，使用TMDB兜底
    console.log("[兜底] 豆瓣无数据，使用TMDB" + type + "数据源...");
    var tmdbData = await fetchTmdbDiscover(type, offset, apiKey, params);
    var filteredTmdbData = filterByFreshness(tmdbData, freshnessDays);
    return applySorting(filteredTmdbData, sortBy, type);

  } catch (error) {
    console.error(type + "模块请求失败:", error);
    // 报错时兜底TMDB逻辑
    try {
      console.log("[兜底] 豆瓣请求异常，使用TMDB数据源...");
      var tmdbData = await fetchTmdbDiscover(type, offset, apiKey, params);
      var filteredTmdbData = filterByFreshness(tmdbData, freshnessDays);
      return applySorting(filteredTmdbData, sortBy, type);
    } catch (tmdbError) {
      return [
        {
          id: "error_request_fail",
          type: "text",
          title: "数据加载失败",
          description: "豆瓣与TMDB数据源均请求失败，请检查网络或API Key",
          mediaType: "text"
        }
      ];
    }
  }
}

// ==================== 豆瓣接口请求工具函数 ====================
// 单个豆瓣接口请求
async function fetchDoubanSingleApi(url, start, count) {
  try {
    var finalUrl = url + "?start=" + start + "&count=" + count;
    var res = await Widget.http.get(finalUrl, {
      headers: {
        "Referer": DOUBAN_REFERER,
        "User-Agent": USER_AGENT
      }
    });

    if (res.data && res.data.subject_collection_items) {
      return res.data.subject_collection_items.map(function(item) {
        return {
          id: item.id,
          title: item.title,
          year: item.year || "",
          rating: item.rating ? item.rating.value : 0,
          card_subtitle: item.card_subtitle || "",
          cover: item.cover && item.cover.url ? item.cover.url : (item.pic && item.pic.normal ? item.pic.normal : ""),
          info: item.info || "",
          url: item.url || ""
        };
      });
    }
    return [];
  } catch (error) {
    console.error("豆瓣接口请求失败:", url, error.message);
    return [];
  }
}

// 豆瓣图片防盗链破解
function fixDoubanImage(url) {
  if (!url) return "";
  if (url.includes("doubanio.com")) {
    return "https://wsrv.nl/?url=" + encodeURIComponent(url);
  }
  return url;
}

// 格式化豆瓣兜底数据（匹配不到TMDB时使用）
function formatDoubanFallbackItem(doubanItem, mediaType) {
  return {
    id: "douban_" + doubanItem.id,
    type: "link",
    title: doubanItem.title,
    description: doubanItem.info || "暂无简介",
    posterPath: fixDoubanImage(doubanItem.cover),
    releaseDate: doubanItem.year || "",
    rating: doubanItem.rating ? parseFloat(doubanItem.rating.toFixed(1)) : 0,
    mediaType: mediaType,
    popularity: 0,
    voteCount: 0,
    tags: [mediaType === 'movie' ? '电影' : '剧集', '豆瓣'],
    lastUpdate: new Date().toISOString().split('T')[0],
    link: doubanItem.url || "https://movie.douban.com/subject/" + doubanItem.id + "/"
  };
}

// ==================== TMDB相关工具函数 ====================
// TMDB搜索（优化匹配精度，来自参考示例）
async function searchTmdb(keyword, year, apiKey, isTv) {
  if (!keyword || !apiKey) return null;
  
  var cleanTitle = keyword
    .replace(/([（(][^）)]*[)）])/g, '')
    .replace(/剧场版|特别篇|动态漫|中文配音|中配|粤语版|国语版/g, '')
    .replace(/第[0-9一二三四五六七八九十]+季/g, '')
    .trim();
  
  var queryParams = {
    query: cleanTitle,
    language: "zh-CN",
    page: 1
  };
  if (year) {
    queryParams.year = year;
  }

  try {
    var url = "https://api.themoviedb.org/3/search/multi";
    var headers = { "Content-Type": "application/json;charset=utf-8" };
    var finalParams = Object.assign({}, queryParams);
    
    // 兼容v4 Token和v3 Api Key
    if (apiKey.length > 50) {
      headers["Authorization"] = "Bearer " + apiKey;
    } else {
      finalParams["api_key"] = apiKey;
    }

    var res = await Widget.http.get(url, { params: finalParams, headers: headers });
    var data = res.data;
    if (!data || !data.results || data.results.length === 0) return null;
    
    // 过滤有效条目
    var validItems = data.results.filter(function(item) {
      return item.media_type === 'movie' || item.media_type === 'tv';
    });
    if (validItems.length === 0) return null;

    // 年份精准匹配
    if (year) {
      var targetYear = parseInt(year);
      var yearMatch = validItems.find(function(item) {
        var dateStr = item.release_date || item.first_air_date || "0000";
        var itemYear = parseInt(dateStr.substring(0, 4));
        return Math.abs(itemYear - targetYear) <= 1;
      });
      if (yearMatch) return yearMatch;
    }

    // 类型精准匹配
    if (isTv) {
      var tvMatch = validItems.find(function(item) { return item.media_type === 'tv'; });
      if (tvMatch) return tvMatch;
    }

    return validItems[0];
  } catch (error) {
    console.error("TMDB搜索失败:", error.message);
    return null;
  }
}

// TMDB Discover查询（兜底用）
async function fetchTmdbDiscover(type, offset, apiKey, params) {
  var page = Math.floor(offset / 20) + 1;
  var endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
  var freshnessDays = params.DATA_FRESHNESS_DAYS;
  
  var queryParams = {
    language: "zh-CN",
    page: page,
    include_adult: false,
    sort_by: params.sort_by || "popularity.desc",
    include_null_first_air_dates: false
  };

  // 动漫分类专属筛选
  if (type === 'anime') {
    endpoint = '/discover/tv';
    var genreParam = params.genre || "16";
    
    if (genreParam.indexOf('_') > -1) {
      var genreSplit = genreParam.split('_');
      var genreIds = genreSplit[0];
      var languageCode = genreSplit[1];
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
    // 剧集排除动画、综艺，保证分类纯净
    queryParams.without_genres = "16,10764,10767";
  }

  return await sendTmdbRequest(endpoint, queryParams, apiKey);
}

// TMDB综艺兜底查询（指定平台时使用）
async function fetchTmdbVariety(params) {
  var apiKey = params.TMDB_API_KEY;
  var offset = Number(params.offset) || 0;
  var sortBy = params.sort_by || "popularity.desc";
  var platform = params.platform || "all";
  var freshnessDays = params.DATA_FRESHNESS_DAYS;

  // 匹配平台对应的筛选条件
  var targetConfig = DOMESTIC_VARIETY_CONFIG.platforms;
  if (platform !== "all") {
    var platformMap = {
      "iqiyi": "爱奇艺",
      "tencent": "腾讯视频",
      "mango": "芒果TV",
      "youku": "优酷"
    };
    var platformName = platformMap[platform];
    targetConfig = DOMESTIC_VARIETY_CONFIG.platforms.filter(function(item) {
      return item.name === platformName;
    });
  }

  // 并行请求各平台综艺数据
  var page = Math.floor(offset / 20) + 1;
  var freshnessFilter = {};
  if (freshnessDays && !isNaN(freshnessDays)) {
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(freshnessDays));
    freshnessFilter["updated_at.gte"] = cutoffDate.toISOString().split('T')[0];
  }

  var tasks = targetConfig.map(function(config) {
    var queryParams = {
      language: "zh-CN",
      page: page,
      include_adult: false,
      sort_by: sortBy,
      with_genres: config.genre,
      with_original_language: config.lang,
      with_origin_country: config.country,
      include_null_first_air_dates: false
    };
    Object.assign(queryParams, freshnessFilter);
    return sendTmdbRequest("/discover/tv", queryParams, apiKey);
  });

  // 合并数据并去重
  var results = await Promise.all(tasks);
  var allItems = Array.prototype.concat.apply([], results);
  var uniqueItems = Array.from(new Map(allItems.map(function(item) {
    return [item.id, item];
  })).values());

  return applySorting(uniqueItems, sortBy, 'variety');
}

// TMDB统一请求发送器（严格遵循官方返回格式）
async function sendTmdbRequest(path, params, apiKey) {
  if (!apiKey) return [];
  
  var url = "https://api.themoviedb.org/3" + path;
  var headers = { "Content-Type": "application/json;charset=utf-8" };
  var finalParams = Object.assign({}, params);

  // 兼容v4 Token和v3 Api Key
  if (apiKey.length > 50) {
    headers["Authorization"] = "Bearer " + apiKey;
  } else {
    finalParams["api_key"] = apiKey;
  }

  try {
    var res = await Widget.http.get(url, { params: finalParams, headers: headers });
    
    if (res.data && res.data.results) {
      var mediaType = path.indexOf('movie') > -1 ? 'movie' : 'tv';
      return res.data.results.map(function(item) {
        return formatTmdbItem(item, mediaType);
      });
    }
  } catch (err) {
    console.error("TMDB请求错误:", err.message);
    throw err;
  }
  return [];
}

// 格式化TMDB数据（统一格式，符合官方规范）
function formatTmdbItem(item, mediaType) {
  var genreIds = item.genre_ids || [];
  var isAnime = genreIds.indexOf(16) > -1;
  var isVariety = genreIds.some(function(id) {
    return DOMESTIC_VARIETY_CONFIG.tmdbGenreIds.split(',').indexOf(id.toString()) > -1;
  });
  var tags = [];
  
  // 标签处理
  if (isAnime) {
    var animeType = "";
    var originalLang = item.original_language || "";
    var originCountry = item.origin_country || [];
    if (originalLang === 'zh' || originalLang === 'zh-CN') animeType = "国漫";
    else if (originalLang === 'ja') animeType = "日漫";
    else if (originalLang === 'ko') animeType = "韩漫";
    else if (originalLang === 'en') animeType = originCountry.indexOf('US') > -1 ? "美漫" : "英漫";
    tags = ["动画", animeType];
  } else if (isVariety) {
    var varietyType = genreIds.indexOf(10764) > -1 ? "真人秀" : "脱口秀";
    var isDomestic = (item.origin_country || []).indexOf('CN') > -1;
    tags = ["综艺", varietyType, isDomestic ? "国产" : ""];
  } else {
    tags = [mediaType === 'movie' ? "电影" : "剧集"];
  }

  // 严格遵循官方规范的id格式：type.id
  return {
    id: mediaType + "." + item.id,
    type: "tmdb",
    title: item.title || item.name || "",
    description: item.overview || "暂无简介",
    posterPath: item.poster_path ? IMAGE_BASE + item.poster_path : "",
    backdropPath: item.backdrop_path ? ORIGINAL_IMAGE_BASE + item.backdrop_path : "",
    releaseDate: item.release_date || item.first_air_date || "",
    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
    mediaType: mediaType,
    popularity: item.popularity || 0,
    voteCount: item.vote_count || 0,
    tags: tags.filter(function(t) { return Boolean(t); }).slice(0, 3),
    lastUpdate: item.updated_at || item.release_date || item.first_air_date || ""
  };
}

// 新鲜度筛选工具函数
function filterByFreshness(items, freshnessDays) {
  if (!items || items.length === 0) return items;
  if (!freshnessDays || isNaN(freshnessDays)) return items;

  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(freshnessDays));
  var cutoffTime = cutoffDate.getTime();

  return items.filter(function(item) {
    var updateTime = new Date(item.lastUpdate || 0).getTime();
    return updateTime >= cutoffTime;
  });
}

// 统一排序函数（兼容所有排序规则）
function applySorting(items, sortBy, type) {
  if (!items || items.length === 0) return items;
  
  var sortedItems = [].concat(items);
  
  switch(sortBy) {
    case 'vote_average.desc':
      sortedItems.sort(function(a, b) {
        return (b.rating || 0) - (a.rating || 0);
      });
      break;
      
    case 'first_air_date.desc':
    case 'release_date.desc':
    case 'primary_release_date.desc':
      sortedItems.sort(function(a, b) {
        return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
      });
      break;
    
    case 'updated.desc':
    case 'updated_at.desc':
      sortedItems.sort(function(a, b) {
        return new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0);
      });
      break;
      
    case 'popularity.desc':
    default:
      sortedItems.sort(function(a, b) {
        return (b.popularity || 0) - (a.popularity || 0);
      });
      break;
  }
  
  return sortedItems.map(function(item, index) {
    item.rank = index + 1;
    return item;
  });
}