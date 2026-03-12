/**
 * 全球影视榜单 - B站 PGC 聚合优化版
 * 结构参考：Globalseries.js
 */

// ================= [1. WidgetMetadata] =================

WidgetMetadata = {
    id: "bilibili_standard_aggregate",
    title: "国内聚合榜单",
    description: "同步 B 站 PGC 榜单，支持详情页深度解析与资源聚合",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.6.0",
    requiredVersion: "0.0.1",
    // 关键配置：详情缓存时间
    detailCacheDuration: 86400, 
    
    modules: [
        { title: "🌸 番剧", functionName: "loadBangumi", type: "video", params: getParams() },
        { title: "🐉 国创", functionName: "loadGuochuang", type: "video", params: getParams() },
        { title: "🎬 电影", functionName: "loadMovie", type: "video", params: getParams() },
        { title: "📺 电视剧", functionName: "loadTV", type: "video", params: getParams() },
        { title: "🎥 纪录片", functionName: "loadDocumentary", type: "video", params: getParams() }
    ]
};

function getParams() {
    return [{
        name: "day", title: "榜单时间", type: "enumeration", value: "3",
        enumOptions: [{ title: "三日热播", value: "3" }, { title: "一周热门", value: "7" }]
    }];
}

// ================= [2. 列表处理器 (List Handlers)] =================

async function loadBangumi(p) { return await fetchList(1, p.day); }
async function loadMovie(p) { return await fetchList(2, p.day); }
async function loadDocumentary(p) { return await fetchList(3, p.day); }
async function loadGuochuang(p) { return await fetchList(4, p.day); }
async function loadTV(p) { return await fetchList(5, p.day); }

async function fetchList(seasonType, day) {
    const url = `https://api.bilibili.com/pgc/web/rank/list?day=${day}&season_type=${seasonType}`;
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    if (!res?.data?.result?.list) return [];

    return res.data.result.list.map(item => ({
        id: `bili_ss${item.season_id}`, // 规范 ID 格式
        type: "link",                   // 必须为 link 才能触发 loadDetail
        title: item.title,
        subTitle: item.rating ? `⭐ ${item.rating}` : "暂无评分",
        coverUrl: item.cover,
        // link 必须是唯一的，用于传递给 loadDetail
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`,
        mediaType: (seasonType === 2 || seasonType === 3) ? "movie" : "tv"
    }));
}

// ================= [3. 详情处理器 (Detail Handler) - 聚合核心] =================

/**
 * 对应 Globalseries.js 中的 loadDetail
 * 当用户点击列表项时，App 会调用此函数
 */
async function loadDetail(link) {
    try {
        // 从链接中提取 season_id
        const seasonId = link.match(/ss(\d+)/)?.[1];
        if (!seasonId) return null;

        // 调用 B 站 PGC 详情接口获取深度元数据
        const apiUrl = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
        const res = await Widget.http.get(apiUrl, { headers: { "Referer": "https://www.bilibili.com/" } });
        
        if (!res?.data?.result) return null;
        const data = res.data.result;

        // 👉 修复播出时间：优先使用发布时间
        const pubDate = data.publish?.pub_date || data.publish?.release_date_show || "";

        // 构造标准的详情对象
        return {
            id: `bili_ss${seasonId}`,
            title: data.title,
            type: "link",
            link: link,
            description: data.evaluate || data.shell_desc || "暂无简介",
            coverUrl: data.cover,
            releaseDate: pubDate.substring(0, 10), // 确保格式为 YYYY-MM-DD
            rating: data.rating?.score || 0,
            mediaType: data.type === 2 ? "movie" : "tv",
            
            // 👉 聚合关键：注入豆瓣或相关信息（如果存在）
            // B 站有时在描述里会提到豆瓣评分，可以通过正则尝试匹配（可选）
            
            // 选集列表：让详情页可以直接看到并点击播放
            episodeItems: data.episodes?.map(ep => ({
                id: ep.id.toString(),
                title: ep.share_copy || `第 ${ep.index} 话`,
                type: "url",
                videoUrl: ep.link
            })) || [],
            
            // 关联推荐
            relatedItems: data.areas?.map(area => ({
                id: `area_${area.id}`,
                type: "text",
                title: `地区: ${area.name}`
            })) || []
        };
    } catch (e) {
        console.error("Detail Load Error:", e);
        return null;
    }
}

// ================= [4. 辅助函数] =================

function formatCount(count) {
    if (!count) return "0";
    return count < 10000 ? count : (count / 10000).toFixed(1) + "万";
}
