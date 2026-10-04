WidgetMetadata = {
  id: "forward.maihaolian",
  title: "枫叶4K影院",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "枫叶4K影院 (maihaolian.com) 平台分类及搜索模块",
  author: "Forward",
  site: "https://maihaolian.com",
  detailCacheDuration: 3600,
  globalParams: [
    {
      name: "baseUrl",
      title: "站点地址",
      type: "input",
      value: "https://maihaolian.com",
    },
  ],
  modules: [
    {
      id: "loadList",
      title: "平台分类浏览",
      functionName: "loadList",
      cacheDuration: 1800,
      params: [
        {
          name: "platform",
          title: "平台分类",
          type: "enumeration",
          value: "tx",
          enumOptions: [
            { title: "腾讯SVIP", value: "tx" },
            { title: "优酷SVIP", value: "yk" },
            { title: "B站SVIP", value: "bilibili" },
            { title: "红果短剧", value: "hongguo" },
          ],
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
  ],
  // 顶级 search 声明，严禁放入 modules 数组内部
  search: {
    title: "影视搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

/**
 * 1. 列表加载函数
 */
async function loadList(params = {}) {
  try {
    const page = Number(params.page || 1);
    const platform = params.platform || "tx";
    const siteUrl = (params.baseUrl || "https://maihaolian.com").replace(/\/$/, "");

    // 拼装站点分类路径
    const targetUrl = `${siteUrl}/vodshow/${platform}--------${page}---.html`;
    const res = await Widget.http.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });

    if (!res || !res.data) throw new Error("获取列表页面空响应");

    const $ = Widget.html.load(res.data);
    const items = [];

    $(".module-item, .pack-box").each((_, element) => {
      const el = $(element);
      const aTag = el.find("a").first();
      const imgTag = el.find("img").first();

      const href = aTag.attr("href") || "";
      const title = aTag.attr("title") || el.find(".module-item-title").text().trim();
      const poster = imgTag.attr("data-original") || imgTag.attr("data-src") || imgTag.attr("src") || "";
      const note = el.find(".module-item-note, .pack-prb").text().trim();

      if (href && title) {
        const fullLink = href.startsWith("http") ? href : `${siteUrl}${href}`;
        items.push({
          id: href.replace(/[^0-9]/g, "") || href,
          type: "url", // 必须设为 url 类型，才能通过 link 触发 loadDetail
          title: title,
          posterPath: poster.startsWith("//") ? `https:${poster}` : poster,
          description: note,
          link: fullLink,
        });
      }
    });

    return items;
  } catch (error) {
    console.error("[loadList] 加载失败:", error.message || error);
    throw error;
  }
}

/**
 * 2. 详情加载函数
 * 严禁修改形参，直接接收 link 字符串，非 params 对象
 */
async function loadDetail(link) {
  if (!link || typeof link !== "string") return null;

  try {
    const res = await Widget.http.get(link, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });

    if (!res || !res.data) return null;

    const $ = Widget.html.load(res.data);

    const title = $(".module-info-heading h1").text().trim();
    const description = $(".module-info-introduction-content").text().trim();
    const cover = $(".module-info-poster img").attr("data-original") \vert{}\vert{} $(".module-info-poster img").attr("src");

    // 严格按规范提取剧照/截图，字段名必须为 backdropPaths
    const backdropPaths = [];
    $(".stills-list img, .module-item-cover img").each((_, img) => {
      const src = $(img).attr("data-original") \vert{}\vert{} $(img).attr("src");
      if (src) {
        backdropPaths.push(src.startsWith("//") ? `https:${src}` : src);
      }
    });

    // 严格按规范提取推荐列表，字段名必须为 relatedItems
    const relatedItems = [];
    $(".module-item").each((_, el) => {
      const itemEl = $(el);
      const a = itemEl.find("a").first();
      const href = a.attr("href") || "";
      const relTitle = a.attr("title") || itemEl.find(".module-item-title").text().trim();
      const relPoster = itemEl.find("img").attr("data-original") || itemEl.find("img").attr("src");

      if (href && relTitle) {
        relatedItems.push({
          id: href.replace(/[^0-9]/g, "") || href,
          type: "url",
          title: relTitle,
          posterPath: relPoster,
          link: href.startsWith("http") ? href : `https://maihaolian.com${href}`,
        });
      }
    });

    const videoUrl = $(".player-box iframe").attr("src") || "";

    return {
      id: link,
      type: "url",
      title: title || "未知标题",
      posterPath: cover,
      description: description,
      backdropPaths: backdropPaths, // 正确：backdropPaths
      relatedItems: relatedItems,   // 正确：relatedItems
      videoUrl: videoUrl,
      link: link,
    };
  } catch (error) {
    console.error("[loadDetail] 详情解析失败:", error.message || error);
    return null;
  }
}

/**
 * 3. 搜索函数
 */
async function search(params = {}) {
  try {
    const page = Number(params.page || 1);
    const keyword = encodeURIComponent(params.keyword || "");
    const siteUrl = (params.baseUrl || "https://maihaolian.com").replace(/\/$/, "");

    const searchUrl = `${siteUrl}/vodsearch/${keyword}----------${page}---.html`;
    const res = await Widget.http.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });

    if (!res || !res.data) return [];

    const $ = Widget.html.load(res.data);
    const results = [];

    $(".module-search-item, .module-item").each((_, element) => {
      const el = $(element);
      const aTag = el.find("a").first();
      const href = aTag.attr("href") || "";
      const title = el.find(".module-poster-item-title, .module-item-title").text().trim() || aTag.attr("title");
      const poster = el.find("img").attr("data-original") || el.find("img").attr("src");

      if (href && title) {
        results.push({
          id: href.replace(/[^0-9]/g, "") || href,
          type: "url",
          title: title,
          posterPath: poster,
          link: href.startsWith("http") ? href : `${siteUrl}${href}`,
        });
      }
    });

    return results;
  } catch (error) {
    console.error("[search] 搜索失败:", error.message || error);
    throw error;
  }
}
