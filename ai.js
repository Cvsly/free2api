/**
 * AI 影视推荐模块（JSCore 修复增强版）
 * UI优化：标题/副标题结构规范化
 */

const USER_AGENT = "Mozilla/5.0";

// ==================== Metadata ====================
var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "基于自定义AI的智能影视推荐，兼容OpenAI/Gemini/NewApi等第三方接口",
  author: "crush7s",
  version: "5.2.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com"
    },
    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },
    { name: "aiApiKey", title: "API Key", type: "input", required: true },
    { name: "aiModel", title: "模型", type: "input", defaultValue: "gpt-4o-mini" },
    { name: "TMDB_API_KEY", title: "TMDB Key", type: "input" },
    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "6部", value: "6" },
        { title: "9部", value: "9" },
        { title: "12部", value: "12" }
      ],
      defaultValue: "9"
    }
  ]
};

// ==================== 类型映射 ====================
function getGenreNames(ids) {
  var map = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧",
    80: "犯罪", 99: "纪录", 18: "剧情", 10751: "家庭",
    14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻",
    53: "惊悚", 10752: "战争", 37: "西部"
  };

  if (!ids || !ids.length) return "未知类型";

  var arr = [];
  for (var i = 0; i < ids.length; i++) {
    if (map[ids[i]]) arr.push(map[ids[i]]);
    if (arr.length >= 2) break;
  }
  return arr.join(" / ");
}

// ==================== TMDB（核心优化）===================
async function searchTMDB(title, type, key) {
  try {
    var res;

    if (key) {
      res = await Widget.http.get(
        "https://api.themoviedb.org/3/search/" + type,
        {
          params: {
            api_key: key,
            query: title,
            language: "zh-CN"
          }
        }
      );
      if (res.data) res = res.data;
    } else {
      res = await Widget.tmdb.get("/search/" + type, {
        params: {
          query: title,
          language: "zh-CN"
        }
      });
    }

    if (!res || !res.results || res.results.length === 0) return null;

    // ⭐ 优化排序：评分 + 热度
    res.results = res.results
      .filter(i => i && (i.poster_path || i.overview))
      .sort((a, b) => {
        return ((b.vote_average || 0) + (b.popularity || 0) * 0.1)
             - ((a.vote_average || 0) + (a.popularity || 0) * 0.1);
      });

    var item = res.results[0];

    var rawDate = item.release_date || item.first_air_date || "";
    var year = rawDate && rawDate.length >= 4
      ? rawDate.substring(0, 4)
      : "未知年份";

    var genre = getGenreNames(item.genre_ids);
    var titleName = item.title || item.name || title;
    var overview = item.overview || "暂无简介";

    return {
      id: item.id,
      type: "tmdb",

      // ==================== UI结构优化 ====================

      // 主标题（干净）
      title: titleName,

      // 副标题（年份 + 类型）
      subtitle: "📅 " + year + "  ·  🎬 " + genre,

      // 正文（简介）
      description: overview,

      posterPath: item.poster_path,
      rating: item.vote_average || 0,

      mediaType: item.media_type || type,

      // 扩展字段
      year: year,
      genreText: genre,
      popularity: item.popularity || 0
    };

  } catch (e) {
    return null;
  }
}

// ==================== 名称解析 ====================
function parseNames(text) {
  if (!text) return [];

  return text
    .split("\n")
    .map(t => t.trim())
    .map(t => t.replace(/^\d+[\.\、\)）\s\-]+/, ""))
    .filter(t => t.length > 0)
    .slice(0, 15);
}

// ==================== AI入口（保持不变）===================
async function callAI(config) {
  var finalUrl = config.apiUrl.replace(/\/+$/, "");

  var messages = [
    {
      role: "system",
      content: "你是影视推荐助手，只返回影视名称，每行一个"
    },
    {
      role: "user",
      content:
        "推荐" +
        config.count +
        "部与“" +
        config.prompt +
        "”相关的影视作品"
    }
  ];

  return extractContent(
    await Widget.http.post(finalUrl, {
      model: config.model,
      messages: messages
    })
  );
}

// ==================== 主入口 ====================
async function loadAIList(params) {
  var text = await callAI({
    apiUrl: params.aiApiUrl,
    apiKey: params.aiApiKey,
    model: params.aiModel,
    format: params.aiApiFormat,
    prompt: params.prompt,
    count: parseInt(params.recommendCount) || 9
  });

  var names = parseNames(text);
  var results = [];

  for (var i = 0; i < names.length; i++) {
    var name = names[i];

    var result = await searchTMDB(name, "movie", params.TMDB_API_KEY);

    if (!result) {
      result = await searchTMDB(name, "tv", params.TMDB_API_KEY);
    }

    results.push(
      result || {
        id: "ai_" + i,
        type: "tmdb",
        title: name,
        subtitle: "",
        description: "AI 推荐作品"
      }
    );
  }

  return results;
}

// ==================== 相似推荐 ====================
async function loadSimilarList(params) {
  params.prompt = "类似《" + (params.referenceTitle || "") + "》的作品";
  return loadAIList(params);
}

console.log("✅ AI影视推荐模块 v5.2.3 UI优化完整版已加载");
