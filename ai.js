/**
 * AI 影视推荐模块（JSCore 兼容版）
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方中转接口",
  author: "crush7s",
  version: "5.2.0",
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
        {
          title: "OpenAI 官方",
          value: "https://api.openai.com",
        },
        {
          title: "Gemini 官方",
          value: "https://generativelanguage.googleapis.com",
        },
        {
          title: "自定义",
          value: "",
        },
      ],
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
            { title: "轻松喜剧", value: "轻松喜剧" },
            { title: "科幻大片", value: "科幻大片" },
            { title: "悬疑推理", value: "悬疑推理" },
            { title: "经典港剧", value: "经典港剧" },
            { title: "高分动画", value: "高分动画" },
            { title: "犯罪剧情", value: "犯罪剧情" },
            { title: "爱情片", value: "爱情片" },
            { title: "战争片", value: "战争片" },
          ],
        },
      ],
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
    function() { return { model: model, messages: messages }; },
    function() { return { model: model, prompt: messages.map(function(m) { return m.content; }).join("\n") }; },
    function() { return { model: model, input: messages.map(function(m) { return m.content; }).join("\n") }; }
  ];

  for (var i = 0; i < strategies.length; i++) {
    try {
      var body = strategies[i]();
      return await Widget.http.post(apiUrl, body, {
        headers: headers,
        timeout: 60000
      });
    } catch (e) {
      if ((e.message || "").indexOf("400") !== -1) continue;
      throw e;
    }
  }

  throw new Error("所有请求策略失败");
}

// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  apiUrl = apiUrl.replace(/\/+$/, '');

  if (apiUrl.indexOf("/v1beta") === -1) {
    apiUrl += "/v1beta";
  }

  var url = apiUrl + '/models/' + model + ':generateContent?key=' + apiKey;

  var body = {
    contents: [
      {
        parts: [{ text: "推荐" + count + "部" + prompt + "影视作品，只返回名称，每行一个" }]
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

// ==================== 解析 ====================
function extractContent(res) {
  if (!res) return "";

  if (res.choices) {
    var c = res.choices[0];
    if (c && c.message && c.message.content) return c.message.content;
    if (c && c.text) return c.text;
  }

  if (res.data) return extractContent(res.data);
  if (typeof res === "string") return res;

  try { return res.candidates[0].content.parts[0].text; } catch (e) {}

  return "";
}

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

// ==================== JSCore 兼容的 sleep ====================
function sleep(ms) {
  // JSCore 环境中 setTimeout 不可用，使用同步循环模拟
  var start = Date.now();
  while (Date.now() - start < ms) {
    // 自旋等待，不阻塞其他操作
  }
}

// ==================== AI入口（只调用一次） ====================
async function callAI(config) {
  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);

  console.log("[AI] 单次调用，请求推荐 " + config.count + " 部作品");
  console.log("[AI] 使用URL: " + finalUrl);

  var messages = [
    {
      role: "system",
      content: "你是影视推荐助手。严格按照用户要求的数量推荐。每行返回一个影视名称，不要编号，不要解释，不要任何其他文字。格式示例：\n肖申克的救赎\n阿甘正传\n盗梦空间"
    },
    {
      role: "user",
      content: "推荐" + config.count + "部" + config.prompt + "的影视作品"
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

// ==================== 解析名称 ====================
function parseNames(text) {
  if (!text) return [];

  return text
    .split("\n")
    .map(function(t) { return t.trim(); })
    .filter(function(t) {
      if (t.length < 2) return false;
      var cleaned = t.replace(/^\d+[\.\、\)）]\s*/, '');
      if (cleaned.indexOf("推荐") === 0) return false;
      if (cleaned.indexOf("以下") === 0) return false;
      if (cleaned.indexOf("影视") !== -1 && cleaned.length < 10) return false;
      return cleaned.length >= 2;
    })
    .map(function(t) {
      return t.replace(/^\d+[\.\、\)）]\s*/, '').trim();
    })
    .slice(0, 20);
}

// ==================== TMDB搜索（无延迟版本） ====================
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
            language: "zh-CN"
          }
        }
      );
      if (res.data) {
        res = res.data;
      }
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: { query: title, language: "zh-CN" }
      });
    }

    if (res.results && res.results.length > 0) {
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
    }

    return null;
  } catch (e) {
    console.log("[TMDB] 搜索失败: " + title + " (" + type + ")");
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

  console.log("[AI推荐] 开始获取推荐，目标数量: " + config.count);

  // 1. 调用AI一次，获取所有推荐名称
  var text = await callAI(config);
  console.log("[AI返回] 原始响应: " + text);

  // 2. 解析名称列表
  var names = parseNames(text);
  console.log("[解析] 获取到 " + names.length + " 个名称: " + names.join(", "));

  // 3. 如果没有解析到任何名称
  if (names.length === 0) {
    return [{
      id: "ai_error",
      type: "tmdb",
      title: "未获取到推荐",
      description: "AI返回内容: " + (text || "").substring(0, 100)
    }];
  }

  // 4. 查询TMDB（无延迟，JSCore兼容）
  var tmdbKey = params.TMDB_API_KEY;
  var results = [];

  for (var i = 0; i < names.length; i++) {
    var name = names[i];

    // 先查电影
    var result = await searchTMDB(name, "movie", tmdbKey);

    // 没找到电影，尝试电视剧
    if (!result) {
      result = await searchTMDB(name, "tv", tmdbKey);
    }

    if (result) {
      results.push(result);
    } else {
      results.push({
        id: "ai_" + i,
        type: "tmdb",
        title: name,
        description: "AI推荐，暂无详细信息"
      });
    }

    console.log("[进度] " + (i + 1) + "/" + names.length + " - " + name);
  }

  console.log("[完成] 最终返回 " + results.length + " 条结果");
  return results;
}

async function loadSimilarList(params) {
  if (!params) params = {};
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.2.1（JSCore兼容）已加载");
