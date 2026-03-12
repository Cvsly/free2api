/**
 * 国内聚合榜单 - 标准元数据版
 * 专注于提供准确的榜单数据和播出日期，触发 App 自动资源匹配
 */

WidgetMetadata = {
    id: "bilibili_rank_aggregate",
    title: "国内聚合榜单",
    description: "同步 B 站 PGC 数据，支持全网资源匹配",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "3.7.0",
    requiredVersion: "0.0.1",
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

// ================= [1. 列表加载] =================

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
        id: `bili_ss${item.season_id}`,
        type: "link",  // 保持 link 类型以支持 loadDetail
        title: item.title,
        subTitle: item.rating ? `⭐ ${item.rating}` : "暂无评分",
        coverUrl: item.cover,
        // 将 season_id 传给详情页
        link: item.season_id.toString(),
        mediaType: (seasonType === 2 || seasonType === 3) ? "movie" : "tv"
    }));
}

// ================= [2. 详情加载 - 解决时间不详 & 触发聚合] =================

async function loadDetail(seasonId) {
    try {
        const apiUrl = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
        const res = await Widget.http.get(apiUrl, { headers: { "Referer": "https://www.bilibili.com/" } });
        
        if (!res?.data?.result) return null;
        const data = res.data.result;

        // 👉 核心：抓取精准日期
        let pubDate = "";
        if (data.publish?.pub_date) {
            pubDate = data.publish.pub_date.substring(0, 10);
        } else if (data.publish?.release_date_show) {
            // 兼容有些是字符串显示的情况
            const match = data.publish.release_date_show.match(/\d{4}-\d{2}-\d{2}/);
            pubDate = match ? match[0] : "";
        }

        // 返回标准对象，不包含 episodeItems，App 会自动切换到资源搜索模式
        return {
            id: `bili_ss${seasonId}`,
            title: data.title,
            type: "link",
            // 这里提供一个外部链接作为参考
            link: `https://www.bilibili.com/bangumi/play/ss${seasonId}`,
            description: data.evaluate || data.shell_desc || "暂无简介",
            coverUrl: data.cover,
            releaseDate: pubDate, // 这里精准赋值 YYYY-MM-DD
            rating: data.rating?.score || 0,
            mediaType: data.type === 2 ? "movie" : "tv",
            // 注入额外信息，增强跨插件搜索准确性
            genreTitle: data.styles?.join(",") || "",
            // 如果详情里不需要播放 B 站自己的流，这里就不写 episodeItems
        };
    } catch (e) {
        return null;
    }
}
