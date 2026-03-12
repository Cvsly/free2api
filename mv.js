const $module = "BilibiliPGC";
const $name = "B站PGC榜单";
const $version = "1.0.0";
const $author = "";
const $description = "B站番剧/国创/影视综艺PGC排行榜";
const $type = "series";
const $logo = "";
const $host = "https://api.bilibili.com";

// 分类：PGC 大类
function classify() {
    return [
        { name: "番剧", id: "1" },
        { name: "国创", id: "2" },
        { name: "纪录片", id: "3" },
        { name: "综艺", id: "4" },
        { name: "电影", id: "5" },
        { name: "电视剧", id: "6" }
    ];
}

// 首页 = 番剧 3日榜
async function home(page = 1) {
    return await getRank(1, 3, page);
}

// 搜索 B站 PGC
async function search(keyword, page = 1) {
    try {
        const url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${encodeURIComponent(keyword)}&search_type=media_ft&page=${page}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.bilibili.com/"
            }
        });
        const data = await res.json();
        if (data.code !== 0 || !data.data?.result) return [];

        return data.data.result.map(item => ({
            title: item.title?.replace(/<[^>]+>/g, "") || "未知",
            cover: item.cover || "",
            id: item.season_id || "",
            url: item.season_id || ""
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

// 详情：只展示信息，不跳转、不播放
async function detail(id) {
    return {
        title: "B站PGC详情",
        cover: "",
        desc: "本模块仅展示榜单，不提供播放",
        episodes: [
            { name: "榜单展示专用", url: "none" }
        ]
    };
}

// 播放：直接返回空，不跳B站
async function play(url) {
    return {
        playUrl: ""
    };
}

// ==================== 工具函数：获取榜单 ====================
async function getRank(type, day = 3, page = 1) {
    try {
        const url = `https://api.bilibili.com/pgc/season/rank/list?type=${type}&day=${day}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.bilibili.com/"
            }
        });
        const data = await res.json();
        if (data.code !== 0 || !data.data?.list) return [];

        return data.data.list.map(item => ({
            title: item.title || "未知",
            cover: item.cover || "",
            id: item.season_id || "",
            url: item.season_id || ""
        }));
    } catch (e) {
        console.error(e);
        return []
    }
}