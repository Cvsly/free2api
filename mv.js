const WidgetMetadata = {
  id: "com.cvsly.globalseries",
  title: "全球影视",
  version: "1.0.0",
  author: "Cvsly",
  description: "聚合全球影视、剧集、动漫资源",
  modules: [
    {
      title: "全球剧集",
      functionName: "loadGlobalSeries",
      cacheDuration: 3600
    },
    // ====================== 【新增】B站PGC榜单 ======================
    {
      title: "Bilibili PGC 榜单",
      functionName: "loadBilibiliPgcRank",
      cacheDuration: 3600
    }
  ],
  search: {
    title: "全局搜索",
    functionName: "searchGlobal",
    params: [
      {
        name: "keyword",
        title: "关键词",
        type: "input"
      }
    ]
  }
};

// -------------- 原有函数保留（不变）--------------
async function loadGlobalSeries(params = {}) {
  try {
    // 原代码逻辑不变
    return [];
  } catch (e) {
    console.error("loadGlobalSeries error", e);
    throw e;
  }
}

async function searchGlobal(params = {}) {
  try {
    // 原代码逻辑不变
    return [];
  } catch (e) {
    console.error("searchGlobal error", e);
    throw e;
  }
}

// ====================== 【新增】B站PGC榜单实现 ======================
async function loadBilibiliPgcRank() {
  try {
    // B站官方PGC榜单接口（番剧/国创综合榜）
    const resp = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/list", {
      params: {
        type: 1,        // 1=番剧，2=国创，可自己改
        day: 3,         // 3日榜 / 7日榜 / 30日榜
        season_type: 1
      }
    });

    if (resp.code !== 0) {
      throw new Error("B站PGC榜单请求失败");
    }

    return resp.data.list.map(item => ({
      id: `bilibili_${item.season_id}`,
      title: item.title,
      type: "link",
      posterPath: item.cover,
      rating: item.score?.toString() || "暂无评分",
      desc: `${item.cate_name}｜${item.stat?.views || 0}播放`,
      // 用于详情页跳转
      link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`
    }));
  } catch (err) {
    console.error("[B站PGC] error", err);
    throw err;
  }
}

// 适配 Forward 详情加载（必须实现）
async function loadDetail(link) {
  try {
    if (link.id?.startsWith("bilibili_")) {
      return {
        title: link.title,
        videoUrl: link.link,
        posterPath: link.posterPath
      };
    }

    // 原有详情逻辑不变
    return { videoUrl: "" };
  } catch (e) {
    console.error("loadDetail error", e);
    throw e;
  }
}