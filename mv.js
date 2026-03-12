// ================= 1. 先定义参数构造函数 (防止初始化引用报错) =================

// 动漫专属二级菜单 (含地区)
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
                { title: "🏆 高分好评", value: "top" }
            ]
        },
        { name: "page", title: "页码", type: "page", startPage: 1 }
    ];
}

// 其他模块极简菜单 (无地区)
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

// ================= 2. 注册组件元数据 =================

var WidgetMetadata = {
    id: "global_movie_tv_anime_v2",
    title: "全球影视榜单",
    description: "一级分类独立，动漫支持地区切换",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "2.4.1",
    globalParams: [
        {
            name: "TMDB_API_KEY",
            title: "TMDB API Key",
            type: "input",
            description: "请填写 32位 Key 或 v4 Token"
        }
    ],
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
            params: getAnimeParams()
        },
        {
            title: "💃 热门综艺",
            functionName: "loadVariety",
            type: "video",
            params: getSimpleParams()
        }
    ]
};

// ================= 3. 核心请求分发逻辑 =================

async function loadMovies(params) { return await unifiedLoader("movie", params, ""); }
async function loadTV(params) { return await unifiedLoader("tv", params, ""); }
async function loadVariety(params) { return await unifiedLoader("variety", params, "CN"); }
async function loadAnime(params) { 
    const selectedRegion = params.region || "JP";
    return await unifiedLoader("anime", params, selectedRegion); 
}

async function unifiedLoader(category, params, defaultRegion) {
    const apiKey = params.TMDB_API_KEY;
    const sort_by = params.sort_by || "hot";
    const page = parseInt(params.page) || 1;

    if (!apiKey) {
        return [{ id: "error", type: "text", title: "未配置 API Key", description: "请在组件设置中填写 TMDB API Key" }];
    }

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
        default:
            extraParams.without_genres = "16,10764,10767";
            break;
    }

    try {
        const items = await fetchFromTmdb(endpoint, sort_by, page, defaultRegion, extraParams, apiKey);
        return items.length > 0 ? items : [{ id: "empty", type: "text", title: "暂无数据", description: "尝试更换排序或稍后再试" }];
    } catch (error) {
        return [{ id: "error", type: "text", title: "加载失败", description: error.message }];
    }
}

// ================= 4. 底层网络请求 (适配 Widget.http) =================

async function fetchFromTmdb(endpoint, sort_by, page, regionKey, extraParams, apiKey) {
    const today = new Date().toISOString().split('T')[0];
    const isMovie = endpoint.includes("movie");
    const url = `https://api.themoviedb.org/3${endpoint}`;

    let queryParams = {
        language: "zh-CN",
        page: page,
        ...extraParams
    };

    if (regionKey) queryParams.with_origin_country = regionKey;

    // 鉴权处理
    let headers = { "Content-Type": "application/json;charset=utf-8" };
    if (apiKey.length > 50) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
        queryParams["api_key"] = apiKey;
    }

    // 排序逻辑
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

    const res = await Widget.http.get(url, { params: queryParams, headers: headers });
    const data = res.data || {};
    
    return (data.results || []).map(i => {
        const score = i.vote_average ? i.vote_average.toFixed(1) : "N/A";
        return {
            id: String(i.id),
            type: "tmdb",
            mediaType: isMovie ? "movie" : "tv",
            title: i.title || i.name,
            subTitle: `⭐ ${score} | ${i.release_date || i.first_air_date || "未知"}`,
            posterPath: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
            backdropPath: i.backdrop_path ? `https://image.tmdb.org/t/p/w780${i.backdrop_path}` : "",
            description: i.overview || "暂无简介"
        };
    });
}
