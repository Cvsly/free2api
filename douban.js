/**
 * @title 豆瓣我看&豆瓣个性化推荐
 * @version 1.0.15
 * @author huangxd
 * @description 解析豆瓣想看、在看、已看以及根据个人数据生成的个性化推荐【五折码：CHEAP.5;七折码：CHEAP】
 * @site https://github.com/huangxd-/ForwardWidgets
 * @minVersion 0.0.1
 */

// 豆瓣片单组件
const WidgetMetadata = {
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
            {
              title: "想看",
              value: "mark",
            },
            {
              title: "在看",
              value: "doing",
            },
            {
              title: "看过",
              value: "done",
            },
            {
              title: "随机想看(从想看列表中无序抽取9个影片)",
              value: "random_mark",
            },
          ],
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        },
      ],
    },
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
          description: "未填写情况下非个性化推荐；可手机登陆网页版后，通过loon，Qx等软件抓包获取Cookie",
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            {
              title: "电影",
              value: "movie",
            },
            {
              title: "电视",
              value: "tv",
            },
          ],
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        },
      ],
    },
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
          description: "豆瓣片单地址",
          placeholders: [
            {
              title: "豆瓣热门电影",
              value: "https://m.douban.com/subject_collection/movie_hot_gaia",
            },
            {
              title: "热播新剧",
              value: "https://m.douban.com/subject_collection/tv_hot",
            },
            // ... (保留所有原有的placeholders选项)
          ],
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        },
      ],
    },
    {
      title: "电影推荐(TMDB版)",
      requiresWebView: false,
      functionName: "loadRecommendMovies",
      cacheDuration: 86400,
      params: [
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          enumOptions: [
            {
              title: "全部",
              value: "all",
            },
            {
              title: "热门电影",
              value: "热门",
            },
            {
              title: "最新电影",
              value: "最新",
            },
            {
              title: "豆瓣高分",
              value: "豆瓣高分",
            },
            {
              title: "冷门佳片",
              value: "冷门佳片",
            },
          ],
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          belongTo: {
            paramName: "category",
            value: ["热门", "最新", "豆瓣高分", "冷门佳片"],
          },
          enumOptions: [
            {
              title: "全部",
              value: "全部",
            },
            {
              title: "华语",
              value: "华语",
            },
            {
              title: "欧美",
              value: "欧美",
            },
            {
              title: "韩国",
              value: "韩国",
            },
            {
              title: "日本",
              value: "日本",
            },
          ],
        },
        {
          name: "page",
          title: "页码",
          type: "page"
        },
      ],
    },
    {
      title: "剧集推荐(TMDB版)",
      requiresWebView: false,
      functionName: "loadRecommendShows",
      cacheDuration: 86400,
      params: [
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          enumOptions: [
            {
              title: "全部",
              value: "all",
            },
            {
              title: "热门剧集",
              value: "tv",
            },
            {
              title: "热门综艺",
              value: "show",
            },
          ],
        },
        // ... (保留所有原有的剧集推荐参数)
      ],
    },
    {
      title: "观影偏好(TMDB版)",
      description: "根据个人偏好推荐影视作品",
      requiresWebView: false,
      functionName: "getPreferenceRecommendations",
      cacheDuration: 86400,
      params: [
        {
          name: "mediaType",
          title: "类别",
          type: "enumeration",
          value: "movie",
          enumOptions: [
            { title: "电影", value: "movie" },
            { title: "剧集", value: "tv" },
          ]
        },
        // ... (保留所有原有的观影偏好参数)
      ],
    },
    {
      title: "豆瓣影人作品",
      requiresWebView: false,
      functionName: "loadActorItems",
      cacheDuration: 604800,
      params: [
        {
          name: "input_type",
          title: "输入类型",
          type: "enumeration",
          value: "select",
          enumOptions: [
            { title: "筛选", value: "select" },
            { title: "自定义", value: "customize" },
          ],
        },
        // ... (保留所有原有的影人作品参数)
      ],
    },
    {
      title: "豆瓣影人作品(平铺选择版)",
      requiresWebView: false,
      functionName: "loadActorItems",
      cacheDuration: 604800,
      params: [
        {
          name: "sort_by",
          title: "排序方式",
          type: "enumeration",
          value: "vote",
          enumOptions: [
            { title: "评价排序", value: "vote" },
            { title: "时间排序", value: "time" },
          ],
        },
        // ... (保留所有原有的平铺选择版参数)
      ],
    },
    {
      title: "豆瓣首页轮播图(用于首页和apple tv topshelf)",
      requiresWebView: false,
      functionName: "loadCarouselItems",
      description: "从豆瓣热播电影/电视剧/综艺/动漫分别随机获取3个未在影院上映的影片，并乱序后返回总共12个影片",
      cacheDuration: 3600,
    },
  ]
};

// 豆瓣我看
async function loadInterestItems(params = {}) {
  const page = params.page;
  const user_id = params.user_id || "";
  let status = params.status || "";
  const random = status === "random_mark";
  if (random) {
      status = "mark";
  }
  const count = random ? 50 : 20;
  const start = (page - 1) * count;

  if (random) {
    if (page > 1) {
      return [];
    }
    // 获取所有页数据并随机抽取10个item
    let allDoubanIds = [];
    let currentStart = start;

    while (true) {
      const doubanIds = await fetchDoubanPage(user_id, status, currentStart, count);
      allDoubanIds = [...allDoubanIds, ...doubanIds];

      if (doubanIds.length < count) {
        break;
      }

      currentStart += count;
    }

    // 随机抽取10个item
    const shuffled = allDoubanIds.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(9, shuffled.length));
  } else {
    // 获取单页数据
    return await fetchDoubanPage(user_id, status, start, count);
  }
}

// 豆瓣个性化推荐
async function loadSuggestionItems(params = {}) {
  const page = params.page;
  const cookie = params.cookie || "";
  const type = params.type || "";
  const count = 20;
  const start = (page - 1) * count;
  const ckMatch = cookie.match(/ck=([^;]+)/);
  const ckValue = ckMatch ? ckMatch[1] : null;
  let url = `https://m.douban.com/rexxar/api/v2/${type}/suggestion?start=${start}&count=${count}&new_struct=1&with_review=1&ck=${ckValue}`;
  
  const response = await Widget.http.get(url, {
    headers: {
      Referer: `https://m.douban.com/movie`,
      Cookie: cookie,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (response.data?.items) {
    return response.data.items
      .filter(item => item.id != null)
      .map(item => ({
        id: item.id,
        type: "douban",
      }));
  }
  return [];
}

// ... (保留所有其他原有函数实现，包括fetchTmdbData, cleanTitle, fetchImdbItems等)

// 豆瓣首页轮播图
async function loadCarouselItems(params = {}) {
  const response = await Widget.http.get(
    `https://gist.githubusercontent.com/huangxd-/5ae61c105b417218b9e5bad7073d2f36/raw/douban_carousel.json`, 
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    }
  );

  return response.data;
}

// 导出模块
module.exports = {
  WidgetMetadata,
  loadInterestItems,
  loadSuggestionItems,
  loadCardItems,
  loadRecommendMovies,
  loadRecommendShows,
  getPreferenceRecommendations,
  loadActorItems,
  loadCarouselItems
};