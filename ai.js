/**
 * AI影视推荐模块（终极单例防重复版）
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== 全局单例控制 ====================

// 单例请求（整个模块只允许一个AI请求）
var AI_SINGLETON_PENDING = null;

// 缓存
var AI_CACHE = {};
var AI_CACHE_TIME = {};

// 缓存时间（60秒）
var CACHE_TTL = 60 * 1000;


// ==================== API地址自动补全 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  if (apiUrl.includes("/chat/completions") || apiUrl.includes("/responses")) {
    return apiUrl;
  }

  if (apiUrl.endsWith("/v1")) {
    return apiUrl + "/chat/completions";
  }

  if (!apiUrl.includes("/v1")) {
    return apiUrl + "/v1/chat/completions";
  }

  return apiUrl;
}


// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "终极防重复调用版",
  author: "crush7s",
  version: "6.0.0",
  requiredVersion: "0.0.2",

  globalParams: [
    { name: "aiApiUrl", title: "API地址", type: "input", required: true },
    { name: "aiApiKey", title: "API Key", type: "input", required: true },
    { name: "aiModel", title: "模型", type: "input", defaultValue: "gpt-4o-mini" },
    {
      name: "aiApiFormat",
      title: "格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },
    { name: "TMDB_API_KEY", title: "TMDB Key", type: "input" },
    { name: "recommendCount", title: "数量", type: "input", defaultValue: "9" }
  ],

  modules: [
    {
      id: "smartRecommend",
      title: "AI推荐",
      functionName: "loadAIList",
      params: [
        { name: "prompt", title: "想看什么", type: "input", required: true }
      ]
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      functionName: "loadSimilarList"
    }
  ]
};


// ==================== OpenAI请求 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {

  var headers = {
    "Content-Type": "application/json",
    "Authorization": apiKey.startsWith("Bearer ")
      ? apiKey
      : "Bearer " + apiKey
  };

  var body = {
    model: model,
    messages: messages
  };

  return await Widget.http.post(apiUrl, body, {
    headers: headers,
    timeout: 60000
  });
}


// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {

  apiUrl = apiUrl.replace(/\/+$/, '');

  if (!apiUrl.includes("/v1beta")) {
    apiUrl += "/v1beta";
  }

  var url = apiUrl + '/models/' + model + ':generateContent?key=' + apiKey;

  var res = await Widget.http.post(url, {
    contents: [
      { parts: [{ text: "推荐" + count + "部" + prompt + "影视作品，只返回名称" }] }
    ]
  });

  try {
    return res.candidates[0].content.parts[0].text;
  } catch {
    return "";
  }
}


// ==================== 解析 ====================
function extractContent(res) {
  if (!res) return "";

  if (res.choices && res.choices[0]) {
    return res.choices[0].message?.content || res.choices[0].text || "";
  }

  if (typeof res === "string") return res;

  try { return res.candidates[0].content.parts[0].text } catch {}

  return "";
}


// ==================== ⭐ 单例AI调用（核心） ====================
async function callAI(config) {

  var key = JSON.stringify(config);

  // ✅ 缓存命中
  if (AI_CACHE[key] && (Date.now() - AI_CACHE_TIME[key] < CACHE_TTL)) {
    console.log("[AI] 使用缓存");
    return AI_CACHE[key];
  }

  // ✅ 已有全局请求
  if (AI_SINGLETON_PENDING) {
    console.log("[AI] 复用全局请求");
    return await AI_SINGLETON_PENDING;
  }

  // ✅ 创建唯一请求
  AI_SINGLETON_PENDING = (async () => {
    try {

      console.log("[AI] 发起唯一请求");

      let result;

      if (config.format === "gemini") {
        result = await callGeminiFormat(
          config.apiUrl,
          config.apiKey,
          config.model,
          config.prompt,
          config.count
        );
      } else {

        var url = normalizeApiUrl(config.apiUrl, config.format);

        var messages = [
          { role: "system", content: "只返回影视名称，每行一个" },
          { role: "user", content: "推荐" + config.count + "部" + config.prompt }
        ];

        var res = await callOpenAIFormat(
          url,
          config.apiKey,
          config.model,
          messages
        );

        result = extractContent(res);
      }

      // 写入缓存
      AI_CACHE[key] = result;
      AI_CACHE_TIME[key] = Date.now();

      return result;

    } finally {
      // 清除单例锁
      AI_SINGLETON_PENDING = null;
    }
  })();

  return await AI_SINGLETON_PENDING;
}


// ==================== 工具 ====================
function parseNames(text) {
  return text.split("\n")
    .map(t => t.trim())
    .filter(t => t.length > 1);
}


// ==================== TMDB ====================
async function getTmdbDetail(title, type, key) {
  try {
    var res;

    if (key) {
      res = await Widget.http.get(
        "https://api.themoviedb.org/3/search/" + type,
        { params: { api_key: key, query: title } }
      );
      res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: { query: title }
      });
    }

    if (!res.results?.length) return null;

    var item = res.results[0];

    return {
      id: item.id,
      type: "tmdb",
      title: item.title || item.name,
      description: item.overview || "",
      posterPath: item.poster_path
    };

  } catch {
    return null;
  }
}


// ==================== 主逻辑 ====================
async function loadAIList(params) {

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount)
  };

  var text = await callAI(config);

  var names = parseNames(text);

  var tmdbKey = params.TMDB_API_KEY;

  var results = await Promise.all(
    names.map(n => getTmdbDetail(n, "movie", tmdbKey)
      .then(r => r || getTmdbDetail(n, "tv", tmdbKey)))
  );

  return results.filter(Boolean);
}


async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}


console.log("✅ 单例AI模块 v6.0 已加载（彻底防重复调用）");