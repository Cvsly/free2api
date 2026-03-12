const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
var WidgetMetadata = {
  id: "bilibili_pgc_rank",
  title: "B站PGC榜单",
  description: "B站番剧/国创/纪录片/综艺/电影/电视剧PGC排行榜，支持3日/周/月榜切换",
  author: "",
  site: "https://github.com/InchStudio/ForwardWidgets",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "PGC全品类榜单",
      description: "获取B站全品类PGC内容排行榜，支持多周期切换",
      requiresWebView: false,
      functionName: "getBilibiliPGCRank",
      cacheDuration: 3600,
      params: [
        {
          name: "pgcType",
          title: "PGC品类",
          type: "enumeration",
          description: "选择B站PGC内容品类",
          enumOptions: [
            { title: "番剧", value: "1" },
            { title: "国创", value: "2" },
            { title: "纪录片", value: "3" },
            { title: "综艺", value: "4" },
            { title: "电影", value: "5" },
            { title: "电视剧", value: "6" }
          ]
        },
        {
          name: "rankCycle",
          title: "榜单周期",
          type: "enumeration",
          description: "选择榜单统计周期",
          enumOptions: [
            { title: "3日榜", value: "3" },
            { title: "周榜", value: "7" },
            { title: "月榜", value: "30" }
          ]
        }
      ]
    }
  ]
};

// 核心：获取B站PGC榜单主函数
async function getBilibiliPGCRank(params = {}) {
  try {
    // 取参数默认值，防止空值报错
    const pgcType = params.pgcType || "1";
    const rankCycle = params.rankCycle || "3";
    // B站PGC公开排行榜API，与参考文件请求格式一致
    const response = await Widget.http.get(`https://api.bilibili.com/pgc/season/rank/list?type=${pgcType}&day=${rankCycle}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Referer": "https://www.bilibili.com/"
      }
    });
    // 数据有效性校验，对齐参考文件的抛错逻辑
    if (!response || !response.data) throw new Error("获取PGC榜单数据失败");
    const data = response.data;
    if (data.code !== 0 || !data.data?.list || data.data.list.length === 0) throw new Error("当前榜单无数据");
    // 格式化数据，返回Forward标准结构
    return data.data.list.map(item => formatPgcResult(item, pgcType));
  } catch (error) {
    console.error(`[B站PGC榜单] 获取失败: ${error.message}`);
    throw new Error(`获取B站PGC榜单失败: ${error.message}`);
  }
}

// 辅助函数：格式化PGC结果（对齐参考文件formatTmdbResult风格）
const formatPgcResult = (item, pgcType) => {
  // 根据PGC品类匹配mediaType，统一Forward识别格式
  const mediaTypeMap = {
    "1": "tv", "2": "tv", "3": "tv", "4": "tv", "5": "movie", "6": "tv"
  };
  return {
    id: item.season_id || item.id,
    type: "link",
    title: item.title || "未知标题",
    description: item.evaluate || "暂无简介",
    posterPath: item.cover || "",
    backdropPath: item.cover || "",
    releaseDate: item.publish_time || item.update_time || "",
    rating: item.score || 0,
    mediaType: mediaTypeMap[pgcType] || "tv",
    subTitle: `${item.index_show || "全剧集"} | ${item.areas || "未知地区"}`
  };
};