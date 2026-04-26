/**
 * AI 影视推荐模块（JSCore 兼容版）
 */

// ==================== API地址自动补全 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  if (
    apiUrl.indexOf("/chat/completions") !== -1 ||
    apiUrl.indexOf("/responses") !== -1
  ) {
    return apiUrl;
  }

  if (apiUrl.endsWith("/v1")) {
    return apiUrl + "/chat/completions";
  }

  if (apiUrl.indexOf("/v1") === -1) {
    return apiUrl + "/v1/chat/completions";
  }

  return apiUrl;
}

// ==================== 推荐模板 ====================
var RECOMMEND_TEMPLATES = {
  "high_score_anime": {
    label: "高分动漫",
    prompt: "豆瓣评分9分以上的日本动漫电影或剧集"
  },
  "high_score_movie": {
    label: "高分电影",
    prompt: "豆瓣评分9分以上的经典电影"
  },
  "high_score_tv": {
    label: "高分剧集",
    prompt: "豆瓣评分9分以上的电视剧"
  },
  "oscar_best": {
    label: "奥斯卡最佳影片",
    prompt: "历年奥斯卡最佳影片获奖作品"
  },
  "scifi_classic": {
    label: "科幻经典",
    prompt: "经典科幻电影"
  },
  "anime_movie": {
    label: "动画电影",
    prompt: "经典动画电影，包括日本动画和迪士尼皮克斯"
  },
  "crime_suspense": {
    label: "悬疑烧脑",
    prompt: "悬疑推理烧脑电影，剧情反转"
  },
  "comedy": {
    label: "爆笑喜剧",
    prompt: "搞笑喜剧电影"
  },
  "romance": {
    label: "浪漫爱情",
    prompt: "经典爱情电影"
  },
  "horror": {
    label: "恐怖惊悚",
    prompt: "经典恐怖惊悚电影"
  },
  "action": {
    label: "动作爽片",
    prompt: "动作大片，场面震撼"
  },
  "documentary": {
    label: "高分纪录片",
    prompt: "豆瓣高分纪录片"
  },
  "chinese_classic": {
    label: "华语经典",
    prompt: "华语电影经典作品"
  },
  "korean_movie": {
    label: "韩国电影",
    prompt: "经典韩国电影"
  },
  "healing": {
    label: "治愈温情",
    prompt: "治愈系温情电影"
  },
  "mind_blowing": {
    label: "脑洞大开",
    prompt: "脑洞大开、设定新奇、世界观独特的电影"
  },
  "growth": {
    label: "成长励志",
    prompt: "关于成长、励志的正能量电影"
  },
  "war": {
    label: "战争历史",
    prompt: "经典战争历史题材电影"
  },
  "superhero": {
    label: "超级英雄",
    prompt: "漫威DC超级英雄电影"
  },
  "cyberpunk": {
    label: "赛博朋克",
    prompt: "赛博朋克风格电影"
  }
};

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "内置推荐模板 + 自定义数量 + TMDB详情",
  author: "crush7s",
  version: "5.3.0",
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
      type: "input", 
      defaultValue: "9",
      description: "自定义推荐数量，如 6、9、12"
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
          required: true,
          enumOptions: buildTemplateOptions()
        }
      ]
    },
    {
      id: "customRecommend",
      title: "自定义推荐",
      functionName: "loadCustomList",
      params: [
        { 
          name: "customPrompt", 
          title: "描述你想看的", 
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
        { name: "referenceTitle", title: "喜欢的作品", type: "input", required: true }
      ]
    }
  ]
};

// ==================== 构建模板选项 ====================
function buildTemplateOptions() {
  var options = [];
  var keys = Object.keys(RECOMMEND_TEMPLATES);
  
  for (var i = 0; i < keys.length; i++) {
    var template = RECOMMEND_TEMPLATES[keys[i]];
    options.push({
      title: template.label,
      value: template.prompt
    });
  }
  
  return options;
}

// ==================== OpenAI / 中转 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {

  var headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers["Authorization"] = apiKey.indexOf("Bearer ") === 0
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
        parts: [{ text: "推荐" + count + "部" + prompt + "影视作品，只返回名称，每行一个，不要编号" }]
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

// ==================== AI入口 ====================
async function callAI(config) {

  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);

  console.log("[AI] 单次调用，推荐 " + config.count + " 部作品");
  console.log("[AI] 提示词: " + config.prompt);

  var messages = [
    { 
      role: "system", 
      content: "你是影视推荐助手。严格返回" + config.count + "部影视名称，每行一个，不要编号、不要解释、不要任何其他文字。\n格式示例：\n肖申克的救赎\n阿甘正传\n盗梦空间" 
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
    .slice(0, 30);
}

// ==================== TMDB搜索 ====================
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
    console.log("[TMDB] 搜索失败: " + title);
    return null;
  }
}

// ==================== 主逻辑 ====================
async function loadAIList(params) {

  // 兼容：prompt 可能是模板选择的 prompt，也可能是自定义输入
  var userPrompt = params.prompt || params.customPrompt || "";
  var countStr = params.recommendCount || "9";
  
  // 解析数量（支持自定义输入）
  var count = parseInt(countStr);
  if (isNaN(count) || count < 1) {
    count = 9; // 默认值
  }
  if (count > 30) {
    count = 30; // 上限
  }

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: userPrompt,
    count: count
  };

  console.log("[AI推荐] 开始，目标: " + count + " 部");
  
  // 1. 调用AI一次
  var text = await callAI(config);
  console.log("[AI返回] " + text);
  
  // 2. 解析名称
  var names = parseNames(text);
  console.log("[解析] " + names.length + " 个: " + names.join(", "));
  
  if (names.length === 0) {
    return [{
      id: "ai_error",
      type: "tmdb",
      title: "未获取到推荐",
      description: "AI返回: " + (text || "").substring(0, 100)
    }];
  }
  
  // 3. 查询TMDB
  var tmdbKey = params.TMDB_API_KEY;
  var results = [];
  
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    
    var result = await searchTMDB(name, "movie", tmdbKey);
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
    
    console.log("[进度] " + (i + 1) + "/" + names.length);
  }
  
  console.log("[完成] " + results.length + " 条");
  return results;
}

// 自定义推荐
async function loadCustomList(params) {
  // 将 customPrompt 转为 prompt 参数
  return loadAIList(params);
}

// 相似推荐
async function loadSimilarList(params) {
  if (!params) params = {};
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.3.0（内置模板+自定义数量）已加载");
console.log("📋 内置推荐模板: " + Object.keys(RECOMMEND_TEMPLATES).length + " 个");
console.log("🎬 支持模板: " + Object.values(RECOMMEND_TEMPLATES).map(function(t) { return t.label; }).join(", "));
