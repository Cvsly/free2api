// ====================== 元数据配置 ======================
WidgetMetadata = {
  id: "douban",
  title: "豆瓣我看&豆瓣个性化推荐",
  modules: [
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
          description: "未填写情况下接口不可用",
        },
        {
          name: "status",
          title: "状态",
          type: "enumeration",
          enumOptions: [
            { title: "想看", value: "mark" },
            { title: "在看", value: "doing" },
            { title: "看过", value: "done" }
          ],
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        }
      ]
    }
  ],
  version: "1.0.0", // 降低版本号
  requiredVersion: "0.0.1", // 兼容最低版本
  description: "豆瓣影视数据（兼容旧版Forward）",
  author: "你的名字",
  site: ""
};

// ====================== 核心函数 ======================

/**
 * 加载豆瓣「想看/在看/看过」列表（兼容旧版回调风格）
 */
function loadInterestItems(params, callback) {
  var user_id = params.user_id || "";
  var status = params.status || "mark";
  var page = params.page || 1;
  var count = 20;
  var start = (page - 1) * count;
  var url = "https://m.douban.com/rexxar/api/v2/user/" + user_id + "/interests?status=" + status + "&start=" + start + "&count=" + count;

  Widget.http.get(url, {
    headers: {
      "User-Agent": "Forward Widget",
      "Referer": "https://m.douban.com/mine/movie"
    }
  }, function(response) {
    try {
      var data = JSON.parse(response.data);
      if (data && data.interests) {
        var items = [];
        for (var i = 0; i < data.interests.length; i++) {
          var item = data.interests[i];
          if (item.subject && item.subject.id) {
            items.push({
              id: item.subject.id,
              type: "douban",
              title: item.subject.title || "无标题"
            });
          }
        }
        callback(items);
      } else {
        callback([]);
      }
    } catch (e) {
      console.error("解析失败:", e);
      callback([]);
    }
  });
}

// ====================== 其他兼容性调整 ======================

/**
 * 如果没有 Widget.http，改用原生 HTTP 请求
 */
if (typeof Widget === 'undefined' || !Widget.http) {
  console.warn("检测到无 Widget.http，尝试使用 fetch");
  function httpGet(url, options, callback) {
    fetch(url, { headers: options.headers })
      .then(function(res) { return res.json(); })
      .then(function(data) { callback({ data: data }); })
      .catch(function(e) { callback({ error: e }); });
  }
  Widget = { http: { get: httpGet } };
}