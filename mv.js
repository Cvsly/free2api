/**
 * 国内全网影视聚合榜单 (B站原生接口版)
 * 彻底移除 TMDB 依赖，采用 Bilibili PGC 官方接口
 * 特点：零配置、免翻墙、加载极快、数据最符合国内口味
 */

// ================= [1. 参数定义] =================

// B站接口不支持复杂的分页和历史排序，它直接返回当前的 Top 100 榜单
// 所以我们将二级菜单精简到极致

function getAnimeParams() {
    return [
        {
            name: "season_type",
            title: "动漫类型",
            type: "enumeration",
            value: "1",
            enumOptions: [
                { title: "🇯🇵 日本番剧", value: "1" },
                { title: "🇨🇳 国创动画", value: "4" }
            ]
        }
    ];
}

function getSimpleParams() {
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
    id: "domestic_media_bilibili",
    title: "国内热门影视",
    description: "基于 B站官方 PGC 接口的纯正国内榜单",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.0.0",
    requiredVersion: "0.0.1",
    // 移除了 TMDB_API_KEY，彻底零配置
    modules: [
        { title: "🎬 热门电影", functionName: "loadMovies", type: "video", params: getSimpleParams() },
        { title: "📺 热门剧集", functionName: "loadTV", type: "video", params: getSimpleParams() },
        { title: "🎨 热门动漫", functionName: "loadAnime", type: "video", params: getAnimeParams() },
        { title: "💃 热门综艺", functionName: "loadVariety", type: "video", params: getSimpleParams() }
    ]
};

// ================= [3. 业务处理器] =================

// B站 season_type 对应关系：1=番剧, 2=电影, 3=纪录片, 4=国创, 5=电视剧, 7=综艺
async function loadMovies(params) { return await fetchBilibiliRank(2, params.time_range); }
async function loadTV(params) { return await fetchBilibiliRank(5, params.time_range); }
async function loadVariety(params) { return await fetchBilibiliRank(7, params.time_range); }
async function loadAnime(params) { return await fetchBilibiliRank(params.season_type || 1, 3); }

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
            throw new Error("B站接口返回异常");
        }

        const list = response.data.result.list || [];
        if (list.length === 0) return [];

        // 遵循 Forward 规范，组装 VideoItem
        return list.map((item, index) => {
            // 处理评分，有些新剧可能暂无评分
            const score = item.rating ? item.rating : "暂无评分";
            const updateStatus = item.new_ep ? item.new_ep.index_show : "已完结";
            
            // 匹配媒体类型标签
            let mediaTypeTag = "🎬 电影";
            if (seasonType === 1 || seasonType === 4) mediaTypeTag = "🎨 动漫";
            if (seasonType === 5) mediaTypeTag = "📺 剧集";
            if (seasonType === 7) mediaTypeTag = "💃 综艺";

            return {
                id: item.season_id.toString(),
                type: "url", // 设为 url 类型，方便后续可能的直接解析播放
                mediaType: seasonType === 2 ? "movie" : "tv",
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                description: `${mediaTypeTag} | ${updateStatus}\n播放量: ${formatCount(item.stat.view)}\n弹幕数: ${formatCount(item.stat.danmaku)}`,
                coverUrl: item.cover, // B站的海报
                videoUrl: item.url,   // 直接指向 B站播放页
                rating: parseFloat(score) || 0
            };
        });

    } catch (error) {
        console.error("Bilibili 抓取失败:", error);
        return [{ id: "err", type: "text", title: "加载失败", description: "接口访问受限，请稍后重试" }];
    }
}

// 辅助函数：格式化播放量数字 (如：123456 -> 12.3万)
function formatCount(count) {
    if (!count) return "0";
    if (count < 10000) return count.toString();
    return (count / 10000).toFixed(1) + "万";
}
