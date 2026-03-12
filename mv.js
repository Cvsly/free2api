/**
 * 国内全网影视榜单 (B站 PGC 规范版)
 * 严格对标 Bilibili 官方 PGC 榜单分类
 * 包含：番剧、国创、电影、电视剧、纪录片
 */

// ================= [1. 参数定义] =================

// 所有榜单共用简单的日期参数
function getRankParams() {
    return [
        {
            name: "time_range",
            title: "榜单范围",
            type: "enumeration",
            value: "3",
            enumOptions: [
                { title: "🔥 三日热播榜", value: "3" },
                { title: "📅 一周热门榜", value: "7" }
            ]
        }
    ];
}

// ================= [2. WidgetMetadata 配置] =================

WidgetMetadata = {
    id: "bilibili_pgc_rank_v3",
    title: "B站 PGC 榜单",
    description: "同步哔哩哔哩官方番剧、国创、影视热播排行",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.1.0",
    requiredVersion: "0.0.1",
    modules: [
        { title: "🌸 番剧", functionName: "loadBangumi", type: "video", params: getRankParams() },
        { title: "🐉 国创", functionName: "loadGuochuang", type: "video", params: getRankParams() },
        { title: "🎬 电影", functionName: "loadMovie", type: "video", params: getRankParams() },
        { title: "📺 电视剧", functionName: "loadTV", type: "video", params: getRankParams() },
        { title: "🎥 纪录片", functionName: "loadDocumentary", type: "video", params: getRankParams() }
    ]
};

// ================= [3. 业务处理器] =================

// B站 season_type 对应关系：1=番剧, 2=电影, 3=纪录片, 4=国创, 5=电视剧
async function loadBangumi(params) { return await fetchBilibiliRank(1, params.time_range); }
async function loadMovie(params) { return await fetchBilibiliRank(2, params.time_range); }
async function loadDocumentary(params) { return await fetchBilibiliRank(3, params.time_range); }
async function loadGuochuang(params) { return await fetchBilibiliRank(4, params.time_range); }
async function loadTV(params) { return await fetchBilibiliRank(5, params.time_range); }

// ================= [4. 核心：Bilibili 数据抓取引擎] =================

async function fetchBilibiliRank(seasonType, day = 3) {
    // Bilibili PGC 影视排行的官方通用接口
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
    
    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.bilibili.com/"
            }
        });

        // B站接口如果成功，code 为 0
        if (!response || !response.data || response.data.code !== 0) {
            throw new Error("接口返回异常");
        }

        const list = response.data.result.list || [];
        if (list.length === 0) return [];

        // 遵循 Forward 规范，组装 VideoItem
        return list.map((item, index) => {
            // 处理评分，有些新剧可能暂无评分
            const score = item.rating ? item.rating : "暂无评分";
            const updateStatus = item.new_ep ? item.new_ep.index_show : "已完结";
            
            // 匹配媒体类型标签
            let mediaTypeTag = "影视";
            if (seasonType === 1) mediaTypeTag = "🌸 番剧";
            if (seasonType === 2) mediaTypeTag = "🎬 电影";
            if (seasonType === 3) mediaTypeTag = "🎥 纪录片";
            if (seasonType === 4) mediaTypeTag = "🐉 国创";
            if (seasonType === 5) mediaTypeTag = "📺 电视剧";

            return {
                id: item.season_id.toString(),
                type: "url", // 设为 url 类型，允许以后如果有播放插件可以直接跳转
                mediaType: (seasonType === 2 || seasonType === 3) ? "movie" : "tv",
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                // 简介中加入 B站特有的播放量和弹幕数
                description: `${mediaTypeTag} | ${updateStatus}\n▶ 播放: ${formatCount(item.stat.view)} | 💬 弹幕: ${formatCount(item.stat.danmaku)}\n${item.desc || ""}`,
                coverUrl: item.cover,
                videoUrl: item.url,
                rating: parseFloat(score) || 0
            };
        });

    } catch (error) {
        console.error("Bilibili 抓取失败:", error);
        return [{ id: "err", type: "text", title: "加载失败", description: "接口访问受限或网络异常" }];
    }
}

// 辅助函数：格式化播放量数字 (如：123456 -> 12.3万)
function formatCount(count) {
    if (!count) return "0";
    if (count < 10000) return count.toString();
    return (count / 10000).toFixed(1) + "万";
}
