/**
 * AI 影视推荐与智能搜索模块
 * 版本：5.3.0 (深度搜索与意图解析版)
 * 优化点：自动将演职员名转为代表作、强效过滤合集、补全元数据
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 智能影视搜索",
  description: "基于 AI 的自然语言搜索，精准匹配单体影视资源，自动过滤合集干扰",
  author: "crush7s",
  version: "5.3.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.siliconflow.cn/v1/chat/completions",
      description: "推荐使用硅基流动或 OpenAI 格式接口",
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
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "deepseek-ai/DeepSeek-V3",
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "留空则使用内置 Key",
    },
    {
      name: "recommendCount",
      title: "结果数量",
      type: "enumeration",
      enumOptions: [
        { title: "10部", value: "10" },
        { title: "15部", value: "15" },
      ],
      defaultValue: "10",
    },
  ],
  
  // 搜索框入口：支持自然语言搜索
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
      title: "AI 发现",
      functionName: "loadAIList",
      params: [{ name: "prompt", title: "想看什么", type: "input", value: "最近的高分悬疑剧" }],
    },
  ],
};

// ==================== 2. AI 意图解析层 ====================

async function callAI(config) {
  var { apiUrl, apiKey, model, format, prompt, count } = config;
  
  // 极致 Prompt：模仿云端模块的意图解析
  var systemPrompt = "你是一个专业的影视库搜索引擎。\n" +
    "【核心任务】根据用户输入的描述或关键词，列出 " + count + " 个具体的作品名称。\n" +
    "【铁律】\n" +
    "1. 实体转换：如果用户搜的是人名（如周星驰），你必须输出该艺人主演的单体电影作品名（如《功夫》），绝对禁止输出该人名本身。\n" +
    "2. 严禁合集：严禁输出包含“合集”、“系列”、“Collection”、“纪录片”、“电影节”的作品。\n" +
    "3. 纯净输出：严禁带序号、严禁带年份、严禁输出任何开场白或解释（如“好的，为您推荐...”）。\n" +
    "4. 每行一个剧名，若无结果请保持沉默。";
  
  if (format === "gemini") {
    return await callGemini(apiUrl, apiKey, model, prompt, count);
  }

  var headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;

  var response = await Widget.http.post(apiUrl, {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "搜索关键词：「" + prompt + "」" }
    ],
    temperature: 0.1, // 降低随机性，确保精准
  }, { headers: headers, timeout: 60000 });

  var data = response.data || response;
  return data.choices ? data.choices[0].message.content : "";
}

// ==================== 3. 智能过滤与资源匹配 (核心) ====================

async function getSmartTmdbDetail(title, apiKey) {
  if (!title || title.length < 1) return null;
  
  // 过滤黑名单：剔除合集类词汇
  const bannedWords = ["合集", "Collection", "纪录", "传记", "典藏", "电影节", "花絮", "特典", "周边"];
  const searchTypes = ["movie", "tv"];

  for (let type of searchTypes) {
    try {
      let responseData;
      if (apiKey) {
        let res = await Widget.http.get("https://api.themoviedb.org/3/search/" + type, { 
          params: { api_key: apiKey, query: title, language: "zh-CN", include_adult: false },
          timeout: 10000
        });
        responseData = res.data;
      } else {
        responseData = await Widget.tmdb.get("/search/" + type, { params: { query: title, language: "zh-CN" } });
      }

      if (responseData && responseData.results && responseData.results.length > 0) {
        // 在结果中寻找第一个不包含黑名单词汇的项目
        let bestMatch = responseData.results.find(item => {
          let name = item.title || item.name || "";
          return !bannedWords.some(word => name.includes(word));
        });

        if (bestMatch) {
          return {
            id: bestMatch.id,
            type: "tmdb",
            title: bestMatch.title || bestMatch.name,
            description: (bestMatch.overview || "暂无简介").substring(0, 120) + "...",
            posterPath: bestMatch.poster_path ? "https://image.tmdb.org/t/p/w500" + bestMatch.poster_path : null,
            backdropPath: bestMatch.backdrop_path ? "https://image.tmdb.org/t/p/original" + bestMatch.backdrop_path : null,
            releaseDate: bestMatch.release_date || bestMatch.first_air_date || "",
            rating: bestMatch.vote_average || 0.0,
            mediaType: type
          };
        }
      }
    } catch (e) { continue; }
  }
  return null;
}

// ==================== 4. 业务执行逻辑 ====================

async function searchAI(params) {
  const keyword = (params.keyword || params.query || "").trim();
  return await executeCommonLogic(params, keyword);
}

async function loadAIList(params) {
  return await executeCommonLogic(params, params.prompt);
}

async function executeCommonLogic(params, promptText) {
  if (!promptText) return [];

  var aiConfig = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: promptText,
    count: parseInt(params.recommendCount) || 10
  };

  // 1. 获取 AI 解析出的纯净剧名列表
  var content = await callAI(aiConfig);
  var names = content.split("\n")
    .map(line => line.replace(/^[\d\+\-\*•\s\.、]*/g, '').replace(/[《》""'']/g, '').trim())
    .filter(n => n.length > 0 && n.length < 25 && !n.includes("抱歉"));

  if (names.length === 0) throw new Error("AI 未能识别该关键词，请换个描述试试");

  // 2. 并行获取 TMDB 详情（包含合集过滤与海报补全）
  var results = await Promise.all(names.map(name => getSmartTmdbDetail(name, params.TMDB_API_KEY)));

  // 3. 去重并返回
  var seenIds = new Set();
  return results.filter(r => {
    if (r && !seenIds.has(r.id)) {
      seenIds.add(r.id);
      return true;
    }
    return false;
  });
}

async function callGemini(url, key, model, prompt, count) {
  var fullUrl = url.replace(/\/$/, '') + "/models/" + model + ":generateContent?key=" + key;
  var body = {
    contents: [{ parts: [{ text: "列出" + count + "个具体的影视作品名（严禁人名、严禁合集、严禁废话、每行一个）：" + prompt }] }]
  };
  var res = await Widget.http.post(fullUrl, body);
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

console.log("AI 智能搜索模块 v5.3.0 加载完成 [深度意图解析版]");
