/**
 * AI 影视推荐模块
 * 修复：兼容更多第三方接口
 * 优化：AI提示词调整，新增演员作品推荐
 * 优化：API接口路径自动补齐
 * 优化：TMDB标题返回显示详情
 * 修复：聚合引擎资源加载失败（请求头/超时/容错/URL拼接）
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方接口",
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
        { title: "OpenAI 官方", value: "https://api.openai.com" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com" },
        { title: "自定义", value: "" }
      ]
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
            { title: "悬疑烧脑", value: "悬疑烧脑" },
            { title: "科幻巨制", value: "科幻巨制" },
            { title: "爆笑喜剧", value: "爆笑喜剧" },
            { title: "动作爽片", value: "动作爽片" },
            { title: "恐怖惊悚", value: "恐怖惊悚" },
            { title: "周星驰", value: "周星驰" },
            { title: "汤姆·克鲁斯", value: "汤姆·克鲁斯" }
          ]
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

// ==================== 聚合引擎请求工具（新增：修复资源加载核心） ====================
async function requestWithRetry(url, options = {}, retryTimes = 2) {
  // 适配聚合引擎请求头
  const defaultHeaders = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Connection": "keep-alive"
  };
  
  const finalOptions = {
    timeout: 10000, // 聚合引擎缩短超时（避免资源挂起）
    headers: { ...defaultHeaders, ...options.headers },
    ...options
  };

  try {
    return await Widget.http.request(url, finalOptions);
  } catch (e) {
    if (retryTimes > 0 && (e.message.includes("timeout") || e.message.includes("408") || e.message.includes("502"))) {
      // 超时/网关错误重试
      await new Promise(resolve => setTimeout(resolve, 500));
      return requestWithRetry(url, options, retryTimes - 1);
    }
    throw e; // 非重试类错误抛出
  }
}

// ==================== OpenAI ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : "Bearer " + apiKey;
  }
  var body = { model: model, messages: messages };
  // 修复：改用带重试的请求工具
  return await requestWithRetry(apiUrl, {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers,
    timeout: 60000
  });
}

// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  var base = apiUrl.replace(/\/+$/, "");
  // 修复：Gemini URL 拼接（聚合引擎兼容v1正式版）
  if (base.indexOf("/v1") === -1) base += "/v1";
  var modelName = model || "gemini-1.5-flash";
  if (modelName.indexOf("models/") !== 0) modelName = "models/" + modelName;
  var url = `${base}/${modelName}:generateContent?key=${apiKey}`;
  
  var body = {
    contents: [{
      parts: [{
        text: "你是一个影视助手。请推荐" + count + "部" + prompt + "相关影视作品。" +
              "如果输入的是演员名字，请返回该演员主演/参演的代表作品。" +
              "只返回名称，不要编号，不要解释."
      }]
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
  };
  
  // 修复：改用带重试的请求工具
  var res = await requestWithRetry(url, {
    method: "POST",
    body: JSON.stringify(body),
    timeout: 60000
  });
  return extractContent(res);
}

// ==================== 提取内容 ====================
function extractContent(res) {
  if (!res) return "";
  // 修复：聚合引擎返回格式兼容（res.data 优先）
  const data = res.data || res;
  
  if (data.choices && data.choices[0]) {
    var c = data.choices[0];
    if (c.message && c.message.content) return c.message.content;
    if (c.text) return c.text;
  }
  if (data.candidates?.[0]?.content?.parts?.[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  if (typeof data === "string") return data;
  return "";
}

// ==================== URL 修复 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";
  apiUrl = apiUrl.replace(/\/+$/, "");
  if (format === "gemini") return apiUrl;
  if (apiUrl.includes("/chat/completions")) return apiUrl;
  if (apiUrl.endsWith("/v1")) return apiUrl + "/chat/completions";
  if (!apiUrl.includes("/v1")) return apiUrl + "/v1/chat/completions";
  return apiUrl;
}

// ==================== AI入口 ====================
async function callAI(config) {
  if (config.format === "gemini") {
    return await callGeminiFormat(config.apiUrl, config.apiKey, config.model, config.prompt, config.count);
  }
  var finalUrl = normalizeApiUrl(config.apiUrl, config.format);
  var messages = [
    { role: "system", content: "你是影视推荐助手。只返回影视名称。" },
    { role: "user", content: "推荐" + config.count + "部与" + config.prompt + "相关的影视作品" }
  ];
  var res = await callOpenAIFormat(finalUrl, config.apiKey, config.model, messages);
  return extractContent(res);
}

// ==================== 名称解析（修复：增强聚合引擎文本容错） ====================
function parseNames(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/[\n|，|,|；|;]/) // 修复：兼容更多分隔符（聚合引擎返回可能带中文标点）
    .map(t => t.trim())
    .map(t => t.replace(/^\d+[\.\、\)）\s\-：:]+/, "")) // 修复：增加中文冒号等分隔符
    .map(t => t.replace(/《|》|【|】|「|」/g, "")) // 修复：移除书名号/括号（聚合引擎返回可能带）
    .filter(t => t.length > 1) // 过滤空/单字符（避免无效资源加载）
    .slice(0, 15);
}

// ==================== 类型映射 ====================
function getGenreNames(ids) {
  var map = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧",
    80: "犯罪", 99: "纪录", 18: "剧情", 10751: "家庭",
    14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻",
    53: "惊悚", 10752: "战争", 37: "西部",
    10759: "动作冒险", 10762: "儿童", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧",
    10767: "脱口秀", 10768: "战争政治", 10770: "电视电影"
  };
  if (!ids || !ids.length) return "";
  var arr = [];
  for (var i = 0; i < ids.length; i++) {
    if (map[ids[i]]) arr.push(map[ids[i]]);
    if (arr.length >= 2) break;
  }
  return arr.join("/");
}

// ==================== 🔥 优化版 TMDB 搜索（修复：聚合引擎资源加载） ====================
async function searchTMDB(title, type, key) {
  try {
    if (!title) return null; // 空标题直接返回，避免无效请求
    var res;
    
    // 修复：聚合引擎 TMDB 调用适配（优先用key，兼容内置调用）
    const tmdbParams = {
      query: title,
      language: "zh-CN",
      include_adult: false
    };

    if (key) {
      res = await requestWithRetry(
        `https://api.themoviedb.org/3/search/${type}`,
        {
          method: "GET",
          params: { ...tmdbParams, api_key: key }
        }
      );
      res = res.data || res;
    } else {
      // 修复：聚合引擎内置 TMDB 调用添加超时
      res = await Widget.tmdb.get(`/search/${type}`, {
        params: tmdbParams,
        timeout: 8000
      });
      res = res.data || res;
    }

    if (!res || !res.results || res.results.length === 0) return null;

    // 综合评分和人气排序
    res.results.sort((a, b) => {
      var scoreA = (a.vote_average || 0) * Math.log((a.vote_count || 1) + 1);
      var scoreB = (b.vote_average || 0) * Math.log((b.vote_count || 1) + 1);
      return scoreB - scoreA;
    });

    var item = res.results[0];

    // 主标题
    var titleName = item.title || item.name || title;

    // 🔥 年份：只取一次
    var rawDate = item.release_date || item.first_air_date || "";
    var year = rawDate ? rawDate.substring(0, 4) : "";

    // 🔥 类型：优先使用 genre_ids，缺失时使用媒体类型
    var genres = getGenreNames(item.genre_ids);
    if (!genres) {
      genres = (type === "movie" ? "电影" : "剧集");
    }

    // 🔥 副标题格式：年份·类型（年份只显示一次）
    var yearGenre = year ? year + "·" + genres : genres;

    // 简介
    var overview = item.overview || "暂无简介";
    if (overview.length > 200) overview = overview.substring(0, 200) + "...";

    // 海报
    var posterPath = item.poster_path 
      ? "https://image.tmdb.org/t/p/w500" + item.poster_path 
      : null;

    return {
      id: type + "." + item.id,
      tmdbId: parseInt(item.id),
      type: "tmdb",
      mediaType: type,
      title: titleName,
      subTitle: yearGenre,       // 副标题：年份·类型
      genreTitle: genres,        // 纯类型文本
      description: overview,
      posterPath: posterPath,
      releaseDate: rawDate,
      rating: item.vote_average || 0
    };
  } catch (e) {
    console.error("TMDB搜索出错:", e.message);
    return null;
  }
}

// ==================== 主入口 ====================
async function loadAIList(params) {
  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel || "gpt-4o-mini",
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 9
  };

  try {
    var text = await callAI(config);
    var names = parseNames(text);
    var results = [];

    // 修复：聚合引擎并发限制，改用串行+超时兜底
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      let result = null;
      // 给每个TMDB请求单独加超时兜底
      try {
        result = await Promise.race([
          searchTMDB(name, "movie", params.TMDB_API_KEY),
          new Promise((_, reject) => setTimeout(() => reject(new Error("TMDB请求超时")), 8000))
        ]);
      } catch (e) {
        try {
          result = await Promise.race([
            searchTMDB(name, "tv", params.TMDB_API_KEY),
            new Promise((_, reject) => setTimeout(() => reject(new Error("TMDB请求超时")), 8000))
          ]);
        } catch (tvErr) {
          console.warn(`加载${name}资源失败:`, tvErr.message);
        }
      }

      if (result) {
        results.push(result);
      } else {
        results.push({
          id: "ai_" + i,
          type: "tmdb",
          mediaType: "movie",
          title: name,
          subTitle: "AI推荐",
          genreTitle: "AI推荐",
          description: "暂无详细信息",
          posterPath: null,
          rating: 0
        });
      }
    }

    return results;
  } catch (e) {
    return [{
      id: "err",
      type: "tmdb",
      title: "请求出错",
      subTitle: "错误",
      genreTitle: "错误",
      description: e.message || "聚合引擎资源加载失败，请检查API配置或网络"
    }];
  }
}

// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.3.9 已加载 - 副标题优化完成（聚合引擎资源加载修复）");
