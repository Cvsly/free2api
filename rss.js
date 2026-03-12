// ==============================
// RSS 视频订阅源 通用自由订阅模块
// 支持：任意标准视频 RSS / Atom 订阅
// ==============================
const WidgetMetadata = {
  id: "rss.video.feed.free",
  title: "RSS 视频自由订阅",
  author: "ForwardDev",
  version: "1.0.0",
  requiredVersion: "1.0.0",
  detailCacheDuration: 180,

  // 模块入口：支持用户自由输入 RSS 地址
  modules: [
    {
      title: "RSS 视频订阅",
      functionName: "loadRssVideoFeed",
      cacheDuration: 300,
      params: [
        {
          name: "rssUrl",
          title: "RSS 订阅地址",
          type: "input",
          defaultValue: "",
          placeholder: "输入视频 RSS/Atom 地址",
          required: true
        }
      ]
    }
  ]
};

/**
 * 加载并解析通用 RSS 视频订阅源
 * @param {Object} params - { rssUrl }
 * @returns {Array} Forward 标准视频列表
 */
async function loadRssVideoFeed(params) {
  try {
    const { rssUrl } = params;

    // 1. 参数校验
    if (!rssUrl || !rssUrl.startsWith("http")) {
      throw new Error("请输入有效的 RSS 地址");
    }

    // 2. 请求 RSS
    const resp = await Widget.http.get(rssUrl, {
      headers: {
        "User-Agent": "Forward/RSS"
      }
    });

    if (!resp || !resp.data) {
      throw new Error("RSS 源请求失败");
    }

    const xml = resp.data;
    const $ = Widget.html.load(xml);
    const items = [];

    // 3. 通用 RSS <item> 解析（兼容绝大多数 RSS/Atom）
    $("item, entry").each((i, el) => {
      const $item = $(el);

      // 标题
      const title = $item.find("title").text().trim() || "无标题";
      // 链接
      const link =
        $item.find("link").text().trim() ||
        $item.find("link").attr("href") ||
        "";
      // 发布时间
      const date = $item.find("pubDate, updated").text().trim();
      // 视频封面（通用 RSS 媒体缩略图）
      const thumb =
        $item.find("media\\:thumbnail, thumbnail").attr("url") ||
        $item.find("image, img").attr("src") ||
        "";
      // 视频直链（ enclosure 是 RSS 标准视频/文件标签）
      const videoUrl =
        $item.find("enclosure").attr("url") ||
        $item.find("media\\:content, content").attr("url") ||
        link;

      if (!link) return;

      items.push({
        id: `rss.${i}.${link.slice(-20)}`,
        type: "url",
        mediaType: "movie", // 统一按视频处理
        title: title,
        posterPath: thumb,
        videoUrl: videoUrl,
        description: date ? `发布于：${date}` : undefined,
        playerType: "system"
      });
    });

    return items;

  } catch (err) {
    console.error("[RSS解析错误]", err);
    throw new Error(`RSS 加载失败：${err.message}`);
  }
}