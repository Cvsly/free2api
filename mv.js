// --- Bilibili PGC Charts Widget (TMDB Pro Enhanced) ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";

var WidgetMetadata = {
    id: "forward.bilibili.pgc.charts.tmdb",
    title: "B站官方榜单 (TMDB版)",
    description: "同步B站官方PGC榜单数据，并由TMDB提供高清元数据支持播放按钮",
    author: "ForwardUser",
    site: "https://www.bilibili.com/v/popular/rank/bangumi",
    version: "1.3.0",
    requiredVersion: "0.0.1",
    globalParams: [
        {
            name: "TMDB_API_KEY",
            title: "TMDB API 访问令牌",
            type: "input",
            description: "建议填写，可从 TMDB 官网免费获取以提高匹配稳定性"
        },
    ],
    modules: [
        {
            title: "热门番剧榜",
            functionName: "getBilibiliAnimeRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "热门国创榜",
            functionName: "getBilibiliGuochuangRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "电影热播榜",
            functionName: "getBilibiliMovieRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "电视剧热播榜",
            functionName: "getBilibiliTvRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "纪录片榜",
            functionName: "getBilibiliDocuRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        },
        {
            title: "综艺热播榜",
            functionName: "getBilibiliShowRank",
            cacheDuration: 7200,
            params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }]
        }
    ]
};

// --- Helper Functions ---

function formatViewCount(count) {
    if (!count) return '0';
    return count >= 10000 ? (count / 10000).toFixed(1) + '万' : count.toString();
}

/**
 * 清洗B站标题以适配 TMDB 搜索
 */
function cleanBilibiliTitle(title) {
    return title
        .replace(/（[^）]*）|\([^)]*\)/g, '') // 去除括号内容
        .replace(/第[0-9一二三四五六七八九十]+季/g, '') // 去除季数
        .replace(/剧场版|特别篇|动态漫|中配|粤语|独家/g, '')
        .trim();
}

/**
 * TMDB 资源匹配核心
 */
async function fetchTmdbMetadata(title, mediaType, apiKey) {
    const cleanTitle = cleanBilibiliTitle(title);
    try {
        let data;
        if (apiKey) {
            const res = await Widget.http.get(`https://api.themoviedb.org/3/search/${mediaType}`, {
                params: { query: cleanTitle, language: "zh-CN", include_adult: false },
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            data = res.data;
        } else {
            // 系统内置调用
            data = await Widget.tmdb.get(`/search/${mediaType}`, {
                params: { query: cleanTitle, language: "zh-CN" }
            });
        }

        if (!data?.results?.length) return null;
        
        // 优先寻找完全匹配标题的结果，否则取第一项
        const match = data.results.find(i => (i.title || i.name) === cleanTitle) || data.results[0];
        
        return {
            posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
            backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : null,
            overview: match.overview,
            rating: match.vote_average
        };
    } catch (e) {
        return null;
    }
}

// --- Main API Logic ---

async function fetchBilibiliPgcRankWithTmdb(seasonType, day, apiKey) {
    try {
        const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
        const response = await Widget.http.get(url, { headers: { "User-Agent": USER_AGENT } });

        if (!response?.data?.result?.list) throw new Error("无法读取B站数据");

        const list = response.data.result.list;
        const mediaType = String(seasonType) === "2" ? "movie" : "tv"; // 电影选movie，其余均归类为tv

        // 异步并发处理，提升加载速度
        const enrichedItems = await Promise.all(list.map(async (item, index) => {
            const tmdb = await fetchTmdbMetadata(item.title, mediaType, apiKey);
            
            // 基础描述（B站信息备份）
            const biliStats = `Top ${index + 1} | 播放: ${formatViewCount(item.stat?.view)} | ${item.new_ep?.index_show || ''}`;

            return {
                id: String(item.season_id || item.ss_id || `bili-${index}`),
                type: "tmdb", // 核心：设为 tmdb 激活播放按钮
                mediaType: mediaType,
                title: item.title,
                // 优先用 TMDB 的中文简介，没有则显示 B 站排名和播放量
                description: tmdb?.overview || biliStats,
                // 优先用 TMDB 高清海报，没有则用 B 站封面
                posterPath: tmdb?.posterPath || item.cover,
                backdropPath: tmdb?.backdropPath,
                rating: tmdb?.rating ? tmdb.rating.toFixed(1) : (item.rating || "0"),
                url: item.url
            };
        }));

        return enrichedItems;
    } catch (error) {
        console.error(error);
        return [{ id: "err", type: "error", title: "榜单加载失败", description: error.message }];
    }
}

// --- Module Exposed Functions ---

async function getBilibiliAnimeRank(params) { return await fetchBilibiliPgcRankWithTmdb(1, params.day, params.TMDB_API_KEY); }
async function getBilibiliGuochuangRank(params) { return await fetchBilibiliPgcRankWithTmdb(4, params.day, params.TMDB_API_KEY); }
async function getBilibiliMovieRank(params) { return await fetchBilibiliPgcRankWithTmdb(2, params.day, params.TMDB_API_KEY); }
async function getBilibiliTvRank(params) { return await fetchBilibiliPgcRankWithTmdb(5, params.day, params.TMDB_API_KEY); }
async function getBilibiliDocuRank(params) { return await fetchBilibiliPgcRankWithTmdb(3, params.day, params.TMDB_API_KEY); }
async function getBilibiliShowRank(params) { return await fetchBilibiliPgcRankWithTmdb(7, params.day, params.TMDB_API_KEY); }
