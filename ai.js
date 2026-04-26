20260426 17:37:02 || /**
 * AI 影视推荐模块
 * 原生支持OpenAI/Gemini官方接口，全量兼容所有OpenAI格式第三方中转接口
 * 第三方API地址已统一归纳至自定义地址栏，一键即可选择使用
 */

// 全局常量定义
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DEFAULT_TIMEOUT = 120000;
const MAX_RETRY_COUNT = 2;

// ==================== 1. 模块元数据（第三方地址统一归纳至自定义栏） ====================
WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  version: "5.2.0",
  requiredVersion: "0.0.2",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini官方及所有第三方中转接口，支持自然语言搜索、智能推荐、相似推荐",
  author: "crush7s",
  site: "https://github.com/InchStudio/ForwardWidgets",
  detailCacheDuration: 3600,

  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions",
      description: "【第三方地址已统一归纳至自定义栏】支持官方接口与所有OpenAI兼容中转接口，点击右侧「自定义」预设可快速选择常用第三方地址",
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
          title: "自定义（全量第三方中转地址）",
          value: "",
          // 所有第三方地址统一归纳到自定义栏的子预设中，点击即可一键填充
          placeholders: [
            { title: "硅基流动", value: "https://api.siliconflow.cn/v1/chat/completions" },
            { title: "metapi 中转", value: "https://api.metapi.cc/v1/chat/completions" },
            { title: "newapi 中转", value: "https://你的newapi域名/v1/chat/completions" },
            { title: "OneAPI 中转", value: "https://你的oneapi域名/v1/chat/completions" },
            { title: "其他中转接口", value: "" }
          ]
        }
      ]
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
      description: "你的API Key，支持带/不带Bearer前缀，官方与第三方接口通用适配"
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
        { title: "自定义第三方模型", value: "" }
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
      description: "在 https://www.themoviedb.org/settings/api 获取的API Key，非必填"
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
      title: "AI 智能推荐",
      description: "根据描述智能推荐影视",
      functionName: "loadAIList",
      cacheDuration: 3600,
      requiresWebView: false,
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true,
          value: "随便推荐一点",
          description: "用自然语言描述，AI 帮你找片",
          placeholders: [
            { title: "随便推荐一点", value: "随便推荐一点" },
            { title: "轻松喜剧", value: "轻松喜剧" },
            { title: "科幻大片", value: "科幻大片" },
            { title: "悬疑推理", value: "悬疑推理" },
            { title: "经典港剧", value: "经典港剧" },
            { title: "高分动画", value: "高分动画" }
          ]
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "AI 相似推荐",
      description: "基于喜欢的作品推荐相似内容",
      functionName: "loadSimilarList",
      cacheDuration: 3600,
      requiresWebView: false,
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true,
          value: "星际穿越",
          description: "输入你喜欢的作品名，AI 推荐相似内容",
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

  search: {
    title: "AI 影视搜索",
    functionName: "nlSearch",
    cacheDuration: 3600,
    params: [
      {
        name: "keyword",
        title: "搜索关键词",
        type: "input",
        description: "用自然语言描述，AI 帮你找片",
        placeholders: [
          { title: "去年高分科幻片", value: "去年高分科幻片" },
          { title: "诺兰的电影", value: "诺兰的电影" },
          { title: "类似盗梦空间", value: "类似盗梦空间" },
          { title: "最近热门美剧", value: "最近热门美剧" }
        ]
      }
    ]
  }
};

// ==================== 2. 核心工具函数 ====================
function formatOpenAIUrl(apiUrl) {
  if (!apiUrl) return "";
  let cleanUrl = apiUrl.trim().replace(/\/$/, '');
  if (cleanUrl.endsWith('/chat/completions')) return cleanUrl;
  if (cleanUrl.endsWith('/v1')) return cleanUrl + '/chat/completions';
  if (!cleanUrl.includes('/chat/completions')) {
    if (!cleanUrl.includes('/v1')) cleanUrl += '/v1';
    cleanUrl += '/chat/completions';
  }
  return cleanUrl;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseNames(content) {
  if (!content || typeof content !== 'string') return [];
  let names = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    line = line
      .replace(/^[\d\+\-\*•\s\.、，,。]*/g, '')
      .replace(/[《》""''「」\[\]【】()（）]/g, '')
      .replace(/[0-9]{4}年/g, '')
      .replace(/[0-9]+集/g, '')
      .replace(/导演|主演|类型|地区|语言|评分|推荐|理由|说明|注：|：|:|\||/g, '')
      .trim();
    if (line && line.length >= 2 && line.length <= 30) names.push(line);
  }

  if (names.length === 0) {
    const parts = content.split(/\s+/);
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j].trim();
      if (part && part.length >= 2 && part.length <= 30 && !part.match(/^[0-9]+$/)) names.push(part);
    }
  }

  if (names.length === 0 && content.includes(',')) {
    const parts = content.split(/[,，、]/);
    for (let k = 0; k < parts.length; k++) {
      const part = parts[k].trim();
      if (part && part.length >= 2 && part.length <= 30) names.push(part);
    }
  }

  const unique = [...new Set(names)];
  console.log("[解析] 提取到 " + unique.length + " 个剧名: " + unique.join(", "));
  return unique;
}

async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title || !title.trim()) return null;
  const cleanTitle = title
    .replace(/[（(][^）)]*[)）]/g, '')
    .replace(/[\[【][^\]】]*[\]】]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    let responseData;
    if (apiKey) {
      const searchUrl = "https://api.themoviedb.org/3/search/" + mediaType;
      const params = {
        api_key: apiKey,
        query: cleanTitle,
        language: "zh-CN",
        include_adult: false
      };
      const response = await Widget.http.get(searchUrl, {
        params: params,
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
    const item = responseData.results[0];
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

// ==================== 3. AI API 适配器（全兼容第三方中转接口） ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens, mergeSystemPrompt, retryCount = 0) {
  mergeSystemPrompt = mergeSystemPrompt === "true";
  const formattedUrl = formatOpenAIUrl(apiUrl);
  const formattedApiKey = apiKey.trim();
  const formattedModel = model.trim();

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };
  if (formattedApiKey) {
    headers["Authorization"] = formattedApiKey.startsWith('Bearer ') || formattedApiKey.startsWith('bearer ')
      ? formattedApiKey
      : `Bearer ${formattedApiKey}`;
  }

  let finalMessages = messages;
  if (mergeSystemPrompt && messages.length > 0) {
    const systemMsg = messages.find(item => item.role === 'system');
    const userMsgs = messages.filter(item => item.role !== 'system');
    if (systemMsg) {
      const mergedContent = `${systemMsg.content}\n\n用户需求：${userMsgs[0]?.content || ''}`;
      finalMessages = [{ role: "user", content: mergedContent }];
    }
  }

  const requestBody = {
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

  try {
    return await Widget.http.post(formattedUrl, requestBody, {
      headers: headers,
      timeout: DEFAULT_TIMEOUT
    });
  } catch (error) {
    console.error("[OpenAI兼容接口] 请求失败:", error.message);
    if (error.response) {
      console.error("[OpenAI兼容接口] 错误状态码:", error.response.status);
      console.error("[OpenAI兼容接口] 错误详情:", JSON.stringify(error.response.data || error.response));
    }

    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (isRetryable && retryCount < MAX_RETRY_COUNT) {
      const waitTime = 1000 * (retryCount + 1);
      console.log(`[OpenAI兼容接口] ${waitTime}ms后进行第${retryCount + 1}次重试`);
      await delay(waitTime);
      return callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens, mergeSystemPrompt, retryCount + 1);
    }

    let errorMsg = "API请求失败: ";
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data || {};
      const detailMsg = errorData.error?.message || errorData.message || JSON.stringify(errorData);
      if (status === 401) errorMsg += "密钥无效/未授权，请检查API Key是否正确";
      else if (status === 404) errorMsg += "接口地址不存在，请检查API地址是否正确";
      else if (status === 429) errorMsg += "请求频率超限/余额不足，请检查账户配额";
      else if (status >= 500) errorMsg += "服务端错误，请稍后重试或联系接口服务商";
      else errorMsg += `状态码${status}，详情：${detailMsg}`;
    } else {
      errorMsg += error.message || "网络异常，请检查网络连接";
    }
    throw new Error(errorMsg);
  }
}

async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  const baseUrl = apiUrl.replace(/\/$/, '');
  const fullUrl = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  console.log("[Gemini] 请求URL: " + fullUrl);

  let typeInfo = userPrompt;
  if (userPrompt.includes('想看')) {
    typeInfo = userPrompt.replace('我想看', '').replace('类型的作品', '').replace('类似《', '').replace('》的作品', '').trim();
  }

  const promptText = `请推荐${count}部${typeInfo}类型的影视作品。
【输出要求】
1. 只返回剧名，每行一个
2. 不要添加任何序号、标点符号、年份
3. 不要添加任何解释或额外文字
4. 直接开始输出剧名

【输出示例】
流浪地球
星际穿越
阿凡达

请开始推荐：`;

  const requestBody = {
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
    const response = await Widget.http.post(fullUrl, requestBody, {
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      timeout: DEFAULT_TIMEOUT
    });

    let content = "";
    if (response) {
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          content = candidate.content.parts[0].text || "";
        }
      } else if (response.data && response.data.candidates && response.data.candidates[0]) {
        const candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          content = candidate.content.parts[0].text || "";
        }
      }
    }
    console.log("[Gemini] 响应预览: " + content.substring(0, 100));
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

function extractContent(response) {
  if (!response) return "";
  const target = response.data ? response.data : response;

  if (target.choices && target.choices[0]) {
    const choice = target.choices[0];
    if (choice.message && choice.message.content) return choice.message.content.trim();
    if (choice.text) return choice.text.trim();
    if (choice.delta && choice.delta.content) return choice.delta.content.trim();
  }
  if (typeof response === 'string') return response.trim();
  return "";
}

async function callAI(config) {
  const { apiUrl, apiKey, model, format = "openai", prompt, count = 9, mergeSystemPrompt = "false" } = config;
  console.log("[AI] 调用格式: " + format + ", 模型: " + model);
  console.log("[AI] 用户输入: " + prompt);

  try {
    let content = "";
    if (format === "gemini") {
      content = await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
    } else {
      const systemPrompt = `你是一个专业的影视推荐助手。请根据用户的需求，推荐${count}部合适的影视作品。
【严格输出要求】
1. 只返回剧名，每行一个
2. 不要添加任何序号、标点符号、年份、类型说明
3. 不要添加任何解释、思考过程或额外文字
4. 直接输出剧名列表，不要有开头和结尾的多余内容

【正确输出格式示例】
沉默的真相
隐秘的角落
白夜追凶`;
      const userPrompt = `我想看${prompt}类型的作品，请推荐${count}部。`;
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      const response = await callOpenAIFormat(apiUrl, apiKey, model, messages, 0.5, 800, mergeSystemPrompt);
      content = extractContent(response);
    }

    if (!content || content.trim().length === 0) {
      throw new Error("AI返回内容为空，请检查模型是否正常响应");
    }
    console.log("[AI] 原始响应:", content);
    return content;
  } catch (error) {
    console.error("AI API调用失败:", error.message);
    throw error;
  }
}

// ==================== 4. 核心业务函数 ====================
async function loadAIList(params = {}) {
  try {
    const aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      prompt: params.prompt || "",
      count: parseInt(params.recommendCount) || 9,
      mergeSystemPrompt: params.mergeSystemPrompt || "false"
    };
    const tmdbKey = params.TMDB_API_KEY || "";

    if (!aiConfig.apiUrl) throw new Error("请配置AI API地址");
    if (!aiConfig.apiKey) throw new Error("请配置AI API密钥");
    if (!aiConfig.model) throw new Error("请配置AI模型名称");
    if (!aiConfig.prompt) throw new Error("请输入想看的内容描述");

    const content = await callAI(aiConfig);
    let names = parseNames(content);
    names = names.slice(0, aiConfig.count);

    if (names.length === 0) throw new Error("未能解析到推荐结果，请调整描述后重试");
    console.log("[AI推荐] 最终推荐: " + names.join(", "));

    const promises = names.map(name => {
      return new Promise(resolve => {
        getTmdbDetail(name, "tv", tmdbKey)
          .then(detail => detail ? resolve(detail) : getTmdbDetail(name, "movie", tmdbKey))
          .then(detail => resolve(detail))
          .catch(() => resolve(null));
      });
    });
    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);
    console.log("[AI推荐] 成功获取 " + validResults.length + " 个TMDB详情");

    if (validResults.length === 0) {
      return names.map((name, index) => ({
        id: `ai_${index}_${Date.now()}`,
        type: "tmdb",
        title: name,
        description: "AI智能推荐",
        posterPath: null,
        backdropPath: null,
        releaseDate: "",
        rating: 0,
        mediaType: "movie"
      }));
    }

    return validResults;
  } catch (error) {
    console.error("loadAIList 错误:", error);
    throw new Error(error.message || "AI推荐服务暂时不可用，请稍后再试");
  }
}

async function loadSimilarList(params = {}) {
  try {
    const aiConfig = {
      apiUrl: params.aiApiUrl || "",
      apiKey: params.aiApiKey || "",
      model: params.aiModel || "",
      format: params.aiApiFormat || "openai",
      count: parseInt(params.recommendCount) || 9,
      mergeSystemPrompt: params.mergeSystemPrompt || "false"
    };
    const refTitle = params.referenceTitle || "";
    const tmdbKey = params.TMDB_API_KEY || "";

    if (!aiConfig.apiUrl || !aiConfig.apiKey || !aiConfig.model) {
      throw new Error("请配置完整的AI API信息");
    }
    if (!refTitle) throw new Error("请输入喜欢的作品名称");

    aiConfig.prompt = `类似《${refTitle}》的作品`;
    const content = await callAI(aiConfig);
    let names = parseNames(content);
    names = names.slice(0, aiConfig.count);

    if (names.length === 0) throw new Error("未能解析到推荐结果，请调整作品名称后重试");

    const promises = names.map(name => {
      return new Promise(resolve => {
        getTmdbDetail(name, "tv", tmdbKey)
          .then(detail => detail ? resolve(detail) : getTmdbDetail(name, "movie", tmdbKey))
          .then(detail => resolve(detail))
          .catch(() => resolve(null));
      });
    });
    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);

    if (validResults.length === 0) {
      return names.map((name, index) => ({
        id: `similar_${index}_${Date.now()}`,
        type: "tmdb",
        title: name,
        description: "AI相似推荐",
        posterPath: null,
        backdropPath: null,
        releaseDate: "",
        rating: 0,
        mediaType: "movie"
      }));
    }

    return validResults;
  } catch (error) {
    console.error("loadSimilarList 错误:", error);
    throw new Error(error.message || "AI相似推荐服务暂时不可用，请稍后再试");
  }
}

async function nlSearch(params = {}) {
  const keyword = (params.keyword || params.query || params.prompt || "").trim();
  if (!keyword) throw new Error("请输入搜索描述");
  params.prompt = keyword;
  return await loadAIList(params);
}

console.log("AI影视推荐模块v5.2.0 (第三方地址统一归纳版)加载成功");