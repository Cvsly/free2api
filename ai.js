/**
 * AI 影视推荐模块（全兼容修复版）
 * 修复 metapi / 中转站 400 错误
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "全兼容AI影视推荐（支持所有中转站）",
  author: "crush7s",
  version: "5.0.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions"
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 格式", value: "openai" },
        { title: "Gemini 格式", value: "gemini" }
      ],
      defaultValue: "openai"
    },
    {
      name: "aiApiKey",
      title: "API Key",
      type: "input",
      required: true
    },
    {
      name: "aiModel",
      title: "模型",
      type: "input",
      defaultValue: "gpt-4o-mini"
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB Key",
      type: "input"
    },
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
          required: true
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

// ==================== AI请求核心 ====================

// ⭐ 全兼容 OpenAI / 中转站
async function callOpenAIFormat(apiUrl, apiKey, model, messages) {
  var headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith("Bearer ")
      ? apiKey
      : "Bearer " + apiKey;
  }

  // 多策略兼容
  var strategies = [
    () => ({ model, messages }),
    () => ({ model, prompt: messages.map(m => m.content).join("\n") }),
    () => ({ model, input: messages.map(m => m.content).join("\n") })
  ];

  var lastError = null;

  for (var i = 0; i < strategies.length; i++) {
    try {
      var body = strategies[i]();

      var res = await Widget.http.post(apiUrl, body, {
        headers: headers,
        timeout: 60000
      });

      return res;

    } catch (e) {
      lastError = e;

      var msg = e.message || "";

      if (msg.includes("400") || msg.includes("Unsupported")) {
        continue;
      }

      throw e;
    }
  }

  throw new Error("所有请求策略失败: " + lastError.message);
}

// ⭐ Gemini 保持原逻辑
async function callGeminiFormat(apiUrl, apiKey, model, prompt, count) {
  var url = apiUrl.replace(/\/$/, '') + '/models/' + model + ':generateContent?key=' + apiKey;

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
  } catch (e) {
    return "";
  }
}

// ⭐ 全兼容解析
function extractContent(res) {
  if (!res) return "";

  if (res.choices) {
    let c = res.choices[0];
    if (c?.message?.content) return c.message.content;
    if (c?.text) return c.text;
  }

  if (res.data) return extractContent(res.data);

  if (res.output) return res.output;
  if (res.result) return res.result;
  if (res.text) return res.text;

  try { return res.candidates[0].content.parts[0].text } catch(e){}
  try { return res.content[0].text } catch(e){}

  if (typeof res === "string") return res;

  return "";
}

// ⭐ AI统一入口
async function callAI(config) {
  var messages = [
    { role: "system", content: "只返回影视名称，每行一个" },
    { role: "user", content: "推荐" + config.count + "部" + config.prompt }
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
    config.apiUrl,
    config.apiKey,
    config.model,
    messages
  );

  return extractContent(res);
}

// ==================== 工具 ====================
function parseNames(text) {
  return text
    .split("\n")
    .map(t => t.trim())
    .filter(t => t.length > 1)
    .slice(0, 20);
}

// ==================== TMDB ====================
async function getTmdbDetail(title, type, key) {
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
      res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: { query: title }
      });
    }

    if (!res.results || !res.results.length) return null;

    var item = res.results[0];

    return {
      id: item.id,
      type: "tmdb",
      title: item.title || item.name,
      description: item.overview || "",
      posterPath: item.poster_path,
      rating: item.vote_average || 0,
      mediaType: type
    };

  } catch (e) {
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
    names.map(async n => {
      return await getTmdbDetail(n, "movie", tmdbKey)
        || await getTmdbDetail(n, "tv", tmdbKey);
    })
  );

  var valid = results.filter(Boolean);

  return valid.length
    ? valid
    : names.map((n, i) => ({
        id: "ai_" + i,
        type: "tmdb",
        title: n,
        description: "AI推荐"
      }));
}

async function loadSimilarList(params) {
  params.prompt = "类似《" + params.referenceTitle + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.0 全兼容版已加载");