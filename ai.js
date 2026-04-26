/**
 * AI 影视推荐模块
 * 纯净版｜修复 typeMismatch 解析错误｜兼容自定义模型
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// ==================== Metadata 定义 ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "纯净版｜兼容所有自定义中转/私有模型",
  author: "crush7s",
  site: "",
  version: "5.1.1",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI完整API地址",
      type: "input",
      required: true,
      defaultValue: "https://metapi.omgd.eu.org/v1/chat/completions",
      description: "请手动填写完整地址，例：xxx/v1/chat/completions"
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
        { title: "9部", value: "9" }
      ],
      defaultValue: "3"
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

// ==================== 纯净OpenAI请求 ====================
async function callOpenAI(apiUrl, apiKey, model, messages) {
  var headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + apiKey
  };

  // 极简请求体，无额外参数
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
  var sysMsg = "你是影视推荐助手，只返回" + count + "个影视名称，每行一个，无序号、无年份、无解释、无多余文字。";
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
  if (!text) return list;
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

// ==================== TMDB 获取（兼容+容错） ====================
async function getTmdbInfo(title, tmdbKey) {
  if (!title) return null;
  try {
    var responseData;
    if (tmdbKey && tmdbKey.trim() !== "") {
      // 使用用户提供的TMDB Key请求
      var url = "https://api.themoviedb.org/3/search/multi";
      var opt = {
        params: {
          query: title,
          language: "zh-CN",
          api_key: tmdbKey
        },
        headers: { "User-Agent": USER_AGENT }
      };
      var res = await Widget.http.get(url, opt);
      responseData = res.data;
    } else {
      // 使用Forward自带的TMDB接口（如果可用）
      responseData = await Widget.tmdb.get("/search/multi", {
        params: { query: title, language: "zh-CN" }
      });
    }

    if (responseData && responseData.results && responseData.results.length > 0) {
      var item = responseData.results[0];
      return {
        id: item.id || 0,
        title: item.title || item.name || title,
        desc: item.overview || "暂无简介",
        pic: item.poster_path ? "https://image.tmdb.org/t/p/w300" + item.poster_path : "",
        rating: item.vote_average || 0
      };
    }
    return null;
  } catch (e) {
    console.error("TMDB请求失败：", e.message);
    return null;
  }
}

// ==================== 模块标准返回（强制格式） ====================
async function loadAIList(params) {
  params = params || {};
  try {
    var apiUrl = params.aiApiUrl || "";
    var apiKey = params.aiApiKey || "";
    var model = params.aiModel || "";
    var count = parseInt(params.recommendCount) || 3;
    var tmdbKey = params.TMDB_API_KEY || "";
    var prompt = "我想看" + params.prompt + "类型的影视作品";

    if (!apiUrl || !apiKey || !model || !params.prompt) {
      throw new Error("请填写完整配置");
    }

    // 调用AI
    var aiText = await callAIChat(apiUrl, apiKey, model, prompt, count);
    var nameList = parseTitleList(aiText).slice(0, count);
    if (nameList.length === 0) throw new Error("未解析到推荐结果");

    // 生成结果列表（确保格式正确，无null）
    var resultList = [];
    for (var i = 0; i < nameList.length; i++) {
      var name = nameList[i];
      var info = await getTmdbInfo(name, tmdbKey);
      if (info) {
        resultList.push(info);
      } else {
        // TMDB请求失败时，返回强制格式的占位数据
        resultList.push({
          id: "ai_" + Date.now() + "_" + i,
          title: name,
          desc: "AI智能推荐｜暂无详情",
          pic: "",
          rating: 0
        });
      }
    }

    // 强制返回Forward要求的格式
    return {
      list: resultList,
      count: resultList.length
    };
  } catch (error) {
    console.error("loadAIList错误：" + error.message);
    throw error;
  }
}

async function loadSimilarList(params) {
  params = params || {};
  try {
    var apiUrl = params.aiApiUrl || "";
    var apiKey = params.aiApiKey || "";
    var model = params.aiModel || "";
    var count = parseInt(params.recommendCount) || 3;
    var tmdbKey = params.TMDB_API_KEY || "";
    var prompt = "推荐和《" + params.referenceTitle + "》风格题材相似的影视作品";

    if (!apiUrl || !apiKey || !model || !params.referenceTitle) {
      throw new Error("请填写完整配置");
    }

    var aiText = await callAIChat(apiUrl, apiKey, model, prompt, count);
    var nameList = parseTitleList(aiText).slice(0, count);
    if (nameList.length === 0) throw new Error("未解析到推荐结果");

    var resultList = [];
    for (var i = 0; i < nameList.length; i++) {
      var name = nameList[i];
      var info = await getTmdbInfo(name, tmdbKey);
      if (info) {
        resultList.push(info);
      } else {
        resultList.push({
          id: "sim_" + Date.now() + "_" + i,
          title: name,
          desc: "AI相似推荐｜暂无详情",
          pic: "",
          rating: 0
        });
      }
    }

    return {
      list: resultList,
      count: resultList.length
    };
  } catch (error) {
    console.error("loadSimilarList错误：" + error.message);
    throw error;
  }
}

console.log("AI影视推荐 纯净版 加载成功 | 已修复typeMismatch解析错误");
