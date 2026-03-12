const WidgetMetadata = {
    id: "com.cvsly.globalseries",
    title: "全球影视",
    version: "1.0.0",
    author: "Cvsly",
    description: "聚合全球影视、剧集、动漫资源",
    modules: [
        {
            title: "全球剧集",
            functionName: "loadGlobalSeries",
            cacheDuration: 3600
        },
        // 新增 Bilibili PGC 榜单
        {
            title: "Bilibili PGC 榜单",
            functionName: "loadBilibiliPgcRank",
            cacheDuration: 3600
        }
    ],
    search: {
        title: "全局搜索",
        functionName: "searchGlobal",
        params: [
            {
                name: "keyword",
                title: "关键词",
                type: "input"
            }
        ]
    }
};

// ====================== 你原来的代码完全保留，不动 ======================
async function loadGlobalSeries(params = {}) {
    try {
        const resp = await Widget.http.get("https://cdn.jsdelivr.net/gh/InchStudio/ForwardSource/globle/series.json", {
            timeout: 10000
        });
        return resp.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type || "link",
            posterPath: item.posterPath,
            rating: item.rating,
            desc: item.desc,
            link: item.link
        }));
    } catch (e) {
        console.error("loadGlobalSeries error", e);
        throw new Error("全球剧集加载失败");
    }
}

async function searchGlobal(params = {}) {
    try {
        const { keyword } = params;
        if (!keyword) throw new Error("请输入搜索关键词");
        const resp = await Widget.http.get("https://cdn.jsdelivr.net/gh/InchStudio/ForwardSource/search/global.json", {
            params: { keyword },
            timeout: 10000
        });
        return resp.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type || "link",
            posterPath: item.posterPath,
            rating: item.rating,
            desc: item.desc,
            link: item.link
        }));
    } catch (e) {
        console.error("searchGlobal error", e);
        throw new Error("搜索失败");
    }
}

// ====================== 修复版 · B站 PGC 榜单 ======================
async function loadBilibiliPgcRank() {
    try {
        const resp = await Widget.http.get(
            "https://api.bilibili.com/pgc/season/rank/list",
            {
                params: {
                    type: 1,     // 1=番剧 2=国创
                    day: 3,      // 3日榜
                    season_type: 1
                },
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://www.bilibili.com/"
                },
                timeout: 10000
            }
        );

        if (resp.code !== 0 || !resp.data?.list) {
            throw new Error("B站榜单数据异常");
        }

        return resp.data.list.map(item => ({
            id: `ss_${item.season_id}`,
            title: item.title,
            type: "link",
            posterPath: item.cover,
            rating: item.score?.toString() || "",
            desc: `${item.cate_name || "番剧"} | ${item.stat?.views || 0}播放`,
            link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`
        }));
    } catch (err) {
        console.error("loadBilibiliPgcRank error", err);
        throw new Error("Bilibili PGC 榜单加载失败");
    }
}

// ====================== 修复版 · 详情页（兼容原有+B站） ======================
async function loadDetail(link) {
    try {
        // B站番剧详情
        if (link.id?.startsWith("ss_")) {
            return {
                title: link.title,
                videoUrl: link.link,
                posterPath: link.posterPath
            };
        }

        // 原有逻辑保留
        return {
            title: link.title,
            videoUrl: link.link,
            posterPath: link.posterPath
        };
    } catch (e) {
        console.error("loadDetail error", e);
        throw new Error("详情加载失败");
    }
}