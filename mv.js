/**
 * 全球万能影视专区 (B站 PGC 聚合版)
 * 核心逻辑：利用 Bilibili PGC 榜单接口，提供番剧、国创、影剧深度聚合
 * 聚合方式：元数据钩子匹配 (type: link + loadDetail)
 */

WidgetMetadata = {
    id: "bilibili_pgc_aggregate_makka",
    title: "国内聚合榜单",
    description: "同步 B 站 PGC 数据，支持全网资源自动匹配",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.8.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 86400,
    modules: [
        // ================= 模块 1：PGC 官方榜单 =================
        {
            title: "📺 PGC 官方榜单",
            functionName: "loadBiliRank",
            type: "video",
            cacheDuration: 3600,
            params: [
                {
                    name: "seasonType",
                    title: "选择频道",
                    type: "enumeration",
                    value: "1",
                    enumOptions: [
                        { title: "🌸 番剧 (Bangumi)", value: "1" },
                        { title: "🐉 国创 (Guochuang)", value: "4" },
                        { title: "🎬 电影 (Movie)", value: "2" },
                        { title: "📺 电视剧 (TV Series)", value: "5" },
                        { title: "🎥 纪录片 (Documentary)", value: "3" }
                    ]
                },
                {
                    name: "day",
                    title: "时间范围",
                    type: "enumeration",
                    value: "3",
                    enumOptions: [
                        { title: "🔥 三日热播榜", value: "3" },
                        { title: "📅 一周热门榜", value: "7" }
                    ]
                }
            ]
        },
        // ================= 模块 2：深度专题发现 (示例) =================
        {
            title: "🏷️ 影视分类检索",
            functionName: "loadBiliRank", // 复用同一引擎
            type: "video",
            params: [
                {
                    name: "seasonType",
                    title: "类型",
                    type: "enumeration",
                    value: "2",
                    enumOptions: [
                        { title: "🎬 热门电影", value: "2" },
                        { title: "📺 热门电视剧", value: "5" }
                    ]
                }
            ]
        }
    ]
};

// ================= [1. 列表加载核心] =================

async function loadBiliRank(params) {
    const seasonType = params.seasonType || "1";
    const day = params.day || "3";
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;

    try {
        const response = await Widget.http.get(url, {
            headers: { "Referer": "https://www.bilibili.com/" }
        });

        if (!response?.data?.result?.list) return [];
        const list = response.data.result.list;

        return list.map((item, index) => {
            const isMovie = (seasonType === "2" || seasonType === "3");
            const score = item.rating || "暂无评分";

            return {
                id: `bili_ss${item.season_id}`,
                // 👉 触发聚合：type 为 link，App 会调用 loadDetail
                type: "link", 
                mediaType: isMovie ? "movie" : "tv",
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                coverUrl: item.cover,
                // link 作为 loadDetail 的输入参数，传递 season_id
                link: item.season_id.toString(),
                rating: parseFloat(score) || 0,
                description: `⭐ 评分: ${score}\n${item.new_ep?.index_show || ""}\n${item.desc || ""}`
            };
        });
    } catch (e) {
        return [{ id: "err", type: "text", title: "加载失败", description: e.message }];
    }
}

// ================= [2. 详情解析核心 (解决时间不详 & 资源聚合)] =================

async function loadDetail(seasonId) {
    try {
        // 请求 B 站深度详情接口获取精准元数据
        const apiUrl = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
        const res = await Widget.http.get(apiUrl, { headers: { "Referer": "https://www.bilibili.com/" } });
        
        if (!res?.data?.result) return null;
        const data = res.data.result;

        // 👉 修复播出时间：从详情接口获取 publish 数据
        let formattedDate = "";
        if (data.publish?.pub_date) {
            formattedDate = data.publish.pub_date.substring(0, 10); // 提取 YYYY-MM-DD
        } else if (data.publish?.release_date_show) {
            const match = data.publish.release_date_show.match(/\d{4}-\d{2}-\d{2}/);
            formattedDate = match ? match[0] : "";
        }

        // 构造标准元数据对象，不返回 episodeItems 以强制触发 App 自动聚合搜索
        return {
            id: `bili_ss${seasonId}`,
            title: data.title,
            type: "link",
            link: `https://www.bilibili.com/bangumi/play/ss${seasonId}`,
            description: data.evaluate || data.shell_desc || "暂无简介",
            coverUrl: data.cover,
            // 👉 极其重要：标准的 releaseDate 会让聚合搜索极其精准
            releaseDate: formattedDate, 
            rating: data.rating?.score || 0,
            mediaType: data.type === 2 ? "movie" : "tv",
            genreTitle: data.styles?.join(", ") || "影视",
            // 选集列表 (可选，如果你想保留 B 站原片跳转则加上，想纯聚合则移除)
            // episodeItems: [] 
        };
    } catch (e) {
        console.error("Detail Error:", e);
        return null;
    }
}

// ================= [3. 辅助工具] =================

function formatCount(count) {
    if (!count) return "0";
    return count < 10000 ? count : (count / 10000).toFixed(1) + "万";
}
