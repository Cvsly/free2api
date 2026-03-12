/**
 * 影视专区 - 深度聚合优化版
 * 目标：让 B 站榜单实现全网资源自动匹配
 */

WidgetMetadata = {
    id: "global_series_bili_final",
    title: "全球影视聚合",
    version: "3.1.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 86400,
    modules: [
        {
            title: "🌸 B站 PGC 榜单",
            functionName: "loadBiliRank",
            type: "video",
            params: [
                {
                    name: "seasonType", title: "分类", type: "enumeration", value: "1",
                    enumOptions: [
                        { title: "番剧", value: "1" }, { title: "国创", value: "4" },
                        { title: "电影", value: "2" }, { title: "电视剧", value: "5" }
                    ]
                }
            ]
        },
        // ... 原有的 TMDB 模块保持不变
    ]
};

// ================= [1. 列表层：发放“聚合通行证”] =================

async function loadBiliRank(params) {
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=3&season_type=${params.seasonType}`;
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    if (!res?.data?.result?.list) return [];

    return res.data.result.list.map(item => ({
        id: `bili_ss${item.season_id}`, 
        type: "link",        // 👉 必须是 link，点击后才会触发聚合搜索
        title: item.title,
        subTitle: item.rating ? `⭐ ${item.rating}` : "近期热播",
        coverUrl: item.cover,
        link: item.season_id.toString(), // 传递给 loadDetail 使用
        mediaType: (params.seasonType === "2" || params.seasonType === "5") ? "movie" : "tv"
    }));
}

// ================= [2. 详情层：注入“聚合元数据”] =================

async function loadDetail(id) {
    // 如果是 B 站的 ID
    if (!isNaN(id) || id.startsWith("bili_")) {
        const seasonId = id.replace("bili_ss", "");
        try {
            const apiUrl = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
            const res = await Widget.http.get(apiUrl, { headers: { "Referer": "https://www.bilibili.com/" } });
            const data = res?.data?.result;
            if (!data) return null;

            // 👉 聚合核心：提取精准日期。App 需要这个日期来区分同名电影
            let pubDate = data.publish?.pub_date || data.publish?.release_date_show || "";
            pubDate = pubDate.substring(0, 10);

            return {
                id: `bili_ss${seasonId}`,
                title: data.title,
                type: "link",
                description: data.evaluate || "暂无简介",
                coverUrl: data.cover,
                // 👉 这里的元数据是触发图一效果的关键
                releaseDate: pubDate, 
                mediaType: data.type === 2 ? "movie" : "tv",
                rating: data.rating?.score || 0,
                
                // 👉 选集留空或只放标题，App 就会自动在下方展示“全网搜索结果”
                episodeItems: [], 
                
                // 也可以手动关联一个外部地址
                link: `https://www.bilibili.com/bangumi/play/ss${seasonId}`
            };
        } catch (e) { return null; }
    }
    // ... 其他 TMDB 的 loadDetail 逻辑
}
