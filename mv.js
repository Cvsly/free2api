// --- Bilibili PGC Charts Widget ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";

var WidgetMetadata = {
    id: "forward.bilibili.pgc.charts",
    title: "B站PGC榜单",
    description: "聚合获取Bilibili番剧、国创、影视、纪录片等官方排行榜单数据",
    author: "ForwardUser",
    site: "https://www.bilibili.com/v/popular/rank/bangumi",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "热门番剧榜",
            description: "B站热门日本番剧排行榜",
            requiresWebView: false,
            functionName: "getBilibiliAnimeRank",
            cacheDuration: 7200, // 缓存2小时
            params: [
                { 
                    name: "day", 
                    title: "时间范围", 
                    type: "enumeration", 
                    value: "3", 
                    enumOptions: [
                        { title: "三日", value: "3" }, 
                        { title: "一周", value: "7" }
                    ] 
                }
            ]
        },
        {
            title: "热门国创榜",
            description: "B站热门国产动画排行榜",
            requiresWebView: false,
            functionName: "getBilibiliGuochuangRank",
            cacheDuration: 7200,
            params: [
                { 
                    name: "day", 
                    title: "时间范围", 
                    type: "enumeration", 
                    value: "3", 
                    enumOptions: [
                        { title: "三日", value: "3" }, 
                        { title: "一周", value: "7" }
                    ] 
                }
            ]
        },
        {
            title: "影视综纪录片",
            description: "B站电影、电视剧、纪录片、综艺排行榜",
            requiresWebView: false,
            functionName: "getBilibiliMediaRank",
            cacheDuration: 7200,
            params: [
                { 
                    name: "season_type", 
                    title: "影视分类", 
                    type: "enumeration", 
                    value: "2", 
                    description: "选择想要查看的影视类型",
                    enumOptions: [
                        { title: "电影", value: "2" },
                        { title: "纪录片", value: "3" },
                        { title: "电视剧", value: "5" },
                        { title: "综艺", value: "7" }
                    ]
                },
                { 
                    name: "day", 
                    title: "时间范围", 
                    type: "enumeration", 
                    value: "3", 
                    enumOptions: [
                        { title: "三日", value: "3" }, 
                        { title: "一周", value: "7" }
                    ] 
                }
            ]
        }
    ]
};

// --- Helper Functions ---

// 格式化播放量
function formatViewCount(count) {
    if (!count) return '0';
    if (count >= 10000) {
        return (count / 10000).toFixed(1) + '万';
    }
    return count.toString();
}

// 错误对象生成器
function createErrorItem(id, title, error) {
    console.error(`[B站榜单] ${title}:`, error);
    const errorMessage = String(error?.message || error || '未知错误');
    const uniqueId = `error-${id.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    return {
        id: uniqueId,
        type: "error",
        title: title || "加载失败",
        description: errorMessage
    };
}

// --- Bilibili API Functions ---

/**
 * 核心请求函数：获取 B站 PGC 榜单
 * @param {number|string} seasonType - 1:番剧, 2:电影, 3:纪录片, 4:国创, 5:电视剧, 7:综艺
 * @param {string} day - 时间范围 "3" 或 "7"
 */
async function fetchBilibiliPgcRank(seasonType, day) {
    try {
        const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
        console.log(`[B站榜单] 请求地址: ${url}`);
        
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": "https://www.bilibili.com/v/popular/rank/bangumi"
            }
        });

        if (!response || !response.data) {
            throw new Error("接口无响应数据");
        }

        const data = response.data;
        if (data.code !== 0 || !data.result || !data.result.list) {
            throw new Error(`获取数据失败，错误码: ${data.code}, 信息: ${data.message || '未知'}`);
        }

        const list = data.result.list;
        
        return list.map((item, index) => {
            let descriptionParts = [`Top ${index + 1}`];
            
            if (item.rating) {
                descriptionParts.push(`评分: ${item.rating}`);
            }
            if (item.stat && item.stat.view) {
                descriptionParts.push(`播放: ${formatViewCount(item.stat.view)}`);
            }
            if (item.new_ep && item.new_ep.index_show) {
                descriptionParts.push(item.new_ep.index_show);
            }

            return {
                id: String(item.season_id || item.ss_id || `bili-${Date.now()}-${index}`),
                type: "bilibili_pgc",
                title: item.title,
                posterPath: item.cover,
                description: descriptionParts.join(" | "),
                rating: item.rating ? String(item.rating) : undefined,
                url: item.url // 可选：返回原站链接
            };
        });

    } catch (error) {
        return [createErrorItem(`fetch-bilibili-${seasonType}`, 'B站榜单请求失败', error)];
    }
}

// --- Module Exposed Functions ---

async function getBilibiliAnimeRank(params = {}) {
    const day = params.day || "3";
    // season_type 1 代表番剧
    return await fetchBilibiliPgcRank(1, day);
}

async function getBilibiliGuochuangRank(params = {}) {
    const day = params.day || "3";
    // season_type 4 代表国创（国产动画）
    return await fetchBilibiliPgcRank(4, day);
}

async function getBilibiliMediaRank(params = {}) {
    const day = params.day || "3";
    const seasonType = params.season_type || "2"; // 默认 2 电影
    return await fetchBilibiliPgcRank(seasonType, day);
}
