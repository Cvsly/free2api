/**
 * AI 影视推荐模块 + 聚合搜索
 * 支持OpenAI/Gemini/硅基流动/NewApi等接口
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "AI智能推荐 + 聚合搜索，兼容多平台AI接口",
  author: "crush7s",
  site: "",
  version: "5.0.0",
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
        { title: "OpenAI 官方", value: "https://api.openai.com/v1/chat/completions" },
        { title: "Gemini 官方", value: "https://generativelanguage.googleapis.com/v1beta" },
        { title: "硅基流动", value: "https://api.siliconflow.cn/v1/chat/completions" },
        { title: "自定义", value: "" },
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
      description: "OpenAI: gpt-3.5-turbo, gpt-4; Gemini: gemini-1.5-pro; 硅基流动: Qwen/Qwen2.5-7B-Instruct",
      placeholders: [
        { title: "OpenAI", value: "gpt-4" },
        { title: "Gemini", value: "gemini-2.5-flash" },
        { title: "Qwen", value: "Qwen/Qwen2.5-7B-Instruct" },
        { title: "DeepSeek", value: "deepseek-ai/DeepSeek-V2.5" },
        { title: "自定义", value: "" },
      ],
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false,
      description: "在 themoviedb.org 获取的API Key",
      placeholders: [
        { title: "示例 Key", value: "c5efdaca8be081f824c3201b3fb00670" },
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
    {
      id: "aggregateSearch",
      title: "聚合搜索",
      description: "搜索电影 / 剧集 / 动漫，一键查找",
      functionName: "loadAggregateSearch",
      requiresWebView: false,
      params: [
        {
          name: "searchKeyword",
          title: "搜索关键词",
          type: "input",
          required: true,
          value: "",
          placeholders: [
            { title: "蜘蛛侠", value: "蜘蛛侠" },
            { title: "权力的游戏", value: "权力的游戏" },
            { title: "进击的巨人", value: "进击的巨人" },
            { title: "周星驰", value: "周星驰" },
          ],
        },
        {
          name: "searchType",
          title: "搜索类型",
          type: "enumeration",
          enumOptions: [
            { title: "全部", value: "all" },
            { title: "电影", value: "movie" },
            { title: "剧集", value: "tv" },
          ],
          defaultValue: "all",
        },
      ],
    },
  ],
};

// ==================== 2. AI API 适配器 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature, maxTokens) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;
  }
  var response = await Widget.http.post(apiUrl, {
    model: model,
    messages: messages,
    max_tokens: maxTokens || 500,
    temperature: temperature || 0.5,
  }, { headers, timeout: 60000 });
  return response;
}

async function callGeminiFormat(apiUrl, apiKey, model, userPrompt, count) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  var promptText = "请推荐" + count + "部" + userPrompt + "类型的影视作品。\n【输出要求】\n1.只返回剧名，每行一个\n2.不要序号标点年份\n3.不要解释\n4.直接输出";
  
  var requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  var response = await Widget.http.post(fullUrl, requestBody, { timeout: 60000 });
  var content = "";
  if (response.candidates?.[0]?.content?.parts?.[0]) {
    content = response.candidates[0].content.parts[0].text;
  } else if (response.data?.candidates?.[0]?.content?.parts?.[0]) {
    content = response.data.candidates[0].content.parts[0].text;
  }
  return content;
}

function extractContent(response) {
  if (!response) return "";
  if (response.choices?.[0]?.message?.content) return response.choices[0].message.content;
  if (response.choices?.[0]?.text) return response.choices[0].text;
  if (response.data?.choices?.[0]?.message?.content) return response.data.choices[0].message.content;
  if (typeof response === 'string') return response;
  return "";
}

async function callAI(config) {
  var { apiUrl, apiKey, model, format, prompt, count } = config;
  var content = "";

  if (format === "gemini") {
    content = await callGeminiFormat(apiUrl, apiKey, model, prompt, count);
  } else {
    var system = "你是影视推荐助手。只返回剧名，每行一个，无序号无标点无解释。";
    var user = "推荐" + count + "部" + prompt + "类型作品";
    var msg = [{ role: "system", content: system }, { role: "user", content: user }];
    var res = await callOpenAIFormat(apiUrl, apiKey, model, msg, 0.5, 300);
    content = extractContent(res);
  }

  if (!content?.trim()) throw new Error("AI返回为空");
  return content;
}

// ==================== 3. 工具函数 ====================
function parseNames(content) {
  if (!content) return [];
  var lines = content.split("\n");
  var names = [];
  for (var l of lines) {
    var line = l.trim()
      .replace(/^[\d\.\-\*•\s]+/, "")
      .replace(/[《》【】\[\]""''()]/g, "")
      .trim();
    if (line.length >= 2 && line.length <= 40) names.push(line);
  }
  return [...new Set(names)];
}

async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title) return null;
  var t = title.replace(/[（(].*[)）]/g, "").trim();

  try {
    var res;
    if (apiKey) {
      res = await Widget.http.get("https://api.themoviedb.org/3/search/" + mediaType, {
        params: { api_key: apiKey, query: t, language: "zh-CN", include_adult: false },
        headers: { "User-Agent": USER_AGENT },
        timeout: 10000
      });
    } else {
      res = { data: await Widget.tmdb.get("/search/" + mediaType, { params: { query: t, language: "zh-CN" } }) };
    }

    if (!res.data.results?.length) return null;
    var d = res.data.results[0];

    return {
      id: `tmdb:${mediaType}:${d.id}`,
      type: "video",
      title: d.title || d.name,
      description: d.overview || "",
      poster: d.poster_path ? IMAGE_BASE + d.poster_path : null,
      backdrop: d.backdrop_path ? BACKDROP_BASE + d.backdrop_path : null,
      year: (d.release_date || d.first_air_date || "").split("-")[0] || "",
      rating: d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : 0,
      mediaType: mediaType,
      link: `tmdb:${mediaType}:${d.id}`,
    };
  } catch (e) {
    return null;
  }
}

// ==================== 4. 列表函数 ====================
async function loadAIList(params) {
  try {
    var cfg = {
      apiUrl: params.aiApiUrl, apiKey: params.aiApiKey,
      model: params.aiModel, format: params.aiApiFormat,
      prompt: params.prompt, count: +params.recommendCount || 9
    };
    var tk = params.TMDB_API_KEY;
    if (!cfg.prompt) throw new Error("请输入想看的内容");

    var raw = await callAI(cfg);
    var names = parseNames(raw).slice(0, cfg.count);
    var items = await Promise.all(names.map(n => getTmdbDetail(n, "movie", tk).then(x=>x||getTmdbDetail(n,"tv",tk))));
    var valid = items.filter(Boolean);

    return valid.length ? valid : names.map((n,i)=>({
      id: "ai_"+i, type:"video", title:n, description:"AI推荐", poster:null, link:"no-source"
    }));
  } catch (e) { throw e; }
}

async function loadSimilarList(params) {
  try {
    var cfg = {
      apiUrl: params.aiApiUrl, apiKey: params.aiApiKey,
      model: params.aiModel, format: params.aiApiFormat,
      prompt: "类似《"+params.referenceTitle+"》",
      count: +params.recommendCount ||9
    };
    var tk = params.TMDB_API_KEY;
    var raw = await callAI(cfg);
    var names = parseNames(raw).slice(0, cfg.count);
    var items = await Promise.all(names.map(n=>getTmdbDetail(n,"movie",tk).then(x=>x||getTmdbDetail(n,"tv",tk))));
    var valid = items.filter(Boolean);

    return valid.length ? valid : names.map((n,i)=>({
      id:"sim_"+i, type:"video", title:n, description:"相似推荐", poster:null, link:"no-source"
    }));
  } catch(e){ throw e; }
}

// ==================== 新增：聚合搜索 ====================
async function loadAggregateSearch(params) {
  try {
    var kw = params.searchKeyword?.trim();
    var type = params.searchType || "all";
    var tk = params.TMDB_API_KEY;
    var max = +params.recommendCount ||9;

    if (!kw) throw new Error("请输入关键词");

    var tasks = [];
    if (type === "all" || type === "movie") tasks.push(getTmdbDetail(kw, "movie", tk));
    if (type === "all" || type === "tv") tasks.push(getTmdbDetail(kw, "tv", tk));

    var res = await Promise.all(tasks);
    var list = res.filter(Boolean);

    if (list.length ===0) {
      try {
        var aiCfg = {
          apiUrl: params.aiApiUrl, apiKey: params.aiApiKey,
          model: params.aiModel, format: params.aiApiFormat,
          prompt: kw, count: max
        };
        var raw = await callAI(aiCfg);
        var names = parseNames(raw).slice(0, max);
        var more = await Promise.all(names.map(n=>getTmdbDetail(n,"movie",tk).then(x=>x||getTmdbDetail(n,"tv",tk))));
        list = more.filter(Boolean);
      } catch(_){}
    }

    if (list.length ===0) {
      return [{ id:"nores", type:"video", title:kw, description:"未找到资源", poster:null, link:"no-source" }];
    }

    return list.slice(0, max);
  } catch(e){ throw e; }
}

// ==================== 必需：详情播放 ====================
async function loadDetail(item) {
  return {
    link: item.link || item.id,
    playerType: "system"
  };
}

console.log("AI影视推荐模块 v5.0.0 加载成功 ✅");