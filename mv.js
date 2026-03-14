// --- Bilibili PGC Charts Widget ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";

var WidgetMetadata = {
    id: "forward.bilibili.pgc.charts",
    title: "B站PGC榜单",
    description: "聚合获取Bilibili番剧、国创、影视、纪录片等官方排行榜单数据",
    author: "ForwardUser",
    site: "https://www.bilibili.com/v/popular/rank/bangumi",
    version: "1.1.0",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "热门番剧榜",
            description: "B站热门日本番剧排行榜",
            requiresWebView: false,
            functionName: "getBilibiliAnimeRank",
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

function formatViewCount(count) {
    if (!count) return '0';
    if (count >= 10000) {
        return (count / 10000).toFixed(1) + '万';
    }
    return count.toString();
}

function createErrorItem(id, title, error) {
    console.error(`[B站榜单] ${title}:`, error);
    const errorMessage = String(error?.message || error || '未知错误');
    return {
        id: `error-${id}-${Date.now()}`,
        type: "error",
        title: title || "加载失败",
        description: errorMessage
    };
}

// --- Bilibili API Functions ---

async function fetchBilibiliPgcRank(seasonType, day) {
    try {
        const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
        
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": "https://www.bilibili.com/v/popular/rank/bangumi"
            }
        });

        if (!response?.data?.result?.list) {
            throw new Error("接口数据格式异常");
        }

        const list = response.data.result.list;
        
        // 映射 mediaType
        // B站类型：1:番剧, 2:电影, 3:纪录片, 4:国创, 5:电视剧, 7:综艺
        let normalizedMediaType = "tv"; 
        if (String(seasonType) === "2") {
            normalizedMediaType = "movie";
        }

        return list.map((item, index) => {
            let descriptionParts = [`Top ${index + 1}`];
            
            if (item.rating) descriptionParts.push(`评分: ${item.rating}`);
            if (item.stat?.view) descriptionParts.push(`播放: ${formatViewCount(item.stat.view)}`);
            if (item.new_ep?.index_show) descriptionParts.push(item.new_ep.index_show);

            return {
                id: String(item.season_id || item.ss_id || `bili-${index}`),
                // 核心修复：修改为 tmdb 触发播放/搜索按钮
                type: "tmdb", 
                title: item.title,
                posterPath: item.cover,
                description: descriptionParts.join(" | "),
                // 将10分制转为常见的5分制用于星星显示
                rating: item.rating ? (parseFloat(item.rating) / 2).toFixed(1) : undefined, 
                mediaType: normalizedMediaType,
                url: item.url
            };
        });

    } catch (error) {
        return [createErrorItem(`fetch-bili-${seasonType}`, '请求失败', error)];
    }
}

// --- Module Exposed Functions ---

async function getBilibiliAnimeRank(params = {}) {
    return await fetchBilibiliPgcRank(1, params.day || "3");
}

async function getBilibiliGuochuangRank(params = {}) {
    return await fetchBilibiliPgcRank(4, params.day || "3");
}

async function getBilibiliMediaRank(params = {}) {
    return await fetchBilibiliPgcRank(params.season_type || "2", params.day || "3");
}
