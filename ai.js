/**
 * AI 影视推荐模块
 * 全兼容第三方OpenAI协议：NewApi/硅基流动/中转代理/私有化部署/反向代理
 * 适配 ForwardWidgets 官方规范 | 修复模块加载失败、无数据问题
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const OPENAI_CHAT_ENDPOINT = "chat/completions";

// ==================== 1. Metadata 定义【官方规范修复】 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "全兼容OpenAI协议｜智能影视推荐，支持中转/NewApi/硅基流动/私有化AI接口",
  author: "crush7s",
  site: "",
  version: "5.0.1",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com",
      description: "支持填写域名/根地址/完整接口，自动补全OpenAI标准路径",
      placeholders: [
        { title: "OpenAI 官方", value: "https://api.openai.com" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com/v1beta" },
        { title: "硅基流动", value: "https://api.siliconflow.cn" },
        { title: "NewApi/中转", value: "https://your-proxy-domain.com" },
        { title: "自定义", value: "" }
      ]
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 通用格式(中转/硅基/NewApi)", value: "openai" },
        { title: "Gemini 原生格式", value: "gemini" }
      ],
      defaultValue: "openai",
      description: "绝大多数第三方接口选OpenAI格式即可"
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "第三方中转/聚合站直接填写对应Key"
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-3.5-turbo",
      description: "兼容全量OpenAI协议模型，按服务商要求填写",
      placeholders: [
        { title: "OpenAI", value: "gpt-3.5-turbo" },
        { title: "Gemini", value: "gemini-2.5-flash" },
        { title: "硅基流动", value: "Qwen/Qwen2.5-7B-Instruct" },
        { title: "DeepSeek", value: "deepseek-chat" },
        { title: "中转通用", value: "gpt-4o-mini" },
        { title: "自定义", value: "" }
      ]
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "在 https://www.themoviedb.org/settings/api 获取的API Key",
      placeholders: [
        { title: "示例 Key", value: "c5efdaca8be081f824c3201b3fb00670" }
      ]
    },
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "3部", value: "3" },
        { title: "6部", value: "6" },
        { title: "9部", value: "9" },
        { title: "12部", value: "12" },
        { title: "15部", value: "15" },
        { title: "18部", value: "18" }
      ],
      defaultValue: "9"
    }
  ],
  
  modules: [
    {
      id: "smartRecommend",
      title: "AI智能推荐",
      description: "根据描述智能推荐影视",
      functionName: "loadAIList",
      requiresWebView: false,
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true,
          value: "",
          placeholders: [
            { title: "轻松喜剧", value: "轻松喜剧" },
            { title: "科幻大片", value: "科幻大片" },
            { title: "悬疑推理", value: "悬疑推理" },
            { title: "经典港剧", value: "经典港剧" },
            { title: "高分动画", value: "高分动画" },
            { title: "犯罪剧情", value: "犯罪剧情" },
            { title: "爱情片", value: "爱情片" },
            { title: "战争片", value: "战争片" }
          ]
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      description: "基于喜欢的作品推荐相似内容",
      functionName: "loadSimilarList",
      requiresWebView: false,
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true,
          value: "",
          placeholders: [
            { title: "星际穿越", value: "星际穿越" },
            { title: "肖申克的救赎", value: "肖申克的救赎" },
            { title: "狂飙", value: "狂飙" },
            { title: "三体", value: "三体" },
            { title: "盗梦空间", value: "盗梦空间" },
            { title: "让子弹飞", value: "让子弹飞" }
          ]
        }
      ]
    }
  ]
};

// ==================== 2. 通用工具函数 【移除ES6语法】 ====================
function normalizeOpenAiUrl(inputUrl) {
  if (!inputUrl) return "";
  var url = inputUrl.trim().replace(/\/+$/, "");
  if (url.indexOf(OPENAI_CHAT_ENDPOINT) > -1) {
    return url;
  }
  return url + "/v1/" + OPENAI_CHAT_ENDPOINT;
}

function autoDetectApiFormat(apiUrl) {
  if (!apiUrl) return "openai";
  if (apiUrl.indexOf("generativelanguage.googleapis.com") !== -1) {
    return "gemini";
  }
  return "openai";
}

// ==================== 3. AI API 适配器 【全兼容+语法降级】 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens) {
  var fullRequestUrl = normalizeOpenAiUrl(apiUrl);
  var headers = {
    "Content-Type": "application/json"
  };

  if (apiKey && apiKey.trim()) {
    var key = apiKey.trim();
    if (/^Bearer\s+/i.test(key)) {
      headers["Authorization"] = key;
    } else {
      headers["Authorization"] = "Bearer " + key;
    }
  }

  var requestBody = {
    model: model,
    messages: messages,
    temperature: temperature || 0.4,
    max_tokens: maxTokens || 600,
    stream: false
  };

  if (model.indexOf("gpt-4o") !== -1 || model.indexOf("claude") !== -1) {
    requestBody.max_completion_tokens = requestBody.max_tokens;
    delete requestBody.max_tokens;
  }

  console.log("[OpenAI] 最终请求地址：", fullRequestUrl);

  var response = await Widget.http.post(
    fullRequestUrl,
    requestBody,
    {
      headers: headers,
      timeout: 80000
    }
  );

  return response;
}

async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent';
  fullUrl += '?key=' + encodeURIComponent(apiKey);

  var typeInfo = userPrompt;
  if (userPrompt.indexOf('想看') !== -1) {
    typeInfo = userPrompt.replace('我想看', '').replace('类型的作品', '').replace('类似《', '').replace('》的作品', '').trim();
  }

  var promptText = "请推荐" + count + "部" + typeInfo + "类型的影视作品。\n\n" +
  "【输出要求】\n" +
  "1. 只返回剧名，每行一个\n" +
  "2. 不要添加任何序号、标点符号、年份\n" +
  "3. 不要添加任何解释或额外文字\n" +
  "4. 直接开始输出剧名";

  var requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800, topP: 0.8, topK: 20 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  try {
    var response = await Widget.http.post(fullUrl, requestBody, {
      headers: { "Content-Type": "application/json" },
      timeout: 80000
    });

    var content = "";
    if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0]) {
      content = response.candidates[0].content.parts[0].text;
    } else if (response && response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
      content = response.data.candidates[0].content.parts[0].text;
    }
    return content;
  } catch (error) {
    console.error("[Gemini] 请求失败:", error.message);
    throw error;
  }
}

function extractContent(response) {
  if (!response) return "";
  var res = response.data || response;
  var content = "";

  if (res.choices && res.choices[0]) {
    var choice = res.choices[0];
    if (choice.message && choice.message.content) content = choice.message.content.trim();
    else if (choice.text) content = choice.text.trim();
    else if (choice.content) content = choice.content.trim();
  }

  if (!content && res.content) content = res.content.trim();
  if (!content && res.reply) content = res.reply.trim();
  if (!content && res.result) content = res.result.trim();
  if (!content && typeof res === "string") content = res.trim();

  return content;
}

async function callAI(config) {
  var apiUrl = config.apiUrl;
  var apiKey = config.apiKey;
  var model = config.model;
  var format = config.format || autoDetectApiFormat(apiUrl);
  var prompt = config.prompt;
  var count = config.count || 5;
  var content = "";

  try {
    console.log("[AI] 接口格式: " + format + "，模型: " + model);
    if (format === "gemini") {
      content = await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } else {
      var systemPrompt = "你是影视推荐助手。请严格只返回剧名，每行一个，无序号、无年份、无解释、无多余文字。";
      var userPrompt = "我想看" + prompt + "类型的作品，请推荐" + count + "部。";
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      var response = await callOpenAIFormat(apiUrl, apiKey, model, messages, 0.4, 600);
      content = extractContent(response);
    }

    if (!content || content.trim().length === 0) {
      throw new Error("AI接口返回内容为空，请检查API地址、密钥、模型是否正确");
    }
    return content;
  } catch (error) {
    console.error("AI API调用失败:", error.message);
    throw new Error("AI请求失败: " + error.message + "｜请检查接口地址/密钥/模型权限");
  }
}

// ==================== 4. 工具函数 ====================
function parseNames(content) {
  if (!content || typeof content !== 'string') return [];
  var names = [];
  var lines = content.split("\n");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    line = line
      .replace(/^[\d\+\-\*•\s\.、，,。]*/g, '')
      .replace(/[《》""''「」\[\]【】()（）]/g, '')
      .replace(/[0-9]{4}年/g, '')
      .replace(/[0-9]+集/g, '')
      .replace(/导演|主演|类型|地区|评分|推荐|理由|：|:|\|/g, '')
      .trim();
    if (line && line.length >= 2 && line.length <= 30) {
      names.push(line);
    }
  }

  if (names.length === 0) {
    var parts = content.split(/\s+/);
    for (var j = 0; j < parts.length; j++) {
      var part = parts[j].trim();
      if (part && part.length >= 2 && !/^\d+$/.test(part)) names.push(part);
    }
  }
  if (names.length === 0 && content.indexOf(',') !== -1) {
    var parts = content.split(/[,，、]/);
    for (var k = 0; k < parts.length; k++) {
      var part = parts[k].trim();
      if (part && part.length >= 2) names.push(part);
    }
  }

  var unique = [];
  var seen = {};
  for (var n = 0; n < names.length; n++) {
    var name = names[n];
    if (!seen[name]) {
      seen[name] = true;
      unique.push(name);
    }
  }
  return unique;
}

async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title || !title.trim()) return null;
  var cleanTitle = title.replace(/（(.*?)）|\((.*?)\)/g, '').replace(/\s+/g, ' ').trim();
  try {
    var responseData;
    if (apiKey) {
      var searchUrl = "https://api.themoviedb.org/3/search/" + mediaType;
      var response = await Widget.http.get(searchUrl, {
        params: { api_key: apiKey, query: cleanTitle, language: "zh-CN", include_adult: false },
        headers: { "User-Agent": USER_AGENT },
        timeout: 10000
      });
      responseData = response.data;
    } else {
      responseData = await Widget.tmdb.get("/search/" + mediaType, {
        params: { query: cleanTitle, language: "zh-CN" }
      });
    }

    if (!responseData || !responseData.results || responseData.results.length === 0) return null;
    var item = responseData.results[0];
    return {
      id: item.id,
      type: "tmdb",
      title: item.title || item.name,
      desc: item.overview || "",
      pic: item.poster_path ? "https://image.tmdb.org/t/p/w300" + item.poster_path : "",
      rating: item.vote_average || 0,
      year: item.release_date ? item.release_date.split("-")[0] : ""
    };
  } catch (error) {
    console.error("[TMDB] 请求失败:", error.message);
    return null;
  }
}

// ==================== 5. 列表加载函数【强制官方返回格式】 ====================
async function loadAIList(params) {
  params = params || {};
  try {
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      prompt: params.prompt || "",
      count: parseInt(params.recommendCount) || 9
    };
    var tmdbKey = params.TMDB_API_KEY || "";

    if (!aiConfig.apiUrl) throw new Error("请填写AI API地址");
    if (!aiConfig.apiKey) throw new Error("请填写API密钥");
    if (!aiConfig.model) throw new Error("请填写模型名称");
    if (!aiConfig.prompt) throw new Error("请输入想看的影视类型");

    var content = await callAI(aiConfig);
    var names = parseNames(content).slice(0, aiConfig.count);
    if (names.length === 0) throw new Error("未能解析到推荐结果，建议更换模型/接口");

    var promises = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      promises.push(new Promise(function(resolve) {
        getTmdbDetail(name, "tv", tmdbKey).then(function(detail) {
          if(detail) {
            resolve(detail);
          } else {
            return getTmdbDetail(name, "movie", tmdbKey);
          }
        }).then(function(detail) {
          resolve(detail);
        }).catch(function() {
          resolve(null);
        });
      }));
    }

    var results = await Promise.all(promises);
    var validResults = [];
    for(var m = 0; m < results.length; m++){
      if(results[m]) validResults.push(results[m]);
    }

    // 无TMDB数据时，返回纯文本占位（保证有数据不报错）
    if (validResults.length === 0) {
      for (var idx = 0; idx < names.length; idx++) {
        validResults.push({
          id: "ai_" + idx + "_" + Date.now(),
          type: "other",
          title: names[idx],
          desc: "AI智能推荐｜暂无TMDB详情",
          pic: "",
          rating: 0,
          year: ""
        });
      }
    }

    // 严格遵循 Forward 影视模块标准返回
    return {
      list: validResults,
      count: validResults.length
    };
  } catch (error) {
    console.error("loadAIList 错误:", error);
    throw error;
  }
}

async function loadSimilarList(params) {
  params = params || {};
  try {
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      count: parseInt(params.recommendCount) || 9
    };
    var refTitle = params.referenceTitle || "";
    var tmdbKey = params.TMDB_API_KEY || "";

    if (!aiConfig.apiUrl || !aiConfig.apiKey || !aiConfig.model) throw new Error("AI配置不完整");
    if (!refTitle) throw new Error("请输入喜欢的作品名称");

    aiConfig.prompt = "类似《" + refTitle + "》风格、题材、剧情的影视作品";
    var content = await callAI(aiConfig);
    var names = parseNames(content).slice(0, aiConfig.count);

    var promises = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      promises.push(new Promise(function(resolve) {
        getTmdbDetail(name, "tv", tmdbKey).then(function(detail) {
          if(detail) {
            resolve(detail);
          } else {
            return getTmdbDetail(name, "movie", tmdbKey);
          }
        }).then(function(detail) {
          resolve(detail);
        }).catch(function() {
          resolve(null);
        });
      }));
    }

    var results = await Promise.all(promises);
    var validResults = [];
    for(var m = 0; m < results.length; m++){
      if(results[m]) validResults.push(results[m]);
    }

    if (validResults.length === 0) {
      for (var idx = 0; idx < names.length; idx++) {
        validResults.push({
          id: "similar_" + idx + "_" + Date.now(),
          type: "other",
          title: names[idx],
          desc: "AI相似推荐｜暂无TMDB详情",
          pic: "",
          rating: 0,
          year: ""
        });
      }
    }

    return {
      list: validResults,
      count: validResults.length
    };
  } catch (error) {
    console.error("loadSimilarList 错误:", error);
    throw error;
  }
}

console.log("AI影视推荐模块v5.0.1｜Forward官方规范适配 加载成功");