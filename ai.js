/**
 * AI 影视推荐与智能搜索模块
 * 支持 OpenAI / Gemini / 硅基流动 / NewApi 等接口
 * 版本：5.1.0 (智能搜索 & 废话过滤增强版)
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义 AI 的智能推荐与搜索，兼容 OpenAI、Gemini、硅基流动等接口",
  author: "crush7s",
  site: "",
  version: "5.1.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.siliconflow.cn/v1/chat/completions",
      description: "推荐使用硅基流动或 Gemini",
      placeholders: [
        { title: "硅基流动", value: "https://api.siliconflow.cn/v1/chat/completions" },
        { title: "OpenAI 官方", value: "https://api.openai.com/v1/chat/completions" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com/v1beta" },
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
      defaultValue: "deepseek-ai/DeepSeek-V3",
      description: "推荐：deepseek-ai/DeepSeek-V3 或 Qwen/Qwen2.5-7B-Instruct",
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "在 TMDB 官网获取，留空则使用内置 Key",
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
  
  // 全局搜索配置
  search: {
    title: "AI 智能搜索",
    functionName: "searchAI",
    params: [
      {
        name: "keyword",
        title: "描述你想看的内容",
        type: "input",
        description: "支持自然语言（如：类似《大话西游》的喜剧，周星驰高分代表作）",
      },
    ],
  },
  
  modules: [
    {
      id: "smartRecommend",
      title: "AI智能推荐",
      functionName: "loadAIList",
      params: [{ name: "prompt", title: "想看什么", type: "input", value: "高分犯罪剧集" }],
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      functionName: "loadSimilarList",
      params: [{ name: "referenceTitle", title: "喜欢的作品", type: "input", value: "" }],
    },
  ],
};

// ==================== 2. AI API 核心层 ====================

async function callAI(config) {
  var { apiUrl, apiKey, model, format, prompt, count } = config;
  
  try {
    if (format === "gemini") {
      return await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } else {
      // 深度优化的系统提示词：强制“数据库模式”，消除 AI 的礼貌废话
      var systemPrompt = "你是一个影视数据库。根据用户指令提供 " + count + " 个最相关的影视作品名称。\n" +
        "【严禁行为】\n" +
        "1. 禁止输出任何开场白、道歉、解释（如“非常抱歉”、“作为一个AI助手...”）。\n" +
        "2. 只能输出单体作品名（如《功夫》），严禁输出“XX合集”、“XX纪录片”、“XX系列”。\n" +
        "3. 每行只写一个剧名，禁止带标点符号、序号或年份。\n" +
        "4. 如果无法匹配，请保持沉默（直接输出空）。";
      
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "搜索关键词：「" + prompt + "」" }
      ];
      
      var headers = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;

      var response = await Widget.http.post(apiUrl, {
        model: model,
        messages: messages,
        max_tokens: 400,
        temperature: 0.1, // 降低随机性，让输出更干净
      }, { headers: headers, timeout: 60000 });

      return extractContent(response);
    }
  } catch (error) {
    throw new Error("AI服务异常: " + error.message);
  }
}

function extractContent(response) {
  var data = response.data || response;
  if (data.choices && data.choices[0]) {
    return data.choices[0].message ? data.choices[0].message.content : (data.choices[0].text || "");
  }
  return typeof response === 'string' ? response : "";
}

async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  var promptText = "影视搜索列表（单体代表作）：" + prompt + "。列出" + count + "个名字，每行一个，无标点，无解释。";
  
  var response = await Widget.http.post(fullUrl, {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
  }, { headers: { "Content-Type": "application/json" }, timeout: 60000 });
  
  if (response && response.candidates && response.candidates[0]) {
    return response.candidates[0].content.parts[0].text || "";
  }
  return "";
}

// ==================== 3. 工具函数 (解析与 TMDB) ====================

function parseNames(content) {
  if (!content) return [];
  var names = [];
  var lines = content.split("\n");
  
  // 废话黑名单：拦截 AI 的对话式回复
  const blacklist = ["抱歉", "作为一个", "AI助手", "无法", "对不起", "模型", "提示词", "违规", "内容", "推荐", "如下", "找到"];

  for (var line of lines) {
    // 基础清理：去掉序号、书名号
    line = line.replace(/^[\d\+\-\*•\s\.、，]*/g, '').replace(/[《》""''「」\[\]【】()（）]/g, '').trim();
    
    // 逻辑过滤
    const isChatter = blacklist.some(word => line.includes(word));
    const isSentence = /[，。！？：；]/.test(line); // 剧名通常不含这些标点

    if (line && line.length >= 1 && line.length <= 25 && !isChatter && !isSentence) {
      names.push(line);
    }
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
    
    // 这里的策略：尽量避开标题带“合集”、“纪录”的结果
    const filterWords = ["合集", "Collection", "纪录", "传记", "典藏", "电影节"];
    let item = responseData.results.find(r => {
      const t = r.title || r.name;
      return !filterWords.some(w => t.includes(w));
    });

    // 如果都被过滤了，才选第一个
    if (!item) item = responseData.results[0];

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

// ==================== 4. 业务执行函数 ====================

async function searchAI(params) {
  const keyword = (params.keyword || params.query || "").trim();
  return await commonLoadLogic(params, keyword);
}

async function loadAIList(params) {
  return await commonLoadLogic(params, params.prompt);
}

async function loadSimilarList(params) {
  return await commonLoadLogic(params, "类似《" + (params.referenceTitle || "") + "》的高分影视作品");
}

async function commonLoadLogic(params, promptText) {
  if (!promptText) return [];

  var aiConfig = {
    apiUrl: params.aiApiUrl || "",
    apiKey: params.aiApiKey || "",
    model: params.aiModel || "",
    format: params.aiApiFormat || "openai",
    prompt: promptText,
    count: parseInt(params.recommendCount) || 10
  };
  
  var tmdbKey = params.TMDB_API_KEY || "";
  
  // 1. 调用 AI 并解析
  var content = await callAI(aiConfig);
  var names = parseNames(content).slice(0, aiConfig.count);
  
  if (names.length === 0) throw new Error("AI未能提供有效剧名，请尝试更换关键词");

  // 2. 查询 TMDB (先搜电影，再搜 TV)
  var results = await Promise.all(names.map(async (name) => {
    let detail = await getTmdbDetail(name, "movie", tmdbKey);
    if (!detail) detail = await getTmdbDetail(name, "tv", tmdbKey);
    return detail;
  }));

  // 3. 最终过滤与去重
  var seenIds = new Set();
  var validResults = results.filter(r => {
    if (!r || seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });
  
  // 4. 如果所有 TMDB 匹配都失败了，至少显示 AI 返回的文本名字
  if (validResults.length === 0) {
    return names.map((name, i) => ({
      id: "ai_text_" + i + "_" + Date.now(),
      type: "tmdb",
      title: name,
      description: "AI 推荐结果",
      mediaType: "movie"
    }));
  }
  
  return validResults;
}

console.log("AI 影视增强搜索模块 v5.1.0 已挂载");
