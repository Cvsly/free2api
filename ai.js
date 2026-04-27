/**
 * AI 影视推荐模块
 * 修复：将返回类型改为 video 协议，以强制触发聚合引擎（采集站）资源匹配
 * 优化：保留 TMDB 元数据展示
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，支持全网聚合资源搜索",
  author: "crush7s",
  version: "5.6.0",
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
        text: "你是一个影视助手。请推荐" + count + "部" + prompt + "相关影视作品。只返回名称，不要解释."
      }]
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
  };
  var res = await Widget.http.post(url, body, { headers: { "Content-Type": "application/json" } });
  return extractContent(res);
}

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
  return "";
}

function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";
  apiUrl = apiUrl.replace(/\/+$/, "");
  if (format === "gemini") return apiUrl;
  if (apiUrl.endsWith("/v1")) return apiUrl + "/chat/completions";
  if (!apiUrl.includes("/v1")) return apiUrl + "/v1/chat/completions";
  return apiUrl;
}

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

function parseNames(text) {
  if (!text) return [];
  return text.split("\n").map(t => t.trim()).map(t => t.replace(/^\d+[\.\、\)）\s\-]+/, "")).filter(t => t.length > 0);
}

function getGenreNames(ids) {
  var map = { 28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 18: "剧情", 9648: "悬疑", 878: "科幻" };
  if (!ids || !ids.length) return "";
  var arr = [];
  for (var i = 0; i < ids.length; i++) { if (map[ids[i]]) arr.push(map[ids[i]]); if (arr.length >= 2) break; }
  return arr.join("/");
}

// ==================== 🔥 核心修复：TMDB 搜索结果转化为 video 类型 ====================
async function searchTMDB(title, type, key) {
  try {
    var res;
    if (key) {
      res = await Widget.http.get("https://api.themoviedb.org/3/search/" + type, {
        params: { api_key: key, query: title, language: "zh-CN", include_adult: false }
      });
      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, { params: { query: title, language: "zh-CN" } });
    }

    if (!res || !res.results || res.results.length === 0) return null;
    var item = res.results[0];
    var titleName = item.title || item.name || title;
    var rawDate = item.release_date || item.first_air_date || "";
    var year = rawDate ? rawDate.substring(0, 4) : "";
    var genres = getGenreNames(item.genre_ids) || (type === "movie" ? "电影" : "剧集");
    
    // ✨ 核心逻辑改动：
    // 1. type 必须为 "video"，否则不会触发聚合搜索
    // 2. id 使用 "search:" 开头，这是 Forward 识别“需要搜索”的指令
    return {
      id: "search:" + titleName,
      tmdbId: parseInt(item.id),
      type: "video", 
      mediaType: type,
      title: titleName,
      subTitle: year ? year + " · " + genres : genres,
      description: item.overview || "暂无简介",
      posterPath: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : null,
      shareTitle: titleName,
      groupTitle: type === "movie" ? "电影" : "剧集"
    };
  } catch (e) {
    return null;
  }
}

// ==================== 主入口 ====================
async function loadAIList(params) {
  var config = {
    apiUrl: params.aiApiUrl, apiKey: params.aiApiKey, model: params.aiModel,
    format: params.aiApiFormat, prompt: params.prompt, count: parseInt(params.recommendCount) || 9
  };
  try {
    var text = await callAI(config);
    var names = parseNames(text);
    var results = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var result = await searchTMDB(name, "movie", params.TMDB_API_KEY);
      if (!result) result = await searchTMDB(name, "tv", params.TMDB_API_KEY);
      if (result) results.push(result);
    }
    return results;
  } catch (e) {
    return [{ id: "err", type: "video", title: "请求出错", description: e.message }];
  }
}

async function loadSimilarList(params) {
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}
