/**
 * AI 影视推荐模块
 * 修复：解决无法加载资源问题，添加loadDetail详情加载函数
 * 修复：添加link字段，支持Forward资源聚合
 * 修复：TMDB搜索失败时返回text类型，避免无效资源加载
 * 优化：兼容更多第三方接口
 * 优化：AI提示词调整，新增演员作品推荐
 * 优化：API接口路径自动补齐
 * 优化：TMDB标题返回显示详情
 */
const USER_AGENT = "Mozilla/5.0";
// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方接口",
  author: "crush7s",
  version: "5.4.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com",
      description: "点击右侧按钮可选择预设API地址",
      placeholders: [
        { title: "OpenAI 官方", value: "https://api.openai.com" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com" },
        { title: "硅基流动", value: "https://api.siliconflow.cn" },
        { title: "自定义", value: "" }
      ]
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },
    { name: "aiApiKey", title: "API Key", type: "input", required: true },
    { name: "aiModel", title: "模型", type: "input", defaultValue: "gpt-4o-mini" },
    { name: "TMDB_API_KEY", title: "TMDB Key", type: "input" },
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "6部", value: "6" },
        { title: "9部", value: "9" },
        { title: "12部", value: "12" }
      ],
      defaultValue: "9"
    }
  ],
  modules: [
    {
      id: "smartRecommend",
      title: "AI推荐",
      functionName: "loadAIList",
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true,
          value: "",
          placeholders: [
            { title: "悬疑烧脑", value: "悬疑烧脑" },
            { title: "科幻巨制", value: "科幻巨制" },
            { title: "爆笑喜剧", value: "爆笑喜剧" },
            { title: "动作爽片", value: "动作爽片" },
            { title: "恐怖惊悚", value: "恐怖惊悚" },
            { title: "周星驰", value: "周星驰" },
            { title: "汤姆·克鲁斯", value: "汤姆·克鲁斯" }
          ]
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      functionName: "loadSimilarList",
      params: [
        { name: "referenceTitle", title: "喜欢的作品", type: "input", required: true }
      ]
    }
  ]
};
// ==================== OpenAI ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : "Bearer " + apiKey;
  }
  var body = { model: model, messages: messages };
  return await Widget.http.post(apiUrl, body, { headers: headers, timeout: 60000 });
}
// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  var base = apiUrl.replace(/\/+$/, "");
  if (base.indexOf("/v1") === -1) base += "/v1beta";
  var modelName = model || "gemini-1.5-flash";
  if (modelName.indexOf("models/") !== 0) modelName = "models/" + modelName;
  var url = base + "/" + modelName + ":generateContent?key=" + apiKey;
  var body = {
    contents: [{
      parts: [{
        text: "你是一个影视助手。请推荐" + count + "部" + prompt + "相关影视作品。" +
              "如果输入的是演员名字，请返回该演员主演/参演的代表作品。" +
              "只返回名称，不要编号，不要解释."
      }]
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
  };
  var res = await Widget.http.post(url, body, { headers: { "Content-Type": "application/json" } });
  return extractContent(res);
}
// ==================== 提取内容 ====================
function extractContent(res) {
  if (!res) return "";
  if (res.choices && res.choices[0]) {
    var c = res.choices[0];
    if (c.message && c.message.content) return c.message.content;
    if (c.text) return c.text;
  }
  if (res.candidates?.[0]?.content?.parts?.[0]) {
    return res.candidates[0].content.parts[0].text;
  }
  if (res.data) return extractContent(res.data);
  if (typeof res === "string") return res;
  return "";
}
// ==================== URL 修复 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";
  apiUrl = apiUrl.replace(/\/+$/, "");
  if (format === "gemini") return apiUrl;
  if (apiUrl.includes("/chat/completions")) return apiUrl;
  if (apiUrl.endsWith("/v1")) return apiUrl + "/chat/completions";
  if (!apiUrl.includes("/v1")) return apiUrl + "/v1/chat/completions";
  return apiUrl;
}
// ==================== AI入口 ====================
async function callAI(config) {
  if (config.format === "gemini") {
    return await callGeminiFormat(config.apiUrl, config.apiKey, config.model, config.prompt, config.count);
  }
  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);
  var messages = [
    { role: "system", content: "你是影视推荐助手。只返回影视名称。" },
    { role: "user", content: "推荐" + config.count + "部与" + config.prompt + "相关的影视作品" }
  ];
  var res = await callOpenAIFormat(finalUrl, config.apiKey, config.model, messages);
  return extractContent(res);
}
// ==================== 名称解析 ====================
function parseNames(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map(t => t.trim())
    .map(t => t.replace(/^\d+[\.\、\)）\s\-]+/, ""))
    .filter(t => t.length > 0)
    .slice(0, 15);
}
// ==================== 类型映射 ====================
function getGenreNames(ids) {
  var map = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧",
    80: "犯罪", 99: "纪录", 18: "剧情", 10751: "家庭",
    14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻",
    53: "惊悚", 10752: "战争", 37: "西部",
    10759: "动作冒险", 10762: "儿童", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧",
    10767: "脱口秀", 10768: "战争政治", 10770: "电视电影"
  };
  if (!ids || !ids.length) return "";
  var arr = [];
  for (var i = 0; i < ids.length; i++) {
    if (map[ids[i]]) arr.push(map[ids[i]]);
    if (arr.length >= 2) break;
  }
  return arr.join("/");
}
// ==================== 🔥 优化版 TMDB 搜索 ====================
async function searchTMDB(title, type, key) {
  try {
    var res;
    if (key) {
      res = await Widget.http.get(
        "https://api.themoviedb.org/3/search/" + type,
        {
          params: {
            api_key: key,
            query: title,
            language: "zh-CN",
            include_adult: false
          }
        }
      );
      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: {
          query: title,
          language: "zh-CN",
          include_adult: false
        }
      });
    }
    if (!res || !res.results || res.results.length === 0) return null;
    // 综合评分和人气排序
    res.results.sort((a, b) => {
      var scoreA = (a.vote_average || 0) * Math.log((a.vote_count || 1) + 1);
      var scoreB = (b.vote_average || 0) * Math.log((b.vote_count || 1) + 1);
      return scoreB - scoreA;
    });
    var item = res.results[0];
    // 主标题
    var titleName = item.title || item.name || title;
    // 🔥 年份：只取一次
    var rawDate = item.release_date || item.first_air_date || "";
    var year = rawDate ? rawDate.substring(0, 4) : "";
    // 🔥 类型：优先使用 genre_ids，缺失时使用媒体类型
    var genres = getGenreNames(item.genre_ids);
    if (!genres) {
      genres = (type === "movie" ? "电影" : "剧集");
    }
    // 🔥 副标题格式：年份·类型（年份只显示一次）
    var yearGenre = year ? year + "·" + genres : genres;
    // 简介
    var overview = item.overview || "暂无简介";
    if (overview.length > 200) overview = overview.substring(0, 200) + "...";
    // 海报
    var posterPath = item.poster_path 
      ? "https://image.tmdb.org/t/p/w500" + item.poster_path 
      : null;
    // 生成唯一ID和链接
    var itemId = type + "." + item.id;
    return {
      id: itemId,
      tmdbId: parseInt(item.id),
      type: "tmdb",
      mediaType: type,
      title: titleName,
      subTitle: yearGenre,       // 副标题：年份·类型
      genreTitle: genres,        // 纯类型文本
      description: overview,
      posterPath: posterPath,
      releaseDate: rawDate,
      rating: item.vote_average || 0,
      link: itemId               // ✅ 关键修复：添加link字段
    };
  } catch (e) {
    console.error("TMDB搜索出错:", e.message);
    return null;
  }
}
// ==================== ✅ 新增：详情加载函数（核心修复） ====================
async function loadDetail(link, params) {
  try {
    // 解析link格式：type.id (如 movie.345887)
    var parts = link.split(".");
    var mediaType = parts[0];
    var tmdbId = parseInt(parts[1]);
    
    if (!tmdbId || !mediaType || (mediaType !== "movie" && mediaType !== "tv")) {
      throw new Error("无效的资源ID格式");
    }
    
    // 获取TMDB完整详情
    var res;
    if (params.TMDB_API_KEY) {
      res = await Widget.http.get(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}`,
        {
          params: {
            api_key: params.TMDB_API_KEY,
            language: "zh-CN",
            append_to_response: "credits,videos"
          }
        }
      );
      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get(`/${mediaType}/${tmdbId}`, {
        params: {
          language: "zh-CN",
          append_to_response: "credits,videos"
        }
      });
    }
    
    if (!res) {
      throw new Error("无法获取影视详情");
    }
    
    // 处理返回数据
    var titleName = res.title || res.name || "";
    var rawDate = res.release_date || res.first_air_date || "";
    var year = rawDate ? rawDate.substring(0, 4) : "";
    var genres = getGenreNames(res.genres?.map(g => g.id) || []);
    if (!genres) genres = mediaType === "movie" ? "电影" : "剧集";
    
    var overview = res.overview || "暂无简介";
    var posterPath = res.poster_path 
      ? "https://image.tmdb.org/t/p/w500" + res.poster_path 
      : null;
    var backdropPath = res.backdrop_path 
      ? "https://image.tmdb.org/t/p/original" + res.backdrop_path 
      : null;
    
    // 处理时长
    var runtime = res.runtime || res.episode_run_time?.[0] || 0;
    var durationText = "";
    if (runtime > 0) {
      var hours = Math.floor(runtime / 60);
      var minutes = runtime % 60;
      durationText = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
    }
    
    // ✅ 返回完整信息，让Forward聚合引擎自动关联资源
    // 注意：不需要手动返回videoUrl，由Forward内部聚合引擎处理
    return {
      id: link,
      type: "tmdb",
      tmdbId: tmdbId,
      mediaType: mediaType,
      title: titleName,
      subTitle: year + "·" + genres,
      genreTitle: genres,
      description: overview,
      posterPath: posterPath,
      backdropPath: backdropPath,
      releaseDate: rawDate,
      rating: res.vote_average || 0,
      duration: runtime,
      durationText: durationText,
      // 演员信息（可选，提升聚合匹配率）
      cast: res.credits?.cast?.slice(0, 10).map(c => c.name) || []
    };
  } catch (e) {
    console.error("加载详情出错:", e.message);
    throw new Error(`资源加载失败: ${e.message}`);
  }
}
// ==================== 主入口 ====================
async function loadAIList(params) {
  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel || "gpt-4o-mini",
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 9
  };
  try {
    var text = await callAI(config);
    var names = parseNames(text);
    var results = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var result = await searchTMDB(name, "movie", params.TMDB_API_KEY);
      if (!result) {
        result = await searchTMDB(name, "tv", params.TMDB_API_KEY);
      }
      if (result) {
        results.push(result);
      } else {
        // ✅ 修复：TMDB搜索失败时返回text类型，避免聚合引擎尝试加载资源
        results.push({
          id: "ai_" + i,
          type: "text",
          title: name,
          subTitle: "AI推荐（暂无资源）",
          genreTitle: "AI推荐",
          description: "未在TMDB中找到该作品的详细信息",
          posterPath: null,
          rating: 0
        });
      }
    }
    return results;
  } catch (e) {
    return [{
      id: "err",
      type: "text",
      title: "请求出错",
      subTitle: "错误",
      genreTitle: "错误",
      description: e.message
    }];
  }
}
// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}
console.log("✅ AI影视推荐模块 v5.4.0 已加载 - 资源加载问题修复完成");
