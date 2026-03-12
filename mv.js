/**
 * 国内全网影视榜单 - 资源聚合优化版
 * 1. 修复时间显示：兼容多字段检测
 * 2. 开启全网聚合：type 设为 link，触发 App 自动资源匹配
 */

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
    id: "bilibili_aggregate_pro",
    title: "国内影视榜单",
    description: "支持播出时间显示与全网资源自动聚合",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.3.0",
    requiredVersion: "0.0.1",
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

// ================= [4. 核心逻辑：时间修复与聚合开启] =================

async function fetchBilibiliRank(seasonType, day = 3) {
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
    
    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com/"
            }
        });

        if (!response || !response.data || response.data.code !== 0) throw new Error("接口返回异常");

        const list = response.data.result.list || [];
        
        return list.map((item, index) => {
            const score = item.rating ? item.rating : "暂无评分";
            const updateStatus = item.new_ep ? item.new_ep.index_show : "已完结";
            
            // 👉 【修复：播出时间】多字段兜底检测
            // 尝试从 pub_date, pub_time 或 release_date 中获取
            const rawTime = item.pub_date || item.pub_time || item.release_date;
            const pubDateStr = rawTime ? formatDate(rawTime) : "近期播出";

            return {
                id: item.season_id.toString(),
                // 👉 【关键：资源聚合】
                // 将 type 设为 "link"，App 会在点击时触发资源搜索逻辑
                type: "link", 
                mediaType: (seasonType === 2 || seasonType === 3) ? "movie" : "tv",
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                
                // 播出时间字段，供 App UI 使用
                releaseDate: pubDateStr,
                
                // 简介中显性展示时间
                description: `📅 播出时间: ${pubDateStr}\n${updateStatus} | ▶ 播放: ${formatCount(item.stat.view)}\n${item.desc || ""}`,
                
                coverUrl: item.cover,
                // link 字段是聚合的关键，这里指向 B 站原始链接
                link: item.url, 
                rating: parseFloat(score) || 0
            };
        });

    } catch (error) {
        return [{ id: "err", type: "text", title: "加载失败", description: error.message }];
    }
}

// 辅助函数：时间格式化
function formatDate(ts) {
    if (!ts) return "";
    // 如果是 10 位秒级时间戳则 *1000，如果是字符串则尝试直接转换
    const date = new Date(typeof ts === 'number' ? ts * 1000 : ts);
    if (isNaN(date.getTime())) return "时间待定";
    
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 辅助函数：数量格式化
function formatCount(count) {
    if (!count) return "0";
    if (count < 10000) return count.toString();
    return (count / 10000).toFixed(1) + "万";
}
