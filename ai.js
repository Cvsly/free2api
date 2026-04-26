20260426 17:41:06 || /**
 * AI 影视推荐模块
 * 完全遵循ForwardWidget官方开发规范
 * 支持OpenAI/Gemini官方接口，全量兼容metapi/newapi/OneAPI等所有OpenAI格式第三方中转接口
 */

// 全局常量定义（遵循官方规范，先定义常量再声明元数据）
var USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var DEFAULT_TIMEOUT = 120000;
var MAX_RETRY_COUNT = 2;

// ==================== 1. Widget 元数据（100%对齐官方规范结构与字段要求） ====================
var WidgetMetadata = {
  // 基础必填字段（严格遵循官方顺序与规范）
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义大模型的智能影视推荐，兼容OpenAI/Gemini官方及所有第三方中转接口，支持自然语言搜索、智能推荐、相似影视推荐",
  author: "crush7s",
  site: "https://github.com/InchStudio/ForwardWidgets",
  version: "6.0.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  // 全局参数配置（仅使用官方支持的参数类型，无自定义非法类型）
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions",
      description: "官方接口与所有OpenAI兼容中转接口通用，第三方地址已统一收纳至「自定义」预设内",
      placeholders: [
        { title: "OpenAI 官方", value: "https://api.openai.com/v1/chat/completions" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com/v1beta" },
        { title: "自定义（第三方中转地址）", value: "" }
      ]
    },
    {
      name: "thirdPartyApiPreset",
      title: "第三方接口预设",
      type: "enumeration",
      enumOptions: [
        { title: "无", value: "" },
        { title: "硅基流动", value: "https://api.siliconflow.cn/v1/chat/completions" },
        { title: "metapi 中转", value: "https://api.metapi.cc/v1/chat/completions" },
        { title: "newapi 中转", value: "https://你的newapi域名/v1/chat/completions" },
        { title: "OneAPI 中转", value: "https://你的oneapi域名/v1/chat/completions" }
      ],
      defaultValue: "",
      description: "选择后自动填充到上方API地址，也可手动输入自定义地址",
      belongTo: {
        paramName: "aiApiUrl",
        value: [""]
      }
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 格式 (官方/所有中转通用)", value: "openai" },
        { title: "Gemini 格式", value: "gemini" }
      ],
      defaultValue: "openai",
      description: "所有第三方中转接口均选择OpenAI格式，Gemini官方地址选择Gemini格式"
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "对应接口平台的API Key，支持带/不带Bearer前缀，自动适配格式"
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-3.5-turbo",
      description: "填写对应接口平台支持的模型名称，严格匹配大小写和命名规范",
      placeholders: [
        { title: "OpenAI 官方", value: "gpt-4o" },
        { title: "Gemini 官方", value: "gemini-2.5-flash" },
        { title: "通义千问", value: "Qwen/Qwen2.5-7B-Instruct" },
        { title: "DeepSeek", value: "deepseek-ai/DeepSeek-V2.5" }
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
      description: "开源模型/部分第三方接口不支持system角色时，开启此选项"
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "在 https://www.themoviedb.org/settings/api 获取的API Key，非必填，不填将使用App内置TMDB能力"
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

  // 功能模块列表（严格遵循官方字段规范，补全所有必填项）
  modules: [
    {
      id: "smartRecommend",
      title: "AI 智能推荐",
      description: "用自然语言描述想看的内容，AI智能推荐匹配影视",
      functionName: "loadAIList",
      requiresWebView: false,
      sectionMode: false,
      cacheDuration: 3600,
      params: [
        {
          name: "prompt",
          title: "描述你想看的内容",
          type: "input",
          required: true,
          value: "随便推荐一点",
          description: "用自然语言描述，AI帮你精准找片",
          placeholders: [
            { title: "随便推荐一点", value: "随便推荐一点" },
            { title: "轻松喜剧", value: "轻松喜剧" },
            { title: "高分科幻大片", value: "高分科幻大片" },
            { title: "烧脑悬疑推理", value: "烧脑悬疑推理" },
            { title: "经典港剧", value: "经典港剧" },
            { title: "高分治愈动画", value: "高分治愈动画" }
          ]
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "AI 相似推荐",
      description: "输入你喜欢的作品，AI推荐同类型相似影视",
      functionName: "loadSimilarList",
      requiresWebView: false,
      sectionMode: false,
      cacheDuration: 3600,
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品名称",
          type: "input",
          required: true,
          value: "星际穿越",
          description: "输入作品全称，AI推荐同风格相似内容",
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
  ],

  // 全局搜索配置（对齐官方nlsearch模块规范，支持App全局搜索调用）
  search: {
    title: "AI 影视搜索",
    functionName: "nlSearch",
    cacheDuration: 3600,
    params: [
      {
        name: "keyword",
        title: "搜索关键词",
        type: "input",
        required: true,
        description: "用自然语言描述，AI帮你找片",
        placeholders: [
          { title: "去年高分科幻片", value: "去年高分科幻片" },
          { title: "诺兰执导的电影", value: "诺兰执导的电影" },
          { title: "类似盗梦空间的作品", value: "类似盗梦空间的作品" },
          { title: "最近热门美剧", value: "最近热门美剧" }
        ]
      }
    ]
  }
};

// ==================== 2. 工具函数（遵循官方最佳实践，模块化拆分，兼容运行环境） ====================
/**
 * URL格式化工具 - 兼容官方/中转接口地址规范
 * @param {string} apiUrl 用户输入的API地址
 * @returns {string} 格式化后的完整请求地址
 */
function formatOpenAIUrl(apiUrl) {
  if (!apiUrl || typeof apiUrl !== 'string') return "";
  var cleanUrl = apiUrl.trim().replace(/\/$/, '');
  
  // 已为完整chat/completions地址，直接返回
  if (cleanUrl.endsWith('/chat/completions')) {
    return cleanUrl;
  }
  
  // 根地址自动补全路径
  if (cleanUrl.endsWith('/v1')) {
    return cleanUrl + '/chat/completions';
  }
  
  // 无标准路径自动补全
  if (!cleanUrl.includes('/chat/completions')) {
    if (!cleanUrl.includes('/v1')) {
      cleanUrl += '/v1';
    }
    cleanUrl += '/chat/completions';
  }
  
  return cleanUrl;
}

/**
 * 延迟工具函数 - 用于重试退避
 * @param {number} ms 延迟毫秒数
 * @returns {Promise} 延迟Promise
 */
function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * 剧名解析工具 - 兼容各类大模型输出格式
 * @param {string} content AI返回的原始内容
 * @returns {Array} 解析后的剧名数组
 */
function parseNames(content) {
  if (!content || typeof content !== 'string') return [];
  
  var names = [];
  var lines = content.split("\n");

  // 优先按行解析（符合提示词规范的标准输出）
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    
    // 清理多余格式字符
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

  // 兜底：按空格分割解析
  if (names.length === 0) {
    var parts = content.split(/\s+/);
    for (var j = 0; j < parts.length; j++) {
      var part = parts[j].trim();
      if (part && part.length >= 2 && part.length <= 30 && !part.match(/^[0-9]+$/)) {
        names.push(part);
      }
    }
  }

  // 兜底：按逗号/顿号分割解析
  if (names.length === 0 && (content.includes(',') || content.includes('，') || content.includes('、'))) {
    var parts = content.split(/[,，、]/);
    for (var k = 0; k < parts.length; k++) {
      var part = parts[k].trim();
      if (part && part.length >= 2 && part.length <= 30) {
        names.push(part);
      }
    }
  }

  // 数组去重
  var uniqueNames = [];
  var seenMap = {};
  for (var n = 0; n < names.length; n++) {
    var name = names[n];
    if (!seenMap[name]) {
      seenMap[name] = true;
      uniqueNames.push(name);
    }
  }
  
  console.log("[剧名解析] 成功提取 " + uniqueNames.length + " 个剧名: " + uniqueNames.join(", "));
  return uniqueNames;
}

/**
 * TMDB详情查询（严格遵循官方返回格式规范）
 * @param {string} title 影视名称
 * @param {string} mediaType 媒体类型 tv/movie
 * @param {string} apiKey 用户自定义TMDB API Key
 * @returns {Promise<Object|null>} 符合官方规范的影视数据对象
 */
async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return null;
  }

  // 清理标题，提升搜索准确率
  var cleanTitle = title
    .replace(/[（(][^）)]*[)）]/g, '')
    .replace(/[\[【][^\]】]*[\]】]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    var responseData;
    // 优先使用用户自定义API Key
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
      // 使用App内置TMDB能力
      responseData = await Widget.tmdb.get("/search/" + mediaType, {
        params: { query: cleanTitle, language: "zh-CN" }
      });
    }

    // 无结果返回null
    if (!responseData || !responseData.results || responseData.results.length === 0) {
      return null;
    }

    // 取第一个匹配结果，格式化返回数据（严格对齐官方VideoItem规范）
    var item = responseData.results[0];
    var itemId = item.id;
    var itemMediaType = mediaType;
    
    return {
      // 严格遵循官方规范：TMDB类型ID必须为 mediaType.id 格式
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

// ==================== 3. AI API 适配器（兼容官方/所有第三方中转接口） ====================
/**
 * OpenAI格式API调用（兼容所有中转接口，遵循官方HTTP请求规范）
 */
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens, mergeSystemPrompt, retryCount) {
  // 参数初始化
  mergeSystemPrompt = mergeSystemPrompt === "true";
  retryCount = retryCount || 0;
  
  // 格式化请求参数
  var formattedUrl = formatOpenAIUrl(apiUrl);
  var formattedApiKey = apiKey ? apiKey.trim() : "";
  var formattedModel = model ? model.trim() : "";

  // 构建请求头（兼容所有中转平台规范）
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };
  
  // 自动适配API Key格式
  if (formattedApiKey) {
    if (formattedApiKey.startsWith('Bearer ') || formattedApiKey.startsWith('bearer ')) {
      headers["Authorization"] = formattedApiKey;
    } else {
      headers["Authorization"] = "Bearer " + formattedApiKey;
    }
  }

  // 兼容不支持system角色的模型/接口
  var finalMessages = messages;
  if (mergeSystemPrompt && messages.length > 0) {
    var systemMsg = null;
    var userMsgs = [];
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].role === 'system') {
        systemMsg = messages[i];
      } else {
        userMsgs.push(messages[i]);
      }
    }
    // 合并system提示词到user消息中
    if (systemMsg) {
      var mergedContent = systemMsg.content + "\n\n用户需求：" + (userMsgs[0]?.content || '');
      finalMessages = [
        { role: "user", content: mergedContent }
      ];
    }
  }

  // 构建请求体（兼容所有中转平台参数规范）
  var requestBody = {
    model: formattedModel,
    messages: finalMessages,
    temperature: temperature || 0.5,
    stream: false
  };
  
  // 兼容新旧模型的token限制参数
  if (maxTokens) {
    requestBody.max_tokens = maxTokens;
    requestBody.max_completion_tokens = maxTokens;
  }

  console.log("[API请求] 地址: " + formattedUrl);
  console.log("[API请求] 模型: " + formattedModel);
  console.log("[API请求] 重试次数: " + retryCount);

  try {
    return await Widget.http.post(formattedUrl, requestBody, {
      headers: headers,
      timeout: DEFAULT_TIMEOUT
    });
  } catch (error) {
    console.error("[API请求] 失败: " + error.message);
    // 打印错误详情，方便排查
    if (error.response) {
      console.error("[API请求] 错误状态码: " + error.response.status);
      console.error("[API请求] 错误详情: " + JSON.stringify(error.response.data || error.response));
    }

    // 自动重试逻辑：仅网络错误/服务端5xx错误重试
    var isRetryable = !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (isRetryable && retryCount < MAX_RETRY_COUNT) {
      var waitTime = 1000 * (retryCount + 1);
      console.log("[API请求] " + waitTime + "ms后进行第" + (retryCount + 1) + "次重试");
      await delay(waitTime);
      return callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens, mergeSystemPrompt, retryCount + 1);
    }

    // 友好错误提示，精准定位问题
    var errorMsg = "API请求失败: ";
    if (error.response) {
      var status = error.response.status;
      var errorData = error.response.data || {};
      var detailMsg = errorData.error?.message || errorData.message || JSON.stringify(errorData);
      
      if (status === 401) errorMsg += "密钥无效/未授权，请检查API Key是否正确";
      else if (status === 404) errorMsg += "接口地址不存在，请检查API地址是否正确";
      else if (status === 429) errorMsg += "请求频率超限/账户余额不足，请检查接口配额";
      else if (status >= 500) errorMsg += "服务端错误，请稍后重试或联系接口服务商";
      else errorMsg += "状态码" + status + "，详情：" + detailMsg;
    } else {
      errorMsg += error.message || "网络异常，请检查网络连接";
    }
    
    throw new Error(errorMsg);
  }
}

/**
 * Gemini格式API调用（遵循官方规范）
 */
async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  // 格式化请求地址
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  console.log("[Gemini请求] 地址: " + fullUrl);

  // 提取用户需求核心信息
  var typeInfo = userPrompt;
  if (userPrompt.includes('想看')) {
    typeInfo = userPrompt.replace('我想看', '').replace('类型的作品', '').replace('类似《', '').replace('》的作品', '').trim();
  }

  // 构建标准提示词
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

  // 构建请求体
  var requestBody = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
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
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT
      },
      timeout: DEFAULT_TIMEOUT
    });

    // 解析Gemini响应
    var content = "";
    if (response) {
      // 标准响应格式
      if (response.candidates && response.candidates[0]) {
        var candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          content = candidate.content.parts[0].text || "";
        }
      } 
      // 兼容data包裹的响应格式
      else if (response.data && response.data.candidates && response.data.candidates[0]) {
        var candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          content = candidate.content.parts[0].text || "";
        }
      }
    }
    
    console.log("[Gemini响应] 内容长度: " + content.length);
    if (content.length > 0) {
      console.log("[Gemini响应] 预览: " + content.substring(0, 100));
    }
    
    return content;
  } catch (error) {
    console.error("[Gemini请求] 失败: " + error.message);
    if (error.response) {
      console.error("[Gemini请求] 错误状态: " + error.response.status);
      console.error("[Gemini请求] 错误详情: " + JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * 响应内容提取（兼容所有官方/中转接口返回格式）
 * @param {Object|string} response API返回的原始响应
 * @returns {string} 提取后的纯文本内容
 */
function extractContent(response) {
  if (!response) return "";
  // 优先处理data包裹的标准响应格式
  var target = response.data ? response.data : response;

  // 标准OpenAI格式
  if (target.choices && target.choices[0]) {
    var choice = target.choices[0];
    if (choice.message && choice.message.content) return choice.message.content.trim();
    if (choice.text) return choice.text.trim();
    if (choice.delta && choice.delta.content) return choice.delta.content.trim();
  }
  
  // 纯文本响应
  if (typeof response === 'string') return response.trim();
  
  return "";
}

/**
 * 通用AI调用入口（统一调度不同格式的API）
 */
async function callAI(config) {
  var apiUrl = config.apiUrl;
  var apiKey = config.apiKey;
  var model = config.model;
  var format = config.format || "openai";
  var prompt = config.prompt;
  var count = config.count || 9;
  var mergeSystemPrompt = config.mergeSystemPrompt || "false";
  
  console.log("[AI调用] 格式: " + format + ", 模型: " + model);
  console.log("[AI调用] 用户需求: " + prompt);

  try {
    var content = "";
    // Gemini格式调用
    if (format === "gemini") {
      content = await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } 
    // OpenAI格式调用（默认，兼容所有中转接口）
    else {
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
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      var response = await callOpenAIFormat(apiUrl, apiKey, model, messages, 0.5, 800, mergeSystemPrompt);
      content = extractContent(response);
    }

    // 空内容校验
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

// ==================== 4. 核心业务处理函数（严格遵循官方函数规范） ====================
/**
 * AI智能推荐主函数（与元数据functionName完全对应）
 * 严格遵循官方处理函数规范：async + params参数 + try-catch + 标准返回格式
 */
async function loadAIList(params) {
  // 兼容空参数
  params = params || {};
  
  try {
    // 1. 处理第三方接口预设联动
    if (params.thirdPartyApiPreset && params.thirdPartyApiPreset.trim()) {
      params.aiApiUrl = params.thirdPartyApiPreset;
    }

    // 2. 配置提取与必填参数校验（遵循官方最佳实践，提前校验参数）
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      prompt: params.prompt || params.keyword || params.query || "",
      count: parseInt(params.recommendCount) || 9,
      mergeSystemPrompt: params.mergeSystemPrompt || "false"
    };
    var tmdbKey = params.TMDB_API_KEY || "";

    // 必填参数校验，抛出明确错误信息
    if (!aiConfig.apiUrl) throw new Error("请配置AI API地址，可在第三方接口预设中快速选择");
    if (!aiConfig.apiKey) throw new Error("请配置对应接口平台的AI API密钥");
    if (!aiConfig.model) throw new Error("请配置对应接口平台支持的AI模型名称");
    if (!aiConfig.prompt) throw new Error("请输入你想看的内容描述");

    console.log("[智能推荐] 开始处理，推荐数量: " + aiConfig.count);

    // 3. 调用AI获取推荐结果
    var aiContent = await callAI(aiConfig);
    var nameList = parseNames(aiContent);
    // 截取用户指定的推荐数量
    nameList = nameList.slice(0, aiConfig.count);

    // 解析结果为空校验
    if (nameList.length === 0) {
      throw new Error("未能解析到推荐结果，请调整描述内容后重试");
    }
    console.log("[智能推荐] 最终推荐列表: " + nameList.join(", "));

    // 4. 并行查询TMDB详情，提升性能
    var queryPromises = nameList.map(function(name) {
      return new Promise(function(resolve) {
        // 先查剧集，无结果再查电影
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

    // 5. 兜底处理：TMDB无结果时返回标准格式的原始推荐结果
    if (validResults.length === 0) {
      console.log("[智能推荐] TMDB无结果，返回兜底数据");
      return nameList.map(function(name, index) {
        return {
          id: "ai_recommend_" + index + "_" + Date.now(),
          type: "url",
          title: name,
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
        };
      });
    }

    // 6. 返回符合规范的最终结果
    return validResults;
    
  } catch (error) {
    // 遵循官方错误处理规范：打印错误日志 + 抛出用户友好错误
    console.error("[loadAIList] 处理失败: ", error);
    throw new Error(error.message || "AI智能推荐服务暂时不可用，请稍后再试");
  }
}

/**
 * AI相似推荐主函数（与元数据functionName完全对应）
 */
async function loadSimilarList(params) {
  params = params || {};
  
  try {
    // 1. 处理第三方接口预设联动
    if (params.thirdPartyApiPreset && params.thirdPartyApiPreset.trim()) {
      params.aiApiUrl = params.thirdPartyApiPreset;
    }

    // 2. 配置提取与参数校验
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      count: parseInt(params.recommendCount) || 9,
      mergeSystemPrompt: params.mergeSystemPrompt || "false"
    };
    var referenceTitle = params.referenceTitle || "";
    var tmdbKey = params.TMDB_API_KEY || "";

    // 必填参数校验
    if (!aiConfig.apiUrl || !aiConfig.apiKey || !aiConfig.model) {
      throw new Error("请先配置完整的AI API信息");
    }
    if (!referenceTitle) throw new Error("请输入你喜欢的作品名称");

    console.log("[相似推荐] 参考作品: " + referenceTitle);

    // 3. 构建提示词并调用AI
    aiConfig.prompt = "类似《" + referenceTitle + "》的影视作品";
    var aiContent = await callAI(aiConfig);
    var nameList = parseNames(aiContent);
    nameList = nameList.slice(0, aiConfig.count);

    if (nameList.length === 0) {
      throw new Error("未能解析到相似推荐结果，请调整作品名称后重试");
    }

    // 4. 并行查询TMDB详情
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

    // 5. 兜底处理
    if (validResults.length === 0) {
      return nameList.map(function(name, index) {
        return {
          id: "ai_similar_" + index + "_" + Date.now(),
          type: "url",
          title: name,
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
        };
      });
    }

    // 6. 返回最终结果
    return validResults;
    
  } catch (error) {
    console.error("[loadSimilarList] 处理失败: ", error);
    throw new Error(error.message || "AI相似推荐服务暂时不可用，请稍后再试");
  }
}

/**
 * 全局AI搜索函数（与元数据search.functionName完全对应，对齐官方nlsearch规范）
 */
async function nlSearch(params) {
  params = params || {};
  try {
    // 兼容全局搜索的关键词参数
    var keyword = (params.keyword || params.query || params.prompt || "").trim();
    if (!keyword) throw new Error("请输入搜索描述内容");
    
    // 复用智能推荐逻辑，实现自然语言搜索
    params.prompt = keyword;
    return await loadAIList(params);
    
  } catch (error) {
    console.error("[nlSearch] 搜索失败: ", error);
    throw new Error(error.message || "AI搜索服务暂时不可用，请稍后再试");
  }
}

// 模块加载完成提示（遵循官方规范）
console.log("AI影视推荐模块v6.0.0 (官方规范版) 加载成功，完全兼容ForwardWidget官方标准");