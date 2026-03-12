/**
 * 全球影视专区 - 修复版
 * 修复重点：
 * 1. 解决“最新上线”分类无数据问题：增加日期上限过滤，确保只显示已上映作品。
 * 2. 增强健壮性：优化排序参数映射，防止 API 返回空列表。
 */

// ================= [1. 参数构造函数] =================

function getAnimeParams() {
    return [
        {
            name: "region",
            title: "地区选择",
            type: "enumeration",
            value: "JP",
            enumOptions: [
                { title: "🇯🇵 日本动漫", value: "JP" },
                { title: "🇨🇳 国产动漫", value: "CN" },
                { title: "🇺🇸 欧美动漫", value: "US" },
                { title: "🌍 全球搜索", value: "" }
            ]
        },
        {
            name: "sort_by",
            title: "排序规则",
            type: "enumeration",
            value: "hot",
            enumOptions: [
                { title: "🔥 近期热播", value: "hot" },
                { title: "🆕 最新上线", value: "new" },
                { title: "🏆 高分榜单", value: "top" }
            ]
        },
        { name: "page", title: "Page", type: "page", startPage: 1 }
    ];
}

function getSimpleParams() {
    return [
        {
            name: "sort_by",
            title: "排序规则",
            type: "enumeration",
            value: "hot",
            enumOptions: [
                { title: "🔥 近期热播", value: "hot" },
                { title: "🆕 最新上线", value: "new" },
                { title: "🏆 高分榜单", value: "top" }
            ]
        },
        { name: "page", title: "Page", type: "page", startPage: 1 }
    ];
}

// ================= [2. WidgetMetadata] =================

WidgetMetadata = {
    id: "global_media_pro_fixed",
    title: "全球影视探索",
    description: "已修复最新上线排序分类无数据的问题",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "2.5.4",
    requiredVersion: "0.0.1",
    modules: [
        { title: "🎬 热门电影", functionName: "loadMovies", type: "video", params: getSimpleParams() },
        { title: "📺 热门剧集", functionName: "loadTV", type: "video", params: getSimpleParams() },
        { title: "🎨 热门动漫", functionName: "loadAnime", type: "video", params: getAnimeParams() },
        { title: "💃 热门综艺", functionName: "loadVariety", type: "video", params: getSimpleParams() }
    ]
};

// ================= [3. 处理器] =================

async function loadMovies(params) { return await unifiedLoader("movie", params, ""); }
async function loadTV(params) { return await unifiedLoader("tv", params, ""); }
async function loadVariety(params) { return await unifiedLoader("variety", params, "CN"); }
async function loadAnime(params) { return await unifiedLoader("anime", params, params.region || "JP"); }

async function unifiedLoader(category, params, region) {
    const sort_by = params.sort_by || "hot";
    const page = parseInt(params.page) || 1;
    let endpoint = "/discover/tv";
    let extraParams = {};

    switch(category) {
        case "movie": endpoint = "/discover/movie"; break;
        case "anime": extraParams.with_genres = "16"; break;
        case "variety": extraParams.with_genres = "10764,10767"; break;
        default: extraParams.without_genres = "16,10764,10767"; break;
    }

    try {
        const results = await fetchFromTmdb(endpoint, sort_by, page, region, extraParams);
        return results.length > 0 ? results : [{ id: "empty", type: "text", title: "暂无有效数据", description: "请尝试切换排序或页码" }];
    } catch (e) {
        console.error("Load failed:", e);
        return [{ id: "error", type: "text", title: "加载失败", description: "网络超时或API限制" }];
    }
}

// ================= [4. 核心修复逻辑] =================

async function fetchFromTmdb(endpoint, sort_by, page, regionKey, extraParams) {
    const isMovie = endpoint.includes("movie");
    // 👉 修复关键点：获取当前日期并增加一个月作为上限，防止未来无效数据占坑
    const now = new Date();
    const futureLimit = new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    let query = {
        language: "zh-CN",
        page: page,
        include_adult: false,
        ...extraParams
    };

    if (regionKey) query.with_origin_country = regionKey;

    // 👉 排序逻辑修复：
    if (sort_by === "new") {
        query.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        // 限制只显示从过去到现在（+1月内）的内容，过滤掉那些排到 2030 年的无效数据
        query[isMovie ? "primary_release_date.lte" : "first_air_date.lte"] = futureLimit;
        query["vote_count.gte"] = 0; // 降低门槛以显示最新作
    } else if (sort_by === "top") {
        query.sort_by = "vote_average.desc";
        query["vote_count.gte"] = isMovie ? 100 : 30;
    } else {
        query.sort_by = "popularity.desc";
        query["vote_count.gte"] = 5;
    }

    const res = await Widget.tmdb.get(endpoint, { params: query });
    
    if (!res || !res.results) return [];

    return res.results
        .filter(item => item.poster_path) // 自动过滤掉没有海报的无效数据
        .map(item => ({
            id: String(item.id),
            type: "tmdb",
            mediaType: isMovie ? "movie" : "tv",
            title: item.title || item.name,
            description: item.overview || "暂无简介",
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path,
            rating: item.vote_average,
            releaseDate: item.release_date || item.first_air_date
        }));
}
