const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

var WidgetMetadata = {
  id: "movie_shows",
  title: "热门榜单 (完整版)",
  description: "含电影/剧集/动漫/国内综艺，实时更新最新片单",
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
      description: "查看实时热门电影（正在热映/即将上映/今日趋势），支持排序",
      requiresWebView: false,
      functionName: "getMovies",
      cacheDuration: 1800, // 缩短缓存到30分钟，保证数据更新
      params: [
        { 
          name: "category", 
          title: "片单分类", 
          type: "enumeration",
          enumOptions: [
            { title: "正在热映", value: "now_playing" },
            { title: "即将上映", value: "upcoming" },
            { title: "今日热门", value: "trending_day" },
            { title: "本周趋势", value: "trending_week" },
            { title: "经典排行", value: "discover" }
          ],
          default: "now_playing"
        },
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
            { title: "上映日期", value: "first_air_date.desc" },
            { title: "最近更新", value: "updated.desc" }
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

// --- 核心逻辑：电影/剧集/动漫（优化数据源） ---
async function getDataWithFallback(type, params) {
  const apiKey = params.TMDB_API_KEY;
  const offset = Number(params.offset) || 0;
  const sortBy = params.sort_by || "popularity.desc";
  const category = params.category || "now_playing";
  
  let items = [];
  if (type === 'movie') {
    try {
      console.log(`[尝试] 请求豆瓣 ${category} 电影数据...`);
      items = await fetchDoubanMovies(category, offset);
    } catch (e) {
      console.log(`[跳过] 豆瓣请求失败，切换到TMDB数据源`);
    }
  } else if (['tv'].includes(type)) {
    try {
      console.log(`[尝试] 请求豆瓣 ${type} 数据...`);
      items = await fetchDouban(type, offset);
    } catch (e) {
      console.log(`[跳过] 豆瓣请求失败`);
    }
  }...