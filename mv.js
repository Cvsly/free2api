const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

var WidgetMetadata = {
  id: "movie_shows",
  title: "热门榜单 (完整版)",
  description: "含电影/剧集/动漫/国内综艺",
  author: "crush7s",
  site: "",
  version: "2.3.0",
  requiredVersion: "0.0.1",
  globalParams: [
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      description: "必填：支持 32位短 Key 或 v4 长 Token"
    },
  ],
  modules: [
    {
      title: "热门电影",
      description: "查看实时热门电影，支持排序",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 3600, // 恢复原缓存
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "上映日期", value: "release_date.desc" },
            { title: "最近更新", value: "updated.desc" }
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
      cacheDuration: 3600, // 恢复原缓存
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "上映日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated.desc" }
          ],
          default: "popularity.desc"
        },
        // 剧集同步新增地区分类
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
      cacheDuration: 3600, // 恢复原缓存
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          enumOptions: [
            { title: "热度排行", value: "popularity.desc" },
            { title: "评分排行", value: "vote_average.desc" },
            { title: "上映日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated.desc" }
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
  const uniqueItems =...