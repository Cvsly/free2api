const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
// ================= [1. 参数定义] =================
function getRankParams() {
    return [{
        name: "time_range",
        title: "榜单范围",
        type: "enumeration",
        value: "3",
        enumOptions: [
            { title: "🔥 三日热播榜", value: "3" },
            { title: "📅 一周热门榜", value: "7" }
        ]
    }];
}
// ================= [2. WidgetMetadata 配置] =================
var WidgetMetadata = {
    id: "bilibili_pgc_aggregate_v34",
    title: "国内聚合榜单",
    description: "同步 B 站 PGC 数据，支持全网资源自动匹配",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    site: "https://github.com/InchStudio/ForwardWidgets",
    version: "3.4.0",
    requiredVersion: "0.0.3",
    modules: [
        {
            title: "🌸 番剧",
            description: "B站PGC番剧榜单，支持三日/一周榜",
            requiresWebView: false,
            functionName: "loadBangumi",
            type: "video",
            cacheDuration: 3600,
            params: getRankParams()
        },
        {
            title: "🐉 国创",
            description: "B站PGC国创榜单，支持三日/一周榜",
            requiresWebView: false,
            functionName: "loadGuochuang",
            type: "video",
            cacheDuration: 3600,
            params: getRankParams()
        },
        {
            title: "🎬 电影",
            description: "B站PGC电影榜单，支持三日/一周榜",
            requiresWebView: false,
            functionName: "loadMovie",
            type: "video",
            cacheDuration: 3600,
            params: getRankParams()
        },
        {
            title: "📺 电视剧",
            description: "B站PGC电视剧榜单，支持三日/一周榜",
            requiresWebView: false,
            functionName: "loadTV",
            type: "video",
            cacheDuration: 3600,
            params: getRankParams()
        },
        {
            title: "🎥 纪录片",
            description: "B站PGC纪录片榜单，支持三日/一周榜",
            requiresWebView: false,
            functionName: "loadDocumentary",
            type: "video",
            cacheDuration: 3600,
            params: getRankParams()
        }
    ]
};
// ================= [3. 分类处理器] =================
async function loadBangumi(params) { return await fetchBilibiliRank(1, params.time_range); }
async function loadGuochuang(params) { return await fetchBilibiliRank(4, params.time_range); }
async function loadMovie(params) { return await fetchBilibiliRank(2, params.time_range); }
async function loadTV(params) { return await fetchBilibiliRank(5, params.time_range); }
async function loadDocumentary(params) { return await fetchBilibiliRank(3, params.time_range); }
// ================= [4. 核心请求与聚合逻辑] =================
async function fetchBilibiliRank(seasonType, day = 3) {
    // 提取的B站PGC官方数据源
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": "https://www.bilibili.com/"
            }
        });
        // 数据有效性校验
        if (!response || !response.data || response.data.code !== 0) throw new Error("B站PGC接口数据异常");
        const list = response.data.result.list || [];
        if (list.length === 0) throw new Error("当前榜单暂无数据");
        // 列表格式化（保留App自动聚合核心字段）
        return list.map((item, index) => {
            const score = item.rating || "暂无评分";
            const updateStatus = item.new_ep ? item.new_ep.index_show : "已完结";
            // 多级时间探测修复
            let rawTime = item.pub_date || item.pub_time || item.release_date;
            let pubDateStr = "近期播出";
            if (rawTime) {
                if (!isNaN(rawTime) && String(rawTime).length <= 10) {
                    pubDateStr = formatDate(rawTime);
                } else {
                    pubDateStr = String(rawTime).substring(0, 10);
                }
            }
            // 媒体类型判断
            const isMovie = (seasonType === 2 || seasonType === 3);
            return {
                id: `bili_${item.season_id}`,
                type: "link", // 聚合核心：让App自动跨插件搜索
                mediaType: isMovie ? "movie" : "tv", // 标准媒体类型
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                releaseDate: pubDateStr, // 辅助资源匹配
                description: `📅 播出时间: ${pubDateStr}\n${updateStatus} | ▶ 播放: ${formatCount(item.stat?.view)}\n简介: ${item.desc || "暂无简介"}`,
                coverUrl: item.cover,
                link: item.url, // 聚合核心：App跨插件搜索源地址
                rating: parseFloat(score) || 0,
                doubanId: "" // 预留字段，提升匹配成功率
            };
        });
    } catch (error) {
        console.error(`[国内聚合榜单] 获取失败: ${error.message}`);
        return [{ id: "err", type: "text", title: "加载失败", description: error.message }];
    }
}
// ================= [5. 工具函数] =================
/**
 * 格式化秒级时间戳为YYYY-MM-DD
 */
function formatDate(ts) {
    try {
        const date = new Date(Number(ts) * 1000);
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    } catch (e) {
        return "时间待定";
    }
}
/**
 * 格式化播放量为万级展示
 */
function formatCount(count) {
    if (!count) return "0";
    if (count < 10000) return count.toString();
    return (count / 10000).toFixed(1) + "万";
}