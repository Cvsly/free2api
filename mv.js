/**
 * 全球万能影视专区 (Plus 版)
 * 核心逻辑: TMDB Discover + Bilibili PGC 榜单联动
 * 特色：B站榜单内容自动补全 TMDB 高清海报与元数据
 */

WidgetMetadata = {
    id: "global_series_pro",
    title: "全球影视专区 Pro",
    description: "集成 TMDB 全球探索与 Bilibili PGC 实时榜单，支持海报补全",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖 & Gemini",
    version: "2.5.0",
    requiredVersion: "0.0.1",
    modules: [
        // ================= 模块 1：Bilibili PGC 榜单 (新增) =================
        {
            title: "📺 Bilibili 热播榜",
            functionName: "loadBiliRank",
            type: "video",
            cacheDuration: 3600,
            params: [
                {
                    name: "seasonType",
                    title: "榜单类型",
                    type: "enumeration",
                    value: "1",
                    enumOptions: [
                        { title: "🧧 强推番剧", value: "1" },
                        { title: "🇨🇳 国产动画", value: "4" },
                        { title: "🎬 电影榜", value: "2" },
                        { title: "📺 电视剧榜", value: "5" },
                        { title: "🎥 纪录片榜", value: "3" },
                        { title: "🥳 综艺榜", value: "7" }
                    ]
                }
            ]
        },
        // ================= 模块 2：全球探索发现 =================
        {
            title: "🌍 全球探索发现",
            functionName: "loadGlobalList",
            type: "video",
            cacheDuration: 3600,
            params: [
                {
                    name: "region",
                    title: "选择国家/地区",
                    type: "enumeration",
                    value: "CN",
                    enumOptions: [
                        { title: "🇨🇳 大陆 (China)", value: "CN" },
                        { title: "🇭🇰 香港 (Hong Kong)", value: "HK" },
                        { title: "🇹🇼 台湾 (Taiwan)", value: "TW" },
                        { title: "🇺🇸 美国 (USA)", value: "US" },
                        { title: "🇯🇵 日本 (Japan)", value: "JP" },
                        { title: "🇰🇷 韩国 (Korea)", value: "KR" },
                        { title: "🇪🇺 欧洲综合", value: "EU" },
                        { title: "🇮🇳 印度 (India)", value: "IN" },
                        { title: "🇹🇭 泰国 (Thailand)", value: "TH" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "影视类型",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌟 全部混合", value: "all" },
                        { title: "🎬 仅看电影", value: "movie" },
                        { title: "📺 仅看剧集", value: "tv" }
                    ]
                },
                {
                    name: "sort_by",
                    title: "排序榜单",
                    type: "enumeration",
                    value: "hot",
                    enumOptions: [
                        { title: "🔥 近期热播", value: "hot" },
                        { title: "🆕 最新上线", value: "new" },
                        { title: "🏆 历史高分", value: "top" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },
        // ================= 模块 3：高级类型榜单 =================
        {
            title: "🏷️ 题材分类检索",
            functionName: "loadGenreRank",
            type: "video",
            params: [
                {
                    name: "mediaType",
                    title: "类型",
                    type: "enumeration",
                    value: "movie",
                    enumOptions: [{ title: "🎬 电影", value: "movie" }, { title: "📺 剧集", value: "tv" }]
                },
                {
                    name: "genre",
                    title: "流派",
                    type: "enumeration",
                    value: "scifi",
                    enumOptions: [
                        { title: "🛸 科幻", value: "scifi" }, { title: "🔍 悬疑", value: "mystery" },
                        { title: "👻 恐怖", value: "horror" }, { title: "🔪 犯罪", value: "crime" },
                        { title: "💥 动作", value: "action" }, { title: "🎨 动画", value: "animation" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// =========================================================================
// 工具函数：TMDB 数据补全与检索
// =========================================================================

/**
 * 核心优化：利用 B 站标题在 TMDB 中搜索并补全元数据
 */
async function complementWithTmdb(title, year, typeHint = "all") {
    try {
        const searchRes = await Widget.tmdb.get("/search/multi", {
            params: { query: title, language: "zh-CN" }
        });
        
        let match = (searchRes.results || []).find(item => {
            const itemTitle = item.title || item.name;
            const itemDate = item.release_date || item.first_air_date || "";
            // 如果有年份，优先匹配年份相近的
            const yearMatch = year ? itemDate.includes(year) : true;
            return itemTitle === title && yearMatch;
        }) || searchRes.results[0]; // 没精准匹配就取第一个

        if (match) {
            return {
                tmdbId: match.id,
                posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "",
                backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/w780${match.backdrop_path}` : "",
                rating: match.vote_average || 0,
                summary: match.overview,
                mediaType: match.media_type || (match.title ? "movie" : "tv")
            };
        }
    } catch (e) {
        console.error("TMDB Complement Error:", e);
    }
    return null;
}

// =========================================================================
// 逻辑实现：Bilibili PGC 榜单
// =========================================================================

async function loadBiliRank(params) {
    const seasonType = params.seasonType || "1";
    // B站 PGC 榜单接口
    const apiUrl = `https://api.bilibili.com/pgc/web/rank/list?day=3&season_type=${seasonType}`;
    
    try {
        const res = await Widget.http.get(apiUrl);
        const list = res.data.result.list || [];

        // 异步并行补全 TMDB 数据以提高加载速度
        const items = await Promise.all(list.map(async (item) => {
            const rawTitle = item.title;
            // 简单处理年份：有些标题带 2024 等字样
            const yearMatch = rawTitle.match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : "";
            
            const tmdbData = await complementWithTmdb(rawTitle, year);

            return {
                id: `bili_${item.season_id}`,
                tmdbId: tmdbData ? tmdbData.tmdbId : null,
                type: tmdbData ? "tmdb" : "text", // 如果有 TMDB ID 则支持跳转详情
                mediaType: tmdbData ? tmdbData.mediaType : "tv",
                title: rawTitle,
                subTitle: `🔥 ${item.stat.view || item.stat.follow || ""} | ${item.new_ep.index_show}`,
                posterPath: tmdbData?.posterPath || item.cover,
                backdropPath: tmdbData?.backdropPath || item.cover,
                description: `【B站热播】${item.desc}\n评分：${item.rating || "暂无"}\n${tmdbData?.summary || ""}`,
                rating: tmdbData?.rating || parseFloat(item.rating) || 0
            };
        }));

        return items;
    } catch (error) {
        console.error("Bili Rank Load Error:", error);
        return [{ id: "err", title: "加载失败", description: "无法连接 Bilibili 接口" }];
    }
}

// =========================================================================
// 原有模块逻辑 (保持并精简优化)
// =========================================================================

const GENRE_MAP = { 28: "动作", 16: "动画", 35: "喜剧", 18: "剧情", 878: "科幻", 9648: "悬疑" };

function buildItem(item, forceType) {
    const mType = forceType || item.media_type || (item.title ? "movie" : "tv");
    return {
        id: String(item.id),
        tmdbId: item.id,
        type: "tmdb",
        mediaType: mType,
        title: item.title || item.name,
        releaseDate: item.release_date || item.first_air_date,
        subTitle: `⭐ ${item.vote_average?.toFixed(1) || "N/A"}`,
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
        description: item.overview,
        rating: item.vote_average,
        _popularity: item.popularity,
        _date: item.release_date || item.first_air_date
    };
}

async function fetchTmdbList(path, params, region) {
    let p = { ...params, language: "zh-CN" };
    if (region === "EU") p.with_origin_country = "FR|DE|IT|ES";
    else if (region !== "all") p.with_origin_country = region;
    
    const res = await Widget.tmdb.get(path, { params: p });
    return (res.results || []).map(i => buildItem(i, path.includes("movie") ? "movie" : "tv"));
}

async function loadGlobalList(params) {
    const { region = "CN", mediaType = "all", sort_by = "hot", page = 1 } = params;
    const sortMap = { hot: "popularity.desc", new: "release_date.desc", top: "vote_average.desc" };
    
    try {
        if (mediaType === "all") {
            const [m, t] = await Promise.all([
                fetchTmdbList("/discover/movie", { sort_by: sortMap[sort_by], page }, region),
                fetchTmdbList("/discover/tv", { sort_by: sortMap[sort_by], page }, region)
            ]);
            return [...m, ...t].sort((a, b) => sort_by === "hot" ? b._popularity - a._popularity : new Date(b._date) - new Date(a._date)).slice(0, 20);
        }
        return await fetchTmdbList(`/discover/${mediaType}`, { sort_by: sortMap[sort_by], page }, region);
    } catch (e) { return []; }
}

async function loadGenreRank(params) {
    const { mediaType = "movie", genre = "scifi", page = 1 } = params;
    const gIds = { scifi: "878", mystery: "9648", horror: "27", action: "28", animation: "16" };
    return await fetchTmdbList(`/discover/${mediaType}`, { with_genres: gIds[genre], page }, "all");
}
