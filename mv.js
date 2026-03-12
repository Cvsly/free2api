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

WidgetMetadata = {
    id: "bilibili_pgc_aggregate_v35",
    title: "国内聚合榜单",
    description: "同步 B 站 PGC 数据，支持全网资源自动匹配",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.5.0",
    requiredVersion: "0.0.3",
    modules: [
        { title: "🌸 番剧", functionName: "loadBangumi", type: "video", params: getRankParams() },
        { title: "🐉 国创", functionName: "loadGuochuang", type: "video", params: getRankParams() },
        { title: "🎬 电影", functionName: "loadMovie", type: "video", params: getRankParams() },
        { title: "📺 电视剧", functionName: "loadTV", type: "video", params: getRankParams() },
        { title: "🎥 纪录片", functionName: "loadDocumentary", type: "video", params: getRankParams() }
    ]
};

// ================= [3. 处理器] =================

async function loadBangumi(params) { return await fetchBilibiliRank(1, params.time_range); }
async function loadMovie(params) { return await fetchBilibiliRank(2, params.time_range); }
async function loadDocumentary(params) { return await fetchBilibiliRank(3, params.time_range); }
async function loadGuochuang(params) { return await fetchBilibiliRank(4, params.time_range); }
async function loadTV(params) { return await fetchBilibiliRank(5, params.time_range); }

// ================= [4. 聚合引擎逻辑 - 优化版] =================

async function fetchBilibiliRank(seasonType, day = 3) {
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
    
    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com/"
            }
        });

        if (!response || !response.data || response.data.code !== 0) throw new Error("B站接口异常");

        const list = response.data.result.list || [];
        
        return list.map((item, index) => {
            const score = item.rating ? item.rating : "暂无评分";
            const updateStatus = item.new_ep ? item.new_ep.index_show : "已完结";
            
            // 【修复：播出时间】多重探测
            let rawTime = item.pub_date || item.pub_time || item.release_date;
            let pubDateStr = "近期播出";
            if (rawTime) {
                if (!isNaN(rawTime) && String(rawTime).length <= 10) {
                    pubDateStr = formatDate(rawTime);
                } else {
                    pubDateStr = String(rawTime).substring(0, 10);
                }
            }

            const isMovie = (seasonType === 2 || seasonType === 3);

            return {
                id: `bili_${item.season_id}`,
                
                // ✅ 【聚合核心 1】type 必须为 "video"，让 App 识别为可播放内容
                type: "video", 
                
                // ✅ 【聚合核心 2】严格标准 mediaType
                mediaType: isMovie ? "movie" : "tv",
                
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                
                // ✅ 【聚合核心 3】releaseDate 必须是 YYYY-MM-DD 格式，辅助精确匹配
                releaseDate: pubDateStr,
                
                description: `📅 播出时间: ${pubDateStr}\n${updateStatus} | ▶ 播放: ${formatCount(item.stat.view)}\n简介: ${item.desc || "暂无"}`,
                
                coverUrl: item.cover,
                
                // ✅ 【聚合核心 4】link 改为 title，让 App 用标题+年份去全网搜索资源
                link: item.title, 
                
                // ✅ 【聚合核心 5】rating 必须是数字，便于聚合插件排序
                rating: parseFloat(score) || 0,

                // ✅ 【聚合核心 6】额外注入 originalTitle，部分聚合引擎会优先匹配原始标题
                originalTitle: item.origin_name || item.title,
                
                // ✅ 【聚合核心 7】year 字段，部分聚合插件需要年份辅助匹配
                year: pubDateStr.split("-")[0] || ""
            };
        });

    } catch (error) {
        return [{ id: "err", type: "text", title: "加载失败", description: error.message }];
    }
}

/**
 * 格式化时间戳 (修复秒级时间戳显示问题)
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
 * 格式化播放量
 */
function formatCount(count) {
    if (!count) return "0";
    if (count < 10000) return count.toString();
    return (count / 10000).toFixed(1) + "万";
}