// --- Bilibili PGC Charts Widget (TMDB Enhanced) ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";

var WidgetMetadata = {
    id: "forward.bilibili.pgc.charts",
    title: "B站PGC榜单",
    description: "聚合B站番剧影视榜单，并关联TMDB元数据以支持播放按钮",
    author: "ForwardUser",
    site: "https://www.bilibili.com/v/popular/rank/bangumi",
    version: "1.2.0",
    requiredVersion: "0.0.1",
    // 新增：允许用户输入 TMDB API Key 提高匹配成功率
    globalParams: [
        {
            name: "TMDB_API_KEY",
            title: "TMDB API 访问令牌",
            type: "input",
            description: "可选。填入可提高详情匹配成功率"
        },
    ],
    modules: [
        {
            title: "热门番剧榜",
            functionName: "getBilibiliAnimeRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "时间范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "热门国创榜",
            functionName: "getBilibiliGuochuangRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "时间范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "影视综纪录片",
            functionName: "getBilibiliMediaRank",
            cacheDuration: 7200,
            params: [
                { 
                    name: "season_type", 
                    title: "影视分类", 
                    type: "enumeration", 
                    value: "2", 
                    enumOptions: [
                        { title: "电影", value: "2" },
                        { title: "纪录片", value: "3" },
                        { title: "电视剧", value: "5" },
                        { title: "综艺", value: "7" }
                    ]
                },
                { name: "day", title: "时间范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }
            ]
        }
    ]
};

// --- Helper Functions ---

function formatViewCount(count) {
    if (!count) return '0';
    return count >= 10000 ? (count / 10000).toFixed(1) + '万' : count.toString();
}

// --- TMDB Enrichment Logic (From 热门精选.js) ---

const getTmdbDetail = async (title, mediaType, key) => {
    // 预处理标题，移除B站特有的后缀干扰
    const cleanTitle = title
        .replace(/([（(][^）)]*[)）])/g, '')
        .replace(/剧场版|特别篇|动态漫|中配|粤语版|国语版/g, '')
        .replace(/第[0-9一二三四五六七八九十]+季/g, '')
        .trim();

    try {
        let responseData;
        if (key) {
            // 使用 API Key 查询
            const res = await Widget.http.get(`https://api.themoviedb.org/3/search/${mediaType}`, {
                params: { query: cleanTitle, language: "zh-CN", include_adult: false },
                headers: { "Authorization": `Bearer ${key}` }
            });
            responseData = res.data;
        } else {
            // 使用系统内置免 Key 查询
            responseData = await Widget.tmdb.get(`/search/${mediaType}`, {
                params: { query: cleanTitle, language: "zh-CN" }
            });
        }

        if (!responseData?.results?.length) return null;
        
        // 尝试精确匹配或取第一项
        const matched = responseData.results.find(i => (i.name || i.title) === cleanTitle) || responseData.results[0];
        
        return {
            tmdbId: matched.id,
            description: matched.overview, // 补充剧情简介
            posterPath: matched.poster_path,
            backdropPath: matched.backdrop_path,
            tmdbRating: matched.vote_average
        };
    } catch (e) {
        return null;
    }
};

// --- Core API Function ---

async function fetchBilibiliPgcRank(seasonType, day, apiKey) {
    try {
        const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
        const response = await Widget.http.get(url, { headers: { "User-Agent": USER_AGENT } });

        if (!response?.data?.result?.list) throw new Error("获取B站数据失败");

        const list = response.data.result.list;
        const mediaType = String(seasonType) === "2" ? "movie" : "tv";

        // 并发获取 TMDB 详情补充资源
        const enrichedList = await Promise.all(list.map(async (item, index) => {
            const tmdbInfo = await getTmdbDetail(item.title, mediaType, apiKey);
            
            const biliDesc = `「${item.title}」 Top ${index + 1} | 播放: ${formatViewCount(item.stat?.view)} | ${item.new_ep?.index_show || ''}`;

            return {
                id: String(item.season_id || item.ss_id || `bili-${index}`),
                type: "tmdb", // 必须为 tmdb 才能显示播放按钮
                mediaType: mediaType,
                title: item.title,
                // 优先使用 TMDB 的剧情简介，如果没有则用 B 站的统计信息
                description: tmdbInfo?.description || biliDesc,
                posterPath: tmdbInfo?.posterPath || item.cover,
                backdropPath: tmdbInfo?.backdropPath,
                rating: tmdbInfo?.tmdbRating || (item.rating ? parseFloat(item.rating) : 0),
                url: item.url
            };
        }));

        return enrichedList;
    } catch (error) {
        return [{ id: "err", type: "error", title: "加载失败", description: error.message }];
    }
}

// --- Module Exposed Functions ---

async function getBilibiliAnimeRank(params) {
    return await fetchBilibiliPgcRank(1, params.day || "3", params.TMDB_API_KEY);
}

async function getBilibiliGuochuangRank(params) {
    return await fetchBilibiliPgcRank(4, params.day || "3", params.TMDB_API_KEY);
}

async function getBilibiliMediaRank(params) {
    return await fetchBilibiliPgcRank(params.season_type || "2", params.day || "3", params.TMDB_API_KEY);
}
