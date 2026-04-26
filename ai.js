/**
 * AI 影视推荐模块（JSCore 兼容版）- UI优化版
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== API地址自动补全 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

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

// ==================== sleep ====================
function sleep(ms) {
  var start = Date.now();
  while (Date.now() - start < ms) {}
}

// ==================== Metadata（UI优化核心） ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "JSCore兼容 + 单次AI调用 + TMDB批量查询",
  author: "crush7s",
  version: "5.3.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [

    // ========== API模式选择（新增） ==========
    {
      name: "apiMode",
      title: "API模式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI", value: "openai" },
        { title: "Gemini", value: "gemini" },
        { title: "自定义地址", value: "custom" }
      ],
      defaultValue: "openai"
    },

    {
      name: "aiApiUrl",
      title: "AI API 地址（自定义模式才生效）",
      type: "input",
      required: false
    },

    {
      name: "aiApiKey",
      title: "API Key",
      type: "input",
      required: true
    },

    {
      name: "aiModel",
      title: "模型",
      type: "input",
      defaultValue: "gpt-4o-mini"
    },

    { name: "TMDB_API_KEY", title: "TMDB Key", type: "input" },

    // ========== 推荐数量（优化：可理解为默认 + 可改） ==========
    {
      name: "recommendCount",
      title: "推荐数量（可修改）",
      type: "input",
      defaultValue: "9"
    },

    // ========== AI推荐风格（新增预设） ==========
    {
      name: "aiStyle",
      title: "想看什么（可选预设）",
      type: "enumeration",
      enumOptions: [
        { title: "手动输入", value: "" },
        { title: "高分电影", value: "高分电影" },
        { title: "热门电影", value: "热门电影" },
        { title: "科幻大片", value: "科幻电影" },
        { title: "喜剧电影", value: "喜剧电影" },
        { title: "治愈系", value: "治愈系影视" },
        { title: "悬疑烧脑", value: "悬疑电影" }
      ],
      defaultValue: ""
    },

    {
      name: "prompt",
      title: "自定义需求（输入优先）",
      type: "input",
      required: true
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

// ==================== AI入口（只调用一次） ====================
async function callAI(config) {

  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);

  var messages = [
    {
      role: "system",
      content: "你是影视推荐助手。严格按照数量返回，每行一个名称，不要解释。"
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

  var res = await callOpenAIFormat(
    finalUrl,
    config.apiKey,
    config.model,
    messages
  );

  return extractContent(res);
}

// ==================== 主逻辑（UI逻辑优化入口） ====================
async function loadAIList(params) {

  // ====== UI逻辑融合（关键新增） ======
  var finalPrompt = params.prompt || "";

  // 如果选择了预设风格，自动拼接
  if (params.aiStyle && params.aiStyle.length > 0) {
    finalPrompt = params.aiStyle + " " + finalPrompt;
  }

  // API模式控制
  var apiUrl = params.aiApiUrl;

  if (params.apiMode === "openai") {
    apiUrl = "https://api.openai.com/v1/chat/completions";
  }

  if (params.apiMode === "gemini") {
    apiUrl = "https://generativelanguage.googleapis.com";
  }

  var config = {
    apiUrl: apiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.apiMode,
    prompt: finalPrompt,
    count: parseInt(params.recommendCount || "9")
  };

  var text = await callAI(config);
  var names = parseNames(text);

  if (names.length === 0) {
    return [{
      id: "ai_error",
      type: "tmdb",
      title: "未获取到推荐",
      description: text
    }];
  }

  var tmdbKey = params.TMDB_API_KEY;
  var results = [];

  for (var i = 0; i < names.length; i++) {
    var name = names[i];

    var result = await searchTMDB(name, "movie", tmdbKey);

    if (!result) {
      result = await searchTMDB(name, "tv", tmdbKey);
    }

    results.push(result || {
      id: "ai_" + i,
      type: "tmdb",
      title: name,
      description: "AI推荐"
    });
  }

  return results;
}

console.log("✅ AI影视推荐模块 v5.3.0（UI优化版）已加载");