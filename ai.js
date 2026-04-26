/**
 * AI 影视推荐模块
 * 纯净极简版｜适配自定义私有中转/自定义模型
 * 去除所有额外参数、关闭自动URL拼接、兼容 gpt-5.4
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== Metadata 官方规范 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "极简纯净版｜兼容所有自定义中转、私有模型",
  author: "crush7s",
  site: "",
  version: "5.1.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI完整API地址",
      type: "input",
      required: true,
      defaultValue: "https://metapi.omgd.eu.org/v1/chat/completions",
      description: "请手动填写完整地址，例：xxx/v1/chat/completions",
      placeholders: [
        { title: "你的中转完整地址", value: "https://metapi.omgd.eu.org/v1/chat/completions" }
      ]
    },
    {
      name: "aiApiFormat",
      title: "API格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI通用", value: "openai" },
        { title: "Gemini原生", value: "gemini" }
      ],
      defaultValue: "openai",
      description: "自定义中转一律选 OpenAI通用"
    },
    {
      name: "aiApiKey",
      title: "API密钥",
      type: "input",
      required: true,
      description: "你的sk密钥，其他客户端同款"
    },
    {
      name: "aiModel",
      title: "模型名称",
      type: "input",
      required: true,
      defaultValue: "gpt-5.4",
      description: "直接填写你能用的私有模型：gpt-5.4"
    },
    {
      name: "TMDB_API_KEY",
      title: "TMDB密钥",
      type: "input",
      required: false,
      description: "选填，无则留空"
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
      defaultValue: "9"
    }
  ],

  modules: [
    {
      id: "smartRecommend",
      title: "AI智能推荐",
      description: "按风格类型推荐影视",
      functionName: "loadAIList",
      requiresWebView: false,
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true,
          value: ""
        }
      ]
    },
    {
      id: "similarRecommend",
      title: "相似推荐",
      description: "按作品推荐相似",
      functionName: "loadSimilarList",
      requiresWebView: false,
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true,
          value: ""
        }
      ]
    }
  ]
};

// ==================== 纯净OpenAI请求｜无任何多余参数 ====================
async function callOpenAI(apiUrl, apiKey, model, messages) {
  var headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + apiKey
  };

  // 【关键】极简请求体，只保留必填字段，和你其他客户端完全一致
  var body = {
    model: model,
    messages: messages
  };

  try {
    var res = await Widget.http.post(apiUrl, body, {
      headers: headers,
      timeout: 60000
    });
    return res;
  } catch (err) {
    console.error("AI请求错误：", err.status, err.message);
    if (err.response) {
      console.error("服务器返回：", err.response.data);
    }
    throw new Error("AI接口请求失败，请检查地址/密钥/模型");
  }
}

// ==================== 响应解析 ====================
function getAiContent(res) {
  var data = res.data || res;
  if (!data || !data.choices || !data.choices[0]) return "";
  return data.choices[0].message.content || "";
}

// ==================== AI统一入口 ====================
async function callAIChat(apiUrl, apiKey, model, prompt, count) {
  var sysMsg = "你是影视推荐助手，只返回" + count + "个影视名称，每行一个，不要序号、不要年份、不要解释、不要多余文字。";
  var userMsg = prompt;

  var messages = [
    { role: "system", content: sysMsg },
    { role: "user", content: userMsg }
  ];

  var response = await callOpenAI(apiUrl, apiKey, model, messages);
  var content = getAiContent(response);

  if (!content || content.trim() === "") {
    throw new Error("AI返回内容为空");
  }
  return content;
}

// ==================== 剧名解析 ====================
function parseTitleList(text) {
  var list = [];
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var t = lines[i].trim();
    if (!t) continue;
    t = t.replace(/^\d+[\.、\s]/, "").replace(/[《》]/g, "").trim();
    if (t.length >= 2) list.push(t);
  }
  // 去重
  var arr = [];
  var map = {};
  for (var j = 0; j < list.length; j++) {
    if (!map[list[j]]) {
      map[list[j]] = 1;
      arr.push(list[j]);
    }
  }
  return arr;
}

// ==================== TMDB 获取 ====================
async function getTmdbInfo(title, tmdbKey) {
  if (!title) return null;
  try {
    var url = "https://api.themoviedb.org/3/search/multi";
    var opt = {
      params: {
        query: title,
        language: "zh-CN",
        api_key: tmdbKey || ""
      },
      headers: { "User-Agent": USER_AGENT }
    };
    var res = await Widget.http.get(url, opt);
    var data = res.data;
    if (!data || !data.results || data.results.length === 0) return null;
    var item = data.results[0];
    return {
      id: item.id,
      title: item.title || item.name,
      desc: item.overview || "暂无简介",
      pic: item.poster_path ? "https://image.tmdb.org/t/p/w300" + item.poster_path : "",
      rating: item.vote_average || 0
    };
  } catch (e) {
    return null;
  }
}

// ==================== 模块标准返回 ====================
async function loadAIList(params) {
  var apiUrl = params.aiApiUrl || "";
  var apiKey = params.aiApiKey || "";
  var model = params.aiModel || "";
  var count = parseInt(params.recommendCount) || 9;
  var tmdbKey = params.TMDB_API_KEY || "";
  var prompt = "我想看" + params.prompt + "类型的影视作品";

  var aiText = await callAIChat(apiUrl, apiKey, model, prompt, count);
  var nameList = parseTitleList(aiText).slice(0, count);

  var resultList = [];
  for (var i = 0; i < nameList.length; i++) {
    var info = await getTmdbInfo(nameList[i], tmdbKey);
    if (info) {
      resultList.push(info);
    } else {
      resultList.push({
        id: "ai_" + Date.now() + i,
        title: nameList[i],
        desc: "AI智能推荐",
        pic: "",
        rating: 0
      });
    }
  }

  return {
    list: resultList,
    count: resultList.length
  };
}

async function loadSimilarList(params) {
  var apiUrl = params.aiApiUrl || "";
  var apiKey = params.aiApiKey || "";
  var model = params.aiModel || "";
  var count = parseInt(params.recommendCount) || 9;
  var tmdbKey = params.TMDB_API_KEY || "";
  var prompt = "推荐和《" + params.referenceTitle + "》风格题材相似的影视作品";

  var aiText = await callAIChat(apiUrl, apiKey, model, prompt, count);
  var nameList = parseTitleList(aiText).slice(0, count);

  var resultList = [];
  for (var i = 0; i < nameList.length; i++) {
    var info = await getTmdbInfo(nameList[i], tmdbKey);
    if (info) {
      resultList.push(info);
    } else {
      resultList.push({
        id: "sim_" + Date.now() + i,
        title: nameList[i],
        desc: "AI相似推荐",
        pic: "",
        rating: 0
      });
    }
  }

  return {
    list: resultList,
    count: resultList.length
  };
}

console.log("AI影视推荐 极简纯净版 加载成功 | 兼容自定义模型 gpt-5.4");