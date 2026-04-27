/**
 * AI 影视推荐模块（JSCore 修复增强版）
 * 保持原有功能不变：
 * 1. 优化 TMDB 返回数据（显示上映时间 / 首播时间 + 类型）
 * 2. 优化 AI 提示词（支持演员名返回作品）
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方接口",
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
};

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
      content:
        "你是影视推荐助手。只返回影视名称。"
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

// ==================== 🆕 增强的类型映射 ====================
function getGenreNames(ids, mediaType) {
  var map = {
    // 电影类
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧",
    80: "犯罪", 99: "纪录", 18: "剧情", 10751: "家庭",
    14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻",
    53: "惊悚", 10752: "战争", 37: "西部",
    // 电视剧类
    10759: "动作冒险", 10762: "儿童", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧",
    10767: "脱口秀", 10768: "战争政治", 10770: "电视电影"
  };

  if (!ids || !ids.length) return "未知类型";

  var arr = [];
  for (var i = 0; i < ids.length; i++) {
    if (map[ids[i]]) arr.push(map[ids[i]]);
    if (arr.length >= 3) break; // 最多显示3个类型
  }

  return arr.length > 0 ? arr.join(" / ") : "未知类型";
}

// ==================== 🆕 增强的TMDB搜索 ====================
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

    // 🔥 智能排序（综合评分和人气）
    res.results.sort((a, b) => {
      var scoreA = (a.vote_average || 0) * Math.log((a.vote_count || 1) + 1);
      var scoreB = (b.vote_average || 0) * Math.log((b.vote_count || 1) + 1);
      return scoreB - scoreA;
    });

    var item = res.results[0];

    // ===== 🆕 优化年份显示 =====
    var rawDate = item.release_date || item.first_air_date || "";
    var year = rawDate ? rawDate.substring(0, 4) : "";

    // 电影：上映时间 | 电视剧：首播时间
    var dateType = type === "movie" ? "上映" : "首播";
    var dateDisplay = year ? year : "未知年份";
    
    // 如果有完整日期，显示更详细
    if (rawDate && rawDate.length >= 10) {
      var monthDay = rawDate.substring(5); // MM-DD
      if (type === "tv") {
        dateDisplay = year + "年首播";
      } else {
        dateDisplay = year;
      }
    }

    // ===== 🆕 优化类型显示 =====
    var genre = getGenreNames(item.genre_ids, type);

    // ===== 🆕 完整标题处理 =====
    var titleName = item.title || item.name || title;
    var originalTitle = item.original_title || item.original_name || "";
    
    // 如果有原始标题且与当前标题不同，添加显示
    if (originalTitle && originalTitle !== titleName) {
      titleName = titleName + " (" + originalTitle + ")";
    }

    // ===== 🆕 优化简介 =====
    var overview = item.overview || "暂无简介";
    if (overview.length > 200) {
      overview = overview.substring(0, 200) + "...";
    }

    // ===== 🆕 完整海报URL =====
    var posterPath = item.poster_path 
      ? "https://image.tmdb.org/t/p/w500" + item.poster_path 
      : null;

    // ===== 🆕 构建优化的描述信息 =====
    var descriptionParts = [];
    
    // 第一行：年份 + 类型标签
    var metaLine = [];
    if (year) {
      metaLine.push(type === "movie" ? year + "年上映" : year + "年首播");
    }
    if (genre) {
      metaLine.push(genre);
    }
    if (item.vote_average > 0) {
      metaLine.push("⭐" + item.vote_average.toFixed(1));
    }
    
    descriptionParts.push(metaLine.join(" · "));
    
    // 第二行：简介
    if (overview) {
      descriptionParts.push(overview);
    }

    // ===== 🆕 返回结构化的数据 =====
    return {
      id: item.id,
      type: "tmdb",
      title: titleName,
      description: descriptionParts.join("\n"),
      posterPath: posterPath,
      rating: item.vote_average || 0,
      mediaType: item.media_type || type,
      year: year,
      genreText: genre,
      // 额外信息（可能对UI有用）
      originalTitle: originalTitle,
      voteCount: item.vote_count || 0,
      popularity: item.popularity || 0,
      dateDisplay: dateDisplay
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

      // 先搜索电影，再搜索电视剧
      var result = await searchTMDB(name, "movie", params.TMDB_API_KEY);

      if (!result) {
        result = await searchTMDB(name, "tv", params.TMDB_API_KEY);
      }

      // 🆕 如果没有找到TMDB结果，返回基础信息
      if (!result) {
        results.push({
          id: "ai_" + i,
          type: "tmdb",
          title: name,
          description: "AI 推荐作品\n暂无详细信息",
          posterPath: null,
          rating: 0,
          year: "未知",
          genreText: "AI推荐"
        });
      } else {
        results.push(result);
      }
    }

    return results;
  } catch (e) {
    return [{
      id: "err",
      type: "tmdb",
      title: "请求出错",
      description: "错误信息：" + e.message + "\n请检查API配置"
    }];
  }
}

// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.3.0 增强优化版已加载 - TMDB显示优化");
