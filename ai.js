/**
 * AI 影视推荐与智能搜索模块
 * 版本：5.3.0 (深度意图解析 & 资源补全版)
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 智能搜索",
  description: "深度理解搜索意图，自动过滤合集，匹配精准单体影视资源",
  author: "crush7s",
  version: "5.3.0",
  globalParams: [
    { name: "aiApiUrl", title: "API 地址", type: "input", defaultValue: "https://api.siliconflow.cn/v1/chat/completions" },
    { name: "aiApiFormat", title: "格式", type: "enumeration", enumOptions: [{title:"OpenAI", value:"openai"}, {title:"Gemini", value:"gemini"}], defaultValue: "openai" },
    { name: "aiApiKey", title: "API 密钥", type: "input", required: true },
    { name: "aiModel", title: "模型", type: "input", defaultValue: "deepseek-ai/DeepSeek-V3" },
    { name: "TMDB_API_KEY", title: "TMDB Key", type: "input", defaultValue: "c5efdaca8be081f824c3201b3fb00670" }, // 默认提供一个备用Key
    { name: "recommendCount", title: "数量", type: "enumeration", enumOptions: [{title:"10部", value:"10"}, {title:"15部", value:"15"}], defaultValue: "10" }
  ],
  search: {
    title: "AI 智能搜索",
    functionName: "searchAI",
    params: [{ name: "keyword", title: "描述你想看的内容", type: "input" }]
  },
  modules: [
    { id: "smartRecommend", title: "AI 发现", functionName: "loadAIList", params: [{ name: "prompt", title: "想看什么", type: "input", value: "经典高分悬疑片" }] }
  ]
};

// ==================== 1. 意图解析引擎 ====================

async function callAI(config) {
  const { apiUrl, apiKey, model, format, prompt, count } = config;
  
  // 核心 Prompt：强制 AI 执行“实体拆解”
  const systemPrompt = `你是一个专业的影视数据专家。
任务：根据用户输入的关键词，输出 ${count} 个具体的、单体的影视作品名称。
约束：
1. 如果用户输入人名（如“周星驰”），请输出他主演的最具代表性的单体电影名，严禁直接输出人名。
2. 严禁输出任何形式的“合集”、“系列”、“纪录片”、“电影节”或“Collection”。
3. 严禁输出任何解释、序号、标点或“非常抱歉”等废话。
4. 每行一个剧名，必须是纯文本。`;

  if (format === "gemini") {
    return await callGemini(apiUrl, apiKey, model, prompt, count);
  }

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = apiKey.startsWith('Bearer ') ? apiKey : "Bearer " + apiKey;

  const response = await Widget.http.post(apiUrl, {
    model: model,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
    temperature: 0.2
  }, { headers: headers, timeout: 60000 });

  const data = response.data || response;
  return data.choices?.[0]?.message?.content || "";
}

// ==================== 2. 高级过滤与 TMDB 匹配 ====================

async function getSmartTmdbDetail(title, apiKey) {
  if (!title) return null;
  const types = ["movie", "tv"];
  const bannedWords = ["合集", "Collection", "纪录", "传记", "典藏", "电影节", "花絮", "特典"];

  for (let type of types) {
    try {
      let resp;
      if (apiKey) {
        resp = await Widget.http.get(`https://api.themoviedb.org/3/search/${type}`, {
          params: { api_key: apiKey, query: title, language: "zh-CN" }
        });
        resp = resp.data;
      } else {
        resp = await Widget.tmdb.get(`/search/${type}`, { params: { query: title, language: "zh-CN" } });
      }

      if (resp && resp.results && resp.results.length > 0) {
        // 关键逻辑：在搜索结果中筛选非合集项目
        let match = resp.results.find(item => {
          const t = item.title || item.name || "";
          return !bannedWords.some(w => t.includes(w));
        });

        if (match) {
          return {
            id: match.id,
            type: "tmdb",
            title: match.title || match.name,
            description: (match.overview || "暂无简介").substring(0, 100) + "...",
            posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
            backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : null,
            releaseDate: match.release_date || match.first_air_date || "未知日期",
            rating: match.vote_average || 0.0,
            mediaType: type
          };
        }
      }
    } catch (e) { continue; }
  }
  return null;
}

// ==================== 3. 统一入口 ====================

async function searchAI(params) {
  const kw = (params.keyword || params.query || "").trim();
  return await executeLogic(params, kw);
}

async function loadAIList(params) {
  return await executeLogic(params, params.prompt);
}

async function executeLogic(params, promptText) {
  if (!promptText) return [];

  const config = {
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: promptText,
    count: parseInt(params.recommendCount) || 10
  };

  // 1. AI 解析出干净的电影名列表
  const rawContent = await callAI(config);
  const names = rawContent.split("\n")
    .map(n => n.replace(/^[\d\.\-\s]*/, '').replace(/[《》]/g, '').trim())
    .filter(n => n.length > 0 && n.length < 20 && !n.includes("抱歉"));

  // 2. 并行获取 TMDB 详情（带合集过滤）
  const detailPromises = names.map(name => getSmartTmdbDetail(name, params.TMDB_API_KEY));
  const details = await Promise.all(detailPromises);

  // 3. 结果去重与展示
  const seen = new Set();
  return details.filter(d => {
    if (d && !seen.has(d.id)) {
      seen.add(d.id);
      return true;
    }
    return false;
  });
}

async function callGemini(url, key, model, prompt, count) {
  const fullUrl = `${url.replace(/\/$/, '')}/models/${model}:generateContent?key=${key}`;
  const p = `列出${count}个具体的影视作品名称（不要合集，不要解释），针对描述：${prompt}。每行一个名。`;
  const res = await Widget.http.post(fullUrl, { contents: [{ parts: [{ text: p }] }] });
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
