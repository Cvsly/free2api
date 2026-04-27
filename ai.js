/**
 * AI 影视推荐模块
 * 修复：兼容更多第三方接口
 * 优化：AI提示词调整
 * 优化：API接口路径自动补齐
 * 新增：补充日期/海报字段，实现截图中的卡片UI效果
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方接口",
  author: "crush7s",
  version: "5.2.1",
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
        { title: "自定义", value: "" },
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

// ==================== OpenAI / 中转修复 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : "Bearer " + apiKey;
  }

  // 这里的 apiUrl 已经是 normalizeApiUrl 处理过的完整路径
  var body = { model: model, messages: messages };
  
  try {
    return await Widget.http.post(apiUrl, body, {
      headers: headers,
      timeout: 60000
    });
  } catch (e) {
    console.log("[OpenAI] 请求失败: " + e.message);
    throw e;
  }
}

// ==================== Gemini 官方修复版 ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  // 1. 规范化基础 URL
  var base = apiUrl.replace(/\/+$/, '');
  if (base.indexOf("/v1") === -1) {
    base += "/v1beta"; 
  }
  
  // 2. 确保模型名称正确 (Gemini 官方需要 models/ 前缀)
  var modelName = model || "gemini-1.5-flash";
  if (modelName.indexOf("models/") !== 0) {
    modelName = "models/" + modelName;
  }

  // 3. 构造完整 URL，Gemini 官方推荐将 Key 放在 URL 中
  var url = base + '/' + modelName + ':generateContent?key=' + apiKey;

  var body = {
    contents: [{
      parts: [{ 
        text: "你是一个影视助手。请推荐" + count + "部" + prompt + "影视作品。只返回名称，不要编号，不要解释。" 
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500
    }
  };

  console.log("[Gemini] 请求 URL: " + url);
  
  var res = await Widget.http.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });

  // 兼容不同的 JSCore 返回结构
  return extractContent(res);
}

// ==================== 解析内容增强 ====================
function extractContent(res) {
  if (!res) return "";
  
  // 1. 处理 OpenAI 格式
  if (res.choices && res.choices[0]) {
    var c = res.choices[0];
    if (c.message && c.message.content) return c.message.content;
    if (c.text) return c.text;
  }

  // 2. 处理 Gemini 官方格式
  if (res.candidates && res.candidates[0] && res.candidates[0].content) {
    var parts = res.candidates[0].content.parts;
    if (parts && parts[0] && parts[0].text) return parts[0].text;
  }

  // 3. 处理嵌套 data 情况
  if (res.data) return extractContent(res.data);
  
  if (typeof res === "string") return res;
  return "";
}

// ==================== API 地址补全 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";
  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  // OpenAI 逻辑
  if (apiUrl.includes("/chat/completions")) return apiUrl;
  if (apiUrl.endsWith("/v1")) return apiUrl + "/chat/completions";
  if (!apiUrl.includes("/v1")) return apiUrl + "/v1/chat/completions";

  return apiUrl;
}

// ==================== AI 入口 ====================
async function callAI(config) {
  if (config.format === "gemini") {
    return await callGeminiFormat(
      config.apiUrl,
      config.apiKey,
      config.model,
      config.prompt,
      config.count
    );
  }

  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);
  var messages = [
    { role: "system", content: "你是影视推荐助手。只返回影视名称，严禁输出编号和解释。" },
    { role: "user", content: "推荐" + config.count + "部" + config.prompt + "的影视作品" }
  ];

  var res = await callOpenAIFormat(finalUrl, config.apiKey, config.model, messages);
  return extractContent(res);
}

// ==================== 后面逻辑保持不变 ====================
function parseNames(text) {
  if (!text) return [];
  return text.split("\n")
    .map(function(t) { return t.trim(); })
    .filter(function(t) {
      var cleaned = t.replace(/^\d+[\.\、\)）\s\-]+/, '').trim();
      return cleaned.length >= 1 && !/^推荐|^以下|^好的/.test(cleaned);
    })
    .map(function(t) {
      return t.replace(/^\d+[\.\、\)）\s\-]+/, '').trim();
    })
    .slice(0, 15);
}

// ==================== 【修改点】补充海报/日期字段，适配卡片UI ====================
async function searchTMDB(title, type, key) {
  try {
    var res;
    if (key) {
      res = await Widget.http.get("https://api.themoviedb.org/3/search/" + type, {
        params: { api_key: key, query: title, language: "zh-CN" }
      });
      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: { query: title, language: "zh-CN" }
      });
    }

    if (res && res.results && res.results.length > 0) {
      var item = res.results[0];
      
      // 1. 处理完整海报地址，确保Forward App能正常加载海报
      var posterUrl = null;
      if (item.poster_path) {
        posterUrl = key 
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
          : (Widget.tmdb?.imageBaseUrl || "https://image.tmdb.org/t/p") + "/w500" + item.poster_path;
      }

      // 2. 处理日期信息（适配截图中标题下方的日期显示）
      // 电影用release_date，剧集用first_air_date
      var releaseDate = type === "movie" ? item.release_date : item.first_air_date;

      return {
        id: item.id,
        type: "tmdb",
        title: item.title || item.name,
        description: item.overview || "暂无简介",
        posterPath: item.poster_path, // 保留原有字段兼容旧版本
        posterUrl: posterUrl, // 新增完整海报地址
        releaseDate: releaseDate || "", // 新增日期字段，用于卡片副标题显示
        rating: item.vote_average || 0,
        mediaType: type
      };
    }
    return null;
  } catch (e) {
    console.log("[TMDB] 搜索失败: " + e.message);
    return null;
  }
}

async function loadAIList(params) {
  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel || (params.aiApiFormat === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'),
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 9
  };

  try {
    var text = await callAI(config);
    var names = parseNames(text);

    if (names.length === 0) {
      return [{ id: "err", type: "tmdb", title: "AI 未能生成列表", description: "请检查 API Key 或模型设置" }];
    }

    var results = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var result = await searchTMDB(name, "movie", params.TMDB_API_KEY);
      if (!result) result = await searchTMDB(name, "tv", params.TMDB_API_KEY);
      
      // 【修改点】补充默认字段，避免无TMDB结果时UI显示异常
      results.push(result || {
        id: "ai_" + i,
        type: "tmdb",
        title: name,
        description: "AI 推荐作品",
        releaseDate: "", // 补充空日期字段，保持UI一致性
        posterUrl: ""
      });
    }
    return results;
  } catch (e) {
    return [{ id: "err", type: "tmdb", title: "请求出错", description: e.message }];
  }
}

async function loadSimilarList(params) {
  if (!params) params = {};
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 5.2.1（UI适配版）");
