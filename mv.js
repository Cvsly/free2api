// --- Bilibili PGC Charts Widget (TMDB Metadata Version) ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";

var WidgetMetadata = {
    id: "forward.bilibili.pgc.charts.tmdb",
    title: "B站 PGC 榜单 (TMDB)",
    description: "以 B 站官方分类展示榜单，元数据由 TMDB 强力驱动",
    author: "ForwardUser",
    version: "1.3.0",
    requiredVersion: "0.0.1",
    globalParams: [
        {
            name: "TMDB_API_KEY",
            title: "TMDB API 访问令牌",
            type: "input",
            description: "填入此项可获得更精准的匹配和更高的访问频率"
        },
    ],
    modules: [
        { title: "番剧榜", functionName: "getAnimeRank", params: [{ name: "day", title: "时间", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "国创榜", functionName: "getGuochuangRank", params: [{ name: "day", title: "时间", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "电影榜", functionName: "getMovieRank", params: [{ name: "day", title: "时间", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "电视剧榜", functionName: "getTvSeriesRank", params: [{ name: "day", title: "时间", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "纪录片榜", functionName: "getDocRank", params: [{ name: "day", title: "时间", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "综艺榜", functionName: "getVarietyRank", params: [{ name: "day", title: "时间", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] }
    ]
};

// --- TMDB 元数据替换核心逻辑 ---

const getTmdbMetadata = async (biliTitle, mediaType, apiKey) => {
    // 1. 标题预处理：移除 B 站常见的干扰项（如“第2季”、“（独家）”等）
    const cleanTitle = biliTitle
        .replace(/（[^）]+）|\([^)]+\)/g, '')
        .replace(/第[0-9一二三四五六七八九十]+季/g, '')
        .replace(/剧场版|特别篇|动态漫|中配|粤语|日语/g, '')
        .trim();

    try {
        let results;
        if (apiKey) {
            const res = await Widget.http.get(`https://api.themoviedb.org/3/search/${mediaType}`, {
                params: { query: cleanTitle, language: "zh-CN", include_adult: false },
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            results = res.data?.results;
        } else {
            const res = await Widget.tmdb.get(`/search/${mediaType}`, {
                params: { query: cleanTitle, language: "zh-CN" }
            });
            results = res?.results;
        }

        if (!results || results.length === 0) return null;

        // 优先寻找标题完全一致的，否则取第一个
        const match = results.find(i => (i.title || i.name) === cleanTitle) || results[0];

        return {
            tmdbId: match.id,
            overview: match.overview,
            poster: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
            backdrop: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : null,
            rating: match.vote_average
        };
    } catch (e) {
        console.error(`[TMDB Search Error] ${cleanTitle}:`, e);
        return null;
    }
};

// --- 统一数据抓取与融合函数 ---

async function fetchRankAndEnrich(seasonType, day, apiKey) {
    try {
        const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
        const response = await Widget.http.get(url, { headers: { "User-Agent": USER_AGENT } });
        
        if (!response?.data?.result?.list) throw new Error("无法读取 B 站接口");

        const list = response.data.result.list;
        const mediaType = (seasonType === 2) ? "movie" : "tv";

        // 并发处理所有项，将 B 站数据与 TMDB 元数据融合
        return await Promise.all(list.map(async (item, index) => {
            const tmdb = await getTmdbMetadata(item.title, mediaType, apiKey);

            return {
                id: String(item.season_id || item.ss_id || index),
                // 保持播放按钮的关键字段
                type: "tmdb", 
                mediaType: mediaType,
                // 展示逻辑
                title: item.title,
                // 替换元数据：优先使用 TMDB 简介，备选使用 B 站信息
                description: tmdb?.overview || `B站播放: ${(item.stat?.view / 10000).toFixed(1)}万 | ${item.new_ep?.index_show || ''}`,
                // 替换封面：优先使用 TMDB 海报
                posterPath: tmdb?.poster || item.cover,
                // 替换背景图
                backdropPath: tmdb?.backdrop,
                // 替换评分
                rating: tmdb?.rating || (item.rating ? parseFloat(item.rating) : 0),
                url: item.url
            };
        }));
    } catch (e) {
        return [{ id: "err", type: "error", title: "获取榜单失败", description: e.message }];
    }
}

// --- PGC 官方规范分类入口 ---

async function getAnimeRank(p) { return await fetchRankAndEnrich(1, p.day, p.TMDB_API_KEY); }     // 番剧
async function getGuochuangRank(p) { return await fetchRankAndEnrich(4, p.day, p.TMDB_API_KEY); }  // 国创
async function getMovieRank(p) { return await fetchRankAndEnrich(2, p.day, p.TMDB_API_KEY); }      // 电影
async function getDocRank(p) { return await fetchRankAndEnrich(3, p.day, p.TMDB_API_KEY); }        // 纪录片
async function getTvSeriesRank(p) { return await fetchRankAndEnrich(5, p.day, p.TMDB_API_KEY); }   // 电视剧
async function getVarietyRank(p) { return await fetchRankAndEnrich(7, p.day, p.TMDB_API_KEY); }    // 综艺
