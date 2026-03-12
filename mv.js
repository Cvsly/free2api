BilibiliPGCRank.js - Forward B站PGC榜单模块
// ==================== Forward Widget 元数据规范 ====================
const WidgetMetadata = {
    id: "bilibili-pgc-rank",
    title: "B站PGC榜单",
    version: "1.0.0",
    requiredVersion: "1.0.0",
    description: "哔哩哔哩番剧/国创/纪录片/综艺/电影/电视剧 PGC排行榜",
    author: "Forward Dev",
    detailCacheDuration: 180,
    // 功能模块：6大PGC品类榜单
    modules: [
        {
            title: "番剧榜单",
            functionName: "getAnimeRank",
            cacheDuration: 300,
            // 榜单时间参数：3日榜/周榜/月榜
            params: [
                { name: "type", type: "constant", value: "1" },
                { name: "day", type: "enumeration", value: "3", options: ["3", "7", "30"], labels: ["三日榜", "周榜", "月榜"] }
            ]
        },
        {
            title: "国创榜单",
            functionName: "getGuochuangRank",
            cacheDuration: 300,
            params: [
                { name: "type", type: "constant", value: "2" },
                { name: "day", type: "enumeration", value: "3", options: ["3", "7", "30"], labels: ["三日榜", "周榜", "月榜"] }
            ]
        },
        {
            title: "纪录片榜单",
            functionName: "getDocumentaryRank",
            cacheDuration: 300,
            params: [
                { name: "type", type: "constant", value: "3" },
                { name: "day", type: "enumeration", value: "3", options: ["3", "7", "30"], labels: ["三日榜", "周榜", "月榜"] }
            ]
        },
        {
            title: "综艺榜单",
            functionName: "getVarietyRank",
            cacheDuration: 300,
            params: [
                { name: "type", type: "constant", value: "4" },
                { name: "day", type: "enumeration", value: "3", options: ["3", "7", "30"], labels: ["三日榜", "周榜", "月榜"] }
            ]
        },
        {
            title: "电影榜单",
            functionName: "getMovieRank",
            cacheDuration: 300,
            params: [
                { name: "type", type: "constant", value: "5" },
                { name: "day", type: "enumeration", value: "3", options: ["3", "7", "30"], labels: ["三日榜", "周榜", "月榜"] }
            ]
        },
        {
            title: "电视剧榜单",
            functionName: "getTvRank",
            cacheDuration: 300,
            params: [
                { name: "type", type: "constant", value: "6" },
                { name: "day", type: "enumeration", value: "3", options: ["3", "7", "30"], labels: ["三日榜", "周榜", "月榜"] }
            ]
        }
    ],
    // 搜索功能：搜索PGC内容
    search: {
        title: "搜索B站PGC",
        functionName: "searchPgc",
        params: [
            { name: "keyword", type: "input" }
        ]
    }
};

// ==================== 核心请求工具函数 ====================
async function requestPgcRank(type, day) {
    try {
        // B站公开PGC排行榜API 无鉴权
        const url = `https://api.bilibili.com/pgc/season/rank/list?type=${type}&day=${day}`;
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 Bilibili ForwardWidget",
                "Referer": "https://www.bilibili.com/"
            }
        });

        const data = JSON.parse(response.body);
        if (data.code !== 0) throw new Error("API请求失败");

        // 转换为Forward标准列表格式
        return data.data.list.map(item => ({
            id: `bilibili-pgc-${item.season_id}`,
            type: "link", // 跳转详情类型
            title: item.title,
            cover: item.cover,
            rating: item.score || "暂无评分",
            desc: `${item.index_show} | ${item.areas || "未知地区"}`,
            link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`,
            mediaType: type === 5 ? "movie" : "tv",
            duration: item.new_ep?.index_show || "完结"
        }));
    } catch (err) {
        console.error("B站PGC榜单请求失败:", err);
        return [];
    }
}

// ==================== 榜单处理函数 ====================
async function getAnimeRank(params) {
    return await requestPgcRank(params.type, params.day);
}

async function getGuochuangRank(params) {
    return await requestPgcRank(params.type, params.day);
}

async function getDocumentaryRank(params) {
    return await requestPgcRank(params.type, params.day);
}

async function getVarietyRank(params) {
    return await requestPgcRank(params.type, params.day);
}

async function getMovieRank(params) {
    return await requestPgcRank(params.type, params.day);
}

async function getTvRank(params) {
    return await requestPgcRank(params.type, params.day);
}

// ==================== 搜索函数 ====================
async function searchPgc(params) {
    try {
        const keyword = encodeURIComponent(params.keyword);
        const url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&search_type=media_ft`;
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 Bilibili ForwardWidget",
                "Referer": "https://www.bilibili.com/"
            }
        });

        const data = JSON.parse(response.body);
        return data.data.result.map(item => ({
            id: `bilibili-pgc-${item.season_id}`,
            type: "link",
            title: item.title,
            cover: item.cover,
            rating: item.score || "暂无评分",
            desc: `${item.cat} | ${item.areas}`,
            link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`,
            mediaType: item.cat.includes("电影") ? "movie" : "tv"
        }));
    } catch (err) {
        console.error("B站PGC搜索失败:", err);
        return [];
    }
}

// ==================== 详情加载函数 ====================
async function loadDetail(link) {
    try {
        const response = await Widget.http.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 Bilibili ForwardWidget",
                "Referer": "https://www.bilibili.com/"
            }
        });

        const $ = Widget.html.load(response.body);
        const title = $("h1.bangumi-title").text().trim();
        const cover = $("div.media-cover img").attr("src");
        const desc = $("div.desc-info").text().trim();

        return {
            title,
            cover,
            desc,
            videoUrl: link // B站播放页链接
        };
    } catch (err) {
        console.error("详情加载失败:", err);
        return {};
    }
}