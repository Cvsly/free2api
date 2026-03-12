/**
 * B站 PGC 榜单 (B站 PGC 规范版)
 * 修复：新增播出时间显示
 */

// ================= [1. 参数定义] =================

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
    id: "bilibili_pgc_full_v32",
    title: "B站 PGC 榜单",
    description: "同步 B 站官方影视排行",
    author: "crush7s",
    version: "3.2.0",
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

async function loadBangumi(params) { return await fetchBilibiliRank(1, params.time_range); }
async function loadMovie(params) { return await fetchBilibiliRank(2, params.time_range); }
async function loadDocumentary(params) { return await fetchBilibiliRank(3, params.time_range); }
async function loadGuochuang(params) { return await fetchBilibiliRank(4, params.time_range); }
async function loadTV(params) { return await fetchBilibiliRank(5, params.time_range); }

// ================= [4. 核心：数据抓取与时间处理] =================

async function fetchBilibiliRank(seasonType, day = 3) {
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
    
    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com/"
            }
        });

        if (!response || !response.data || response.data.code !== 0) {
            throw new Error("接口返回异常");
        }

        const list = response.data.result.list || [];
        
        return list.map((item, index) => {
            const score = item.rating ? item.rating : "暂无评分";
            const updateStatus = item.new_ep ? item.new_ep.index_show : "已完结";
            
            // 👉 时间处理：B站返回的是 Unix 时间戳 (单位：秒)
            const pubDateStr = item.pub_date ? formatDate(item.pub_date) : "未知时间";

            return {
                id: item.season_id.toString(),
                type: "url",
                mediaType: (seasonType === 2 || seasonType === 3) ? "movie" : "tv",
                title: item.title,
                // 1. subTitle 显示评分和排名
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                // 2. releaseDate 字段会被 App 识别并在封面或详情位置展示播出日期
                releaseDate: pubDateStr,
                // 3. description 加入播出时间显示，方便一眼看到
                description: `📅 播出时间: ${pubDateStr}\n${updateStatus} | ▶ 播放: ${formatCount(item.stat.view)}\n${item.desc || ""}`,
                coverUrl: item.cover,
                videoUrl: item.url,
                rating: parseFloat(score) || 0
            };
        });

    } catch (error) {
        return [{ id: "err", type: "text", title: "加载失败", description: error.message }];
    }
}

/**
 * 格式化时间戳
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 格式化播放量
 */
function formatCount(count) {
    if (!count) return "0";
    if (count < 10000) return count.toString();
    return (count / 10000).toFixed(1) + "万";
}
