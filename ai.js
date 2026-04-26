// 20260426 18:25:36
/**
 * AI 影视推荐模块
 * 修复400 Bad Request报错，Metapi全格式兼容，Forward官方规范适配
 */

var USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";
var DEFAULT_TIMEOUT = 120000;

// ==================== 1. 模块元数据 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "适配Metapi全协议格式的智能影视推荐，支持OpenAI/Claude/Gemini全系列接口",
  author: "crush7s",
  site: "https://github.com/InchStudio/ForwardWidgets",
  version: "6.2.2",
  requiredVersion: "0.0.1",
  detailCacheDuration: 3600,
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://metapi.omgd.eu.org",
      description: "仅填根域名/地址，系统自动补全对应协议的标准路径",
      placeholders: [
        { title: "Metapi 官方", value: "https://metapi.omgd.eu.org" },
        { title: "OpenAI 官方", value: "https://api.openai.com" },
        { title: "自定义接口", value: "" }
      ]
    },
    {
      name: "aiApiFormat",
      title: "API 协议格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI Chat", value: "openai-chat" },
        { title: "OpenAI Responses", value: "openai-responses" },
        { title: "Claude", value: "claude" },
        { title: "Gemini", value: "gemini-native" }
      ],
      defaultValue: "openai-chat",
      description: "必须与Metapi选择的格式完全一致：Chat对应/v1/chat/completions"
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "对应平台的API Key，系统自动适配认证格式"
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-5.4",
      description: "必须与Metapi选择的模型名称完全一致，严格匹配大小写",
      placeholders: [
        { title: "GPT-5.4", value: "gpt-5.4" },
        { title: "GPT-4o", value: "gpt-4o" },
        { title: "Claude 3.5", value: "claude-3-5-sonnet-20240620" },
        { title: "通义千问", value: "Qwen/Qwen2.5-7B-Instruct" }
      ]
    },
    {
      name: "mergeSystemPrompt",
      title: "合并系统提示词",
      type: "enumeration",
      enumOptions: [
        { title: "关闭", value: "false" },
        { title: "开启", value: "true" }
      ],
      defaultValue: "false",
      description: "仅模型不支持system角色时开启，Metapi默认格式必须关闭"
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "TMDB官网获取的API Key，非必填"
    },
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "3部", value: "3" },
        { title: "6部", value: "6" },
        { title: "9部", value: "9" },
        { title: "12部", value: "12" }
      ],
      defaultValue: "3"
    }
  ],
  modules: [
    {
      id: "smartRecommend",
      title: "AI 智能推荐",
      description: "用自然语言描述想看的内容，AI智能推荐",
      functionName: "loadAIList",
      requiresWebView: false,
      cacheDuration: 3600,
      params: [
        {
          name: "prompt",
          title: "描述你想看的内容",
          type: "input",
          required: true,
          value: "随便推荐一点",
          placeholders: [
            { title: "随便推荐一点", value: "随便推荐一点" },
            { title: "轻松喜剧", value: "轻松喜剧" },
            { title: "科幻大片", value: "科幻大片" },
            { title: "悬疑推理", value: "悬疑推理" }
          ]
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "AI 相似推荐",
      description: "输入喜欢的作品，AI推荐相似内容",
      functionName: "loadSimilarList",
      requiresWebView: false,
      cacheDuration: 3600,
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品名称",
          type: "input",
          required: true,
          value: "星际穿越",
          placeholders: [
            { title: "星际穿越", value: "星际穿越" },
            { title: "肖申克的救赎", value: "肖申克的救赎" },
            { title: "狂飙", value: "狂飙" }
          ]
        }
      ]
    }
  ],
  search: {
    title: "AI 影视搜索",
    functionName: "nlSearch",
    cacheDuration: 3600,
    params: [
      {
        name: "keyword",
        title: "搜索关键词",
        type: "input",
        description: "用自然语言描述，AI帮你找片",
        placeholders: [
          { title: "去年高分科幻片", value: "去年高分科幻片" },
          { title: "诺兰的电影", value: "诺兰的电影" },
          { title: "类似盗梦空间", value: "类似盗梦空间" }
        ]
      }
    ]
  }
};

// ==================== 2. 核心工具函数 ====================
/**
 * 多协议API地址自动格式化，杜绝路径重复拼接
 */
function formatApiUrl(apiUrl, format) {
  if (!apiUrl || typeof apiUrl !== 'string') return "";
  var cleanUrl = apiUrl.trim().replace(/\/$/, '');

  switch (format) {
    case "openai-chat":
      if (cleanUrl.indexOf('/chat/completions') !== -1) return cleanUrl;
      if (cleanUrl.indexOf('/v1') !== -1) return cleanUrl + '/chat/completions';
      return cleanUrl + '/v1/chat/completions';

    case "openai-responses":
      if (cleanUrl.indexOf('/responses') !== -1) return cleanUrl;
      if (cleanUrl.indexOf('/v1') !== -1) return cleanUrl + '/responses';
      return cleanUrl + '/v1/responses';

    case "claude":
      if (cleanUrl.indexOf('/v1/messages') !== -1) return cleanUrl;
      if (cleanUrl.indexOf('/v1') !== -1) return cleanUrl + '/messages';
      return cleanUrl + '/v1/messages';

    case "gemini-native":
      if (cleanUrl.indexOf('/v1beta') !== -1) return cleanUrl;
      return cleanUrl + '/v1beta';

    default:
      return cleanUrl;
  }
}

/**
 * 剧名解析工具
 */
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
      .replace(/导演|主演|类型|地区|语言|评分|推荐|理由|说明|注：|：|:|\||/g, '')
      .trim();
    if (line && line.length >= 2 && line.length <= 30) {
      names.push(line);
    }
  }

  if (names.length === 0) {
    var parts = content.split(/\s+/);
    for (var j = 0; j < parts.length; j++) {
      var part = parts[j].trim();
      if (part && part.length >= 2 && part.length <= 30 && !part.match(/^[0-9]+$/)) {
        names.push(part);
      }
    }
  }

  if (names.length === 0 && (content.includes(',') || content.includes('，') || content.includes('、'))) {
    var parts = content.split(/[,，、]/);
    for (var k = 0; k < parts.length; k++) {
      var part = parts[k].trim();
      if (part && part.length >= 2 && part.length <= 30) {
        names.push(part);
      }
    }
  }

  var uniqueNames = [];
  var seenMap = {};
  for (var n = 0; n < names.length; n++) {
    var name = names[n];
    if (!seenMap[name]) {
      seenMap[name] = true;
      uniqueNames.push(name);
    }
  }
  console.log("[剧名解析] 提取到 " + uniqueNames.length + " 个剧名: " + uniqueNames.join(", "));
  return uniqueNames;
}

/**
 * TMDB详情查询
 */
async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return null;
  }

  var cleanTitle = title
    .replace(/[（(][^）)]*[)）]/g, '')
    .replace(/[\[【][^\]】]*[\]】]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    var responseData;
    if (apiKey && apiKey.trim()) {
      var searchUrl = "https://api.themoviedb.org/3/search/" + mediaType;
      var requestParams = {
        api_key: apiKey.trim(),
        query: cleanTitle,
        language: "zh-CN",
        include_adult: false
      };

      var response = await Widget.http.get(searchUrl, {
        params: requestParams,
        headers: { "User-Agent": USER_AGENT },
        timeout: 10000
      });
      
      responseData = response.data;
    } else {
      responseData = await Widget.tmdb.get("/search/" + mediaType, {
        params: { query: cleanTitle, language: "zh-CN" }
      });
    }

    if (!responseData || !responseData.results || responseData.results.length === 0) {
      return null;
    }

    var item = responseData.results[0];
    var itemId = item.id;
    var itemMediaType = mediaType;
    
    return {
      id: itemMediaType + "." + itemId,
      type: "tmdb",
      title: item.title || item.name || cleanTitle,
      description: item.overview || "AI智能推荐影视",
      posterPath: item.poster_path || "",
      backdropPath: item.backdrop_path || "",
      releaseDate: item.release_date || item.first_air_date || "",
      mediaType: itemMediaType,
      rating: item.vote_average || 0,
      genreTitle: "",
      duration: 0,
      durationText: "",
      previewUrl: "",
      videoUrl: "",
      link: "",
      episode: 0,
      playerType: "system",
      childItems: []
    };
  } catch (error) {
    console.error("[TMDB查询] 请求失败: " + error.message);
    return null;
  }
}

// ==================== 3. 多协议API适配器（修复400核心问题） ====================
/**
 * 1. OpenAI Chat 格式适配（Metapi默认格式，修复400）
 */
async function callOpenAIChatFormat(apiUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens, mergeSystemPrompt) {
  mergeSystemPrompt = mergeSystemPrompt === "true";
  var formattedUrl = formatApiUrl(apiUrl, "openai-chat");
  var formattedApiKey = apiKey.trim();
  var formattedModel = model.trim();

  // 标准请求头
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };
  // 密钥格式100%正确处理
  if (formattedApiKey) {
    var authKey = formattedApiKey;
    if (!authKey.startsWith('Bearer ') && !authKey.startsWith('bearer ')) {
      authKey = "Bearer " + authKey;
    }
    headers["Authorization"] = authKey;
  }

  // 修复消息体格式，100%符合OpenAI规范
  var messages = [];
  if (!mergeSystemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });
  } else {
    var mergedContent = systemPrompt + "\n\n用户需求：" + userPrompt;
    messages.push({ role: "user", content: mergedContent });
  }

  // 【核心修复】精简请求体，仅保留必须字段，移除所有不兼容参数
  var requestBody = {
    model: formattedModel,
    messages: messages,
    temperature: Math.min(Math.max(temperature || 0.5, 0), 2), // 限制温度在0-2之间，避免超出范围
    stream: false
  };
  // 仅当maxTokens有效时添加，避免无效参数
  if (maxTokens && maxTokens > 0) {
    requestBody.max_tokens = maxTokens;
  }

  // 调试日志：脱敏打印完整请求信息，方便排查
  console.log("[OpenAI Chat] 请求地址: " + formattedUrl);
  console.log("[OpenAI Chat] 请求模型: " + formattedModel);
  console.log("[OpenAI Chat] 认证头: " + headers["Authorization"].substring(0, 15) + "***");
  console.log("[OpenAI Chat] 请求体: " + JSON.stringify(requestBody));

  try {
    var response = await Widget.http.post(formattedUrl, requestBody, {
      headers: headers,
      timeout: DEFAULT_TIMEOUT
    });
    var target = response.data ? response.data : response;
    var content = "";

    // 兼容所有标准响应格式
    if (target.choices && target.choices[0]) {
      var choice = target.choices[0];
      if (choice.message && choice.message.content) content = choice.message.content.trim();
      if (choice.text) content = choice.text.trim();
    }

    console.log("[OpenAI Chat] 响应成功，内容长度: " + content.length);
    return content;
  } catch (error) {
    console.error("[OpenAI Chat] 请求失败: " + error.message);
    if (error.response) {
      console.error("[OpenAI Chat] 错误状态码: " + error.response.status);
      console.error("[OpenAI Chat] 错误响应: " + JSON.stringify(error.response.data || {}));
    }
    throw formatError(error);
  }
}

/**
 * 2. OpenAI Responses 格式适配
 */
async function callOpenAIResponsesFormat(apiUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens) {
  var formattedUrl = formatApiUrl(apiUrl, "openai-responses");
  var formattedApiKey = apiKey.trim();
  var formattedModel = model.trim();

  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };
  if (formattedApiKey) {
    var authKey = formattedApiKey;
    if (!authKey.startsWith('Bearer ') && !authKey.startsWith('bearer ')) {
      authKey = "Bearer " + authKey;
    }
    headers["Authorization"] = authKey;
  }

  var requestBody = {
    model: formattedModel,
    instructions: systemPrompt,
    input: userPrompt,
    temperature: Math.min(Math.max(temperature || 0.5, 0), 2),
    stream: false
  };
  if (maxTokens && maxTokens > 0) {
    requestBody.max_output_tokens = maxTokens;
  }

  console.log("[OpenAI Responses] 请求地址: " + formattedUrl);
  console.log("[OpenAI Responses] 请求模型: " + formattedModel);
  console.log("[OpenAI Responses] 请求体: " + JSON.stringify(requestBody));

  try {
    var response = await Widget.http.post(formattedUrl, requestBody, {
      headers: headers,
      timeout: DEFAULT_TIMEOUT
    });
    var target = response.data ? response.data : response;
    var content = "";

    if (target.output && target.output.length > 0) {
      for (var i = 0; i < target.output.length; i++) {
        var item = target.output[i];
        if (item.type === "message" && item.content && item.content.length > 0) {
          for (var j = 0; j < item.content.length; j++) {
            var part = item.content[j];
            if (part.type === "text" && part.text) {
              content += part.text;
            }
          }
        }
      }
    } else if (target.content) {
      content = target.content.trim();
    }

    return content.trim();
  } catch (error) {
    console.error("[OpenAI Responses] 请求失败: " + error.message);
    throw formatError(error);
  }
}

/**
 * 3. Claude 格式适配
 */
async function callClaudeFormat(apiUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens) {
  var formattedUrl = formatApiUrl(apiUrl, "claude");
  var formattedApiKey = apiKey.trim();
  var formattedModel = model.trim();
  var finalMaxTokens = maxTokens || 1024;

  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": USER_AGENT,
    "x-api-key": formattedApiKey,
    "anthropic-version": "2023-06-01"
  };

  var requestBody = {
    model: formattedModel,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
    temperature: Math.min(Math.max(temperature || 0.5, 0), 1),
    stream: false,
    max_tokens: finalMaxTokens
  };

  console.log("[Claude] 请求地址: " + formattedUrl);
  console.log("[Claude] 请求模型: " + formattedModel);

  try {
    var response = await Widget.http.post(formattedUrl, requestBody, {
      headers: headers,
      timeout: DEFAULT_TIMEOUT
    });
    var target = response.data ? response.data : response;
    var content = "";

    if (target.content && target.content.length > 0) {
      for (var i = 0; i < target.content.length; i++) {
        var part = target.content[i];
        if (part.type === "text" && part.text) {
          content += part.text;
        }
      }
    }

    return content.trim();
  } catch (error) {
    console.error("[Claude] 请求失败: " + error.message);
    throw formatError(error);
  }
}

/**
 * 4. Gemini Native 格式适配
 */
async function callGeminiNativeFormat(apiUrl, apiKey, model, userPrompt, count) {
  var baseUrl = formatApiUrl(apiUrl, "gemini-native");
  var formattedModel = model.trim();
  var fullUrl = baseUrl + '/models/' + formattedModel + ':generateContent?key=' + encodeURIComponent(apiKey.trim());
  console.log("[Gemini] 请求地址: " + fullUrl);

  var typeInfo = userPrompt;
  if (userPrompt.includes('想看')) {
    typeInfo = userPrompt.replace('我想看', '').replace('类型的作品', '').replace('类似《', '').replace('》的作品', '').trim();
  }

  var promptText = "请推荐" + count + "部" + typeInfo + "类型的影视作品。\n\n" +
    "【输出要求】\n" +
    "1. 只返回剧名，每行一个\n" +
    "2. 不要添加任何序号、标点符号、年份\n" +
    "3. 不要添加任何解释或额外文字\n" +
    "4. 直接开始输出剧名\n\n" +
    "【输出示例】\n" +
    "流浪地球\n" +
    "星际穿越\n" +
    "阿凡达\n\n" +
    "请开始推荐：";

  var requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
      topP: 0.8,
      topK: 20
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  try {
    var response = await Widget.http.post(fullUrl, requestBody, {
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      timeout: DEFAULT_TIMEOUT
    });

    var content = "";
    var target = response.data ? response.data : response;
    if (target.candidates && target.candidates[0]) {
      var candidate = target.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        content = candidate.content.parts[0].text || "";
      }
    }

    return content.trim();
  } catch (error) {
    console.error("[Gemini] 请求失败: " + error.message);
    throw formatError(error);
  }
}

/**
 * 统一错误格式化，新增400错误专属提示
 */
function formatError(error) {
  var errorMsg = "API请求失败: ";
  // SSL错误处理
  if (error.message && error.message.indexOf("SSL") !== -1) {
    errorMsg += "SSL证书无效，无法建立安全连接，请检查API地址是否正确";
  }
  // 400错误专属处理
  else if (error.response && error.response.status === 400) {
    var errorData = error.response.data || {};
    var detailMsg = "";
    if (errorData.error) {
      detailMsg = errorData.error.message || JSON.stringify(errorData.error);
    } else if (errorData.message) {
      detailMsg = errorData.message;
    }
    errorMsg += "400请求格式错误，可能原因：1. 模型名称不正确/无权限；2. 消息体格式不支持；3. 密钥无效；4. 参数超出范围。详情：" + detailMsg;
  }
  // 403错误处理
  else if (error.response && error.response.status === 403) {
    errorMsg += "403访问被拒绝，可能原因：1. API密钥无效/无权限；2. 接口地址错误；3. 账户余额不足/IP被限制";
  }
  // 其他状态码处理
  else if (error.response) {
    var status = error.response.status;
    var errorData = error.response.data || {};
    var detailMsg = "";

    if (errorData.error) {
      detailMsg = errorData.error.message || JSON.stringify(errorData.error);
    } else if (errorData.message) {
      detailMsg = errorData.message;
    } else {
      detailMsg = JSON.stringify(errorData);
    }

    if (status === 401) errorMsg += "401未授权，请检查API Key是否正确";
    else if (status === 404) errorMsg += "404地址不存在，请检查API根地址是否正确";
    else if (status === 429) errorMsg += "429请求超限，请检查账户余额/配额";
    else if (status >= 500) errorMsg += "服务端错误，请稍后重试";
    else errorMsg += "状态码" + status + "，详情：" + detailMsg;
  } else {
    errorMsg += error.message || "网络异常，请检查网络连接";
  }
  return new Error(errorMsg);
}

/**
 * 通用AI调用入口
 */
async function callAI(config) {
  var apiUrl = config.apiUrl;
  var apiKey = config.apiKey;
  var model = config.model;
  var format = config.format || "openai-chat";
  var prompt = config.prompt;
  var count = config.count || 3;
  var mergeSystemPrompt = config.mergeSystemPrompt || "false";
  
  console.log("[AI调用] 协议格式: " + format + ", 模型: " + model);
  console.log("[AI调用] 用户需求: " + prompt);

  // 标准提示词
  var systemPrompt = "你是一个专业的影视推荐助手。请根据用户的需求，推荐" + count + "部合适的影视作品。\n\n" +
    "【严格输出要求】\n" +
    "1. 只返回剧名，每行一个\n" +
    "2. 不要添加任何序号、标点符号、年份、类型说明\n" +
    "3. 不要添加任何解释、思考过程或额外文字\n" +
    "4. 直接输出剧名列表，不要有开头和结尾的多余内容\n\n" +
    "【正确输出格式示例】\n" +
    "沉默的真相\n" +
    "隐秘的角落\n" +
    "白夜追凶";
  
  var userPrompt = "我想看" + prompt + "类型的作品，请推荐" + count + "部。";
  var temperature = 0.5;
  var maxTokens = 800;

  try {
    var content = "";
    switch (format) {
      case "openai-chat":
        content = await callOpenAIChatFormat(apiUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens, mergeSystemPrompt);
        break;
      case "openai-responses":
        content = await callOpenAIResponsesFormat(apiUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens);
        break;
      case "claude":
        content = await callClaudeFormat(apiUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens);
        break;
      case "gemini-native":
        content = await callGeminiNativeFormat(apiUrl, apiKey, model, prompt, count);
        break;
      default:
        throw new Error("不支持的API协议格式，请重新选择");
    }

    if (!content || content.trim().length === 0) {
      throw new Error("AI返回内容为空，请检查模型是否正常响应");
    }
    
    console.log("[AI调用] 原始响应: " + content);
    return content;
  } catch (error) {
    console.error("[AI调用] 失败: " + error.message);
    throw error;
  }
}

// ==================== 4. 核心业务处理函数 ====================
async function loadAIList(params) {
  params = params || {};
  
  try {
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai-chat",
      prompt: params.prompt || params.keyword || params.query || "",
      count: parseInt(params.recommendCount) || 3,
      mergeSystemPrompt: params.mergeSystemPrompt || "false"
    };
    var tmdbKey = params.TMDB_API_KEY || "";

    // 【前置校验】提前拦截无效参数，避免无效请求
    if (!aiConfig.apiUrl) throw new Error("请填写AI API地址");
    if (!aiConfig.apiKey) throw new Error("请填写AI API密钥");
    if (!aiConfig.model) throw new Error("请填写AI模型名称，必须与Metapi平台完全一致");
    if (!aiConfig.prompt) throw new Error("请输入想看的内容描述");

    console.log("[智能推荐] 开始处理，推荐数量: " + aiConfig.count);

    // 调用AI获取推荐
    var aiContent = await callAI(aiConfig);
    var nameList = parseNames(aiContent);
    nameList = nameList.slice(0, aiConfig.count);

    if (nameList.length === 0) {
      throw new Error("未能解析到推荐结果，请调整描述后重试");
    }
    console.log("[智能推荐] 最终推荐列表: " + nameList.join(", "));

    // 并行查询TMDB详情
    var queryPromises = nameList.map(function(name) {
      return new Promise(function(resolve) {
        getTmdbDetail(name, "tv", tmdbKey)
          .then(function(detail) {
            if (detail) {
              resolve(detail);
            } else {
              return getTmdbDetail(name, "movie", tmdbKey);
            }
          })
          .then(function(detail) {
            resolve(detail);
          })
          .catch(function() {
            resolve(null);
          });
      });
    });
    
    var queryResults = await Promise.all(queryPromises);
    var validResults = queryResults.filter(function(item) { return item !== null; });
    console.log("[智能推荐] 成功获取 " + validResults.length + " 条影视详情");

    // 兜底处理
    if (validResults.length === 0) {
      console.log("[智能推荐] TMDB无结果，返回兜底数据");
      var fallbackList = [];
      for (var i = 0; i < nameList.length; i++) {
        fallbackList.push({
          id: "ai_recommend_" + i + "_" + Date.now(),
          type: "url",
          title: nameList[i],
          description: "AI智能推荐影视",
          posterPath: "",
          backdropPath: "",
          releaseDate: "",
          mediaType: "movie",
          rating: 0,
          genreTitle: "",
          duration: 0,
          durationText: "",
          previewUrl: "",
          videoUrl: "",
          link: "",
          episode: 0,
          playerType: "system",
          childItems: []
        });
      }
      return fallbackList;
    }

    return validResults;
    
  } catch (error) {
    console.error("[loadAIList] 处理失败: ", error);
    throw new Error(error.message || "AI推荐服务暂时不可用");
  }
}

async function loadSimilarList(params) {
  params = params || {};
  
  try {
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai-chat",
      count: parseInt(params.recommendCount) || 3,
      mergeSystemPrompt: params.mergeSystemPrompt || "false"
    };
    var referenceTitle = params.referenceTitle || "";
    var tmdbKey = params.TMDB_API_KEY || "";

    if (!aiConfig.apiUrl || !aiConfig.apiKey || !aiConfig.model) {
      throw new Error("请先配置完整的AI API信息");
    }
    if (!referenceTitle) throw new Error("请输入喜欢的作品名称");

    console.log("[相似推荐] 参考作品: " + referenceTitle);
    aiConfig.prompt = "类似《" + referenceTitle + "》的影视作品";
    var aiContent = await callAI(aiConfig);
    var nameList = parseNames(aiContent);
    nameList = nameList.slice(0, aiConfig.count);

    if (nameList.length === 0) {
      throw new Error("未能解析到相似推荐结果，请调整作品名称后重试");
    }

    var queryPromises = nameList.map(function(name) {
      return new Promise(function(resolve) {
        getTmdbDetail(name, "tv", tmdbKey)
          .then(function(detail) {
            if (detail) {
              resolve(detail);
            } else {
              return getTmdbDetail(name, "movie", tmdbKey);
            }
          })
          .then(function(detail) {
            resolve(detail);
          })
          .catch(function() {
            resolve(null);
          });
      });
    });
    
    var queryResults = await Promise.all(queryPromises);
    var validResults = queryResults.filter(function(item) { return item !== null; });

    if (validResults.length === 0) {
      var fallbackList = [];
      for (var i = 0; i < nameList.length; i++) {
        fallbackList.push({
          id: "ai_similar_" + i + "_" + Date.now(),
          type: "url",
          title: nameList[i],
          description: "AI相似推荐影视",
          posterPath: "",
          backdropPath: "",
          releaseDate: "",
          mediaType: "movie",
          rating: 0,
          genreTitle: "",
          duration: 0,
          durationText: "",
          previewUrl: "",
          videoUrl: "",
          link: "",
          episode: 0,
          playerType: "system",
          childItems: []
        });
      }
      return fallbackList;
    }

    return validResults;
    
  } catch (error) {
    console.error("[loadSimilarList] 处理失败: ", error);
    throw new Error(error.message || "AI相似推荐服务暂时不可用");
  }
}

async function nlSearch(params) {
  params = params || {};
  try {
    var keyword = (params.keyword || params.query || params.prompt || "").trim();
    if (!keyword) throw new Error("请输入搜索描述内容");
    
    params.prompt = keyword;
    return await loadAIList(params);
    
  } catch (error) {
    console.error("[nlSearch] 搜索失败: ", error);
    throw new Error(error.message || "AI搜索服务暂时不可用");
  }
}

console.log("AI影视推荐模块v6.2.2 加载成功，已修复400 Bad Request报错");