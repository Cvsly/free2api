const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "增强兼容版（支持 metapi / 中转站）",
  version: "5.0.0",

  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions",
    },
    {
      name: "aiApiKey",
      title: "API Key",
      type: "input",
      required: true,
    },
    {
      name: "aiModel",
      title: "模型",
      type: "input",
      defaultValue: "gpt-4o-mini",
    },

    // ⭐ 新增：自定义 Header
    {
      name: "customHeaders",
      title: "自定义Headers(JSON)",
      type: "input",
      required: false,
      description: '{"x-api-key":"xxx"}'
    },

    // ⭐ 新增：自定义Body
    {
      name: "customBody",
      title: "自定义Body(JSON)",
      type: "input",
      required: false,
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
      defaultValue: "9",
    },
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
        }
      ]
    }
  ]
};

// ==================== 核心：增强解析 ====================
function extractContent(res) {
  if (!res) return "";

  // 标准 OpenAI
  if (res.choices) {
    let c = res.choices[0];
    if (c.message?.content) return c.message.content;
    if (c.text) return c.text;
  }

  // 包裹 data
  if (res.data) return extractContent(res.data);

  // 常见中转站
  if (res.output) return res.output;
  if (res.result) return res.result;
  if (res.text) return res.text;

  // Gemini
  try {
    return res.candidates[0].content.parts[0].text;
  } catch (e) {}

  // 字符串兜底
  if (typeof res === "string") return res;

  console.log("解析失败:", JSON.stringify(res));
  return "";
}

// ==================== AI调用 ====================
async function callAI(config) {
  let headers = {
    "Content-Type": "application/json"
  };

  // 默认 Bearer
  if (config.apiKey) {
    headers["Authorization"] = config.apiKey.startsWith("Bearer")
      ? config.apiKey
      : "Bearer " + config.apiKey;
  }

  // ⭐ 合并自定义 Header
  if (config.customHeaders) {
    try {
      Object.assign(headers, JSON.parse(config.customHeaders));
    } catch (e) {}
  }

  let body;

  // ⭐ 如果用户自定义Body
  if (config.customBody) {
    try {
      body = JSON.parse(config.customBody);
    } catch (e) {
      throw new Error("customBody JSON错误");
    }
  } else {
    body = {
      model: config.model,
      messages: [
        {
          role: "system",
          content: "只返回影视名称，每行一个"
        },
        {
          role: "user",
          content: "推荐" + config.count + "部" + config.prompt
        }
      ],
      temperature: 0.5
    };
  }

  let res = await Widget.http.post(config.apiUrl, body, {
    headers: headers,
    timeout: 60000
  });

  let content = extractContent(res);

  if (!content) throw new Error("AI返回为空");

  return content;
}

// ==================== 名称解析 ====================
function parseNames(text) {
  return text
    .split("\n")
    .map(t => t.trim())
    .filter(t => t.length > 1 && t.length < 30)
    .slice(0, 20);
}

// ==================== 主逻辑 ====================
async function loadAIList(params) {
  let config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 6,
    customHeaders: params.customHeaders,
    customBody: params.customBody
  };

  if (!config.apiUrl) throw "缺少API地址";
  if (!config.apiKey) throw "缺少API Key";

  let content = await callAI(config);

  let names = parseNames(content);

  return names.map((n, i) => ({
    id: "ai_" + i,
    type: "tmdb",
    title: n,
    description: "AI推荐",
    posterPath: null
  }));
}

console.log("✅ AI模块 v5.0 已加载（全兼容版）");