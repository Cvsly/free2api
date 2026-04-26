/**
 * AI 影视推荐模块（稳定修复版）
 * 不改API逻辑，仅修复UI兼容问题
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "OpenAI / Gemini / 自定义API + TMDB智能解析（稳定版）",
  author: "crush7s",
  version: "5.2.2-stable",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [

    // ==================== API地址（稳定UI版）====================
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions"
    },

    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI / 硅基流动（通用）", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },

    {
      name: "aiApiKey",
      title: "API Key",
      type: "input",
      required: true
    },

    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      defaultValue: "gpt-4o-mini"
    },

    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false
    },

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
      title: "AI智能推荐",
      functionName: "loadAIList",
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true
        }
      ]
    },

    {
      id: "similarRecommend",
      title: "相似推荐",
      functionName: "loadSimilarList",
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true
        }
      ]
    }
  ]
};

// ==================== API地址处理 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";
  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  if (apiUrl.includes("/chat/completions")) return apiUrl;

  if (apiUrl.endsWith("/v1")) return apiUrl + "/chat/completions";

  if (!apiUrl.includes("/v1")) return apiUrl + "/v1/chat/completions";

  return apiUrl;
}

// ==================== OpenAI ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {

  var headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ")
      ? apiKey
      : "Bearer " + apiKey;
  }

  return await Widget.http.post(
    apiUrl,
    {
      model: model,
      messages: messages
    },
    { headers }
  );
}

// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {

  var base = apiUrl.replace(/\/$/, "");
  var url = base + "/models/" + model + ":generateContent?key=" + apiKey;

  var body = {
    contents: [
      {
        parts: [{
          text: "推荐" + count + "部" + prompt + "影视作品，每行一个名称，不要解释"
        }]
      }
    ]
  };

  var res = await Widget.http.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });

  try {
    return res.candidates[0].content.parts[0].text;
  } catch (e) {
    return "";
  }
}

// ==================== 提取内容 ====================
function extractContent(res) {
  if (!res) return "";

  if (res.choices) {
    return res.choices[0].message.content || "";
  }

  if (typeof res === "string") return res;

  if (res.data) return extractContent(res.data);

  try {
    return res.candidates[0].content.parts[0].text;
  } catch (e) {}

  return "";
}

// ==================== AI调用（不改逻辑）====================
async function callAI(config) {

  var apiUrl = normalizeApiUrl(config.apiUrl, config.format);

  var messages = [
    {
      role: "system",
      content: "你是影视推荐助手，只返回名称，每行一个，不要解释"
    },
    {
      role: "user",
      content: "推荐" + config.count + "部" + config.prompt + "影视作品"
    }
  ];

  if (config.format === "gemini") {
    return await callGeminiFormat(
      config.apiUrl,
      config.apiKey,
      config.model,
      config.prompt,
      config.count
    );
  }

  var res = await callOpenAIFormat(apiUrl, config.apiKey, config.model, messages);
  return extractContent(res);
}

// ==================== 解析剧名 ====================
function parseNames(text) {
  if (!text) return [];

  return text
    .split("\n")
    .map(t => t.trim())
    .map(t => t.replace(/^\d+[\.\、\)）]\s*/, ""))
    .filter(t => t.length > 1)
    .slice(0, 30);
}

// ==================== TMDB ====================
async function searchTMDB(title, type, key) {
  try {
    var res = await Widget.http.get(
      "https://api.themoviedb.org/3/search/" + type,
      {
        params: {
          api_key: key,
          query: title,
          language: "zh-CN"
        }
      }
    );

    if (res.data) res = res.data;

    if (res.results && res.results.length > 0) {
      var item = res.results[0];
      return {
        id: item.id,
        title: item.title || item.name,
        description: item.overview || "",
        posterPath: item.poster_path,
        rating: item.vote_average || 0,
        mediaType: type
      };
    }
  } catch (e) {}

  return null;
}

// ==================== 主逻辑 ====================
async function loadAIList(params) {

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount || "9")
  };

  var text = await callAI(config);
  var names = parseNames(text).slice(0, config.count);

  var tmdbKey = params.TMDB_API_KEY;

  var results = [];

  for (var i = 0; i < names.length; i++) {
    var r = await searchTMDB(names[i], "movie", tmdbKey);
    if (!r) r = await searchTMDB(names[i], "tv", tmdbKey);

    results.push(r || {
      title: names[i],
      description: "AI推荐"
    });
  }

  return results;
}

// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.2.2-stable 已加载");