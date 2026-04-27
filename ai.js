/**
 * AI 影视推荐模块（JSCore 优化版）
 * 优化内容：
 * 1. TMDB 返回增加年份 + 类型显示（类似示例图）
 * 2. AI Prompt 增强：支持演员名返回作品
 * 3. 保持原有接口与功能不变
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
            { title: "周星驰", value: "周星驰" },
            { title: "汤姆汉克斯", value: "汤姆汉克斯" }
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
    headers["Authorization"] =
      apiKey.indexOf("Bearer ") === 0 ? apiKey : "Bearer " + apiKey;
  }

  return await Widget.http.post(apiUrl, {
    model: model,
    messages: messages
  }, {
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
        text: buildPrompt(prompt, count)
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600
    }
  };

  var res = await Widget.http.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });

  return extractContent(res);
}

// ==================== 内容解析 ====================
function extractContent(res) {
  if (!res) return "";

  if (res.choices && res.choices[0]) {
    var c = res.choices[0];
    if (c.message && c.message.content) return c.message.content;
    if (c.text) return c.text;
  }

  if (res.candidates &&
      res.candidates[0] &&
      res.candidates[0].content &&
      res.candidates[0].content.parts &&
      res.candidates[0].content.parts[0]) {
    return res.candidates[0].content.parts[0].text || "";
  }

  if (res.data) return extractContent(res.data);

  if (typeof res === "string") return res;

  return "";
}

// ==================== URL 规范 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  if (apiUrl.indexOf("/chat/completions") > -1) return apiUrl;
  if (apiUrl.indexOf("/v1") > -1) return apiUrl + "/chat/completions";

  return apiUrl + "/v1/chat/completions";
}

// ==================== Prompt 优化（支持演员） ====================
function buildPrompt(prompt, count) {
  return (
    "你是一个专业影视助手。" +
    "如果用户输入的是演员名字，请返回该演员最经典或高评分的影视作品。" +
    "如果输入的是题材、风格、关键词，则推荐符合要求的影视作品。" +
    "请推荐" + count + "部" + prompt + "相关影视作品。" +
    "只返回作品名称，每行一个。" +
    "不要编号，不要解释，不要年份，不要其它文字。"
  );
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
        "你是影视推荐助手。支持演员名、导演名、题材、关键词推荐。只返回影视名称，每行一个。"
    },
    {
      role: "user",
      content: buildPrompt(config.prompt, config.count)
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

  return text.split("\n")
    .map(function (t) {
      return t.replace(/^\d+[\.\、\)]/, "").trim();
    })
    .filter(function (t) {
      return t.length > 0;
    })
    .slice(0, 15);
}

// ==================== 类型转换 ====================
function getGenreNames(ids) {
  var map = {
    28: "动作",
    12: "冒险",
    16: "动画",
    35: "喜剧",
    80: "犯罪",
    99: "纪录",
    18: "剧情",
    10751: "家庭",
    14: "奇幻",
    36: "历史",
    27: "恐怖",
    10402: "音乐",
    9648: "悬疑",
    10749: "爱情",
    878: "科幻",
    53: "惊悚",
    10752: "战争",
    37: "西部",
    10759: "动作冒险",
    10765: "奇幻科幻",
    10768: "战争政治"
  };

  var arr = [];

  for (var i = 0; i < ids.length && i < 2; i++) {
    if (map[ids[i]]) arr.push(map[ids[i]]);
  }

  return arr.join(" / ");
}

// ==================== TMDB 搜索优化 ====================
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
            language: "zh-CN"
          }
        }
      );

      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: {
          query: title,
          language: "zh-CN"
        }
      });
    }

    if (res && res.results && res.results.length > 0) {
      var item = res.results[0];

      var date =
        item.release_date ||
        item.first_air_date ||
        "";

      var year = date ? date.substring(0, 4) : "未知";

      var genres = getGenreNames(item.genre_ids || []);

      return {
        id: item.id,
        type: "tmdb",
        title: item.title || item.name,

        // 类似图中显示：2024 · 动作 / 喜剧
        subtitle: year + " · " + genres,

        description: item.overview || "暂无简介",
        posterPath: item.poster_path,
        rating: item.vote_average || 0,
        mediaType: type
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

// ==================== 主列表 ====================
async function loadAIList(params) {
  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel ||
      (params.aiApiFormat === "gemini"
        ? "gemini-1.5-flash"
        : "gpt-4o-mini"),
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 9
  };

  try {
    var text = await callAI(config);

    var names = parseNames(text);

    if (names.length === 0) {
      return [{
        id: "err",
        type: "tmdb",
        title: "AI 未生成结果",
        description: "请检查 API 设置"
      }];
    }

    var results = [];

    for (var i = 0; i < names.length; i++) {
      var item = await searchTMDB(names[i], "movie", params.TMDB_API_KEY);

      if (!item) {
        item = await searchTMDB(names[i], "tv", params.TMDB_API_KEY);
      }

      results.push(item || {
        id: "ai_" + i,
        type: "tmdb",
        title: names[i],
        subtitle: "AI 推荐",
        description: "暂无 TMDB 数据"
      });
    }

    return results;

  } catch (e) {
    return [{
      id: "err",
      type: "tmdb",
      title: "请求失败",
      description: e.message
    }];
  }
}

// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  if (!params) params = {};

  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";

  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.3.0 优化版已加载");
