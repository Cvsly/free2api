export default {
  name: "B站PGC榜单",
  author: "豆包",
  version: "1.0.0",
  description: "哔哩哔哩番剧、国创、综艺、纪录片、电视剧正版PGC热门榜单",
  type: "normal",

  async data() {
    try {
      const response = await fetch(
        "https://api.bilibili.com/pgc/season/rank/list?type=0&day=3"
      );
      const result = await response.json();

      if (result.code !== 0) {
        return {
          title: "获取榜单失败",
          list: []
        };
      }

      const list = result.data.list.map(item => ({
        title: item.title || "未知标题",
        cover: item.cover || "",
        url: `bilibili://pgc/detail/${item.season_id}`,
        score: item.score || "暂无评分",
        playCount: item.stat?.views ? this.formatPlayCount(item.stat.views) : "0",
        desc: `${item.style || ""} · ${item.area || ""}`.trim()
      }));

      return {
        title: "B站PGC三日热门榜",
        list: list.slice(0, 20)
      };
    } catch (e) {
      return {
        title: "网络异常",
        list: []
      };
    }
  },

  formatPlayCount(count) {
    if (count >= 100000000) {
      return (count / 100000000).toFixed(1) + "亿";
    } else if (count >= 10000) {
      return (count / 10000).toFixed(1) + "万";
    }
    return count.toString();
  },

  render(data) {
    if (!data.list || data.list.length === 0) {
      return `
        <div style="padding: 20px; text-align: center; color: #999; font-size: 14px;">
          ${data.title}
        </div>
      `;
    }

    return `
      <div style="padding: 10px;">
        <div style="font-size: 17px; font-weight: bold; color: #fff; margin-bottom: 10px;">
          ${data.title}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${data.list.map(item => `
            <div style="width: 48%; border-radius: 10px; overflow: hidden; background: #1a1a1a;">
              <a href="${item.url}">
                <img 
                  src="${item.cover}" 
                  style="width: 100%; aspect-ratio: 16/9; object-fit: cover;"
                />
                <div style="padding: 8px;">
                  <div style="font-size: 14px; color: #fff; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.title}
                  </div>
                  <div style="font-size: 12px; color: #999; margin-top: 4px;">
                    ${item.playCount}播放 | ${item.score}
                  </div>
                  <div style="font-size: 11px; color: #777; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.desc}
                  </div>
                </div>
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}