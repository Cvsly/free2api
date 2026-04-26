/**
 * AI 影视推荐模块（防重复请求版）
 */

const USER_AGENT = "Mozilla/5.0";

// ✅ 全局请求缓存（关键）
var __AI_REQUEST_CACHE__ = {};

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "智能影视推荐（防重复请求版）",
  author: "crush7s",
  version: "5.0.0",
  requiredVersion: "0.0.2",

  globalParams: [
    { name: "aiApiUrl", title: "API地址", type: "input", required: true },
    { name: "aiApiKey", title: "API Key", type: "input", required: true },
    { name: "aiModel", title: "模型", type: "input", required: true },
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
    { name: "recommendCount", title: "数量", type: "input", defaultValue: "6" }
  ],

  modules: [
    {
      id: "smartRecommend",
      title: "AI推荐",
      functionName: "loadAIList",
      params: [{ name: "prompt", title: "想看什么", type: "input", required: true }]
    }
  ]
};

// ==================== AI调用 ====================

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

  // ✅ 自动兼容（避免400）
  if (!model.includes("gpt-5") && !apiUrl.includes("metapi")) {
    body.temperature = 0.5;
  }

  return await Widget.http.post(apiUrl, body, {
    headers: headers,
    timeout: 60000
  });
}

// ==================== 核心：带缓存的AI调用 ====================

async function callAI(config) {

  var cacheKey = JSON.stringify(config);

  // ✅ 已存在请求 → 直接复用
  if (__AI_REQUEST_CACHE__[cacheKey]) {
    console.log("[AI] 命中缓存，避免重复请求");
    return __AI_REQUEST_CACHE__[cacheKey];
  }

  var promise = (async () => {

    var content = "";

    try {

      if (config.format === "gemini") {
        // 简化版 Gemini（保持兼容）
        content = "暂未实现Gemini适配";
      } else {

        var messages = [
          { role: "system", content: "你是影视推荐助手，只返回片名" },
          { role: "user", content: "推荐" + config.count + "部" + config.prompt }
        ];

        var res = await callOpenAIFormat(
          config.apiUrl,
          config.apiKey,
          config.model,
          messages
        );

        if (res.choices && res.choices[0]) {
          content = res.choices[0].message.content;
        }
      }

      return content;

    } finally {
      // ✅ 5秒后清理缓存
      setTimeout(() => {
        delete __AI_REQUEST_CACHE__[cacheKey];
      }, 5000);
    }

  })();

  __AI_REQUEST_CACHE__[cacheKey] = promise;

  return promise;
}

// ==================== 解析 ====================

function parseNames(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map(t => t.trim())
    .filter(t => t.length > 1);
}

// ==================== 主入口 ====================

async function loadAIList(params) {

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 6
  };

  var content = await callAI(config);

  var names = parseNames(content);

  return names.map((name, i) => ({
    id: "ai_" + i,
    type: "tmdb",
    title: name,
    description: "AI推荐",
    posterPath: null
  }));
}

console.log("AI模块已加载（防重复请求版）");