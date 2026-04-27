/**
 * AI 影视推荐模块（JSCore 修复增强版）
 * 保持原有功能不变：
 * 1. 优化 TMDB 返回数据（显示上映时间 / 首播时间 + 类型）
 * 2. 优化 AI 提示词（支持演员名返回作品）
 * 3. 🔥 修复列表显示问题：按 ForwardWidgets 官方标准使用 description 字段
 */
const USER_AGENT = "Mozilla/5.0";
// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方接口",
  author: "crush7s",
  version: "5.3.6",
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
// ==================== OpenAI ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ")
      ? apiKey
      : "Bearer " + apiKey;
  }
  var body = {
    model: model,
    messages: messages
  };
  return await Widget.http.post(apiUrl, body, {
    headers: headers,
    timeout: 60000
  });
}
// ==================== Gemini ====================
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  var base = apiUrl.replace(/\/+$/, "");
  if (base.indexOf("/v1") === -1) {
    base += "/v1beta";
  }
  var modelName = model || "gemini-1.5-flash";
  if (modelName.indexOf("models/") !== 0) {
    modelName = "models/" + modelName;
  }
  var url = base + "/" + modelName + ":generateContent?key=" + apiKey;
  var body = {
    contents: [{
      parts: [{
        text:
          "你是一个影视助手。请推荐" +
          count +
          "部" +
          prompt +
          "相关影视作品。" +
          "如果输入的是演员名字，请返回该演员主演/参演的代表作品。" +
          "只返回名称，不要编号，不要解释."
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500
    }
  };
  var res = await Widget.http.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });
  return extractContent(res);
}
// ==================== 提取内容 ====================
function extractContent(res) {
  if (!res) return "";
  if (res.choices && res.choices[0]) {
    var c = res.choices[0];
    if (c.message && c.message.content) return c.message.content;
    if (c.text) return c.text;
  }
  if (
    res.candidates &&
    res.candidates[0] &&
    res.candidates[0].content &&
    res.candidates[0].content.parts &&
    res.candidates[0].content.parts[0]
  ) {
    return res.candidates[0].content.parts[0].text;
  }
  if (res.data) return extractContent(res.data);
  if (typeof res === "string") return res;
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
    {
      role: "system",
      content: "你是影视推荐助手。只返回影视名称。"
    },
    {
      role: "user",
      content:
        "推荐" +
        config.count +
        "部与" +
        config.prompt +
        "相关的影视作品"
    }
  ];
  var res = await callOpenAIFormat(
    finalUrl,
    config.apiKey,
    config.model,
    messages
  );
  return extractContent(res);
}
// ==================== 名称解析 ====================
function parseNames(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map(t => t.trim())
    .map(t => t.replace(/^\d+[\.\、\)）\s\-]+/, ""))
    .filter(t => t.length > 0)
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
// ==================== 🔥 核心修复：TMDB搜索 (按官方标准使用 description) ====================
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
            language: "zh-CN",
            include_adult: false
          }
        }
      );
      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: {
          query: title,
          language: "zh-CN",
          include_adult: false
        }
      });
    }
    if (!res || !res.results || res.results.length === 0) return null;
    // 智能排序（综合评分和人气）
    res.results.sort((a, b) => {
      var scoreA = (a.vote_average || 0) * Math.log((a.vote_count || 1) + 1);
      var scoreB = (b.vote_average || 0) * Math.log((b.vote_count || 1) + 1);
      return scoreB - scoreA;
    });
    var item = res.results[0];
    // 主标题：纯影视名称
    var titleName = item.title || item.name || title;
    // 副标题：年份·类型
    var rawDate = item.release_date || item.first_air_date || "";
    var year = rawDate ? rawDate.substring(0, 4) : "未知";
    var genres = getGenreNames(item.genre_ids);
    if (!genres) genres = (type === "movie" ? "电影" : "剧集");
    var description = year + "·" + genres;  // 例：2026·惊悚/动作
    // 海报
    var posterPath = item.poster_path 
      ? "https://image.tmdb.org/t/p/w500" + item.poster_path 
      : null;
    return {
      id: item.id,
      type: "tmdb",
      title: titleName,         // 主标题
      description: description, // 🔥 副标题（ForwardWidgets 列表默认显示此字段作为副标题）
      posterPath: posterPath,
      rating: item.vote_average || 0,
      mediaType: item.media_type || type
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
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var result = await searchTMDB(name, "movie", params.TMDB_API_KEY);
      if (!result) {
        result = await searchTMDB(name, "tv", params.TMDB_API_KEY);
      }
      if (result) {
        results.push(result);
      } else {
        results.push({
          id: "ai_" + i,
          type: "tmdb",
          title: name,
          description: "AI推荐·未知类型",
          posterPath: null,
          rating: 0,
          mediaType: "movie"
        });
      }
    }
    return results;
  } catch (e) {
    return [{
      id: "err",
      type: "tmdb",
      title: "请求出错",
      description: "错误信息"
    }];
  }
}
// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}
console.log("✅ AI影视推荐模块 v5.3.6 已加载 - 按官方标准显示副标题");
