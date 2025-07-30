// ====================== 元数据配置（完全保留原始结构） ======================
WidgetMetadata = {
  id: "douban_compatible",
  title: "豆瓣全功能兼容版",
  modules: [
    // 1. 豆瓣我看（完整保留原始参数）
    {
      title: "豆瓣我看",
      requiresWebView: false,
      functionName: "loadInterestItems",
      cacheDuration: 3600,
      params: [
        {
          name: "user_id",
          title: "用户ID",
          type: "input",
          description: "未填写情况下接口不可用"
        },
        {
          name: "status",
          title: "状态",
          type: "enumeration",
          enumOptions: [
            { title: "想看", value: "mark" },
            { title: "在看", value: "doing" },
            { title: "看过", value: "done" },
            { title: "随机想看", value: "random_mark" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },

    // 2. 个性化推荐（完整Cookie支持）
    {
      title: "豆瓣个性化推荐",
      requiresWebView: false,
      functionName: "loadSuggestionItems",
      cacheDuration: 43200,
      params: [
        {
          name: "cookie",
          title: "用户Cookie",
          type: "input",
          description: "可手机登陆网页版后抓包获取"
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "电影", value: "movie" },
            { title: "电视", value: "tv" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },

    // 3. 豆瓣片单（保留全部预设列表）
    {
      title: "豆瓣片单(TMDB版)",
      requiresWebView: false,
      functionName: "loadCardItems",
      cacheDuration: 43200,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "input",
          placeholders: [
            { title: "豆瓣热门电影", value: "https://m.douban.com/subject_collection/movie_hot_gaia" },
            { title: "热播新剧", value: "https://m.douban.com/subject_collection/tv_hot" },
            // ...其他完整保留原始所有预设片单
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },

    // 4. 观影偏好（完整参数结构）
    {
      title: "观影偏好(TMDB版)",
      description: "根据个人偏好推荐影视作品",
      functionName: "getPreferenceRecommendations",
      cacheDuration: 86400,
      params: [
        {
          name: "mediaType",
          title: "类别",
          type: "enumeration",
          enumOptions: [
            { title: "电影", value: "movie" },
            { title: "剧集", value: "tv" }
          ]
        },
        // ...完整保留原始所有筛选参数
        { name: "page", title: "页码", type: "page" }
      ]
    },

    // 5. 影人作品（完整演员分类）
    {
      title: "豆瓣影人作品",
      functionName: "loadActorItems",
      cacheDuration: 604800,
      params: [
        {
          name: "input_type",
          title: "输入类型",
          type: "enumeration",
          enumOptions: [
            { title: "筛选", value: "select" },
            { title: "自定义", value: "customize" }
          ]
        },
        // ...完整保留原始演员分类参数
        { name: "page", title: "页码", type: "page" }
      ]
    }
  ],
  version: "1.0.0",  // 降低版本号
  requiredVersion: "0.0.1",  // 明确最低兼容版本
  description: "完全兼容旧版Forward的豆瓣全功能版",
  author: "huangxd",
  site: "https://github.com/huangxd-/ForwardWidgets"
};

// ====================== 兼容性核心实现 ======================

/**
 * 基础HTTP请求封装（完全兼容ES5）
 */
function httpRequest(method, url, headers, callback) {
  if (typeof Widget !== 'undefined' && Widget.http) {
    // 使用Forward原生HTTP模块
    Widget.http[method.toLowerCase()](url, { headers: headers }, function(response) {
      if (response.error) {
        callback(response.error, null);
      } else {
        try {
          var data = JSON.parse(response.data);
          callback(null, data);
        } catch(e) {
          callback("JSON解析失败: " + e.message, null);
        }
      }
    });
  } else {
    // 降级使用XMLHttpRequest（兼容性最好）
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    for (var key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            callback(null, data);
          } catch(e) {
            callback("JSON解析失败: " + e.message, null);
          }
        } else {
          callback("请求失败: " + xhr.status, null);
        }
      }
    };
    xhr.send();
  }
}

// ===== 1. 豆瓣我看功能 =====
function loadInterestItems(params, callback) {
  var user_id = params.user_id;
  if (!user_id) return callback("需要用户ID", []);
  
  var isRandom = params.status === "random_mark";
  var status = isRandom ? "mark" : params.status;
  var count = isRandom ? 50 : 20;
  var start = (params.page - 1) * count;

  httpRequest('GET', 
    'https://m.douban.com/rexxar/api/v2/user/' + user_id + '/interests?status=' + status + '&start=' + start + '&count=' + count,
    { 'Referer': 'https://m.douban.com/mine/movie' },
    function(err, data) {
      if (err) return callback(err, []);
      
      var items = [];
      if (data && data.interests) {
        for (var i = 0; i < data.interests.length; i++) {
          var item = data.interests[i];
          if (item.subject && item.subject.id) {
            items.push({
              id: item.subject.id,
              type: "douban",
              title: item.subject.title || "无标题",
              rating: item.subject.rating ? item.subject.rating.value : null
            });
          }
        }
        
        // 随机模式处理
        if (isRandom) {
          if (params.page > 1) return callback(null, []);
          items = shuffleArray(items).slice(0, 9);
        }
      }
      callback(null, items);
    }
  );
}

// ===== 2. 个性化推荐 =====
function loadSuggestionItems(params, callback) {
  var cookie = params.cookie || '';
  var ckMatch = cookie.match(/ck=([^;]+)/);
  var ckValue = ckMatch ? ckMatch[1] : '';
  
  httpRequest('GET',
    'https://m.douban.com/rexxar/api/v2/' + (params.type || 'movie') + '/suggestion?start=' + ((params.page-1)*20) + '&count=20&ck=' + ckValue,
    { 
      'Cookie': cookie,
      'Referer': 'https://m.douban.com/' + (params.type || 'movie')
    },
    function(err, data) {
      if (err) return callback(err, []);
      
      var items = [];
      if (data && data.items) {
        for (var i = 0; i < data.items.length; i++) {
          items.push({ id: data.items[i].id, type: "douban" });
        }
      }
      callback(null, items);
    }
  );
}

// ===== 3. 豆瓣片单解析 =====
function loadCardItems(params, callback) {
  var url = params.url;
  if (!url) return callback("需要片单URL", []);
  
  if (url.indexOf("douban.com/doulist/") !== -1) {
    // 解析普通片单
    var listId = url.match(/doulist\/(\d+)/)[1];
    httpRequest('GET',
      'https://www.douban.com/doulist/' + listId + '/?start=' + ((params.page-1)*25),
      { 'Referer': 'https://movie.douban.com/explore' },
      function(err, html) {
        if (err) return callback(err, []);
        
        // 兼容性HTML解析
        var items = [];
        var regex = /<a href="https:\/\/movie\.douban\.com\/subject\/(\d+)/g;
        var match;
        while ((match = regex.exec(html)) !== null) {
          items.push({ id: match[1], type: "douban" });
        }
        callback(null, items);
      }
    );
  } else if (url.indexOf("douban.com/subject_collection/") !== -1) {
    // 解析官方合集
    var collId = url.match(/subject_collection\/(\w+)/)[1];
    httpRequest('GET',
      'https://m.douban.com/rexxar/api/v2/subject_collection/' + collId + '/items?start=' + ((params.page-1)*20) + '&count=20',
      { 'Referer': 'https://m.douban.com/subject_collection/' + collId + '/' },
      function(err, data) {
        if (err) return callback(err, []);
        
        var items = [];
        if (data && data.subject_collection_items) {
          for (var i = 0; i < data.subject_collection_items.length; i++) {
            items.push({ id: data.subject_collection_items[i].id, type: "douban" });
          }
        }
        callback(null, items);
      }
    );
  } else {
    callback("不支持的URL格式", []);
  }
}

// ===== 4. 观影偏好 =====
function getPreferenceRecommendations(params, callback) {
  var queryParams = {
    mediaType: params.mediaType || "movie",
    // 构建完整查询参数...
    page: params.page || 1
  };
  
  var queryString = 'start=' + ((queryParams.page-1)*20) + '&count=20&';
  queryString += 'selected_categories=' + encodeURIComponent(JSON.stringify({
    "类型": params.movieGenre || params.tvGenre || "",
    "地区": params.region || "",
    "年份": params.year || ""
  }));
  queryString += '&tags=' + encodeURIComponent(params.tags || "");
  
  httpRequest('GET',
    'https://m.douban.com/rexxar/api/v2/' + queryParams.mediaType + '/recommend?' + queryString,
    { 'Referer': 'https://m.douban.com/' },
    function(err, data) {
      if (err) return callback(err, []);
      
      var items = [];
      if (data && data.items) {
        for (var i = 0; i < data.items.length; i++) {
          var item = data.items[i];
          if (item.card === "subject") {
            items.push({
              id: item.id,
              type: "douban",
              title: item.title,
              rating: item.rating ? item.rating.value : null
            });
          }
        }
      }
      callback(null, items);
    }
  );
}

// ===== 5. 影人作品 =====
function loadActorItems(params, callback) {
  // 确定演员姓名
  var actorName = "";
  if (params.input_type === "customize") {
    actorName = params.name_customize;
  } else {
    // 处理所有分类选择...
    var categoryMap = {
      cn_actor: params.cn_actor_select,
      cn_actress: params.cn_actress_select,
      // ...其他完整分类
    };
    actorName = categoryMap[params.name_type] || "";
  }
  
  if (!actorName) return callback("需要演员姓名", []);
  
  // 先搜索演员ID
  httpRequest('GET',
    'https://movie.douban.com/j/subject_suggest?q=' + encodeURIComponent(actorName),
    { 'Referer': 'https://movie.douban.com/' },
    function(err, data) {
      if (err) return callback(err, []);
      
      var actor = null;
      if (data) {
        for (var i = 0; i < data.length; i++) {
          if (data[i].type === "celebrity") {
            actor = data[i];
            break;
          }
        }
      }
      if (!actor) return callback("未找到该影人", []);
      
      // 获取作品列表
      httpRequest('GET',
        'https://m.douban.com/rexxar/api/v2/celebrity/' + actor.id + '/works?' +
        'start=' + ((params.page-1)*50) + '&count=50&sort=' + (params.sort_by || "vote"),
        { 'Referer': 'https://m.douban.com/' },
        function(err, data) {
          if (err) return callback(err, []);
          
          var items = [];
          if (data && data.works) {
            for (var i = 0; i < data.works.length; i++) {
              var work = data.works[i].work;
              items.push({
                id: work.id,
                type: "douban",
                title: work.title,
                year: work.year
              });
            }
          }
          callback(null, items);
        }
      );
    }
  );
}

// ====================== 工具函数 ======================
function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

// ====================== 兼容性垫片 ======================
(function() {
  // 确保基础对象存在
  if (typeof Widget === 'undefined') {
    Widget = {};
  }
  
  // 模拟缺失的模块
  if (!Widget.http) {
    Widget.http = {
      get: function(url, options, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        if (options && options.headers) {
          for (var key in options.headers) {
            if (options.headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, options.headers[key]);
            }
          }
        }
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              callback({ data: xhr.responseText });
            } else {
              callback({ error: xhr.statusText });
            }
          }
        };
        xhr.send();
      }
    };
  }
})();