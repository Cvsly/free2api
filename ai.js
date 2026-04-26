/**
 * AI 影视推荐模块 - 兼容增强版
 * 支持 OpenAI/Gemini/硅基流动/MatAPI/MetAPI 等中转站
 * 修复了 403 Forbidden 以及路径拼接问题
 */

const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，已优化中转站兼容性",
  author: "crush7s",
  site: "",
  version: "5.0.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions",
      description: "支持中转地址，如 https://metapi.omgd.eu.org",
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 格式 (通用)", value: "openai" },
        { title: "Gemini 格式", value: "gemini" },
      ],
      defaultValue: "openai",
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "你的 API Key",
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-4o-mini",
      description: "推荐：gpt-4o-mini, deepseek-chat, qwen-plus",
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "可选，留空则使用内置 Key",
    },
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "3部", value: "3" },
        { title: "6部", value: "6" },
        { title: "9部", value: "9" },
      ],
      defaultValue: "9",
    },
  ],
  
  modules: [
    {
      id: "smartRecommend",
      title: "AI智能推荐",
      description: "根据描述智能推荐影视",
      functionName: "loadAIList",
      requiresWebView: false,
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true,
          value: "轻松喜剧",
        },
      ],
    },
  ],
};

// ==================== 2. AI API 适配器 ====================

/**
 * OpenAI 格式 API 调用 (增强 Header 伪装)
 */
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens) {
  var authHeader = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;
  
  var headers = {
    "Content-Type": "application/json",
    "Authorization": authHeader,
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Origin": "https://github.com/InchStudio/ForwardWidgets"
  };
  
  console.log("[AI请求] URL: " + apiUrl);
  
  var response = await Widget.http.post(
    apiUrl,
    {
      model: model,
      messages: messages,
      max_tokens: maxTokens || 500,
      temperature: temperature || 0.7,
    },
    {
      headers: headers,
      timeout: 30000,
    }
  );
  
  return response;
}

/**
 * Gemini API 调用 - 官方格式
 */
async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent?key=' + apiKey;
  
  var promptText = "请推荐" + count + "部" + userPrompt + "类型的影视作品。只返回剧名，每行一个，不要序号。";
  
  var response = await Widget.http.post(
    fullUrl,
    {
      contents: [{ parts: [{ text: promptText }] }]
    },
    {
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      timeout: 30000,
    }
  );
  
  if (response && response.candidates && response.candidates[0]) {
    return response.candidates[0].content.parts[0].text || "";
  }
  return "";
}

/**
 * 通用 AI 调用入口 (核心修复逻辑)
 */
async function callAI(config) {
  var apiUrl = config.apiUrl.trim();
  var format = config.format || "openai";
  
  // --- 关键修复：路径补全 ---
  if (format === "openai") {
    if (!apiUrl.includes('/chat/completions')) {
      apiUrl = apiUrl.replace(/\/$/, '');
      if (!apiUrl.endsWith('/v1')) apiUrl += '/v1';
      apiUrl += '/chat/completions';
    }
  }
  
  try {
    if (format === "gemini") {
      return await callGeminiFormat(apiUrl, config.apiKey, config.model, config.prompt, config.count);
    } else {
      var systemPrompt = "你是一个影视推荐助手。请根据用户的需求，推荐" + config.count + "部影视作品。\n要求：只输出剧名，每行一个，严禁任何额外解释。";
      var userPrompt = "我想看 " + config.prompt + " 类型的作品。";
      
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      var response = await callOpenAIFormat(apiUrl, config.apiKey, config.model, messages);
      
      // 检查是否触发 403 或其他错误
      if (!response || response.error) {
        var errorMsg = response && response.error ? response.error.message : "请求被拒绝 (403/Forbidden)";
        throw new Error(errorMsg);
      }
      
      return extractContent(response);
    }
  } catch (e) {
    throw new Error("AI接口调用失败: " + e.message);
  }
}

// ==================== 3. 工具函数 ====================

function extractContent(response) {
  if (!response) return "";
  // 某些环境下 response 可能包裹在 data 属性中
  var data = response.data || response;
  if (data.choices && data.choices[0]) {
    var choice = data.choices[0];
    return choice.message ? choice.message.content : (choice.text || "");
  }
  return "";
}

function parseNames(content) {
  if (!content) return [];
  return content.split("\n")
    .map(line => line.replace(/^[\d\.\-\s]+/, '').replace(/[《》]/g, '').trim())
    .filter(line => line.length > 0 && line.length < 20);
}

async function getTmdbDetail(title, mediaType, apiKey) {
  try {
    var responseData;
    if (apiKey) {
      var res = await Widget.http.get("https://api.themoviedb.org/3/search/" + mediaType, {
        params: { api_key: apiKey, query: title, language: "zh-CN" },
        headers: { "User-Agent": USER_AGENT }
      });
      responseData = res.data || res;
    } else {
      responseData = await Widget.tmdb.get("/search/" + mediaType, {
        params: { query: title, language: "zh-CN" }
      });
    }
    return (responseData.results && responseData.results.length > 0) ? responseData.results[0] : null;
  } catch (e) { return null; }
}

// ==================== 4. 列表加载函数 ====================

async function loadAIList(params) {
  var content = await callAI({
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 6
  });

  var names = parseNames(content);
  if (names.length === 0) throw new Error("AI 未返回有效推荐");

  var promises = names.map(async (name) => {
    let detail = await getTmdbDetail(name, "tv", params.TMDB_API_KEY);
    if (!detail) detail = await getTmdbDetail(name, "movie", params.TMDB_API_KEY);
    
    if (detail) {
      return {
        id: detail.id.toString(),
        type: "tmdb",
        title: detail.title || detail.name,
        description: detail.overview,
        posterPath: detail.poster_path,
        rating: detail.vote_average,
        mediaType: detail.title ? "movie" : "tv"
      };
    }
    return null;
  });

  var results = await Promise.all(promises);
  return results.filter(r => r !== null);
}

console.log("AI 影视推荐模块 v5.0.0 修复版加载成功");
