/**
 * 全球影视专区 - 旗舰版 (v2.5.2)
 * 优化重点：
 * 1. 结构重组：一级菜单独立模块化，二级菜单逻辑分发。
 * 2. 动漫增强：仅动漫分类保留地区切换，其余分类保持极简。
 * 3. 性能优化：统一 buildItem 构造器，完善 GenreMap 匹配。
 */

// ================= [1. 基础配置与映射] =================

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10764: "真人秀", 10767: "脱口秀"
};

// --- 参数构造：动漫专属 (带地区) ---
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
        { name: "page", title: "页码", type: "page", startPage: 1 }
    ];
}

// --- 参数构造：极简通用 ---
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
        { name: "page", title: "页码", type: "page", startPage: 1 }
    ];
}

// ================= [2. 组件元数据] =================

var WidgetMetadata = {
    id: "global_media_pro_makka",
    title: "全球万能影视",
    description: "独立分类探索纯正的本土电影与剧集",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "2.5.2",
    modules: [
        { title: "🎬 电影专区", functionName: "loadMovies", type: "video", params: getSimpleParams() },
        { title: "📺 剧集专区", functionName: "loadTV", type: "video", params: getSimpleParams() },
        { title: "🎨 动漫世界", functionName: "loadAnime", type: "video", params: getAnimeParams() },
        { title: "💃 综艺大观", functionName: "loadVariety", type: "video", params: getSimpleParams() }
    ]
};

// ================= [3. 业务逻辑处理器] =================

async function loadMovies(params) { return await unifiedLoader("movie", params, ""); }
async function loadTV(params) { return await unifiedLoader("tv", params, ""); }
async function loadVariety(params) { return await unifiedLoader("variety", params, "CN"); }
async function loadAnime(params) { 
    const region = params.region || "JP";
    return await unifiedLoader("anime", params, region); 
}

/**
 * 统一数据加载引擎
 */
async function unifiedLoader(category, params, region) {
    const sort_by = params.sort_by || "hot";
    const page = parseInt(params.page) || 1;
    
    let endpoint = "/discover/tv";
    let extraParams = {};

    // 分类过滤器逻辑
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
        default: // 纯剧集：排除动画和综艺
            extraParams.without_genres = "16,10764,10767";
            break;
    }

    try {
        const results = await fetchFromTmdb(endpoint, sort_by, page, region, extraParams);
        return results.length > 0 ? results : [{ id: "empty", type: "text", title: "无数据", description: "尝试更换排序或稍后再试" }];
    } catch (e) {
        console.error(e);
        return [{ id: "error", type: "text", title: "加载失败", description: "网络异常或参数错误" }];
    }
}

// ================= [4. 数据抓取与清洗] =================

async function fetchFromTmdb(endpoint, sort_by, page, regionKey, extraParams) {
    const today = new Date().toISOString().split('T')[0];
    const isMovie = endpoint.includes("movie");
    
    let queryParams = {
        language: "zh-CN",
        page: page,
        include_adult: false,
        ...extraParams
    };

    if (regionKey) queryParams.with_origin_country = regionKey;

    // 排序逻辑实现
    if (sort_by === "hot" || sort_by === "popularity") {
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 5; 
    } 
    else if (sort_by === "new" || sort_by === "time") {
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        queryParams[isMovie ? "primary_release_date.lte" : "first_air_date.lte"] = today;
    } 
    else if (sort_by === "top" || sort_by === "rating") {
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = isMovie ? 100 : 30; 
    }

    const res = await Widget.tmdb.get(endpoint, { params: queryParams });
    const mediaType = isMovie ? "movie" : "tv";
    
    return (res.results || []).map(item => buildItem(item, mediaType));
}

/**
 * 统一数据项构造器 (基于原版逻辑优化)
 */
function buildItem(item, mediaType) {
    if (!item) return null;
    
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    
    // 类型解析逻辑
    const genreIds = item.genre_ids || [];
    const genreText = genreIds.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ") || "影视";
    
    const typeTag = mediaType === "movie" ? "🎬 电影" : "📺 剧集";

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", 
        mediaType: mediaType,
        title: title,
        subTitle: `⭐ ${score} | ${releaseDate.substring(0, 4) || "未知"}`,
        genreTitle: genreText,    
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", 
        description: `${typeTag} | 分数: ${score}\n${item.overview || "暂无简介"}`
    };
}
