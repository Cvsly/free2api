/**
 * @title 豆瓣我看&豆瓣个性化推荐
 * @version 1.0.15
 * @author huangxd
 * @description 解析豆瓣想看、在看、已看以及根据个人数据生成的个性化推荐【五折码：CHEAP.5;七折码：CHEAP】
 * @site https://github.com/huangxd-/ForwardWidgets
 * @minVersion 0.0.1
 */

const WidgetMetadata = {
  // ... (保留原有的WidgetMetadata结构不变)
};

// 增强的请求函数，添加重试机制和错误处理
async function safeFetch(url, options = {}, retries = 3) {
  try {
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        ...options.headers
      },
      ...options
    });

    if (!response.data) {
      throw new Error("Empty response data");
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`请求失败，剩余重试次数: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return safeFetch(url, options, retries - 1);
    }
    throw error;
  }
}

// 豆瓣我看 - 改进版
async function loadInterestItems(params = {}) {
  try {
    const page = params.page || 1;
    const user_id = params.user_id || "";
    let status = params.status || "";
    
    if (!user_id) {
      throw new Error("用户ID不能为空");
    }

    const random = status === "random_mark";
    if (random) {
      status = "mark";
    }
    const count = random ? 50 : 20;
    const start = (page - 1) * count;

    const url = `https://m.douban.com/rexxar/api/v2/user/${user_id}/interests?status=${status}&start=${start}&count=${count}`;
    
    const response = await safeFetch(url, {
      headers: {
        Referer: `https://m.douban.com/mine/movie`
      }
    });

    if (!response.data.interests) {
      return [];
    }

    const items = response.data.interests
      .filter(item => item.subject?.id)
      .map(item => ({
        id: item.subject.id,
        type: "douban"
      }));

    // 去重处理
    const uniqueItems = [...new Map(items.map(item => [item.id, item])].map(([_, value]) => value);

    if (random && page === 1) {
      // 随机抽取9个
      const shuffled = uniqueItems.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(9, shuffled.length));
    }
    return uniqueItems;
  } catch (error) {
    console.error("loadInterestItems error:", error);
    return [];
  }
}

// 豆瓣个性化推荐 - 改进版
async function loadSuggestionItems(params = {}) {
  try {
    const page = params.page || 1;
    const cookie = params.cookie || "";
    const type = params.type || "movie";
    const count = 20;
    const start = (page - 1) * count;
    
    if (!cookie) {
      console.warn("未提供Cookie，将返回非个性化推荐");
    }

    const ckMatch = cookie.match(/ck=([^;]+)/);
    const ckValue = ckMatch ? ckMatch[1] : "null";
    
    const url = `https://m.douban.com/rexxar/api/v2/${type}/suggestion?start=${start}&count=${count}&new_struct=1&with_review=1&ck=${ckValue}`;
    
    const response = await safeFetch(url, {
      headers: {
        Referer: `https://m.douban.com/movie`,
        Cookie: cookie
      }
    });

    if (!response.data?.items) {
      return [];
    }

    return response.data.items
      .filter(item => item.id)
      .map(item => ({
        id: item.id,
        type: "douban"
      }));
  } catch (error) {
    console.error("loadSuggestionItems error:", error);
    return [];
  }
}

// 豆瓣片单(TMDB版) - 改进版
async function loadCardItems(params = {}) {
  try {
    const url = params.url;
    if (!url) {
      throw new Error("缺少片单URL");
    }

    if (url.includes("douban.com/doulist/")) {
      return loadDefaultList(params);
    } else if (url.includes("douban.com/subject_collection/")) {
      return loadSubjectCollection(params);
    }
    return [];
  } catch (error) {
    console.error("loadCardItems error:", error);
    return [];
  }
}

// ... (保留其他原有函数，但都添加类似的错误处理和日志记录)

// 导出模块
module.exports = {
  WidgetMetadata,
  loadInterestItems,
  loadSuggestionItems,
  loadCardItems,
  loadRecommendMovies,
  loadRecommendShows,
  getPreferenceRecommendations,
  loadActorItems,
  loadCarouselItems
};