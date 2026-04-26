/**
 * AI 影视推荐模块（增强版 UI + 单调用）
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== API地址模板 ====================
const API_PRESETS = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com",
  custom: ""
};

// ==================== URL处理 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  if (apiUrl.includes("/chat/completions")) return apiUrl;
  if (apiUrl.endsWith("/v1")) return apiUrl + "/chat/completions";

  if (!apiUrl.includes("/v1")) {
    return apiUrl + "/v1/chat/completions";
  }

  return apiUrl;
}

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI影视推荐 Pro",
  description: "单次AI调用 + 智能UI + 自定义API",
  author: "crush7s",
  version: "6.0.0",
  requiredVersion: "0.0.2",

  globalParams: [

    // ✅ API类型选择
    {
      name: "apiPreset",
      title: "API类型",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI（官方）", value: "openai" },
        { title: "Gemini（谷歌）", value: "gemini" },
        { title: "自定义", value: "custom" }
      ],
      defaultValue: "openai"
    },

    // ✅ 地址可编辑
    {
      name: "aiApiUrl",
      title: "API地址（可编辑）",
      type: "input",
      required: true,
      placeholder: "自动填充，可自行修改"
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

    {
      name: "TMDB_API_KEY",
      title: "TMDB Key",
      type: "input"
    },

    // ✅ 改为自由输入
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "input",
      defaultValue: "9",
      placeholder: "建议 6-20"
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
          type: "enumeration",

          // ✅ 内置推荐
          enumOptions: [
            { title: "高分电影", value: "高分电影" },
            { title: "喜剧电影", value: "喜剧电影" },
            { title: "悬疑烧脑", value: "悬疑烧脑电影" },
            { title: "科幻大片", value: "科幻电影" },
            { title: "爱情电影", value: "爱情电影" },
            { title: "动作爽片", value: "动作电影" }
          ],

          // ✅ 允许用户输入
          allowCustom: true,
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

// ==================== 自动填充API ====================
function resolveApiUrl(params) {
  var preset = params.apiPreset || "openai";

  // 如果用户填了，就优先用用户的
  if (params.aiApiUrl && params.aiApiUrl.length > 5) {
    return params.aiApiUrl;
  }

  return API_PRESETS[preset];
}

// ==================== AI调用 ====================
async function callAI(config) {

  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);

  var messages = [
    {
      role: "system",
      content: "只返回影视名称，每行一个，不要任何解释"
    },
    {
      role: "user",
      content: "推荐" + config.count + "部" + config.prompt
    }
  ];

  var headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + config.apiKey
  };

  var res = await Widget.http.post(finalUrl, {
    model: config.model,
    messages: messages
  }, { headers });

  return extractContent(res);
}

// ==================== 解析 ====================
function extractContent(res) {
  if (!res) return "";

  if (res.choices && res.choices[0]) {
    return res.choices[0].message.content || "";
  }

  return "";
}

// ==================== 名称解析 ====================
function parseNames(text) {
  if (!text) return [];

  return text
    .split("\n")
    .map(function(t) { return t.trim(); })
    .filter(function(t) { return t.length > 1; });
}

// ==================== 主逻辑 ====================
async function loadAIList(params) {

  // ✅ 数量安全处理
  var count = parseInt(params.recommendCount) || 9;
  if (count < 1) count = 6;
  if (count > 20) count = 20;

  var apiUrl = resolveApiUrl(params);

  var config = {
    apiUrl: apiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.apiPreset,
    prompt: params.prompt,
    count: count
  };

  console.log("[配置]", config);

  var text = await callAI(config);

  var names = parseNames(text);

  return names.map(function(name, i) {
    return {
      id: "ai_" + i,
      type: "tmdb",
      title: name,
      description: "AI推荐"
    };
  });
}

// ==================== 相似 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐 Pro v6.0 已加载");