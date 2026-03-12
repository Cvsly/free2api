/**
 * 全球影视专区 + B站 PGC 聚合版
 * 1. 保留 TMDB 全球探索逻辑
 * 2. 新增 B站 PGC 官方榜单模块
 * 3. 增强聚合：支持通过 loadDetail 获取 B站 精准播出时间
 */

WidgetMetadata = {
    id: "global_series_bili_aggregate",
    title: "全球影视聚合",
    description: "全球 TMDB 探索 + B站官方 PGC 榜单，支持资源自动匹配",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.0.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 86400,
    modules: [
        // ================= 模块 1：B站 PGC 官方榜单 (新增) =================
        {
            title: "🌸 B站 PGC 榜单",
            functionName: "loadBiliRank",
            type: "video",
            cacheDuration: 3600,
            params: [
                {
                    name: "seasonType",
                    title: "选择频道",
                    type: "enumeration",
                    value: "1",
                    enumOptions: [
                        { title: "🌸 番剧 (Bangumi)", value: "1" },
                        { title: "🐉 国创 (Guochuang)", value: "4" },
                        { title: "🎬 电影 (Movie)", value: "2" },
                        { title: "📺 电视剧 (TV Series)", value: "5" },
                        { title: "🎥 纪录片 (Documentary)", value: "3" }
                    ]
                },
                {
                    name: "day",
                    title: "时间范围",
                    type: "enumeration",
                    value: "3",
                    enumOptions: [
                        { title: "🔥 三日热播榜", value: "3" },
                        { title: "📅 一周热门榜", value: "7" }
                    ]
                }
            ]
        },
        // ================= 模块 2：全球探索发现 (保留) =================
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
                        { title: "🇨🇳 大陆", value: "CN" }, { title: "🇺🇸 美国", value: "US" },
                        { title: "🇯🇵 日本", value: "JP" }, { title: "🇰🇷 韩国", value: "KR" },
                        { title: "🇭🇰 香港", value: "HK" }, { title: "🇹🇼 台湾", value: "TW" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "影视类型",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌟 全部", value: "all" },
                        { title: "🎬 电影", value: "movie" },
                        { title: "📺 剧集", value: "tv" }
                    ]
                },
                {
                    name: "sort_by",
                    title: "排序榜单",
                    type: "enumeration",
                    value: "hot",
                    enumOptions: [
                        { title: "🔥 近期热播", value: "hot" },
                        { title: "🆕 最新上线", value: "new" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },
        // ================= 模块 3：高级类型榜单 (保留) =================
        {
            title: "🏷️ 高级类型榜单",
            functionName: "loadGenreRank",
            type: "video",
            cacheDuration: 3600,
            params: [
                {
                    name: "mediaType",
                    title: "影视类型",
                    type: "enumeration",
                    value: "movie",
                    enumOptions: [{ title: "🎬 电影", value: "movie" }, { title: "📺 剧集", value: "tv" }]
                },
                {
                    name: "genre",
                    title: "题材流派",
                    type: "enumeration",
                    value: "scifi",
                    enumOptions: [{ title: "🛸 科幻", value: "scifi" }, { title: "🔍 悬疑", value: "mystery" }]
                }
            ]
        }
    ]
};

// =========================================================================
// [新增逻辑] Bilibili PGC 处理器
// =========================================================================

async function loadBiliRank(params) {
    const seasonType = params.seasonType || "1";
    const day = params.day || "3";
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;

    try {
        const response = await Widget.http.get(url, {
            headers: { "Referer": "https://www.bilibili.com/" }
        });

        if (!response?.data?.result?.list) return [];
        const list = response.data.result.list;

        return list.map((item, index) => {
            const isMovie = (seasonType === "2" || seasonType === "3");
            const score = item.rating || "暂无评分";

            return {
                id: `bili_ss${item.season_id}`,
                type: "link", // 设为 link 触发 loadDetail
                mediaType: isMovie ? "movie" : "tv",
                title: item.title,
                subTitle: `TOP ${index + 1} | ⭐ ${score}`,
                coverUrl: item.cover,
                link: item.season_id.toString(), // 传递 season_id 给 loadDetail
                rating: parseFloat(score) || 0,
                description: `⭐ 评分: ${score}\n${item.new_ep?.index_show || ""}\n${item.desc || ""}`
            };
        });
    } catch (e) {
        return [{ id: "err", type: "text", title: "加载失败", description: e.message }];
    }
}

/**
 * 详情处理器：解决 B站 播出时间不详并增强聚合搜索
 */
async function loadDetail(link) {
    // 判断是否为 B站 ID (纯数字或 bili_ 前缀)
    if (!link.includes("http") && !isNaN(link)) {
        try {
            const apiUrl = `https://api.bilibili.com/pgc/view/web/season?season_id=${link}`;
            const res = await Widget.http.get(apiUrl, { headers: { "Referer": "https://www.bilibili.com/" } });
            if (!res?.data?.result) return null;
            const data = res.data.result;

            let pubDate = "";
            if (data.publish?.pub_date) {
                pubDate = data.publish.pub_date.substring(0, 10);
            } else if (data.publish?.release_date_show) {
                const match = data.publish.release_date_show.match(/\d{4}-\d{2}-\d{2}/);
                pubDate = match ? match[0] : "";
            }

            return {
                id: `bili_ss${link}`,
                title: data.title,
                type: "link",
                link: `https://www.bilibili.com/bangumi/play/ss${link}`,
                description: data.evaluate || "暂无简介",
                coverUrl: data.cover,
                releaseDate: pubDate, // 精准日期，聚合关键
                mediaType: data.type === 2 ? "movie" : "tv",
                rating: data.rating?.score || 0
            };
        } catch (e) { return null; }
    }
    // 如果是 TMDB 或其他逻辑，这里可以根据需要扩展
    return null;
}

// =========================================================================
// [保留逻辑] TMDB 处理器 (原样保留，仅微调以兼容)
// =========================================================================

const GLOBAL_GENRE_MAP = { 28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片", 18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐", 9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部", 10759: "动作冒险" };

function getGenreText(ids) { if (!ids || !Array.isArray(ids)) return ""; return ids.map(id => GLOBAL_GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / "); }

function buildItem(item, forceMediaType) {
    if (!item) return null;
    const mediaType = forceMediaType || item.media_type || (item.title ? "movie" : "tv");
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", 
        mediaType: mediaType,
        title: item.title || item.name,
        releaseDate: releaseDate, 
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", 
        description: `⭐ ${score}\n${item.overview || "暂无简介"}`,
        rating: item.vote_average || 0,
        _popularity: item.popularity || 0,
        _date: releaseDate || "1970-01-01"
    };
}

async function fetchFromTmdb(endpoint, sort_by, page, regionKey) {
    const today = new Date().toISOString().split('T')[0];
    let queryParams = { language: "zh-CN", page: page };
    if (regionKey === "ES_LANG") queryParams.with_original_language = "es";
    else if (regionKey === "EU") queryParams.with_origin_country = "FR|DE|IT|NL|DK|NO|FI";
    else queryParams.with_origin_country = regionKey;
    const isMovie = endpoint.includes("movie");
    if (sort_by === "hot") { queryParams.sort_by = "popularity.desc"; queryParams["vote_count.gte"] = 5; }
    else if (sort_by === "new") { queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc"; queryParams[isMovie ? "primary_release_date.lte" : "first_air_date.lte"] = today; queryParams["vote_count.gte"] = 1; }
    const res = await Widget.tmdb.get(endpoint, { params: queryParams });
    return (res.results || []).map(i => buildItem(i, isMovie ? "movie" : "tv")).filter(Boolean);
}

async function loadGlobalList(params) {
    const { region = "CN", mediaType = "all", sort_by = "hot", page = 1 } = params;
    try {
        let items = [];
        if (mediaType === "all") {
            const [movies, tvs] = await Promise.all([fetchFromTmdb("/discover/movie", sort_by, page, region), fetchFromTmdb("/discover/tv", sort_by, page, region)]);
            items = [...movies, ...tvs].sort((a, b) => sort_by === "hot" ? b._popularity - a._popularity : new Date(b._date) - new Date(a._date)).slice(0, 20);
        } else {
            items = await fetchFromTmdb(mediaType === "movie" ? "/discover/movie" : "/discover/tv", sort_by, page, region);
        }
        return items.length ? items : [{ id: "empty", type: "text", title: "无数据" }];
    } catch (e) { return [{ id: "error", type: "text", title: "网络异常" }]; }
}

async function loadGenreRank(params = {}) {
    // 逻辑与原代码一致... (此处省略 loadGenreRank 内部 buildItem 部分以节省篇幅，保持你原有的即可)
    // 建议直接在原代码基础上追加上面的 loadBiliRank 和修改后的 WidgetMetadata
}
