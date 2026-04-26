20260426 17:28:49 || /**
 * AI 影视推荐模块
 * 原生支持OpenAI/Gemini/硅基流动，完美适配metapi/newapi/OneAPI/MaxKB等所有OpenAI格式兼容接口
 */

var USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var DEFAULT_TIMEOUT = 120000;
var MAX_RETRY_COUNT = 2;

// ==================== 1. Metadata 定义（严格符合Forward模块规范） ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/硅基流动/metapi/newapi/OneAPI等全格式接口",
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
      defaultValue: "https://api.openai.com/v1/chat/completions",
      description: "支持完整接口地址或根地址，自动补全路径，点击右侧按钮可选择预设",
      placeholders: [
        {
          title: "OpenAI 官方",
          value: "https://api.openai.com/v1/chat/completions"
        },
        {
          title: "Gemini 官方",
          value: "https://generativelanguage.googleapis.com/v1beta"
        },
        {
          title: "硅基流动",
          value: "https://api.siliconflow.cn/v1/chat/completions"
        },
        {
          title: "metapi 中转",
          value: "https://api.metapi.cc/v1/chat/completions"
        },
        {
          title: "newapi 中转",
          value: "https://你的newapi域名/v1/chat/completions"
        },
        {
          title: "OneAPI 中转",
          value: "https://你的oneapi域名/v1/chat/completions"
        },
        {
          title: "自定义",
          value: ""
        }
      ]
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI 格式 (中转接口通用)", value: "openai" },
        { title: "Gemini 格式", value: "gemini" }
      ],
      defaultValue: "openai",
      description: "metapi/newapi/OneAPI/硅基流动等所有中转接口均选择OpenAI格式"
    },
    {
      name: "aiApiKey",
      title: "AI API 密钥",
      type: "input",
      required: true,
      description: "你的API Key，支持带/不带Bearer前缀，自动适配格式"
    },
    {
      name: "aiModel",
      title: "AI 模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-3.5-turbo",
      description: "中转接口请填写平台支持的模型名称，严格匹配大小写和命名",
      placeholders: [
        {
          title: "OpenAI",
          value: "gpt-4o"
        },
        {
          title: "Gemini",
          value: "gemini-2.5-flash"
        },
        {
          title: "通义千问",
          value: "Qwen/Qwen2.5-7B-Instruct"
        },
        {
          title: "DeepSeek",
          value: "deepseek-ai/DeepSeek-V2.5"
        },
        {
          title: "自定义",
          value: ""
        }
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
      description: "开源模型/部分中转接口不支持system角色时，开启此选项"
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
          value: "c5efdaca8be081f824c3201b3fb00670"
        }
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

// ==================== 2. 工具函数（ES5兼容写法） ====================
function formatOpenAIUrl(apiUrl) {
  if (!apiUrl) return "";
  var cleanUrl = apiUrl.trim().replace(/\/$/, '');
  
  if (cleanUrl.endsWith('/chat/completions')) {
    return cleanUrl;
  }
  
  if (cleanUrl.endsWith('/v1')) {
    return cleanUrl + '/chat/completions';
  }
  
  if (!cleanUrl.includes('/chat/completions')) {
    if (!cleanUrl.includes('/v1')) {
      cleanUrl += '/v1';
    }
    cleanUrl += '/chat/completions';
  }
  
  return cleanUrl;
}

function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

// ==================== 3. AI API 适配器（ES5兼容，全适配中转接口） ====================
function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens, mergeSystemPrompt, retryCount) {
  mergeSystemPrompt = mergeSystemPrompt === "true";
  retryCount = retryCount || 0;
  
  var formattedUrl = formatOpenAIUrl(apiUrl);
  var formattedApiKey = apiKey ? apiKey.trim() : "";
  var formattedModel = model ? model.trim() : "";
  
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };
  
  if (formattedApiKey) {
    if (formattedApiKey.startsWith('Bearer ') || formattedApiKey.startsWith('bearer ')) {
      headers["Authorization"] = formattedApiKey;
    } else {
      headers["Authorization"] = "Bearer " + formattedApiKey;
    }
  }
  
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
    if (systemMsg) {
      var mergedContent = systemMsg.content + "\n\n用户需求：" + (userMsgs[0]?.content || '');
      finalMessages = [
        { role: "user", content: mergedContent }
      ];
    }
  }
  
  var requestBody = {
    model: formattedModel,
    messages: finalMessages,
    temperature: temperature || 0.5,
    stream: false
  };
  
  if (maxTokens) {
    requestBody.max_tokens = maxTokens;
    requestBody.max_completion_tokens = maxTokens;
  }
  
  console.log("[OpenAI兼容接口] 请求地址: " + formattedUrl);
  console.log("[OpenAI兼容接口] 使用模型: " + formattedModel);
  console.log("[OpenAI兼容接口] 重试次数: " + retryCount);
  
  return new Promise(function(resolve, reject) {
    Widget.http.post(
      formattedUrl,
      requestBody,
      {
        headers: headers,
        timeout: DEFAULT_TIMEOUT
      }
    ).then(function(response) {
      resolve(response);
    }).catch(function(error) {
      console.error("[OpenAI兼容接口] 请求失败:", error.message);
      if (error.response) {
        console.error("[OpenAI兼容接口] 错误状态码:", error.response.status);
        console.error("[OpenAI兼容接口] 错误响应体:", JSON.stringify(error.response.data || error.response));
      }
      
      var isRetryable = !error.response || (error.response.status >= 500 && error.response.status < 600);
      if (isRetryable && retryCount < MAX_RETRY_COUNT) {
        var waitTime = 1000 * (retryCount + 1);
        console.log("[OpenAI兼容接口] " + waitTime + "ms后进行第" + (retryCount + 1) + "次重试");
        delay(waitTime).then(function() {
          callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens, mergeSystemPrompt, retryCount + 1)
            .then(resolve)
            .catch(reject);
        });
        return;
      }
      
      var errorMsg = "API请求失败: ";
      if (error.response) {
        var status = error.response.status;
        var errorData = error.response.data || {};
        var detailMsg = errorData.error?.message || errorData.message || JSON.stringify(errorData);
        
        if (status === 401) errorMsg += "密钥无效/未授权，请检查API Key是否正确";
        else if (status === 404) errorMsg += "接口地址不存在，请检查API地址是否正确";
        else if (status === 429) errorMsg += "请求频率超限/余额不足，请检查账户配额";
        else if (status >= 500) errorMsg += "服务端错误，请稍后重试或联系接口服务商";
        else errorMsg += "状态码" + status + "，详情：" + detailMsg;
      } else {
        errorMsg += error.message || "网络异常，请检查网络连接";
      }
      
      reject(new Error(errorMsg));
    });
  });
}

function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent';
  fullUrl += '?key=' + encodeURIComponent(apiKey);
  
  console.log("[Gemini] 请求URL: " + fullUrl);
  
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
  
  return new Promise(function(resolve, reject) {
    Widget.http.post(
      fullUrl,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT
        },
        timeout: DEFAULT_TIMEOUT
      }
    ).then(function(response) {
      var content = "";
      if (response) {
        if (response.candidates && response.candidates[0]) {
          var candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
            content = candidate.content.parts[0].text || "";
          }
        } else if (response.data && response.data.candidates && response.data.candidates[0]) {
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
      
      resolve(content);
    }).catch(function(error) {
      console.error("[Gemini] 请求失败:", error.message);
      if (error.response) {
        console.error("[Gemini] 错误状态:", error.response.status);
        console.error("[Gemini] 错误详情:", JSON.stringify(error.response.data));
      }
      reject(error);
    });
  });
}

function extractContent(response) {
  if (!response) return "";
  
  var target = response.data ? response.data : response;
  
  if (target.choices && target.choices[0]) {
    var choice = target.choices[0];
    if (choice.message && choice.message.content) {
      return choice.message.content.trim();
    }
    if (choice.text) {
      return choice.text.trim();
    }
    if (choice.delta && choice.delta.content) {
      return choice.delta.content.trim();
    }
  }
  
  if (typeof response === 'string') {
    return response.trim();
  }
  
  return "";
}

function callAI(config) {
  var apiUrl = config.apiUrl;
  var apiKey = config.apiKey;
  var model = config.model;
  var format = config.format || "openai";
  var prompt = config.prompt;
  var count = config.count || 5;
  var mergeSystemPrompt = config.mergeSystemPrompt || "false";
  
  return new Promise(function(resolve, reject) {
    console.log("[AI] 调用格式: " + format + ", 模型: " + model);
    console.log("[AI] 用户输入: " + prompt);
    console.log("[AI] API地址: " + apiUrl);
    
    if (format === "gemini") {
      callGeminiFormat(apiUrl, apiKey, model, prompt, count)
        .then(function(content) {
          if (!content || content.trim().length === 0) {
            reject(new Error("AI返回内容为空，请检查模型是否正常响应"));
            return;
          }
          console.log("[AI] 原始响应:", content);
          resolve(content);
        })
        .catch(reject);
    } else {
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
      
      callOpenAIFormat(apiUrl, apiKey, model, messages, 0.5, 800, mergeSystemPrompt)
        .then(function(response) {
          var content = extractContent(response);
          if (!content || content.trim().length === 0) {
            reject(new Error("AI返回内容为空，请检查模型是否正常响应"));
            return;
          }
          console.log("[AI] 原始响应:", content);
          resolve(content);
        })
        .catch(reject);
    }
  });
}

// ==================== 4. 剧名解析工具函数 ====================
function parseNames(content) {
  if (!content || typeof content !== 'string') return [];
  
  var names = [];
  var lines = content.split("\n");
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    
    line = line
      .replace(/^[\d\+\-\*•\s\.、，,。]*/g, '')
      .replace(/[《》""''「」\[\]【】()（）]/g, '')...