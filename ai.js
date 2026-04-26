/**
 * AI 影视推荐模块（优化版：单次调用 + 批量TMDB）
 */

const USER_AGENT = "Mozilla/5.0";

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

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "自动补全API地址 + 全兼容中转 + 批量优化",
  author: "crush7s",
  version: "5.2.0",
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
        { name: "prompt", title: "想看什么", type: "input", required: true }
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
    () => ({ model, messages }),
    () => ({ model, prompt: messages.map(m => m.content).join("\n") }),
    () => ({ model, input: messages.map(m => m.content).join("\n") })
  ];

  for (var i = 0; i < strategies.length; i++) {
    try {
      var body = strategies[i]();

      return await Widget.http.post(apiUrl, body, {
        headers: headers,
        timeout: 60000
      });

    } catch (e) {
      if ((e.message || "").includes("400")) continue;
      throw e;
    }
  }

  throw new Error("所有请求策略失败");
}

// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {

  apiUrl = apiUrl.replace(/\/+$/, '');

  if (!apiUrl.includes("/v1beta")) {
    apiUrl += "/v1beta";
  }

  var url = apiUrl + '/models/' + model + ':generateContent?key=' + apiKey;

  var body = {
    contents: [
      {
        parts: [{ text: "推荐" + count + "部" + prompt + "影视作品，只返回名称" }]
      }
    ]
  };

  var res = await Widget.http.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });

  try {
    return res.candidates[0].content.parts[0].text;
  } catch {
    return "";
  }
}

// ==================== 解析 ====================
function extractContent(res) {
  if (!res) return "";

  if (res.choices) {
    let c = res.choices[0];
    if (c?.message?.content) return c.message.content;
    if (c?.text) return c.text;
  }

  if (res.data) return extractContent(res.data);
  if (typeof res === "string") return res;

  try { return res.candidates[0].content.parts[0].text } catch {}

  return "";
}

// ==================== AI入口（只调用一次） ====================
async function callAI(config) {

  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);

  console.log("[AI] 单次调用，请求推荐 " + config.count + " 部作品");
  console.log("[AI] 使用URL:", finalUrl);

  var messages = [
    { 
      role: "system", 
      content: "你是影视推荐助手。严格按照用户要求的数量推荐。每行返回一个影视名称，不要编号，不要解释。格式：\n电影名称\n电影名称" 
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

// ==================== 工具 ====================
function parseNames(text) {
  if (!text) return [];
  
  var count = 0;
  
  return text
    .split("\n")
    .map(function(t) { return t.trim(); })
    .filter(function(t) { 
      // 过滤空行、纯数字行、太短的行
      if (t.length < 1) return false;
      if (/^\d+[\.\、\)）]?\s*$/.test(t)) return false;
      // 去除行首的编号
      t = t.replace(/^\d+[\.\、\)）]\s*/, '');
      return t.length > 1;
    })
    .map(function(t) {
      return t.replace(/^\d+[\.\、\)）]\s*/, '').trim();
    })
    .filter(function(t) { return t.length > 1; })
    .slice(0, 20); // 最多20个
}

// ==================== TMDB批量查询优化 ====================
async function getTmdbDetailBatch(names, type, key, cache) {
  // 如果已有缓存，避免重复查询
  if (!cache) cache = {};
  
  var results = [];
  
  // 使用串行请求避免 TMDB 频率限制
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var cacheKey = type + "_" + name;
    
    if (cache[cacheKey]) {
      results.push(cache[cacheKey]);
      continue;
    }
    
    try {
      var res;
      
      if (key) {
        res = await Widget.http.get(
          "https://api.themoviedb.org/3/search/" + type,
          {
            params: {
              api_key: key,
              query: name,
              language: "zh-CN"
            }
          }
        );
        res = res.data;
      } else {
        res = await Widget.tmdb.get("/search/" + type, {
          params: { query: name }
        });
      }

      if (res.results?.length > 0) {
        var item = res.results[0];
        var entry = {
          id: item.id,
          type: "tmdb",
          title: item.title || item.name,
          description: item.overview || "",
          posterPath: item.poster_path,
          rating: item.vote_average || 0,
          mediaType: type
        };
        cache[cacheKey] = entry;
        results.push(entry);
      } else {
        cache[cacheKey] = null;
        results.push(null);
      }
      
    } catch (e) {
      console.log("[TMDB] 查询失败: " + name, e);
      cache[cacheKey] = null;
      results.push(null);
    }
    
    // 添加小延迟，避免触发频率限制
    if (i < names.length - 1) {
      await new Promise(function(resolve) { 
        setTimeout(resolve, 200); 
      });
    }
  }
  
  return results;
}

// ==================== 主逻辑（优化后） ====================
async function loadAIList(params) {

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount)
  };

  console.log("[AI推荐] 开始获取推荐，目标数量:", config.count);
  
  // 1. 调用AI一次，获取所有推荐名称
  var text = await callAI(config);
  console.log("[AI返回] 原始响应:", text);
  
  // 2. 解析名称列表
  var names = parseNames(text);
  console.log("[解析] 获取到 " + names.length + " 个名称:", names);
  
  // 3. 如果没有解析到任何名称，返回默认结构
  if (!names.length) {
    return [{
      id: "ai_error",
      type: "tmdb",
      title: "未获取到推荐",
      description: "AI返回内容: " + text.substring(0, 100)
    }];
  }
  
  // 4. 批量查询TMDB（先查电影，没找到则查电视剧）
  var tmdbKey = params.TMDB_API_KEY;
  var cache = {};
  
  // 先查所有电影
  var movieResults = await getTmdbDetailBatch(names, "movie", tmdbKey, cache);
  
  // 找出没有找到电影的，再查电视剧
  var tvNames = [];
  var tvIndexes = [];
  for (var i = 0; i < movieResults.length; i++) {
    if (!movieResults[i]) {
      tvNames.push(names[i]);
      tvIndexes.push(i);
    }
  }
  
  var tvResults = [];
  if (tvNames.length > 0) {
    console.log("[TMDB] 未找到电影，尝试电视剧:", tvNames);
    tvResults = await getTmdbDetailBatch(tvNames, "tv", tmdbKey, cache);
  }
  
  // 5. 合并结果
  var finalResults = [];
  var tvIdx = 0;
  
  for (var i = 0; i < names.length; i++) {
    if (movieResults[i]) {
      finalResults.push(movieResults[i]);
    } else if (tvIdx < tvResults.length) {
      var tvRes = tvResults[tvIdx];
      if (tvRes) {
        finalResults.push(tvRes);
      } else {
        // 都没找到，创建基础条目
        finalResults.push({
          id: "ai_" + i,
          type: "tmdb",
          title: names[i],
          description: "AI推荐，暂无详细信息"
        });
      }
      tvIdx++;
    } else {
      finalResults.push({
        id: "ai_" + i,
        type: "tmdb",
        title: names[i],
        description: "AI推荐，暂无详细信息"
      });
    }
  }
  
  console.log("[完成] 最终返回 " + finalResults.length + " 条结果");
  
  return finalResults;
}

async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.2（单次调用+批量TMDB优化）已加载");