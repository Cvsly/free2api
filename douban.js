// ====================== 元数据配置 ======================
WidgetMetadata = {
  id: "douban_all",
  title: "豆瓣影视全功能版",
  modules: [
    // 1. 豆瓣我看（想看/在看/看过）
    {
      title: "豆瓣我看",
      functionName: "loadInterestItems",
      cacheDuration: 3600,
      params: [
        { name: "user_id", title: "用户ID", type: "input", required: true },
        { 
          name: "status", 
          title: "状态", 
          type: "enumeration", 
          enumOptions: [
            { title: "想看", value: "mark" },
            { title: "在看", value: "doing" },
            { title: "看过", value: "done" },
            { title: "随机推荐", value: "random" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },

    // 2. 豆瓣片单（热门电影/剧集等）
    {
      title: "豆瓣片单",
      functionName: "loadDoubanList",
      params: [
        { 
          name: "list_type", 
          title: "片单类型", 
          type: "enumeration",
          enumOptions: [
            { title: "热门电影", value: "movie_hot_gaia" },
            { title: "热播剧集", value: "tv_hot" },
            { title: "豆瓣Top250", value: "movie_top250" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },

    // 3. 影人作品（演员/导演）
    {
      title: "影人作品",
      functionName: "loadCelebrityWorks",
      params: [
        { name: "name", title: "演员/导演名", type: "input" },
        { 
          name: "sort", 
          title: "排序", 
          type: "enumeration",
          enumOptions: [
            { title: "按热度", value: "vote" },
            { title: "按时间", value: "time" }
          ]
        }
      ]
    }
  ],
  version: "1.0.0",
  requiredVersion: "0.0.1", // 最低兼容版本
  description: "豆瓣影视全功能集合（兼容旧版Forward）",
  author: "你的名字",
  site: ""
};

// ====================== 核心函数 ======================

/**
 * 1. 加载「想看/在看/看过」列表
 */
function loadInterestItems(params, callback) {
  var user_id = params.user_id;
  if (!user_id) return callback([]);

  var status = params.status || "mark";
  var page = params.page || 1;
  var count = 20;
  var url = "https://m.douban.com/rexxar/api/v2/user/" + user_id + 
            "/interests?status=" + status + "&start=" + ((page-1)*count) + "&count=" + count;

  httpGet(url, function(response) {
    try {
      var data = JSON.parse(response.data);
      var items = (data.interests || []).map(function(item) {
        return {
          id: item.subject.id,
          type: "douban",
          title: item.subject.title || "无标题",
          rating: item.subject.rating ? item.subject.rating.value : 0
        };
      });
      if (params.status === "random") {
        items = shuffleArray(items).slice(0, 10); // 随机取10条
      }
      callback(items);
    } catch(e) {
      console.error("解析失败:", e);
      callback([]);
    }
  });
}

/**
 * 2. 加载豆瓣片单（如热门电影/Top250）
 */
function loadDoubanList(params, callback) {
  var list_type = params.list_type || "movie_hot_gaia";
  var page = params.page || 1;
  var url = "https://m.douban.com/rexxar/api/v2/subject_collection/" + 
            list_type + "/items?start=" + ((page-1)*20) + "&count=20";

  httpGet(url, function(response) {
    try {
      var data = JSON.parse(response.data);
      var items = (data.subject_collection_items || []).map(function(item) {
        return {
          id: item.id,
          type: "douban",
          title: item.title,
          cover: item.cover_url || ""
        };
      });
      callback(items);
    } catch(e) {
      console.error("解析失败:", e);
      callback([]);
    }
  });
}

/**
 * 3. 加载影人作品
 */
function loadCelebrityWorks(params, callback) {
  var name = params.name;
  if (!name) return callback([]);

  // 先搜索影人ID
  var searchUrl = "https://movie.douban.com/j/subject_suggest?q=" + encodeURIComponent(name);
  httpGet(searchUrl, function(response) {
    try {
      var data = JSON.parse(response.data);
      var celebrity = data.find(function(item) { return item.type === "celebrity"; });
      if (!celebrity) return callback([]);

      // 获取影人作品
      var worksUrl = "https://m.douban.com/rexxar/api/v2/celebrity/" + celebrity.id + "/works?sort=" + (params.sort || "vote");
      httpGet(worksUrl, function(response) {
        try {
          var worksData = JSON.parse(response.data);
          var items = (worksData.works || []).map(function(item) {
            return {
              id: item.work.id,
              type: "douban",
              title: item.work.title,
              year: item.work.year || ""
            };
          });
          callback(items);
        } catch(e) {
          console.error("解析作品失败:", e);
          callback([]);
        }
      });
    } catch(e) {
      console.error("搜索影人失败:", e);
      callback([]);
    }
  });
}

// ====================== 工具函数 ======================

/** 通用HTTP请求（兼容Widget.http和fetch） */
function httpGet(url, callback) {
  if (typeof Widget !== 'undefined' && Widget.http) {
    Widget.http.get(url, { headers: { "User-Agent": "Forward" } }, callback);
  } else {
    fetch(url, { headers: { "User-Agent": "Forward" } })
      .then(function(res) { return res.text(); })
      .then(function(text) { callback({ data: text }); })
      .catch(function(e) { callback({ error: e }); });
  }
}

/** 数组随机排序 */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}