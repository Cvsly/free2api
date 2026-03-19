/**
 * AI 影视推荐模块（参考官方模块优化搜索）
 * 支持OpenAI/Gemini/硅基流动/NewApi等接口
 * 完全适配Forward官方搜索逻辑，自然语言解析+精准匹配
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

// ==================== 1. Metadata 定义（完全参考官方）====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "自然语言描述需求，AI解析意图后精准匹配影视",
  author: "crush7s",
  site: "https://github.com/InchStudio/ForwardWidgets",
  version: "7.0.0",
  requiredVersion: "0.0.1",
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
      description: "在 themoviedb.org 获取的API Key（必需）",
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
  
  // 全局搜索：完全参考官方模块的nlSearch逻辑
  search: {
    title: "AI 影视搜索",
    functionName: "nlSearch",
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
          { title: "周星驰参演的喜剧", value: "周星驰参演的喜剧" },
        ],
      },
    ],
  },
};

// ==================== 2. AI API 适配器 ====================
async function callOpenAIFormat(apiUrl, apiKey, model, messages, temperature) {
  var headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;
  }
  var response = await Widget.http.post(apiUrl, {
    model: model,
    messages: messages,
    temperature: temperature || 0.3, // 降低随机性，提高解析准确性
  }, { headers, timeout: 60000 });
  return response;
}

async function callGeminiFormat(apiUrl, apiKey, model, prompt) {
  var baseUrl = apiUrl.replace(/\/$/, '');
  var fullUrl = baseUrl + '/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  var requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
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

// ==================== 3. 核心：自然语言解析（参考官方逻辑）====================
/**
 * 解析用户自然语言查询，提取核心意图（演员/导演/类型/年份/相似作品）
 */
async function parseQueryIntent(params) {
  const keyword = (params.keyword || params.query || "").trim();
  const aiApiUrl = params.aiApiUrl;
  const aiApiKey = params.aiApiKey;
  const aiModel = params.aiModel;
  const aiFormat = params.aiApiFormat || "openai";

  // 参考官方模块：用LLM解析意图，返回结构化数据
  const systemPrompt = `你是影视搜索意图解析专家，需精准分析用户查询的核心需求，返回JSON格式，字段说明：
  - type: 搜索类型（actor=演员参演/ director=导演作品/ genre=类型/ similar=相似作品/ title=片名/ mixed=混合需求）
  - value: 核心值（如演员名/导演名/类型/参考片名）
  - filters: 过滤条件（对象，可选，如{year: "2023-2025", rating: ">8.0"}）
  示例1：查询"周星驰的喜剧" → {"type":"actor","value":"周星驰","filters":{"genre":"喜剧"}}
  示例2：查询"诺兰执导的科幻片" → {"type":"director","value":"诺兰","filters":{"genre":"科幻"}}
  示例3：查询"类似盗梦空间的悬疑片" → {"type":"similar","value":"盗梦空间","filters":{"genre":"悬疑"}}
  示例4：查询"2024年高分科幻片" → {"type":"genre","value":"科幻","filters":{"year":"2024","rating":">8.0"}}
  只返回JSON，不要任何额外文字！`;

  try {
    let intentJson;
    if (aiFormat === "gemini") {
      const prompt = `${systemPrompt}\n用户查询：${keyword}`;
      const content = await callGeminiFormat(aiApiUrl, aiApiKey, aiModel, prompt);
      intentJson = JSON.parse(content.replace(/```json|```/g, "").trim());
    } else {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: keyword }
      ];
      const response = await callOpenAIFormat(aiApiUrl, aiApiKey, aiModel, messages);
      const content = response.data.choices[0].message.content;
      intentJson = JSON.parse(content.replace(/```json|```/g, "").trim());
    }
    return intentJson || {};
  } catch (e) {
    console.error("[意图解析失败]", e.message);
    // 降级：默认按片名搜索
    return { type: "title", value: keyword };
  }
}

// ==================== 4. 精准搜索实现（按意图匹配）====================
async function searchByIntent(intent, params) {
  const tmdbKey = params.TMDB_API_KEY;
  const count = parseInt(params.recommendCount) || 9;
  const filters = intent.filters || {};
  const results = [];

  try {
    // 1. 演员参演作品
    if (intent.type === "actor") {
      const personRes = await Widget.http.get("https://api.themoviedb.org/3/search/person", {
        params: { api_key: tmdbKey, query: intent.value, language: "zh-CN" },
        headers: { "User-Agent": USER_AGENT }
      });
      if (personRes.data.results?.length) {
        const personId = personRes.data.results[0].id;
        const [movieCredits, tvCredits] = await Promise.all([
          Widget.http.get(`https://api.themoviedb.org/3/person/${personId}/movie_credits`, {
            params: { api_key: tmdbKey, language: "zh-CN" }
          }),
          Widget.http.get(`https://api.themoviedb.org/3/person/${personId}/tv_credits`, {
            params: { api_key: tmdbKey, language: "zh-CN" }
          })
        ]);
        // 合并并过滤
        const works = [...(movieCredits.data.cast || []), ...(tvCredits.data.cast || [])]
          .filter(item => {
            // 过滤合集/纪录片
            if (item.title?.includes("合集") || item.name?.includes("合集") || item.title?.includes("纪录")) return false;
            // 过滤年份
            if (filters.year) {
              const [minYear, maxYear] = filters.year.split("-").map(Number);
              const itemYear = item.release_date ? item.release_date.split("-")[0] : item.first_air_date?.split("-")[0];
              if (itemYear && (itemYear < minYear || itemYear > maxYear)) return false;
            }
            // 过滤评分
            if (filters.rating) {
              const ratingThreshold = parseFloat(filters.rating.replace(">", ""));
              if (item.vote_average < ratingThreshold) return false;
            }
            // 过滤类型
            if (filters.genre) {
              const genreLower = filters.genre.toLowerCase();
              return item.genre_ids?.some(gid => {
                const genreMap = {
                  28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪",
                  99: "纪录片", 18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史",
                  27: "恐怖", 10402: "音乐", 9648: "悬疑", 10749: "爱情", 878: "科幻",
                  10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部"
                };
                return genreMap[gid]?.toLowerCase().includes(genreLower);
              });
            }
            return true;
          })
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, count);
        // 转换格式
        results.push(...works.map(item => ({
          id: `tmdb:${item.media_type || (item.title ? "movie" : "tv")}:${item.id}`,
          type: "video",
          title: item.title || item.name,
          description: item.overview || "暂无简介",
          poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
          backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
          year: (item.release_date || item.first_air_date || "").split("-")[0] || "未知",
          rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
          mediaType: item.media_type || (item.title ? "movie" : "tv"),
          link: `tmdb:${item.media_type || (item.title ? "movie" : "tv")}:${item.id}`,
        })));
      }
    }

    // 2. 导演作品（补充导演搜索，参考官方示例）
    else if (intent.type === "director") {
      // 先搜索导演ID
      const personRes = await Widget.http.get("https://api.themoviedb.org/3/search/person", {
        params: { api_key: tmdbKey, query: intent.value, language: "zh-CN" }
      });
      if (personRes.data.results?.length) {
        const personId = personRes.data.results[0].id;
        // 搜索导演参与的电影/剧集
        const [movieCredits, tvCredits] = await Promise.all([
          Widget.http.get(`https://api.themoviedb.org/3/person/${personId}/movie_credits`, {
            params: { api_key: tmdbKey, language: "zh-CN" }
          }),
          Widget.http.get(`https://api.themoviedb.org/3/person/${personId}/tv_credits`, {
            params: { api_key: tmdbKey, language: "zh-CN" }
          })
        ]);
        // 筛选导演身份的作品
        const directedWorks = [
          ...(movieCredits.data.crew?.filter(c => c.job === "Director") || []),
          ...(tvCredits.data.crew?.filter(c => c.job === "Director") || [])
        ]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, count);
        results.push(...directedWorks.map(item => ({
          id: `tmdb:${item.media_type || (item.title ? "movie" : "tv")}:${item.id}`,
          type: "video",
          title: item.title || item.name,
          description: item.overview || "暂无简介",
          poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
          backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
          year: (item.release_date || item.first_air_date || "").split("-")[0] || "未知",
          rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
          mediaType: item.media_type || (item.title ? "movie" : "tv"),
          link: `tmdb:${item.media_type || (item.title ? "movie" : "tv")}:${item.id}`,
        })));
      }
    }

    // 3. 类型搜索
    else if (intent.type === "genre") {
      const genreMap = {
        "动作": 28, "冒险": 12, "动画": 16, "喜剧": 35, "犯罪": 80,
        "纪录片": 99, "剧情": 18, "家庭": 10751, "奇幻": 14, "历史": 36,
        "恐怖": 27, "音乐": 10402, "悬疑": 9648, "爱情": 10749, "科幻": 878,
        "惊悚": 53, "战争": 10752, "西部": 37
      };
      const genreId = genreMap[intent.value] || "";
      if (genreId) {
        const [movieRes, tvRes] = await Promise.all([
          Widget.http.get("https://api.themoviedb.org/3/discover/movie", {
            params: {
              api_key: tmdbKey, language: "zh-CN",
              with_genres: genreId,
              primary_release_year: filters.year ? filters.year.split("-")[0] : "",
              vote_average.gte: filters.rating ? filters.rating.replace(">", "") : 6.0,
              sort_by: "popularity.desc"
            }
          }),
          Widget.http.get("https://api.themoviedb.org/3/discover/tv", {
            params: {
              api_key: tmdbKey, language: "zh-CN",
              with_genres: genreId,
              first_air_year: filters.year ? filters.year.split("-")[0] : "",
              vote_average.gte: filters.rating ? filters.rating.replace(">", "") : 6.0,
              sort_by: "popularity.desc"
            }
          })
        ]);
        results.push(...(movieRes.data.results || []).map(item => ({
          id: `tmdb:movie:${item.id}`,
          type: "video",
          title: item.title,
          description: item.overview || "暂无简介",
          poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
          backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
          year: item.release_date.split("-")[0] || "未知",
          rating: parseFloat(item.vote_average.toFixed(1)),
          mediaType: "movie",
          link: `tmdb:movie:${item.id}`,
        })));
        results.push(...(tvRes.data.results || []).map(item => ({
          id: `tmdb:tv:${item.id}`,
          type: "video",
          title: item.name,
          description: item.overview || "暂无简介",
          poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
          backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
          year: item.first_air_date.split("-")[0] || "未知",
          rating: parseFloat(item.vote_average.toFixed(1)),
          mediaType: "tv",
          link: `tmdb:tv:${item.id}`,
        })));
      }
    }

    // 4. 相似作品（参考官方示例）
    else if (intent.type === "similar") {
      // 先搜索参考作品ID
      const [movieRes, tvRes] = await Promise.all([
        Widget.http.get("https://api.themoviedb.org/3/search/movie", {
          params: { api_key: tmdbKey, query: intent.value, language: "zh-CN" }
        }),
        Widget.http.get("https://api.themoviedb.org/3/search/tv", {
          params: { api_key: tmdbKey, query: intent.value, language: "zh-CN" }
        })
      ]);
      if (movieRes.data.results?.length) {
        const movieId = movieRes.data.results[0].id;
        const similarRes = await Widget.http.get(`https://api.themoviedb.org/3/movie/${movieId}/similar`, {
          params: { api_key: tmdbKey, language: "zh-CN" }
        });
        results.push(...(similarRes.data.results || []).map(item => ({
          id: `tmdb:movie:${item.id}`,
          type: "video",
          title: item.title,
          description: item.overview || "暂无简介",
          poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
          backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
          year: item.release_date.split("-")[0] || "未知",
          rating: parseFloat(item.vote_average.toFixed(1)),
          mediaType: "movie",
          link: `tmdb:movie:${item.id}`,
        })));
      } else if (tvRes.data.results?.length) {
        const tvId = tvRes.data.results[0].id;
        const similarRes = await Widget.http.get(`https://api.themoviedb.org/3/tv/${tvId}/similar`, {
          params: { api_key: tmdbKey, language: "zh-CN" }
        });
        results.push(...(similarRes.data.results || []).map(item => ({
          id: `tmdb:tv:${item.id}`,
          type: "video",
          title: item.name,
          description: item.overview || "暂无简介",
          poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
          backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
          year: item.first_air_date.split("-")[0] || "未知",
          rating: parseFloat(item.vote_average.toFixed(1)),
          mediaType: "tv",
          link: `tmdb:tv:${item.id}`,
        })));
      }
    }

    // 5. 片名/混合搜索（降级）
    else {
      const [movieRes, tvRes] = await Promise.all([
        Widget.http.get("https://api.themoviedb.org/3/search/movie", {
          params: { api_key: tmdbKey, query: intent.value, language: "zh-CN" }
        }),
        Widget.http.get("https://api.themoviedb.org/3/search/tv", {
          params: { api_key: tmdbKey, query: intent.value, language: "zh-CN" }
        })
      ]);
      results.push(...(movieRes.data.results || []).map(item => ({
        id: `tmdb:movie:${item.id}`,
        type: "video",
        title: item.title,
        description: item.overview || "暂无简介",
        poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
        backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
        year: item.release_date.split("-")[0] || "未知",
        rating: parseFloat(item.vote_average.toFixed(1)),
        mediaType: "movie",
        link: `tmdb:movie:${item.id}`,
      })));
      results.push(...(tvRes.data.results || []).map(item => ({
        id: `tmdb:tv:${item.id}`,
        type: "video",
        title: item.name,
        description: item.overview || "暂无简介",
        poster: item.poster_path ? IMAGE_BASE + item.poster_path : null,
        backdrop: item.backdrop_path ? BACKDROP_BASE + item.backdrop_path : null,
        year: item.first_air_date.split("-")[0] || "未知",
        rating: parseFloat(item.vote_average.toFixed(1)),
        mediaType: "tv",
        link: `tmdb:tv:${item.id}`,
      })));
    }

    // 去重+过滤+排序
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values())
      .filter(item => !item.title.includes("合集") && !item.title.includes("纪录"))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, count);

    return uniqueResults.length ? uniqueResults : [{
      id: `no_result_${Date.now()}`,
      type: "video",
      title: "未找到匹配结果",
      description: "请尝试调整关键词或搜索条件",
      poster: null,
      backdrop: null,
      year: "",
      rating: 0,
      mediaType: "movie",
      link: "no-source",
    }];
  } catch (e) {
    console.error("[精准搜索失败]", e.message);
    throw new Error(`搜索失败：${e.message}`);
  }
}

// ==================== 5. 全局搜索入口（完全参考官方nlSearch）====================
async function nlSearch(params = {}) {
  const keyword = (params.keyword || params.query || "").trim();
  if (!keyword) throw new Error("请输入搜索描述");

  try {
    // 1. 解析意图（参考官方：LLM解析+精准匹配）
    const intent = await parseQueryIntent(params);
    console.log("[搜索意图]", JSON.stringify(intent));

    // 2. 按意图搜索
    const results = await searchByIntent(intent, params);
    return results;
  } catch (error) {
    console.error("[AI搜索] 请求失败:", error.message || error);
    throw new Error("AI 搜索服务暂时不可用，请稍后再试");
  }
}

// ==================== 6. 保留原核心功能：AI智能推荐 ====================
async function loadAIList(params) {
  try {
    const cfg = {
      apiUrl: params.aiApiUrl,
      apiKey: params.aiApiKey,
      model: params.aiModel,
      format: params.aiApiFormat,
      prompt: params.prompt,
      count: +params.recommendCount || 9
    };
    const tmdbKey = params.TMDB_API_KEY;
    if (!cfg.prompt) throw new Error("请输入想看的影视类型");

    // 用意图解析逻辑优化推荐
    const intent = { type: "genre", value: cfg.prompt };
    const results = await searchByIntent(intent, params);
    return results;
  } catch (e) {
    console.error("[AI智能推荐失败]:", e.message);
    throw e;
  }
}

// ==================== 7. 保留原核心功能：相似推荐 ====================
async function loadSimilarList(params) {
  try {
    const refTitle = params.referenceTitle?.trim();
    if (!refTitle) throw new Error("请输入喜欢的影视作品名称");

    const tmdbKey = params.TMDB_API_KEY;
    const count = +params.recommendCount || 9;

    // 用意图解析逻辑优化相似推荐
    const intent = { type: "similar", value: refTitle };
    const results = await searchByIntent(intent, params);
    return results;
  } catch (e) {
    console.error("[相似推荐失败]:", e.message);
    throw e;
  }
}

// ==================== 8. Forward必需：详情加载与播放 ====================
async function loadDetail(item) {
  return {
    link: item.link || item.id,
    playerType: "system"
  };
}

console.log("AI影视推荐模块 v7.0.0 加载成功 ✅（参考官方模块优化搜索）");