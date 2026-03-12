// ==============================
// RSS 视频订阅源模块 - 严格规范版
// 修复点：规范元数据、标准化返回、增强错误处理
// ==============================
const WidgetMetadata = {
  id: "rss.video.subscription", // 唯一ID，避免重复
  title: "RSS视频订阅",
  author: "ForwardDev",
  version: "1.1.0", // 版本号递增
  requiredVersion: "1.0.0", // 兼容最低版本
  detailCacheDuration: 300, // 缓存5分钟

  // 核心模块配置：严格遵循参数规范
  modules: [
    {
      title: "加载RSS订阅源",
      functionName: "loadRssFeed", // 函数名与下方定义一致
      cacheDuration: 300,
      params: [
        {
          name: "rssUrl",
          title: "RSS订阅地址",
          type: "input",
          defaultValue: "https://example.com/feed",
          placeholder: "输入标准RSS/Atom订阅地址",
          required: true
        }
      ]
    }
  ],

  // 可选：搜索配置（如果需要搜索功能）
  search: {
    title: "搜索RSS源",
    functionName: "searchRssFeed",
    params: [
      {
        name: "keyword",
        title: "搜索关键词",
        type: "input",
        required: true
      }
    ]
  }
};

/**
 * 核心加载函数：与元数据functionName完全一致
 * @param {Object} params - 传入参数 { rssUrl }
 * @returns {Array} Forward标准视频列表数据
 */
async function loadRssFeed(params) {
  try {
    // 1. 严格参数校验
    const { rssUrl } = params;
    if (!rssUrl || !/^https?:\/\//.test(rssUrl)) {
      throw new Error("❌ 请输入有效的HTTP/HTTPS地址");
    }

    // 2. 增强请求配置：避免被拦截
    const response = await Widget.http.get(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, application/atom+xml, text/xml, */*",
        "Accept-Language": "zh-CN,zh;q=0.9"
      },
      timeout: 10000 // 10秒超时
    });

    // 3. 响应状态校验
    if (!response || response.statusCode !== 200) {
      throw new Error(`❌ 请求失败，状态码：${response?.statusCode || 0}`);
    }

    if (!response.data || response.data.trim() === "") {
      throw new Error("❌ 未获取到任何数据，请检查订阅地址");
    }

    const xmlData = response.data;
    const $ = Widget.html.load(xmlData);
    const videoItems = [];

    // 4. 通用RSS/Atom解析：兼容两种格式
    // 处理RSS 2.0格式
    $("item").each((index, element) => {
      videoItems.push(parseRssItem($(element), "rss"));
    });

    // 处理Atom格式
    $("entry").each((index, element) => {
      videoItems.push(parseRssItem($(element), "atom"));
    });

    // 5. 空数据处理
    if (videoItems.length === 0) {
      throw new Error("❌ 未解析到任何视频条目，请检查RSS内容");
    }

    return videoItems;

  } catch (error) {
    console.error("[RSS模块错误]", error.message);
    // 抛出明确错误，方便Forward App提示
  throw new Error(`📥 读取失败：${error.message}`);
  }
}

/**
 * 辅助函数：解析单个RSS/Atom条目
 * @param {CheerioElement} item - 单个条目元素
 * @param {String} format - 格式类型 rss/atom
 * @returns {Object} Forward标准视频对象
 */
function parseRssItem(item, format) {
  // 基础信息解析
  const title = item.find("title").text().trim() || "未知标题";
  let link = item.find("link").text().trim() || item.find("link").attr("href") || "";
  const pubDate = item.find("pubDate, updated").text().trim();
  const thumbnail = item.find("media\\:thumbnail").attr("url") || 
                    item.find("thumbnail").attr("url") || 
                    item.find("image").attr("href") || 
                    item.find("img").attr("src") || "";
  // 视频直链解析
  const enclosure = item.find("enclosure");
  let videoUrl = enclosure.attr("url") || "";
  
  // 如果没有直链，用详情页链接替代
  if (!videoUrl && link) {
    videoUrl = link;
  }

  // 标准Forward视频对象结构（必填项完整）
  return {
    id: `rss.item.${Date.now()}.${Math.floor(Math.random() * 1000)}`, // 唯一ID
    type: "url", // 固定值：url/douban/imdb/tmdb
    mediaType: "movie", // 固定值：movie/tv
    title: title,
    posterPath: thumbnail,
    videoUrl: videoUrl,
    description: pubDate ? `发布时间：${pubDate}` : undefined,
    rating: undefined, // 可选：评分
    backdropPath: undefined, // 可选：背景图
    playerType: "system" // 固定值：system/app
  };
}

/**
 * 搜索函数（可选）
 */
async function searchRssFeed(params) {
  const { keyword } = params;
  // 简单搜索：通过关键词过滤标题
  const allItems = await loadRssFeed({ rssUrl: params.rssUrl });
  return allItems.filter(item => 
    item.title.toLowerCase().includes(keyword.toLowerCase())
  );
}