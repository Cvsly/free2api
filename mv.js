/**
 * 全球影视专区 + B站 PGC 深度聚合版
 * 功能：通过 TMDB 补全 B站榜单元数据，解决封面比例及资源匹配问题
 */

WidgetMetadata = {
    id: "global_series_bili_tmdb_hybrid",
    title: "全球影视深度聚合",
    version: "4.0.0",
    detailCacheDuration: 86400,
    modules: [
        {
            title: "🌸 B站 PGC 榜单 (TMDB 补全)",
            functionName: "loadBiliRank",
            type: "video",
            params: [
                {
                    name: "seasonType", title: "频道", type: "enumeration", value: "1",
                    enumOptions: [
                        { title: "番剧", value: "1" }, { title: "国创", value: "4" },
                        { title: "电影", value: "2" }, { title: "电视剧", value: "5" }
                    ]
                }
            ]
        },
        // ... 原有的 TMDB 全球探索模块保持不变
    ]
};

// ================= [1. 列表加载：获取初步信息] =================

async function loadBiliRank(params) {
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=3&season_type=${params.seasonType}`;
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    if (!res?.data?.result?.list) return [];

    return res.data.result.list.map(item => ({
        id: `bili_ss${item.season_id}`,
        type: "link", 
        title: item.title,
        coverUrl: item.cover, // 列表页暂时用 B 站封面
        link: item.season_id.toString(),
        mediaType: (params.seasonType === "2" || params.seasonType === "5") ? "movie" : "tv"
    }));
}

// ================= [2. 详情加载：TMDB 跨站补全核心] =================

async function loadDetail(seasonId) {
    try {
        // 1. 获取 B 站深度元数据用于搜索
        const biliApi = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
        const biliRes = await Widget.http.get(biliApi, { headers: { "Referer": "https://www.bilibili.com/" } });
        const biliData = biliRes?.data?.result;
        if (!biliData) return null;

        // 清洗标题：去除“（正片）”、“第X季”等干扰词，提高 TMDB 匹配率
        const cleanTitle = biliData.title.replace(/（.*）|第.*季/g, "").trim();
        const pubYear = (biliData.publish?.pub_date || "").substring(0, 4);

        // 2. 调用 TMDB Search 补全元数据
        let tmdbMatch = null;
        try {
            const tmdbRes = await Widget.tmdb.get("/search/multi", {
                params: { query: cleanTitle, language: "zh-CN" }
            });
            // 匹配策略：寻找标题一致且年份最接近的
            tmdbMatch = (tmdbRes.results || []).find(r => 
                (r.title || r.name) === cleanTitle || 
                (r.release_date || r.first_air_date || "").includes(pubYear)
            ) || tmdbRes.results?.[0];
        } catch (e) { console.error("TMDB Search Failed"); }

        // 3. 构造最终的聚合对象
        const mediaType = biliData.type === 2 ? "movie" : "tv";
        
        // 如果 TMDB 匹配成功，我们“偷梁换柱”
        const finalItem = {
            id: tmdbMatch ? String(tmdbMatch.id) : `bili_ss${seasonId}`,
            tmdbId: tmdbMatch ? tmdbMatch.id : null,
            // 👉 关键：如果有 TMDB 数据，类型设为 tmdb，否则设为 link
            type: tmdbMatch ? "tmdb" : "link", 
            title: tmdbMatch ? (tmdbMatch.title || tmdbMatch.name) : biliData.title,
            description: tmdbMatch ? tmdbMatch.overview : biliData.evaluate,
            mediaType: mediaType,
            releaseDate: (biliData.publish?.pub_date || "").substring(0, 10),
            rating: tmdbMatch ? tmdbMatch.vote_average : (biliData.rating?.score || 0),
            
            // 👉 解决封面问题：优先使用 TMDB 的标准海报和背景
            posterPath: tmdbMatch?.poster_path || null,
            backdropPath: tmdbMatch?.backdrop_path || null,
            coverUrl: tmdbMatch ? `https://image.tmdb.org/t/p/w500${tmdbMatch.poster_path}` : biliData.cover,
            
            // 关联 B 站原始链接
            link: `https://www.bilibili.com/bangumi/play/ss${seasonId}`,
            
            // 加上这个可以让详情页更有质感
            genreTitle: biliData.styles?.join(" / ") || ""
        };

        return finalItem;

    } catch (error) {
        console.error("Hybrid Load Error:", error);
        return null;
    }
}
