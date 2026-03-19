/**
 * AI 影视推荐模块（方案A：全局搜索演员优先）
 * 支持OpenAI/Gemini/硅基流动/NewApi等接口
 * 适配Forward官方搜索规范，接管全局搜索，优先返回演员作品
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

// ==================== 1. Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "AI智能推荐+相似推荐+全局演员优先搜索",
  author: "crush7s",
  site: "https://github.com/InchStudio/ForwardWidgets",
  version: "6.0.0",
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
      required: true,
      description: "在 themoviedb.org 获取的API Key（演员搜索必需）",
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
      description: "根据类型描述精准推荐影视",
      functionName: "loadAIList",
      requiresWebView: false,
      params: [
        {
          name: "prompt",
          title: "想看什么类型",
          type: "input",
          required: true,
          value: "",
          placeholders: [
            { title: "轻松喜剧", value: "轻松喜剧" },
            { title: "科幻大片", value: "科幻大片" },
            { title: "悬疑推理", value: "悬疑推理" },
            { title: "经典港剧", value: "经典港剧" },
            { title: "高分动画", value: "高分动画" },
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
          ],
        },
      ],
    },
  ],
  
  // 接管全局搜索：演员优先
  search: {
    title: "AI 影视搜索",
    functionName: "actorFirstSearch",
    params: [
      {
        name: "query",
        title: "搜索",
        type: "input",
        description: "输入演员名/片名/类型，优先返回演员作品",
        placeholders: [
          { title: "周星驰", value: "周星驰" },
          { title: "科幻片", value: "科幻片" },
          { title: "诺兰", value: "诺兰" },
        ],
      },
    ],
  },
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
  var promptText = "请推荐" + count + "部符合「" + userPrompt + "」的影视作品。\n【输出要求】\n1.只返回剧名，每行一个\n2.不要序号标点年份类型\n3.不要任何解释\n4.直接输出剧名列表";
  
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
    var system = "你是专业影视推荐助手，精准理解用户自然语言需求。只返回剧名，每行一个，无序号无标点无任何解释。";
    var user = "请推荐" + count + "部符合「" + prompt + "」的影视作品";
    var msg = [{ role: "system", content: system }, { role: "user", content: user }];
    var res = await callOpenAIFormat(apiUrl, apiKey, model, msg, 0.5, 300);
    content = extractContent(res);
  }

  if (!content?.trim()) throw new Error("AI返回内容为空，请检查API配置");
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

// 演员搜索 → 获取演员作品
async function getActorWorks(actorName, apiKey, count) {
  if (!actorName || !apiKey) return [];
  try {
    // 1. 搜索演员
    var personRes = await Widget.http.get("https://api.themoviedb.org/3/search/person", {
      params: { 
        api_key: apiKey, 
        query: actorName, 
        language: "zh-CN",
        include_adult: false
      },
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000
    });

    if (!personRes.data.results?.length) return [];
    var personId = personRes.data.results[0].id;

    // 2. 获取演员参演电影 + 剧集
    var [movieCredits, tvCredits] = await Promise.all([
      Widget.http.get(`https://api.themoviedb.org/3/person/${personId}/movie_credits`, {
        params: { api_key: apiKey, language: "zh-CN" },
        headers: { "User-Agent": USER_AGENT }
      }),
      Widget.http.get(`https://api.themoviedb.org/3/person/${personId}/tv_credits`, {
        params: { api_key: apiKey, language: "zh-CN" },
        headers: { "User-Agent": USER_AGENT }
      })
    ]);

    var works = [];
    // 合并并过滤无效结果
    if (movieCredits.data.cast) {
      works = works.concat(
        movieCredits.data.cast
          .filter(i => !i.title?.includes("合集") && !i.title?.includes("纪录"))
          .map(i => ({...i, media_type: "movie"}))
      );
    }
    if (tvCredits.data.cast) {
      works = works.concat(
        tvCredits.data.cast
          .filter(i => !i.name?.includes("合集") && !i.name?.includes("纪录"))
          .map(i => ({...i, media_type: "tv"}))
      );
    }
    
    works.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    works = works.slice(0, count);

    // 3. 转换为 Forward 格式
    return works.map(d => ({
      id: `tmdb:${d.media_type}:${d.id}`,
      type: "video",
      title: d.title || d.name,
      description: d.overview || "暂无影片简介",
      poster: d.poster_path ? IMAGE_BASE + d.poster_path : null,
      backdrop: d.backdrop_path ? BACKDROP_BASE + d.backdrop_path : null,
      year: (d.release_date || d.first_air_date || "").split("-")[0] || "未知",
      rating: d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : 0,
      mediaType: d.media_type,
      link: `tmdb:${d.media_type}:${d.id}`,
    }));
  } catch (e) {
    console.error(`[演员搜索失败] ${actorName}: ${e.message}`);
    return [];
  }
}

// 原有的片名搜索
async function getTmdbDetail(title, mediaType, apiKey) {
  if (!title) return null;
  var t = title.replace(/[（(].*[)）]/g, "").replace(/\s+/g, " ").trim();

  try {
    var res, responseData;
    if (apiKey) {
      res = await Widget.http.get("https://api.themoviedb.org/3/search/" + mediaType, {
        params: { api_key: apiKey, query: t, language: "zh-CN", include_adult: false },
        headers: { "User-Agent": USER_AGENT },
        timeout: 10000
      });
      responseData = res.data;
    } else {
      responseData = await Widget.tmdb.get("/search/" + mediaType, { params: { query: t, language: "zh-CN" } });
    }

    if (!responseData.results?.length) return null;
    var d = responseData.results[0];

    return {
      id: `tmdb:${mediaType}:${d.id}`,
      type: "video",
      title: d.title || d.name,
      description: d.overview || "暂无影片简介",
      poster: d.poster_path ? IMAGE_BASE + d.poster_path : null,
      backdrop: d.backdrop_path ? BACKDROP_BASE + d.backdrop_path : null,
      year: (d.release_date || d.first_air_date || "").split("-")[0] || "未知",
      rating: d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : 0,
      mediaType: mediaType,
      link: `tmdb:${mediaType}:${d.id}`,
    };
  } catch (e) {
    console.error(`[TMDB查询失败] 标题：${title}，类型：${mediaType}，错误：${e.message}`);
    return null;
  }
}

// ==================== 4. 核心：全局搜索（演员优先） ====================
async function actorFirstSearch(params = {}) {
  const keyword = (params.query || "").trim();
  if (!keyword) return []; // 空查询直接返回空，避免报错
  
  const tmdbKey = params.TMDB_API_KEY;
  const count = parseInt(params.recommendCount) || 9;

  // 1. 优先识别演员名，返回演员作品
  const isChineseName = /^[\u4e00-\u9fa5]{2,}$/.test(keyword);
  const isEnglishName = /^[A-Za-z\s]{2,}$/.test(keyword);
  if ((isChineseName || isEnglishName) && tmdbKey) {
    const actorWorks = await getActorWorks(keyword, tmdbKey, count);
    if (actorWorks.length > 0) return actorWorks;
  }

  // 2. 非演员名 → 走 TMDB 片名搜索
  if (!tmdbKey) {
    throw new Error("请配置 TMDB API Key 以使用搜索功能");
  }

  const [movieRes, tvRes] = await Promise.all([
    Widget.http.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: tmdbKey, query: keyword, language: "zh-CN" },
      headers: { "User-Agent": USER_AGENT },
    }),
    Widget.http.get("https://api.themoviedb.org/3/search/tv", {
      params: { api_key: tmdbKey, query: keyword, language: "zh-CN" },
      headers: { "User-Agent": USER_AGENT },
    }),
  ]);

  const items = [];
  if (movieRes.data.results) {
    items.push(...movieRes.data.results.map(d => ({
      id: `tmdb:movie:${d.id}`,
      type: "video",
      title: d.title,
      description: d.overview,
      poster: d.poster_path ? IMAGE_BASE + d.poster_path : null,
      year: (d.release_date || "").split("-")[0] || "未知",
      rating: d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : 0,
      mediaType: "movie",
      link: `tmdb:movie:${d.id}`,
    })));
  }
  if (tvRes.data.results) {
    items.push(...tvRes.data.results.map(d => ({
      id: `tmdb:tv:${d.id}`,
      type: "video",
      title: d.name,
      description: d.overview,
      poster: d.poster_path ? IMAGE_BASE + d.poster_path : null,
      year: (d.first_air_date || "").split("-")[0] || "未知",
      rating: d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : 0,
      mediaType: "tv",
      link: `tmdb:tv:${d.id}`,
    })));
  }

  // 过滤合集/纪录片，按评分排序
  return items
    .filter(i => !i.title?.includes("合集") && !i.title?.includes("纪录"))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, count);
}

// ==================== 5. 保留原核心功能：AI智能推荐 ====================
async function loadAIList(params) {
  try {
    var cfg = {
      apiUrl: params.aiApiUrl,
      apiKey: params.aiApiKey,
      model: params.aiModel,
      format: params.aiApiFormat,
      prompt: params.prompt,
      count: +params.recommendCount || 9
    };
    var tk = params.TMDB_API_KEY;
    if (!cfg.prompt) throw new Error("请输入想看的影视类型");

    var raw = await callAI(cfg);
    var names = parseNames(raw).slice(0, cfg.count);
    var items = await Promise.all(names.map(n => getTmdbDetail(n, "movie", tk).then(x=>x||getTmdbDetail(n,"tv",tk))));
    var valid = items.filter(Boolean);

    return valid.length ? valid : names.map((n,i)=>({
      id: `ai_type_${i}`,
      type:"video",
      title:n,
      description:"AI类型推荐 | 暂无TMDB详情",
      poster:null,
      backdrop:null,
      year:"未知",
      rating:0,
      link: `ai_type_${n}`,
      mediaType:"movie"
    }));
  } catch (e) { 
    console.error("[AI智能推荐失败]:", e.message);
    throw e; 
  }
}

// ==================== 6. 保留原核心功能：相似推荐 ====================
async function loadSimilarList(params) {
  try {
    var refTitle = params.referenceTitle?.trim();
    if (!refTitle) throw new Error("请输入喜欢的影视作品名称");

    var cfg = {
      apiUrl: params.aiApiUrl,
      apiKey: params.aiApiKey,
      model: params.aiModel,
      format: params.aiApiFormat,
      prompt: `类似《${refTitle}》的影视作品`,
      count: +params.recommendCount ||9
    };
    var tk = params.TMDB_API_KEY;
    
    var raw = await callAI(cfg);
    var names = parseNames(raw).slice(0, cfg.count);
    var items = await Promise.all(names.map(n=>getTmdbDetail(n,"movie",tk).then(x=>x||getTmdbDetail(n,"tv",tk))));
    var valid = items.filter(Boolean);

    return valid.length ? valid : names.map((n,i)=>({
      id:`ai_sim_${i}`,
      type:"video",
      title:n,
      description:`类似《${refTitle}》| 暂无TMDB详情`,
      poster:null,
      backdrop:null,
      year:"未知",
      rating:0,
      link: `ai_sim_${n}`,
      mediaType:"movie"
    }));
  } catch(e){ 
    console.error("[相似推荐失败]:", e.message);
    throw e; 
  }
}

// ==================== 7. Forward必需：详情加载与播放 ====================
async function loadDetail(item) {
  return {
    link: item.link || item.id,
    playerType: "system"
  };
}

console.log("AI影视推荐模块 v6.0.0 加载成功 ✅（全局搜索演员优先）");