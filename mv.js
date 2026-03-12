/**
 * 全球万能影视专区 - 动漫定制版
 * 布局：一级独立模块
 * 二级菜单：仅动漫模块保留地区选择，其他模块保持极简
 */

WidgetMetadata = {
    id: "global_series_anime_custom",
    title: "影视榜单 (动漫增强版)",
    description: "动漫支持地区切换，其他分类保持极简",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "2.4.0",
    modules: [
        {
            title: "🎬 热门电影",
            functionName: "loadMovies",
            type: "video",
            params: getSimpleParams() // 极简菜单
        },
        {
            title: "📺 热门剧集",
            functionName: "loadTV",
            type: "video",
            params: getSimpleParams() // 极简菜单
        },
        {
            title: "🎨 热门动漫",
            functionName: "loadAnime",
            type: "video",
            params: getAnimeParams() // 增强菜单：新增地区
        },
        {
            title: "💃 热门综艺",
            functionName: "loadVariety",
            type: "video",
            params: getSimpleParams() // 极简菜单
        }
    ]
};

// --- 1. 动漫专属二级菜单 (含地区) ---
function getAnimeParams() {
    return [
        {
            name: "region",
            title: "动漫地区",
            type: "enumeration",
            value: "JP", // 默认日漫
            enumOptions: [
                { title: "🇯🇵 日本 (日漫)", value: "JP" },
                { title: "🇨🇳 大陆 (国漫)", value: "CN" },
                { title: "🇺🇸 美国 (美漫)", value: "US" },
                { title: "🌍 全球动漫", value: "" }
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
                { title: "🏆 高分好评", value: "top" }
            ]
        },
        { name: "page", title: "页码", type: "page", startPage: 1 }
    ];
}

// --- 2. 其他模块极简菜单 (无地区) ---
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
                { title: "🏆 高分好评", value: "top" }
            ]
        },
        { name: "page", title: "页码", type: "page", startPage: 1 }
    ];
}

// =========================================================================
// 核心请求分发
// =========================================================================

async function loadMovies(params) { 
    return await unifiedLoader("movie", params, ""); 
}
async function loadTV(params) { 
    return await unifiedLoader("tv", params, ""); 
}
async function loadVariety(params) { 
    return await unifiedLoader("variety", params, "CN"); 
}

// 动漫模块：读取 params.region 而不是固定 JP
async function loadAnime(params) { 
    const selectedRegion = params.region || "JP"; 
    return await unifiedLoader("anime", params, selectedRegion); 
}

async function unifiedLoader(category, params, defaultRegion) {
    const sort_by = params.sort_by || "hot";
    const page = parseInt(params.page) || 1;
    
    let endpoint = "/discover/tv";
    let extraParams = {};

    switch(category) {
        case "movie":
            endpoint = "/discover/movie";
            break;
        case "anime":
            extraParams.with_genres = "16"; 
            break;
        case "variety":
            extraParams.with_genres = "10764,10767";
            break;
        case "tv":
        default:
            extraParams.without_genres = "16,10764,10767";
            break;
    }

    try {
        const items = await fetchFromTmdb(endpoint, sort_by, page, defaultRegion, extraParams);
        return items.length > 0 ? items : [{ id: "empty", type: "text", title: "无数据", description: "该分类下暂无内容" }];
    } catch (error) {
        return [{ id: "error", type: "text", title: "请求失败", description: error.message }];
    }
}

// =========================================================================
// 统一 TMDB 抓取器 (复用之前的逻辑)
// =========================================================================
async function fetchFromTmdb(endpoint, sort_by, page, regionKey, extraParams) {
    const today = new Date().toISOString().split('T')[0];
    const isMovie = endpoint.includes("movie");

    let queryParams = {
        language: "zh-CN",
        page: page,
        ...extraParams
    };

    if (regionKey) queryParams.with_origin_country = regionKey;

    if (sort_by === "hot") {
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 10;
    } else if (sort_by === "new") {
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        queryParams[isMovie ? "primary_release_date.lte" : "first_air_date.lte"] = today;
    } else if (sort_by === "top") {
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = isMovie ? 150 : 50;
    }

    const res = await Widget.tmdb.get(endpoint, { params: queryParams });
    
    return (res.results || []).map(i => {
        const score = i.vote_average ? i.vote_average.toFixed(1) : "N/A";
        return {
            id: String(i.id),
            type: "tmdb",
            mediaType: isMovie ? "movie" : "tv",
            title: i.title || i.name,
            subTitle: `⭐ ${score} | ${i.release_date || i.first_air_date || "未知"}`,
            posterPath: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
            description: i.overview || "暂无简介"
        };
    });
}
