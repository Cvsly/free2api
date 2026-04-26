/**
 * AI影视推荐模块（最终稳定版 + 单例 + fallback + 优化推荐）
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== 单例控制 ====================
var AI_PENDING = null;
var AI_CACHE = {};
var AI_CACHE_TIME = {};
var CACHE_TTL = 60000;


// ==================== API地址自动补全 ====================
function normalizeApiUrl(url, format) {
  if (!url) return "";

  url = url.replace(/\/+$/, "");

  if (format === "gemini") return url;

  if (url.includes("/chat/completions")) return url;

  if (url.endsWith("/v1")) return url + "/chat/completions";

  if (!url.includes("/v1")) return url + "/v1/chat/completions";

  return url;
}


// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "稳定版（单次调用+智能推荐）",
  version: "7.0.0",

  globalParams: [
    { name: "aiApiUrl", title: "API地址", type: "input", required: true },
    { name: "aiApiKey", title: "API Key", type: "input", required: true },
    { name: "aiModel", title: "模型", type: "input", defaultValue: "gpt-4o-mini" },
    {
      name: "aiApiFormat",
      title: "格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },
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
          placeholders: [
            { title: "高分喜剧", value: "高分喜剧" },
            { title: "烧脑悬疑", value: "烧脑悬疑" },
            { title: "经典高分电影", value: "经典高分电影" },
            { title: "下饭轻松剧", value: "下饭轻松剧" },
            { title: "科幻大片", value: "科幻大片" },
            { title: "高分国产剧", value: "高分国产剧" },
            { title: "高分美剧", value: "高分美剧" },
            { title: "动作爽片", value: "动作爽片" },
            { title: "催泪爱情", value: "催泪爱情" },
            { title: "动画佳作", value: "动画佳作" },
            { title: "犯罪神剧", value: "犯罪神剧" },
            { title: "冷门佳片", value: "冷门佳片" }
          ]
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      functionName: "loadSimilarList",
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true
        }
      ]
    }
  ]
};


// ==================== AI请求 ====================
async function callOpenAI(url, key, model, messages) {
  return await Widget.http.post(url, {
    model,
    messages
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": key.startsWith("Bearer ")
        ? key
        : "Bearer " + key
    }
  });
}

async function callGemini(url, key, model, prompt, count) {
  url = url.replace(/\/+$/, '');

  if (!url.includes("/v1beta")) url += "/v1beta";

  var full = url + "/models/" + model + ":generateContent?key=" + key;

  var res = await Widget.http.post(full, {
    contents: [{
      parts: [{ text: "推荐" + count + "部" + prompt + "影视作品，只返回名称" }]
    }]
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
    return res.choices[0]?.message?.content || res.choices[0]?.text || "";
  }

  try { return res.candidates[0].content.parts[0].text } catch {}

  return typeof res === "string" ? res : "";
}


// ⭐ 强化解析
function parseNames(text) {
  if (!text) return [];

  return text.split("\n")
    .map(t => t.trim())
    .map(t => t
      .replace(/^[\d\.\-\s]+/, "")
      .replace(/[《》]/g, "")
    )
    .filter(t => t.length > 1);
}


// ==================== 单例AI ====================
async function callAI(config) {

  var key = JSON.stringify(config);

  if (AI_CACHE[key] && Date.now() - AI_CACHE_TIME[key] < CACHE_TTL) {
    return AI_CACHE[key];
  }

  if (AI_PENDING) {
    return await AI_PENDING;
  }

  AI_PENDING = (async () => {

    let result = "";

    if (config.format === "gemini") {
      result = await callGemini(
        config.apiUrl,
        config.apiKey,
        config.model,
        config.prompt,
        config.count
      );
    } else {
      var url = normalizeApiUrl(config.apiUrl, config.format);

      var res = await callOpenAI(url, config.apiKey, config.model, [
        { role: "system", content: "只返回影视名称，每行一个" },
        { role: "user", content: "推荐" + config.count + "部" + config.prompt }
      ]);

      result = extractContent(res);
    }

    AI_CACHE[key] = result;
    AI_CACHE_TIME[key] = Date.now();

    AI_PENDING = null;

    return result;

  })();

  return await AI_PENDING;
}


// ==================== TMDB ====================
async function getTmdbDetail(title, type, key) {
  try {
    var res;

    if (key) {
      res = await Widget.http.get(
        "https://api.themoviedb.org/3/search/" + type,
        { params: { api_key: key, query: title, language: "zh-CN" } }
      );
      res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: { query: title }
      });
    }

    if (!res.results?.length) return null;

    var i = res.results[0];

    return {
      id: i.id,
      type: "tmdb",
      title: i.title || i.name,
      description: i.overview || "",
      posterPath: i.poster_path,
      rating: i.vote_average || 0
    };

  } catch {
    return null;
  }
}


// ==================== 主逻辑 ====================
async function loadAIList(params) {

  var config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount)
  };

  var text = await callAI(config);

  var names = parseNames(text);

  var tmdbKey = params.TMDB_API_KEY;

  var results = await Promise.all(
    names.map(n =>
      getTmdbDetail(n, "movie", tmdbKey)
      .then(r => r || getTmdbDetail(n, "tv", tmdbKey))
    )
  );

  var valid = results.filter(Boolean);

  // ⭐ 关键修复：fallback
  if (valid.length > 0) return valid;

  return names.map((n, i) => ({
    id: "ai_" + i,
    type: "tmdb",
    title: n,
    description: "AI推荐",
    posterPath: null
  }));
}


async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}


console.log("✅ AI影视推荐 v7.0 最终稳定版已加载");