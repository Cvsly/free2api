/**
 * AI 影视推荐模块（自动补全API版）
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== API地址自动补全 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

  // Gemini 单独处理
  if (format === "gemini") return apiUrl;

  if (
    apiUrl.includes("/chat/completions") ||
    apiUrl.includes("/responses")
  ) {
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
  description: "自动补全API地址 + 全兼容中转",
  author: "crush7s",
  version: "5.1.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [
    { name: "aiApiUrl", title: "AI API 地址", type: "input", required: true },
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
        { name: "prompt", title: "想看什么", type: "input", required: true }
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

// ==================== OpenAI / 中转 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {

  var headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ")
      ? apiKey
      : "Bearer " + apiKey;
  }

  var strategies = [
    () => ({ model, messages }),
    () => ({ model, prompt: messages.map(m => m.content).join("\n") }),
    () => ({ model, input: messages.map(m => m.content).join("\n") })
  ];

  for (var i = 0; i < strategies.length; i++) {
    try {
      var body = strategies[i]();

      return await Widget.http.post(apiUrl, body, {
        headers: headers,
        timeout: 60000
      });

    } catch (e) {
      if ((e.message || "").includes("400")) continue;
      throw e;
    }
  }

  throw new Error("所有请求策略失败");
}

// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {

  apiUrl = apiUrl.replace(/\/+$/, '');

  if (!apiUrl.includes("/v1beta")) {
    apiUrl += "/v1beta";
  }

  var url = apiUrl + '/models/' + model + ':generateContent?key=' + apiKey;

  var body = {
    contents: [
      {
        parts: [{ text: "推荐" + count + "部" + prompt + "影视作品，只返回名称" }]
      }
    ]
  };

  var res = await Widget.http.post(url, body, {
    headers: { "Content-Type": "application/json" }
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

  if (res.choices) {
    let c = res.choices[0];
    if (c?.message?.content) return c.message.content;
    if (c?.text) return c.text;
  }

  if (res.data) return extractContent(res.data);
  if (typeof res === "string") return res;

  try { return res.candidates[0].content.parts[0].text } catch {}

  return "";
}

// ==================== AI入口 ====================
async function callAI(config) {

  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);

  console.log("[AI] 使用URL:", finalUrl);

  var messages = [
    { role: "system", content: "只返回影视名称，每行一个" },
    { role: "user", content: "推荐" + config.count + "部" + config.prompt }
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

  var res = await callOpenAIFormat(
    finalUrl,
    config.apiKey,
    config.model,
    messages
  );

  return extractContent(res);
}

// ==================== 工具 ====================
function parseNames(text) {
  return text
    .split("\n")
    .map(t => t.trim())
    .filter(t => t.length > 1)
    .slice(0, 20);
}

// ==================== TMDB ====================
async function getTmdbDetail(title, type, key) {
  try {
    var res;

    if (key) {
      res = await Widget.http.get(
        "https://api.themoviedb.org/3/search/" + type,
        {
          params: {
            api_key: key,
            query: title,
            language: "zh-CN"
          }
        }
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
      posterPath: item.poster_path,
      rating: item.vote_average || 0,
      mediaType: type
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
    names.map(async n => {
      return await getTmdbDetail(n, "movie", tmdbKey)
        || await getTmdbDetail(n, "tv", tmdbKey);
    })
  );

  var valid = results.filter(Boolean);

  return valid.length
    ? valid
    : names.map((n, i) => ({
        id: "ai_" + i,
        type: "tmdb",
        title: n,
        description: "AI推荐"
      }));
}

async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.1（自动补全API）已加载");