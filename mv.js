/**
 * 全球影视榜单 - 完美适配版
 * 1. 一级菜单：电影、剧集、动漫、综艺独立
 * 2. 二级菜单：仅动漫保留地区切换，其余仅保留排序
 * 3. 修复：初始化加载顺序与 API 鉴权逻辑
 */

// ================= [1. 辅助参数构造器] =================

// 动漫专属参数：包含地区切换
function getAnimeParams() {
    return [
        {
            name: "region",
            title: "动漫地区",
            type: "enumeration",
            value: "JP",
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

// ================= [2. 核心组件配置] =================

var WidgetMetadata = {
    id: "global_media_expert_v2",
    title: "全球影视探索",
    description: "独立分类菜单，极致筛选体验",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "2.5.0",
    globalParams: [
        {
            name: "TMDB_API_KEY",
            title: "TMDB API Key",
            type: "input",
            description: "必填：支持 32位 Key 或 v4 Token"
        }
    ],
    modules: [
        { title: "🎬 热门电影", functionName: "loadMovies", type: "video", params: getSimpleParams() },
        { title: "📺 热门剧集", functionName: "loadTV", type: "video", params: getSimpleParams() },
        { title: "🎨 热门动漫", functionName: "loadAnime", type: "video", params: getAnimeParams() },
        { title: "💃 热门综艺", functionName: "loadVariety", type: "video", params: getSimpleParams() }
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
 * 统一加载器：处理不同模块的过滤逻辑
 */
async function unifiedLoader(category, params, region) {
    const apiKey = params.TMDB_API_KEY;
    if (!apiKey) {
        return [{ id: "err", type: "text", title: "未填 API Key", description: "请在组件设置中填写 TMDB Key" }];
    }

    const sort_by = params.sort_by || "hot";
    const page = parseInt(params.page) || 1;
    
    let endpoint = "/discover/tv";
    let extraParams = {};

    // 模块化过滤配置
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
        default: // 纯剧集：排除掉动漫(16)和综艺(10764,10767)
            extraParams.without_genres = "16,10764,10767";
            break;
    }

    try {
        const results = await fetchTmdb(endpoint, sort_by, page, region, extraParams, apiKey);
        return results.length > 0 ? results : [{ id: "empty", type: "text", title: "无数据", description: "尝试切换排序或页码" }];
    } catch (e) {
        return [{ id: "error", type: "text", title: "加载失败", description: e.message }];
    }
}

// ================= [4. TMDB 通讯内核] =================

async function fetchTmdb(endpoint, sort_by, page, region, extraParams, apiKey) {
    const isMovie = endpoint.includes("movie");
    const today = new Date().toISOString().split('T')[0];
    
    let query = {
        language: "zh-CN",
        page: page,
        include_adult: false,
        ...extraParams
    };

    if (region) query.with_origin_country = region;

    // 排序逻辑细化
    if (sort_by === "hot") {
        query.sort_by = "popularity.desc";
        query["vote_count.gte"] = 15;
    } else if (sort_by === "new") {
        query.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        query[isMovie ? "primary_release_date.lte" : "first_air_date.lte"] = today;
    } else if (sort_by === "top") {
        query.sort_by = "vote_average.desc";
        query["vote_count.gte"] = isMovie ? 200 : 50; 
    }

    // 鉴权头部处理
    let headers = { "Content-Type": "application/json" };
    if (apiKey.length > 50) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
        query["api_key"] = apiKey;
    }

    const url = `https://api.themoviedb.org/3${endpoint}`;
    const res = await Widget.http.get(url, { params: query, headers: headers });
    
    if (!res.data || !res.data.results) throw new Error("API 返回异常");

    return res.data.results.map(i => {
        const score = i.vote_average ? i.vote_average.toFixed(1) : "暂无";
        const date = i.release_date || i.first_air_date || "";
        return {
            id: String(i.id),
            type: "tmdb",
            mediaType: isMovie ? "movie" : "tv",
            title: i.title || i.name,
            subTitle: `⭐ ${score} | ${date.substring(0, 4)}`,
            posterPath: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
            backdropPath: i.backdrop_path ? `https://image.tmdb.org/t/p/w780${i.backdrop_path}` : "",
            description: i.overview || "暂无简介"
        };
    });
}
