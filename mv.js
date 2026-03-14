// --- Bilibili PGC Charts & TMDB Metadata Widget ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";

var WidgetMetadata = {
    id: "forward.bilibili.pgc.pro",
    title: "B站官方榜单 (TMDB版)",
    description: "同步B站番剧影视榜单，并自动补全TMDB高清封面与剧情简介",
    author: "ForwardUser",
    version: "1.3.0",
    globalParams: [
        {
            name: "TMDB_API_KEY",
            title: "TMDB 访问令牌",
            type: "input",
            description: "推荐填写以获得更稳定的海报和简介抓取"
        }
    ],
    modules: [
        { title: "日本番剧榜", functionName: "getAnime", params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "国产动画榜", functionName: "getGuochuang", params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "电影榜单", functionName: "getMovie", params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "电视剧榜", functionName: "getTV", params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "纪录片榜", functionName: "getDoc", params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] },
        { title: "综艺榜单", functionName: "getShow", params: [{ name: "day", title: "范围", type: "enumeration", value: "3", enumOptions: [{ title: "三日", value: "3" }, { title: "一周", value: "7" }] }] }
    ]
};

// --- 工具函数：清洗B站标题以适配TMDB搜索 ---
function cleanTitle(title) {
    return title
        .replace(/（.*）|\(.*\)/g, '') // 移除括号内容（如：仅限港澳台）
        .replace(/第[一二三四五六七八九十0-9]+季/g, '') // 移除“第1季”
        .replace(/剧场版|特别篇|动态漫|：/g, ' ') // 移除后缀和特殊冒号
        .trim();
}

// --- 核心：从TMDB获取元数据 ---
async function fetchTmdbMetadata(title, mediaType, apiKey) {
    const q = cleanTitle(title);
    try {
        let results;
        if (apiKey) {
            const res = await Widget.http.get(`https://api.themoviedb.org/3/search/${mediaType}`, {
                params: { query: q, language: "zh-CN" },
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            results = res.data?.results;
        } else {
            const res = await Widget.tmdb.get(`/search/${mediaType}`, { params: { query: q, language: "zh-CN" } });
            results = res?.results;
        }

        if (!results || results.length === 0) return null;

        // 优先寻找标题完全一致的，否则取第一个
        const match = results.find(i => (i.title || i.name) === q) || results[0];
        return {
            poster: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
            backdrop: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : null,
            overview: match.overview,
            rating: match.vote_average,
            tmdbId: match.id
        };
    } catch (e) {
        return null;
    }
}

// --- 统一获取逻辑 ---
async function fetchBilibiliRank(seasonType, day, apiKey) {
    // 映射 B站类型 -> TMDB mediaType
    // 2: 电影, 其他通常对应 TV
    const tmdbType = (seasonType === 2) ? "movie" : "tv";

    try {
        const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
        const response = await Widget.http.get(url, { headers: { "User-Agent": USER_AGENT } });
        const list = response.data?.result?.list || [];

        // 并行处理所有项的 TMDB 数据抓取
        return await Promise.all(list.slice(0, 20).map(async (item, index) => {
            const tmdb = await fetchTmdbMetadata(item.title, tmdbType, apiKey);

            return {
                id: String(item.season_id || item.ss_id),
                type: "tmdb", // 核心：设为 tmdb 触发播放按钮逻辑
                title: item.title,
                mediaType: tmdbType,
                // 元数据替换：优先使用 TMDB 数据
                posterPath: tmdb?.poster || item.cover, 
                backdropPath: tmdb?.backdrop,
                description: tmdb?.overview || `B站播放量: ${(item.stat?.view / 10000).toFixed(1)}万 | ${item.new_ep?.index_show || ''}`,
                rating: tmdb?.rating ? tmdb.rating.toFixed(1) : (item.rating || "0.0"),
                url: item.url,
                label: `Top ${index + 1}`
            };
        }));
    } catch (error) {
        return [{ id: "err", type: "error", title: "获取失败", description: error.message }];
    }
}

// --- 模块导出函数 ---
async function getAnime(p) { return await fetchBilibiliRank(1, p.day, p.TMDB_API_KEY); }
async function getGuochuang(p) { return await fetchBilibiliRank(4, p.day, p.TMDB_API_KEY); }
async function getMovie(p) { return await fetchBilibiliRank(2, p.day, p.TMDB_API_KEY); }
async function getTV(p) { return await fetchBilibiliRank(5, p.day, p.TMDB_API_KEY); }
async function getDoc(p) { return await fetchBilibiliRank(3, p.day, p.TMDB_API_KEY); }
async function getShow(p) { return await fetchBilibiliRank(7, p.day, p.TMDB_API_KEY); }
