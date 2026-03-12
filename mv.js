/**
 * 全球影视专区 - Forward 规范优化版
 * 遵循 SKILL.md 规范：
 * 1. 结构优化：先声明参数构造函数，再声明 WidgetMetadata。
 * 2. 模块独立：电影、剧集、动漫、综艺分模块配置。
 * 3. 动漫增强：仅动漫模块提供地区（region）过滤参数。
 */

// ================= [1. 参数构造函数 - 必须放在 Metadata 之前] =================

// 动漫专属参数：包含地区切换
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

// 通用参数：仅排序与分页
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

// ================= [2. WidgetMetadata 定义] =================

WidgetMetadata = {
    id: "global_media_pro_final", // 建议更换 ID 以避免冲突
    title: "全球影视探索",
    description: "遵循 Forward 规范开发的影视聚合插件",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "2.5.3",
    requiredVersion: "0.0.3", // 对应 skill 中的当前版本
    
    // 如果需要 API Key，可以在这里开启
    // globalParams: [{ name: "apiKey", title: "TMDB API Key", type: "input" }],

    modules: [
        {
            title: "🎬 热门电影",
            functionName: "loadMovies",
            type: "video",
            params: getSimpleParams()
        },
        {
            title: "📺 热门剧集",
            functionName: "loadTV",
            type: "video",
            params: getSimpleParams()
        },
        {
            title: "🎨 热门动漫",
            functionName: "loadAnime",
            type: "video",
            params: getAnimeParams() // 只有这里有地区选项
        },
        {
            title: "💃 热门综艺",
            functionName: "loadVariety",
            type: "video",
            params: getSimpleParams()
        }
    ]
};

// ================= [3. 处理器函数] =================

async function loadMovies(params) { return await unifiedLoader("movie", params, ""); }
async function loadTV(params) { return await unifiedLoader("tv", params, ""); }
async function loadVariety(params) { return await unifiedLoader("variety", params, "CN"); }
async function loadAnime(params) { 
    const region = params.region || "JP";
    return await unifiedLoader("anime", params, region); 
}

/**
 * 核心加载引擎
 */
async function unifiedLoader(category, params, region) {
    const sort_by = params.sort_by || "hot";
    const page = parseInt(params.page) || 1;
    
    let endpoint = "/discover/tv";
    let extraParams = {};

    // 分类过滤器
    switch(category) {
        case "movie":
            endpoint = "/discover/movie";
            break;
        case "anime":
            extraParams.with_genres = "16"; // 动画标签
            break;
        case "variety":
            extraParams.with_genres = "10764,10767"; // 综艺标签
            break;
        default: 
            extraParams.without_genres = "16,10764,10767";
            break;
    }

    try {
        // 使用 Widget.tmdb API
        const query = {
            language: "zh-CN",
            page: page,
            ...extraParams
        };

        if (region) query.with_origin_country = region;

        // 排序映射
        if (sort_by === "hot") query.sort_by = "popularity.desc";
        if (sort_by === "new") query.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        if (sort_by === "top") query.sort_by = "vote_average.desc";

        const res = await Widget.tmdb.get(endpoint, { params: query });
        
        if (!res || !res.results) return [];

        return res.results.map(item => ({
            id: String(item.id),
            type: "tmdb", // 声明为 tmdb 类型，App 会自动补全详情
            mediaType: endpoint.includes("movie") ? "movie" : "tv",
            title: item.title || item.name,
            description: item.overview,
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path,
            rating: item.vote_average,
            releaseDate: item.release_date || item.first_air_date
        }));

    } catch (e) {
        console.error("加载失败:", e);
        return [{ id: "err", type: "text", title: "加载失败", description: e.message }];
    }
}
