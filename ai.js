/**
 * AI 影视推荐与智能搜索模块
 * 支持 OpenAI / Gemini / 硅基流动 / NewApi 等接口
 * 版本：5.2.0 (极致过滤版 - 解决合集与废话问题)
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义 AI 的智能推荐与搜索，兼容 OpenAI、Gemini、硅基流动等接口",
  author: "crush7s",
  site: "",
  version: "5.2.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.siliconflow.cn/v1/chat/completions",
      description: "推荐使用硅基流动",
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
      description: "推荐：deepseek-ai/DeepSeek-V3",
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "在 TMDB 官网获取",
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
  
  // 全局搜索配置：点击搜索框时触发
  search: {
    title: "AI 智能搜索",
    functionName: "searchAI",
    params: [
      {
        name: "keyword",
        title: "描述你想看的内容",
        type: "input",
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
  ],
};

// ==================== 2. AI API 核心层 ====================

async function callAI(config) {
  var { apiUrl, apiKey, model, format, prompt, count } = config;
  
  try {
    if (format === "gemini") {
      return await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } else {
      // 极致 Prompt：强制 AI 将“人名”转换为“单体代表作名”
      var systemPrompt = "你是一个纯粹的影视剧名提取接口。\n" +
        "【任务】根据用户输入的关键词或描述，列出 " + count + " 个具体的作品名称。\n" +
        "【铁律】\n" +
        "1. 如果用户输入的是演职员名字（如周星驰），请列出其主演的具体电影（如《功夫》），绝不要直接输出该名字。\n" +
        "2. 严禁输出任何包含“合集”、“系列”、“纪录片”、“电影节”或“Collection”的条目。\n" +
        "3. 严禁输出任何道歉、开场白、解释语或标点符号。\n" +
        "4. 严禁带序号，每行只能有一个纯净的剧名。\n" +
        "5. 禁止回答“非常抱歉”等废话，若无结果请保持沉默。";
      
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "用户关键词：「" + prompt + "」" }
      ];
      
      var headers = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;

      var response = await Widget.http.post(apiUrl, {
        model: model,
        messages: messages,
        max_tokens: 400,
        temperature: 0.1, 
      }, { headers: headers, timeout: 60000 });

      return extractContent(response);
    }
  } catch (error) {
    throw new Error("AI服务请求失败: " + error.message);
  }
}

function extractContent(response) {
  var data = response.data || response;
  if (data.choices && data.choices[0]) {
    return data.choices[0].message ? data.choices[0].message.content : (data.choices[0].text || "");
  }
  return typeof response === 'string' ? response : "";
}

// ==================== 3. 逻辑过滤层 (重点) ====================

function parseNames(content) {
  if (!content) return [];
  var names = [];
  var lines = content.split("\n");
  
  // 废话及垃圾词黑名单
  const blacklist = ["抱歉", "作为一个", "AI助手", "无法", "对不起", "模型", "内容", "合集", "如下", "找到"];

  for (var line of lines) {
    // 强力清理所有符号
    line = line.replace(/^[\d\+\-\*•\s\.、，]*/g, '').replace(/[《》""''「」\[\]【】()（）]/g, '').trim();
    
    const isChatter = blacklist.some(word => line.includes(word));
    const isSentence = /[，。！？：；]/.test(line);

    if (line && line.length >= 1 && line.length <= 25 && !isChatter && !isSentence) {
      names.push(line);
    }
  }
  return [...new Set(names)];
}

async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title || !title.trim()) return null;
  try {
    var responseData;
    if (apiKey) {
      var response = await Widget.http.get("https://api.themoviedb.org/3/search/" + mediaType, { 
        params: { api_key: apiKey, query: title, language: "zh-CN", include_adult: false },
        timeout: 10000
      });
      responseData = response.data;
    } else {
      responseData = await Widget.tmdb.get("/search/" + mediaType, { params: { query: title, language: "zh-CN" } });
    }
    
    if (!responseData || !responseData.results || responseData.results.length === 0) return null;
    
    // 关键过滤：如果在 TMDB 搜索结果中发现标题带有禁用词，则寻找下一个候选条目
    const bannedWords = ["合集", "Collection", "纪录", "传记", "典藏", "电影节", "花絮"];
    
    let bestMatch = responseData.results.find(item => {
      const mainTitle = item.title || item.name || "";
      return !bannedWords.some(word => mainTitle.includes(word));
    });

    // 如果所有候选结果都带“合集”，说明该词本身可能无效，此时返回 null 避免干扰
    if (!bestMatch) return null;

    return {
      id: bestMatch.id,
      type: "tmdb",
      title: bestMatch.title || bestMatch.name,
      description: bestMatch.overview || "",
      posterPath: bestMatch.poster_path,
      backdropPath: bestMatch.backdrop_path,
      releaseDate: bestMatch.release_date || bestMatch.first_air_date || "",
      rating: bestMatch.vote_average || 0,
      mediaType: mediaType
    };
  } catch (e) { return null; }
}

// ==================== 4. 业务执行 ====================

async function searchAI(params) {
  const keyword = (params.keyword || params.query || "").trim();
  return await commonLoadLogic(params, keyword);
}

async function loadAIList(params) {
  return await commonLoadLogic(params, params.prompt);
}

async function commonLoadLogic(params, promptText) {
  if (!promptText) return [];

  var aiConfig = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: promptText,
    count: parseInt(params.recommendCount) || 10
  };
  
  var tmdbKey = params.TMDB_API_KEY || "";
  
  // 1. 获取 AI 转换后的剧名列表
  var content = await callAI(aiConfig);
  var names = parseNames(content);
  
  if (names.length === 0) throw new Error("AI未能提供具体剧名，请换个描述");

  // 2. 并行查询 TMDB (强制过滤合集)
  var results = await Promise.all(names.map(async (name) => {
    // 优先电影，再搜 TV
    let detail = await getTmdbDetail(name, "movie", tmdbKey);
    if (!detail) detail = await getTmdbDetail(name, "tv", tmdbKey);
    return detail;
  }));

  // 3. 去重与过滤无效结果
  var seenIds = new Set();
  var validResults = results.filter(r => {
    if (!r || seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });
  
  return validResults;
}

console.log("AI 影视增强搜索模块 v5.2.0 已加载 [硅基流动优化版]");
