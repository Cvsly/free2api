/**
 * AI 影视推荐及搜索模块
 * 支持OpenAI/Gemini/硅基流动/NewApi等接口
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐与搜索，兼容OpenAI/Gemini/硅基流动/NewApi等接口",
  author: "crush7s",
  site: "",
  version: "5.0.0", // 升级版本号
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions",
      description: "点击右侧按钮可选择预设API地址",
      placeholders: [
        { title: "OpenAI 官方", value: "https://api.openai.com/v1/chat/completions" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com/v1beta" },
        { title: "硅基流动", value: "https://api.siliconflow.cn/v1/chat/completions" },
        { title: "自定义", value: "" },
      ],
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
      description: "选择API响应格式，Gemini官方地址请选择Gemini格式",
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "你的API Key",
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-3.5-turbo",
      description: "推荐使用：deepseek-ai/DeepSeek-V3 或 Qwen/Qwen2.5-7B-Instruct",
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "可选：在 https://www.themoviedb.org/settings/api 获取",
    },
    {
      name: "recommendCount",
      title: "结果数量",
      type: "enumeration",
      enumOptions: [
        { title: "5部", value: "5" },
        { title: "10部", value: "10" },
        { title: "15部", value: "15" },
      ],
      defaultValue: "10",
    },
  ],
  
  // 新增：全局搜索功能定义
  search: {
    title: "AI 智能搜索",
    functionName: "searchAI",
    params: [
      {
        name: "keyword",
        title: "想找什么？",
        type: "input",
        description: "用自然语言描述，AI 帮你找片",
        placeholders: [
          { title: "去年高分科幻片", value: "去年高分科幻片" },
          { title: "类似盗梦空间的电影", value: "类似盗梦空间的电影" },
          { title: "周星驰执导的作品", value: "周星驰执导的作品" },
        ],
      },
    ],
  },
  
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
          value: "高分犯罪剧集",
        },
      ],
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      description: "基于喜欢的作品推荐相似内容",
      functionName: "loadSimilarList",
      requiresWebView: false,
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true,
          value: "",
        },
      ],
    },
  ],
};

// ==================== 2. AI API 适配器 (保持不变) ====================

async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;
  }
  return await Widget.http.post(apiUrl, {
    model: model,
    messages: messages,
    max_tokens: maxTokens || 500,
    temperature: temperature || 0.5,
  }, { headers: headers, timeout: 60000 });
}

async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  var promptText = "请推荐" + count + "部与「" + userPrompt + "」相关的影视作品。\n\n【输出要求】\n1. 只返回剧名，每行一个\n2. 不要添加任何序号、标点或额外文字";
  
  var requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
  };
  
  var response = await Widget.http.post(fullUrl, requestBody, { headers: { "Content-Type": "application/json" }, timeout: 60000 });
  var content = "";
  if (response && response.candidates && response.candidates[0]) {
    content = response.candidates[0].content.parts[0].text || "";
  }
  return content;
}

function extractContent(response) {
  if (!response) return "";
  var data = response.data || response;
  if (data.choices && data.choices[0]) {
    var choice = data.choices[0];
    return choice.message ? choice.message.content : (choice.text || "");
  }
  return typeof response === 'string' ? response : "";
}

async function callAI(config) {
  var { apiUrl, apiKey, model, format, prompt, count } = config;
  try {
    if (format === "gemini") {
      return await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } else {
      var systemPrompt = "你是一个影视推荐助手。请根据用户的需求，推荐" + count + "部合适的影视作品。只返回剧名，每行一个，不要解释。";
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "我想找关于「" + prompt + "」的作品" }
      ];
      var response = await callOpenAIFormat(apiUrl, apiKey, model, messages, 0.5, 500);
      return extractContent(response);
    }
  } catch (error) { throw new Error("AI服务请求失败: " + error.message); }
}

// ==================== 3. 工具函数 (保持不变) ====================

function parseNames(content) {
  if (!content) return [];
  var names = [];
  var lines = content.split("\n");
  for (var line of lines) {
    line = line.replace(/^[\d\+\-\*•\s\.、，]*|《|》|""|''|「|」|\[|\]|【|】|\(.*?\)|（.*?）/g, '').trim();
    if (line && line.length >= 2 && line.length <= 40) names.push(line);
  }
  return [...new Set(names)];
}

async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title) return null;
  try {
    var responseData;
    if (apiKey) {
      var response = await Widget.http.get("https://api.themoviedb.org/3/search/" + mediaType, { 
        params: { api_key: apiKey, query: title, language: "zh-CN" },
        timeout: 10000
      });
      responseData = response.data;
    } else {
      responseData = await Widget.tmdb.get("/search/" + mediaType, { params: { query: title, language: "zh-CN" } });
    }
    if (!responseData || !responseData.results || responseData.results.length === 0) return null;
    var item = responseData.results[0];
    return {
      id: item.id,
      type: "tmdb",
      title: item.title || item.name,
      description: item.overview || "",
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      releaseDate: item.release_date || item.first_air_date || "",
      rating: item.vote_average || 0,
      mediaType: mediaType
    };
  } catch (e) { return null; }
}

// ==================== 4. 列表加载与搜索函数 ====================

// 新增：全局搜索执行函数
async function searchAI(params) {
  // 搜索框输入的词在 keyword 或 query 字段中
  const keyword = (params.keyword || params.query || "").trim();
  if (!keyword) return [];

  // 将 keyword 传入 AI 处理逻辑
  return await commonLoadLogic(params, keyword);
}

async function loadAIList(params) {
  return await commonLoadLogic(params, params.prompt);
}

async function loadSimilarList(params) {
  const ref = params.referenceTitle || "";
  return await commonLoadLogic(params, "类似《" + ref + "》的作品");
}

/**
 * 核心逻辑复用：调用 AI -> 解析剧名 -> TMDB 补全
 */
async function commonLoadLogic(params, promptText) {
  if (!promptText) throw new Error("请输入搜索内容");

  var aiConfig = {
    apiUrl: params.aiApiUrl || "",
    apiKey: params.aiApiKey || "",
    model: params.aiModel || "",
    format: params.aiApiFormat || "openai",
    prompt: promptText,
    count: parseInt(params.recommendCount) || 10
  };
  
  var tmdbKey = params.TMDB_API_KEY || "";
  
  // 1. 调用 AI 获取名字
  var content = await callAI(aiConfig);
  var names = parseNames(content).slice(0, aiConfig.count);
  
  if (names.length === 0) throw new Error("AI未能解析到结果");

  // 2. 并行查询 TMDB 详情
  var results = await Promise.all(names.map(async (name) => {
    // 先查 TV，没查到再查 Movie
    let detail = await getTmdbDetail(name, "tv", tmdbKey);
    if (!detail) detail = await getTmdbDetail(name, "movie", tmdbKey);
    return detail;
  }));

  var validResults = results.filter(r => r !== null);
  
  // 如果 TMDB 没搜到，至少返回文字结果防止空白
  if (validResults.length === 0) {
    return names.map((name, i) => ({
      id: "ai_" + i + Date.now(),
      type: "tmdb",
      title: name,
      description: "AI 推荐结果",
      mediaType: "movie"
    }));
  }
  
  return validResults;
}

console.log("AI影视推荐与搜索模块 v5.0.0 加载成功");
