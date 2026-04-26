/**
 * AI 影视推荐模块（JSCore 兼容 + 灵活配置版）
 */

const USER_AGENT = "Mozilla/5.0";

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

  if (apiUrl.lastIndexOf("/v1") === apiUrl.length - 3) {
    return apiUrl + "/chat/completions";
  }

  if (apiUrl.indexOf("/v1") === -1) {
    return apiUrl + "/v1/chat/completions";
  }

  return apiUrl;
}

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "智能推荐 + 自定义数量 + 内置提示词",
  author: "crush7s",
  version: "5.3.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [
    { name: "aiApiUrl", title: "AI API 地址", type: "input", required: true, placeholder: "https://api.openai.com" },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 兼容", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },
    { name: "aiApiKey", title: "API Key", type: "input", required: true, placeholder: "sk-..." },
    { name: "aiModel", title: "模型", type: "input", defaultValue: "gpt-4o-mini", placeholder: "gpt-4o-mini / gemini-pro" },
    { name: "TMDB_API_KEY", title: "TMDB Key（可选）", type: "input", placeholder: "留空使用内置Key" },
    {
      name: "recommendCount",
      title: "默认推荐数量",
      type: "input",
      defaultValue: "9",
      placeholder: "例如: 6、9、12，可自定义"
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
          placeholder: "例如: 高分科幻、悬疑烧脑、治愈系动漫、类似《盗梦空间》..."
        },
        {
          name: "customCount",
          title: "推荐数量（留空使用默认）",
          type: "input",
          placeholder: "例如: 5、10、20"
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
          required: true,
          placeholder: "输入你喜欢的影视作品名称"
        },
        {
          name: "similarCount",
          title: "推荐数量（留空使用默认）",
          type: "input",
          placeholder: "例如: 8、10"
        }
      ]
    },
    {
      id: "discoverModule",
      title: "发现好片",
      functionName: "loadDiscoverList",
      params: [
        {
          name: "discoverType",
          title: "快速选择",
          type: "enumeration",
          enumOptions: [
            { title: "🔥 高分神作 (8.5+)", value: "高分神作评分8.5以上" },
            { title: "🎬 经典必看", value: "经典必看的影视作品" },
            { title: "🧠 烧脑悬疑", value: "烧脑悬疑反转不断的作品" },
            { title: "😂 爆笑喜剧", value: "搞笑喜剧让人开怀大笑" },
            { title: "🎭 剧情佳片", value: "剧情深刻打动人心的作品" },
            { title: "🚀 科幻巨制", value: "科幻题材视觉效果震撼" },
            { title: "👻 恐怖惊悚", value: "恐怖惊悚细思极恐的作品" },
            { title: "💕 浪漫爱情", value: "浪漫爱情感人至深" },
            { title: "🎌 日漫神作", value: "日本动漫神作必看" },
            { title: "🇨🇳 国产精品", value: "国产影视精品佳作" },
            { title: "🇰🇷 韩剧推荐", value: "韩剧高分推荐" },
            { title: "🎥 冷门佳片", value: "冷门小众但评价极高的作品" }
          ],
          defaultValue: "高分神作评分8.5以上"
        },
        {
          name: "discoverCount",
          title: "推荐数量（留空使用默认）",
          type: "input",
          placeholder: "例如: 6、15"
        }
      ]
    }
  ]
};

// ==================== 提示词构建 ====================
function buildPrompt(userInput, count) {
  // 智能增强用户输入
  var enhancedPrompt = userInput;
  
  // 如果输入较短，自动扩展
  if (userInput.length < 10) {
    var promptMap = {
      "科幻": "科幻题材的影视作品，包括人工智能、太空探索、时间旅行等",
      "悬疑": "悬疑烧脑推理类影视作品，结局出人意料",
      "喜剧": "搞笑喜剧让人捧腹大笑的影视作品",
      "恐怖": "恐怖惊悚气氛营造出色的影视作品",
      "爱情": "浪漫爱情故事感人至深的影视作品",
      "动作": "动作片打斗精彩场面火爆的影视作品",
      "动漫": "高分动漫包括日漫和国产动漫",
      "动画": "高分动画电影和动画剧集",
      "纪录片": "高分纪录片真实震撼",
      "韩剧": "高分韩剧推荐",
      "美剧": "高分美剧推荐",
      "国产": "国产影视精品佳作",
      "经典": "经典必看影史留名的作品",
      "冷门": "冷门小众但评价极高的作品"
    };
    
    for (var key in promptMap) {
      if (userInput.indexOf(key) !== -1) {
        enhancedPrompt = promptMap[key];
        break;
      }
    }
  }
  
  // 确保包含"影视作品"关键词
  if (enhancedPrompt.indexOf("影视") === -1 && 
      enhancedPrompt.indexOf("电影") === -1 && 
      enhancedPrompt.indexOf("剧") === -1 && 
      enhancedPrompt.indexOf("动漫") === -1 && 
      enhancedPrompt.indexOf("动画") === -1) {
    enhancedPrompt += "的影视作品";
  }
  
  console.log("[提示词] 原始: " + userInput + " -> 增强: " + enhancedPrompt);
  
  return "推荐" + count + "部" + enhancedPrompt;
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
async function callGeminiFormat(apiUrl, apiKey, model, promptText, count) {

  apiUrl = apiUrl.replace(/\/+$/, '');

  if (apiUrl.indexOf("/v1beta") === -1) {
    apiUrl += "/v1beta";
  }

  var url = apiUrl + '/models/' + model + ':generateContent?key=' + apiKey;

  var body = {
    contents: [
      {
        parts: [{ 
          text: "只返回" + count + "个影视名称，每行一个，不要编号和解释。\n" + promptText
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

  console.log("[AI] 请求 " + config.count + " 部推荐");
  console.log("[AI] URL: " + finalUrl);

  var systemPrompt = "你是专业影视推荐助手。严格返回用户要求数量的影视名称。每行一个，不要编号、序号、分类标题。不要任何解释和多余文字。不要使用Markdown格式。";

  var userPrompt = buildPrompt(config.prompt, config.count);

  var messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  if (config.format === "gemini") {
    return await callGeminiFormat(
      config.apiUrl,
      config.apiKey,
      config.model,
      userPrompt,
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
  
  var lines = text.split("\n");
  var names = [];
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    
    // 跳过空行
    if (line.length < 2) continue;
    
    // 去除Markdown格式
    line = line.replace(/^[\*\-\+#]+\s*/, '');
    line = line.replace(/^\d+[\.\、\)）]\s*/, '');
    line = line.replace(/^[《「『]/, '');
    line = line.replace(/[》」』]$/, '');
    
    // 跳过非片名行
    if (line.indexOf("推荐") === 0) continue;
    if (line.indexOf("以下") === 0) continue;
    if (line.indexOf("影视作品") !== -1 && line.length < 15) continue;
    if (line.indexOf("---") === 0) continue;
    
    line = line.trim();
    
    if (line.length >= 2) {
      names.push(line);
    }
  }
  
  return names.slice(0, 30);
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
        backdropPath: item.backdrop_path,
        rating: item.vote_average || 0,
        year: (item.release_date || item.first_air_date || "").substring(0, 4),
        mediaType: type
      };
    }
    
    return null;
    
  } catch (e) {
    console.log("[TMDB] " + title + " 搜索失败");
    return null;
  }
}

// ==================== 主逻辑 ====================
async function loadAIList(params) {

  // 获取推荐数量
  var count = parseInt(params.customCount) || parseInt(params.recommendCount) || 9;
  // 限制范围
  if (count < 1) count = 6;
  if (count > 30) count = 30;

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: count
  };

  console.log("[AI推荐] " + count + "部 - " + params.prompt);
  
  // 1. 调用AI一次
  var text = await callAI(config);
  console.log("[AI返回] " + (text ? text.substring(0, 200) : "空"));
  
  // 2. 解析名称
  var names = parseNames(text);
  console.log("[解析] " + names.length + " 个: " + names.join(", "));
  
  if (names.length === 0) {
    return [{
      id: "ai_error",
      type: "tmdb",
      title: "未获取到推荐",
      description: "请尝试更具体的描述，如"高分科幻电影""
    }];
  }
  
  // 3. TMDB查询
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
        description: "AI推荐",
        rating: 0,
        year: ""
      });
    }
  }
  
  console.log("[完成] " + results.length + " 条结果");
  
  return results;
}

async function loadSimilarList(params) {
  var promptText = "与《" + params.referenceTitle + "》风格相似的影视作品";
  
  // 合并参数
  var newParams = {};
  for (var key in params) {
    newParams[key] = params[key];
  }
  newParams.prompt = promptText;
  newParams.customCount = params.similarCount || params.customCount;
  
  return loadAIList(newParams);
}

async function loadDiscoverList(params) {
  var newParams = {};
  for (var key in params) {
    newParams[key] = params[key];
  }
  newParams.prompt = params.discoverType;
  newParams.customCount = params.discoverCount;
  
  return loadAIList(newParams);
}

console.log("✅ AI影视推荐 v5.3.0 已加载");
console.log("   - 支持自定义推荐数量");
console.log("   - 内置快速发现模块");
console.log("   - 智能提示词增强");
