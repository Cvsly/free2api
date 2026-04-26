/**
 * AI 影视推荐模块 v5.2.0
 * 针对 MetAPI/MatAPI 400 错误深度优化
 */

const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "修复 400 错误。注：模型名请填写 gpt-4o-mini 或 deepseek-chat",
  author: "crush7s",
  version: "5.2.0",
  globalParams: [
    {
      name: "aiApiUrl",
      title: "API 地址",
      type: "input",
      required: true,
      defaultValue: "https://metapi.omgd.eu.org",
      description: "填写中转站基础地址即可"
    },
    {
      name: "aiApiKey",
      title: "API Key",
      type: "input",
      required: true
    },
    {
      name: "aiModel",
      title: "模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-4o-mini"
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "留空使用内置查询"
    },
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "6部", value: "6" },
        { title: "9部", value: "9" }
      ],
      defaultValue: "6"
    }
  ],
  modules: [
    {
      id: "smartRecommend",
      title: "AI智能推荐",
      functionName: "loadAIList",
      params: [
        { name: "prompt", title: "想看什么", type: "input", required: true, value: "轻松喜剧" }
      ]
    }
  ]
};

// ==================== 2. 核心 API 适配器 ====================

async function callOpenAIFormat(apiUrl, apiKey, model, messages) {
  // 1. 严格清理 Key 和模型名
  var cleanKey = apiKey.trim().replace(/^Bearer\s+/i, '');
  var cleanModel = model.trim();
  
  // 2. 补全 Authorization
  var headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + cleanKey,
    "User-Agent": USER_AGENT,
    "Accept": "application/json"
  };
  
  // 3. 构建严格符合 OpenAI 规范的 Body
  var body = {
    model: cleanModel,
    messages: messages,
    temperature: 0.7,
    presence_penalty: 0,
    stream: false
  };

  console.log("[AI请求] 目标: " + apiUrl);
  console.log("[AI请求] 模型: " + cleanModel);

  // 4. 使用 Forward 框架发起请求
  var response = await Widget.http.post(apiUrl, body, {
    headers: headers,
    timeout: 30000
  });

  // 处理 400 等非 200 状态码
  if (!response || response.error) {
    var errorInfo = response.error ? (response.error.message || JSON.stringify(response.error)) : "未知 400 错误";
    throw new Error("中转站拒绝请求: " + errorInfo);
  }

  return response;
}

async function callAI(config) {
  var apiUrl = config.apiUrl.trim();
  
  // 路径自动修正：确保包含 v1/chat/completions
  if (!apiUrl.includes('/chat/completions')) {
    apiUrl = apiUrl.replace(/\/$/, '');
    if (!apiUrl.endsWith('/v1')) {
      apiUrl += '/v1';
    }
    apiUrl += '/chat/completions';
  }

  var messages = [
    { role: "system", content: "你是一个影视专家，只返回剧名列表，每行一个，不要解释。" },
    { role: "user", content: "请推荐 " + config.count + " 部 " + config.prompt + " 风格的作品。" }
  ];

  var res = await callOpenAIFormat(apiUrl, config.apiKey, config.model, messages);
  return extractContent(res);
}

function extractContent(res) {
  // 兼容不同的返回包裹层级
  var data = res.data || res;
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  return "";
}

// ==================== 3. 业务工具 ====================

function parseNames(content) {
  if (!content) return [];
  return content.split("\n")
    .map(line => line.replace(/^[\d\.\-\s、]+/, '').replace(/[《》]/g, '').trim())
    .filter(line => line.length > 0 && line.length < 25);
}

async function getTmdbDetail(title, mediaType, apiKey) {
  try {
    var resData;
    if (apiKey) {
      var res = await Widget.http.get("https://api.themoviedb.org/3/search/" + mediaType, {
        params: { api_key: apiKey, query: title, language: "zh-CN" }
      });
      resData = res.data || res;
    } else {
      resData = await Widget.tmdb.get("/search/" + mediaType, {
        params: { query: title, language: "zh-CN" }
      });
    }
    return (resData.results && resData.results.length > 0) ? resData.results[0] : null;
  } catch (e) { return null; }
}

// ==================== 4. 主加载函数 ====================

async function loadAIList(params) {
  try {
    var content = await callAI({
      apiUrl: params.aiApiUrl,
      apiKey: params.aiApiKey,
      model: params.aiModel,
      prompt: params.prompt,
      count: params.recommendCount || 6
    });

    var names = parseNames(content);
    if (names.length === 0) throw new Error("AI 返回内容解析失败");

    var items = await Promise.all(names.map(async (name) => {
      // 优先查电视剧，再查电影
      let d = await getTmdbDetail(name, "tv", params.TMDB_API_KEY);
      if (!d) d = await getTmdbDetail(name, "movie", params.TMDB_API_KEY);
      
      if (d) {
        return {
          id: d.id.toString(),
          type: "tmdb",
          title: d.title || d.name,
          description: d.overview || "AI 推荐作品",
          posterPath: d.poster_path,
          rating: d.vote_average,
          mediaType: d.title ? "movie" : "tv"
        };
      }
      return null;
    }));

    var validItems = items.filter(i => i !== null);
    if (validItems.length === 0) throw new Error("未能从 TMDB 匹配到相关影视信息");
    
    return validItems;
  } catch (e) {
    console.error("[模块错误] " + e.message);
    throw e;
  }
}

console.log("AI 影视推荐 v5.2.0 加载成功");
