/**
 * AI 影视推荐模块
 * 支持OpenAI/Gemini/硅基流动/NewApi等接口
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/硅基流动/NewApi等接口",
  author: "crush7s",
  site: "",
  version: "4.9.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,
  
  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions",
      description: "点击右侧按钮可选择预设API地址",
      placeholders: [
        {
          title: "OpenAI 官方",
          value: "https://api.openai.com/v1/chat/completions",
        },
        {
          title: "Gemini 官方",
          value: "https://generativelanguage.googleapis.com/v1beta",
        },
        {
          title: "硅基流动",
          value: "https://api.siliconflow.cn/v1/chat/completions",
        },
        {
          title: "自定义",
          value: "",
        },
      ],
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 格式 (通用)", value: "openai" },
        { title: "Gemini 格式", value: "gemini" },
      ],
      defaultValue: "openai",
      description: "选择API响应格式，Gemini官方地址请选择Gemini格式",
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "你的API Key",
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-3.5-turbo",
      description: "OpenAI: gpt-3.5-turbo, gpt-4; Gemini: gemini-1.5-pro, gemini-2.5-flash; 硅基流动: Qwen/Qwen2.5-7B-Instruct, deepseek-chat",
      placeholders: [
        {
          title: "OpenAI",
          value: "gpt-4",
        },
        {
          title: "Gemini",
          value: "gemini-2.5-flash",
        },
        {
          title: "Qwen",
          value: "Qwen/Qwen2.5-7B-Instruct",
        },
        {
          title: "DeepSeek",
          value: "deepseek-ai/DeepSeek-V2.5",
        },
        {
          title: "自定义",
          value: "",
        },
      ],
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "在 https://www.themoviedb.org/settings/api 获取的API Key",
      placeholders: [
        {
          title: "示例 Key",
          value: "c5efdaca8be081f824c3201b3fb00670",
        },
      ],
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
        { title: "18部", value: "18" },
      ],
      defaultValue: "9",
    },
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
            { title: "战争片", value: "战争片" },
          ],
        },
      ],
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
            { title: "让子弹飞", value: "让子弹飞" },
          ],
        },
      ],
    },
  ],
};

// ==================== 2. AI API 适配器 ====================

/**
 * OpenAI 格式 API 调用
 */
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens) {
  var headers = {
    "Content-Type": "application/json"
  };
  
  if (apiKey) {
    if (apiKey.startsWith('Bearer ')) {
      headers["Authorization"] = apiKey;
    } else {
      headers["Authorization"] = "Bearer " + apiKey;
    }
  }
  
  var response = await Widget.http.post(
    apiUrl,
    {
      model: model,
      messages: messages,
      max_tokens: maxTokens || 500,
      temperature: temperature || 0.5,
    },
    {
      headers: headers,
      timeout: 60000,
    }
  );
  
  return response;
}

/**
 * Gemini API 调用 - 官方格式
 */
async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  // 移除末尾斜杠
  var baseUrl = apiUrl.replace(/\/$/, '');
  
  // Gemini官方URL格式
  var fullUrl = baseUrl + '/models/' + model + ':generateContent';
  fullUrl += '?key=' + encodeURIComponent(apiKey);
  
  console.log("[Gemini] 请求URL: " + fullUrl);
  
  // 从userPrompt中提取类型
  var typeInfo = userPrompt;
  if (userPrompt.includes('想看')) {
    typeInfo = userPrompt.replace('我想看', '').replace('类型的作品', '').replace('类似《', '').replace('》的作品', '').trim();
  }
  
  // Gemini专用提示词
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
  
  // Gemini请求体格式
  var requestBody = {
    contents: [
      {
        parts: [
          {
            text: promptText
          }
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
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  };
  
  try {
    var response = await Widget.http.post(
      fullUrl,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 60000,
      }
    );
    
    // 解析Gemini响应
    var content = "";
    
    if (response) {
      // 标准Gemini响应格式
      if (response.candidates && response.candidates[0]) {
        var candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          content = candidate.content.parts[0].text || "";
        }
      }
      // 某些SDK可能包装在data字段
      else if (response.data && response.data.candidates && response.data.candidates[0]) {
        var candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          content = candidate.content.parts[0].text || "";
        }
      }
    }
    
    console.log("[Gemini] 原始响应长度: " + content.length);
    if (content.length > 0) {
      console.log("[Gemini] 响应预览: " + content.substring(0, 100));
    }
    
    return content;
    
  } catch (error) {
    console.error("[Gemini] 请求失败:", error.message);
    if (error.response) {
      console.error("[Gemini] 错误状态:", error.response.status);
      console.error("[Gemini] 错误详情:", JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * 从响应中提取内容
 */
function extractContent(response) {
  if (!response) return "";
  
  // 标准OpenAI格式
  if (response.choices && response.choices[0]) {
    var choice = response.choices[0];
    if (choice.message && choice.message.content) {
      return choice.message.content;
    }
    if (choice.text) {
      return choice.text;
    }
  }
  
  // data字段包裹的情况
  if (response.data) {
    if (response.data.choices && response.data.choices[0]) {
      var choice = response.data.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
      if (choice.text) {
        return choice.text;
      }
    }
  }
  
  // 如果是纯文本
  if (typeof response === 'string') {
    return response;
  }
  
  return "";
}

/**
 * 通用 AI 调用入口
 */
async function callAI(config) {
  var apiUrl = config.apiUrl;
  var apiKey = config.apiKey;
  var model = config.model;
  var format = config.format || "openai";
  var prompt = config.prompt;
  var count = config.count || 5;
  
  var content = "";
  
  try {
    console.log("[AI] 调用格式: " + format + ", 模型: " + model);
    console.log("[AI] 用户输入: " + prompt);
    console.log("[AI] API地址: " + apiUrl);
    
    if (format === "gemini") {
      // Gemini格式
      content = await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } else {
      // OpenAI格式（默认，适用于OpenAI、硅基流动、New API等）
      var systemPrompt = "你是一个影视推荐助手。请根据用户的需求，推荐" + count + "部合适的影视作品。\n\n" +
        "【严格要求】\n" +
        "1. 只返回剧名，每行一个\n" +
        "2. 不要添加任何序号、标点符号、年份、类型说明\n" +
        "3. 不要添加任何解释、思考过程或额外文字\n" +
        "4. 直接输出剧名列表\n\n" +
        "【输出格式示例】\n" +
        "沉默的真相\n" +
        "隐秘的角落\n" +
        "白夜追凶";
      
      var userPrompt = "我想看" + prompt + "类型的作品，请推荐" + count + "部。";
      
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      var response = await callOpenAIFormat(apiUrl, apiKey, model, messages, 0.5, 300);
      content = extractContent(response);
    }
    
    if (!content || content.trim().length === 0) {
      throw new Error("AI返回内容为空");
    }
    
    console.log("[AI] 原始响应:", content);
    return content;
    
  } catch (error) {
    console.error("AI API调用失败:", error.message);
    throw new Error("AI服务请求失败: " + error.message);
  }
}

// ==================== 3. 工具函数 ====================

/**
 * 解析剧名 - 增强版，支持空格分隔
 */
function parseNames(content) {
  if (!content || typeof content !== 'string') return [];
  
  var names = [];
  
  // 先尝试按行分割
  var lines = content.split("\n");
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    
    // 清理行内容
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
  
  // 如果没有按行解析到结果，尝试按空格分割
  if (names.length === 0) {
    var parts = content.split(/\s+/);
    for (var j = 0; j < parts.length; j++) {
      var part = parts[j].trim();
      if (part && part.length >= 2 && part.length <= 30 && !part.match(/^[0-9]+$/)) {
        names.push(part);
      }
    }
  }
  
  // 如果还没有结果，尝试按逗号分割
  if (names.length === 0 && content.includes(',')) {
    var parts = content.split(/[,，、]/);
    for (var k = 0; k < parts.length; k++) {
      var part = parts[k].trim();
      if (part && part.length >= 2 && part.length <= 30) {
        names.push(part);
      }
    }
  }
  
  // 去重
  var unique = [];
  var seen = {};
  for (var n = 0; n < names.length; n++) {
    var name = names[n];
    if (!seen[name]) {
      seen[name] = true;
      unique.push(name);
    }
  }
  
  console.log("[解析] 提取到 " + unique.length + " 个剧名: " + unique.join(", "));
  return unique;
}

/**
 * 查询TMDB详情
 */
async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title || !title.trim()) return null;

  // 清理标题
  var cleanTitle = title
    .replace(/[（(][^）)]*[)）]/g, '')
    .replace(/[\[【][^\]】]*[\]】]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    var responseData;
    
    if (apiKey) {
      var searchUrl = "https://api.themoviedb.org/3/search/" + mediaType;
      var params = {
        api_key: apiKey,
        query: cleanTitle,
        language: "zh-CN",
        include_adult: false
      };

      var response = await Widget.http.get(searchUrl, { 
        params: params,
        headers: { "User-Agent": USER_AGENT },
        timeout: 10000,
      });
      
      responseData = response.data;
    } else {
      // 使用内置查询
      responseData = await Widget.tmdb.get("/search/" + mediaType, {
        params: { query: cleanTitle, language: "zh-CN" }
      });
    }

    if (!responseData || !responseData.results || responseData.results.length === 0) {
      return null;
    }

    var item = responseData.results[0];
    return {
      id: item.id,
      type: "tmdb",
      title: item.title || item.name,
      description: item.overview || "",
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      releaseDate: item.release_date || item.first_air_date || "",
      rating: item.vote_average || 0,
      mediaType: mediaType
    };
  } catch (error) {
    console.error("[TMDB] 请求失败: " + error.message);
    return null;
  }
}

// ==================== 4. 列表加载函数 ====================

async function loadAIList(params) {
  params = params || {};
  
  try {
    // 获取配置
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      prompt: params.prompt || "",
      count: parseInt(params.recommendCount) || 5
    };
    
    var tmdbKey = params.TMDB_API_KEY || "";
    
    // 验证配置
    if (!aiConfig.apiUrl) throw new Error("请配置AI API地址");
    if (!aiConfig.apiKey) throw new Error("请配置AI API密钥");
    if (!aiConfig.model) throw new Error("请配置AI模型名称");
    if (!aiConfig.prompt) throw new Error("请输入想看的内容");
    
    console.log("[AI推荐] 使用API: " + aiConfig.apiUrl);
    console.log("[AI推荐] 使用模型: " + aiConfig.model);
    console.log("[AI推荐] 使用格式: " + aiConfig.format);
    
    // 调用AI
    var content = await callAI(aiConfig);
    var names = parseNames(content);
    
    // 确保不超过请求数量
    names = names.slice(0, aiConfig.count);
    
    if (names.length === 0) {
      throw new Error("未能解析到推荐结果");
    }
    
    console.log("[AI推荐] 最终推荐: " + names.join(", "));
    
    // 并行查询TMDB
    var promises = names.map(function(name) {
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
    
    var results = await Promise.all(promises);
    var validResults = results.filter(function(r) { return r !== null; });
    
    console.log("[AI推荐] 成功获取 " + validResults.length + " 个TMDB详情");
    
    if (validResults.length === 0) {
      // 返回AI原始结果
      return names.map(function(name, index) {
        return {
          id: "ai_" + index + "_" + Date.now(),
          type: "tmdb",
          title: name,
          description: "AI智能推荐",
          posterPath: null,
          backdropPath: null,
          releaseDate: "",
          rating: 0,
          mediaType: "movie"
        };
      });
    }
    
    return validResults;
    
  } catch (error) {
    console.error("loadAIList 错误:", error);
    throw error;
  }
}

async function loadSimilarList(params) {
  params = params || {};
  
  try {
    // 获取配置
    var aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      count: parseInt(params.recommendCount) || 5
    };
    
    var refTitle = params.referenceTitle || "";
    var tmdbKey = params.TMDB_API_KEY || "";
    
    if (!aiConfig.apiUrl || !aiConfig.apiKey || !aiConfig.model) {
      throw new Error("请配置完整的AI API信息");
    }
    if (!refTitle) throw new Error("请输入喜欢的作品");
    
    // 构建相似推荐提示词
    aiConfig.prompt = "类似《" + refTitle + "》的作品";
    
    var content = await callAI(aiConfig);
    var names = parseNames(content);
    names = names.slice(0, aiConfig.count);
    
    // 并行查询TMDB
    var promises = names.map(function(name) {
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
    
    var results = await Promise.all(promises);
    var validResults = results.filter(function(r) { return r !== null; });
    
    if (validResults.length === 0) {
      return names.map(function(name, index) {
        return {
          id: "similar_" + index + "_" + Date.now(),
          type: "tmdb",
          title: name,
          description: "AI相似推荐",
          posterPath: null,
          backdropPath: null,
          releaseDate: "",
          rating: 0,
          mediaType: "movie"
        };
      });
    }
    
    return validResults;
    
  } catch (error) {
    console.error("loadSimilarList 错误:", error);
    throw error;
  }
}

console.log("AI影视推荐模块v4.9.0 (去除Claude版本)加载成功");
