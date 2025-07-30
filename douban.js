// 豆瓣API工具类
class DoubanAPI {
  static async fetchUserInterests(userId, status, start = 0, count = 20) {
    const url = `https://m.douban.com/rexxar/api/v2/user/${userId}/interests?status=${status}&start=${start}&count=${count}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Referer: `https://m.douban.com/mine/movie`,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const data = await response.json();
      return data.interests || [];
    } catch (error) {
      console.error("获取用户兴趣列表失败:", error);
      return [];
    }
  }

  static async fetchSuggestions(cookie, type, start = 0, count = 20) {
    const ckMatch = cookie.match(/ck=([^;]+)/);
    const ckValue = ckMatch ? ckMatch[1] : null;
    const url = `https://m.douban.com/rexxar/api/v2/${type}/suggestion?start=${start}&count=${count}&new_struct=1&with_review=1&ck=${ckValue}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Referer: `https://m.douban.com/movie`,
          Cookie: cookie,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("获取推荐列表失败:", error);
      return [];
    }
  }

  static async fetchSubjectCollection(collectionId, type, start = 0, count = 20) {
    const url = `https://m.douban.com/rexxar/api/v2/subject_collection/${collectionId}/items?start=${start}&count=${count}&updated_at&items_only=1&type_tag&for_mobile=1${type ? `&type=${type}` : ''}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Referer: `https://m.douban.com/subject_collection/${collectionId}/`,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const data = await response.json();
      return data.subject_collection_items || [];
    } catch (error) {
      console.error("获取豆瓣合集失败:", error);
      return [];
    }
  }

  static async fetchDoubanList(listId, start = 0, count = 25) {
    const pageUrl = `https://www.douban.com/doulist/${listId}/?start=${start}&sort=seq&playable=0&sub_type=`;
    
    try {
      const response = await fetch(pageUrl, {
        headers: {
          Referer: `https://movie.douban.com/explore`,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const items = Array.from(doc.querySelectorAll('.doulist-item .title a'));
      
      return items.map(item => {
        const link = item.getAttribute('href');
        const text = item.textContent.trim().split(' ')[0];
        return { title: text, type: "multi" };
      });
    } catch (error) {
      console.error("获取豆瓣片单失败:", error);
      return [];
    }
  }

  static async fetchRecommendations(mediaType, category, categoryType, start = 0, count = 20) {
    let url = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/${mediaType}?start=${start}&limit=${count}&category=${category}&type=${categoryType}`;
    
    if (category === "all") {
      url = `https://m.douban.com/rexxar/api/v2/${mediaType}/recommend?refresh=0&start=${start}&count=${count}&selected_categories=%7B%7D&uncollect=false&score_range=0,10&tags=`;
    }
    
    try {
      const response = await fetch(url, {
        headers: {
          Referer: `https://movie.douban.com/${mediaType}`,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("获取推荐失败:", error);
      return [];
    }
  }

  static async fetchActorWorks(actorId, sortBy = "vote", start = 0, count = 50) {
    const url = `https://m.douban.com/rexxar/api/v2/celebrity/${actorId}/works?start=${start}&count=${count}&sort=${sortBy}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          Referer: `https://m.douban.com/movie`,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const data = await response.json();
      return data.works || [];
    } catch (error) {
      console.error("获取影人作品失败:", error);
      return [];
    }
  }

  static async searchActor(name) {
    const apiUrl = `https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(name)}`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          Referer: "https://movie.douban.com/",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const data = await response.json();
      return data.find(item => item.type === "celebrity")?.id || null;
    } catch (error) {
      console.error("搜索影人失败:", error);
      return null;
    }
  }
}

// TMDB工具类
class TMDBHelper {
  static async searchMedia(query, mediaType) {
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=${mediaType}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("搜索TMDB失败:", error);
      return [];
    }
  }

  static cleanTitle(title) {
    // 特殊替换
    if (title === "歌手" || title.startsWith("歌手·") || title.match(/^歌手\d{4}$/)) {
      return "我是歌手";
    }

    // 删除括号及其中内容
    title = title.replace(/[（(【\[].*?[）)】\]]/g, '');

    // 删除季数、期数等
    const patterns = [
      /[·\-:]\s*[^·\-:]+季/,
      /第[^季]*季/,
      /(?:Part|Season|Series)\s*\d+/i,
      /\d{4}/,
      /(?:\s+|^)\d{1,2}(?:st|nd|rd|th)?(?=\s|$)/i,
      /(?<=[^\d\W])\d+\s*$/,
      /[·\-:].*$/,
    ];
    
    patterns.forEach(pattern => {
      title = title.replace(pattern, '');
    });

    // 删除结尾修饰词
    const tailKeywords = ['前传', '后传', '外传', '番外篇', '番外', '特别篇', '剧场版', 'SP', '最终季', '完结篇', '完结', '电影', 'OVA', '后篇'];
    tailKeywords.forEach(kw => {
      title = title.replace(new RegExp(`${kw}$`), '');
    });

    title = title.trim();

    // 对"多个词"的情况，仅保留第一个"主标题"
    const parts = title.split(/\s+/);
    if (parts.length > 1) {
      return parts[0].replace(/\d+$/, '');
    }
    
    return title.replace(/\d+$/, '');
  }
}

// 豆瓣我看功能
class DoubanInterests {
  static async getInterests(params) {
    const { user_id, status, page } = params;
    const count = status === "random_mark" ? 50 : 20;
    const start = (page - 1) * count;
    
    if (status === "random_mark") {
      if (page > 1) return [];
      
      let allInterests = [];
      let currentStart = 0;
      
      while (true) {
        const interests = await DoubanAPI.fetchUserInterests(user_id, "mark", currentStart, count);
        allInterests = [...allInterests, ...interests];
        
        if (interests.length < count) break;
        currentStart += count;
      }
      
      // 随机抽取9个
      const shuffled = allInterests.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(9, shuffled.length)).map(item => ({
        id: item.subject.id,
        type: "douban"
      }));
    } else {
      const interests = await DoubanAPI.fetchUserInterests(user_id, status, start, count);
      return interests.map(item => ({
        id: item.subject.id,
        type: "douban"
      }));
    }
  }
}

// 豆瓣个性化推荐功能
class DoubanSuggestions {
  static async getSuggestions(params) {
    const { cookie, type, page } = params;
    const count = 20;
    const start = (page - 1) * count;
    
    const items = await DoubanAPI.fetchSuggestions(cookie, type, start, count);
    return items.filter(item => item.id != null).map(item => ({
      id: item.id,
      type: "douban"
    }));
  }
}

// 豆瓣片单功能
class DoubanCollections {
  static async getCollectionItems(params) {
    const { url, page } = params;
    
    if (url.includes("douban.com/doulist/")) {
      return this.getDoubanListItems(params);
    } else if (url.includes("douban.com/subject_collection/")) {
      return this.getSubjectCollectionItems(params);
    }
    
    return [];
  }

  static async getDoubanListItems(params) {
    const { url, page } = params;
    const listId = url.match(/doulist\/(\d+)/)?.[1];
    if (!listId) return [];
    
    const count = 25;
    const start = (page - 1) * count;
    
    const items = await DoubanAPI.fetchDoubanList(listId, start, count);
    return this.fetchTMDBItems(items);
  }

  static async getSubjectCollectionItems(params) {
    const { url, page, type } = params;
    const collectionId = url.match(/subject_collection\/(\w+)/)?.[1];
    if (!collectionId) return [];
    
    const count = 20;
    const start = (page - 1) * count;
    
    const items = await DoubanAPI.fetchSubjectCollection(collectionId, type, start, count);
    return this.fetchTMDBItems(items);
  }

  static async fetchTMDBItems(items) {
    const promises = items.map(async item => {
      if (!item || !item.title) return null;
      
      const title = item.type === "tv" ? TMDBHelper.cleanTitle(item.title) : item.title;
      const results = await TMDBHelper.searchMedia(title, item.type);
      
      if (results.length > 0) {
        return {
          id: results[0].id,
          type: "tmdb",
          title: results[0].title ?? results[0].name,
          description: results[0].overview,
          releaseDate: results[0].release_date ?? results[0].first_air_date,
          backdropPath: results[0].backdrop_path,
          posterPath: results[0].poster_path,
          rating: results[0].vote_average,
          mediaType: item.type !== "multi" ? item.type : results[0].media_type,
        };
      }
      return null;
    });
    
    const results = await Promise.all(promises);
    const validItems = results.filter(Boolean);
    
    // 去重
    const seenTitles = new Set();
    return validItems.filter(item => {
      if (seenTitles.has(item.title)) return false;
      seenTitles.add(item.title);
      return true;
    });
  }
}

// 电影/剧集推荐功能
class DoubanRecommendations {
  static async getRecommendMovies(params) {
    return this.getRecommendItems(params, "movie");
  }

  static async getRecommendShows(params) {
    return this.getRecommendItems(params, "tv");
  }

  static async getRecommendItems(params, type) {
    const { category, type: categoryType, page } = params;
    const count = 20;
    const start = (page - 1) * count;
    
    const items = await DoubanAPI.fetchRecommendations(type, category, categoryType, start, count);
    return DoubanCollections.fetchTMDBItems(items);
  }
}

// 观影偏好推荐功能
class PreferenceRecommendations {
  static async getRecommendations(params) {
    const {
      mediaType,
      movieGenre,
      tvGenre,
      zyGenre,
      tvModus,
      region,
      year,
      platform,
      sort_by,
      tags,
      rating,
      offset
    } = params;
    
    // 验证评分
    if (!/^\d$/.test(String(rating))) {
      throw new Error("评分必须为 0～9 的整数");
    }
    
    const selectedCategories = {
      "类型": movieGenre || tvGenre || zyGenre || "",
      "地区": region || "",
      "形式": tvModus || "",
    };
    
    const tags_sub = [];
    if (movieGenre) tags_sub.push(movieGenre);
    if (tvModus && !tvGenre && !zyGenre) tags_sub.push(tvModus);
    if (tvModus && tvGenre) tags_sub.push(tvGenre);
    if (tvModus && zyGenre) tags_sub.push(zyGenre);
    if (region) tags_sub.push(region);
    if (year) tags_sub.push(year);
    if (platform) tags_sub.push(platform);
    
    if (tags) {
      const customTagsArray = tags.split(',').filter(tag => tag.trim() !== '');
      tags_sub.push(...customTagsArray);
    }
    
    const limit = 20;
    const url = `https://m.douban.com/rexxar/api/v2/${mediaType}/recommend?refresh=0&start=${offset}&count=${Number(offset) + limit}&selected_categories=${encodeURIComponent(JSON.stringify(selectedCategories))}&uncollect=false&score_range=${rating},10&tags=${encodeURIComponent(tags_sub.join(","))}&sort=${sort_by}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://movie.douban.com/explore"
        }
      });
      
      const data = await response.json();
      const validItems = data.items?.filter(item => item.card === "subject") || [];
      
      if (validItems.length === 0) {
        throw new Error("未找到有效的影视作品");
      }
      
      return DoubanCollections.fetchTMDBItems(validItems);
    } catch (error) {
      console.error("获取偏好推荐失败:", error);
      throw error;
    }
  }
}

// 豆瓣影人作品功能
class DoubanActorWorks {
  static async getActorWorks(params) {
    const {
      input_type,
      name_type,
      cn_actor_select,
      cn_actress_select,
      ht_actor_select,
      ht_actress_select,
      jk_actor_select,
      jk_actress_select,
      ea_actor_select,
      ea_actress_select,
      cn_director_select,
      fr_director_select,
      name_customize,
      actor_select,
      sort_by,
      page
    } = params;
    
    const nameTypeDict = {
      'cn_actor': cn_actor_select,
      'cn_actress': cn_actress_select,
      'ht_actor': ht_actor_select,
      'ht_actress': ht_actress_select,
      'jk_actor': jk_actor_select,
      'jk_actress': jk_actress_select,
      'ea_actor': ea_actor_select,
      'ea_actress': ea_actress_select,
      'cn_director': cn_director_select,
      'fr_director': fr_director_select,
    };
    
    let actor;
    if (actor_select) {
      actor = actor_select;
    } else if (input_type === "select") {
      actor = nameTypeDict[name_type];
    } else {
      actor = name_customize;
    }
    
    if (!actor) {
      throw new Error("缺少演员姓名");
    }
    
    const actorId = await DoubanAPI.searchActor(actor);
    if (!actorId) {
      throw new Error("解析豆瓣影人ID失败");
    }
    
    const count = 50;
    const start = (page - 1) * count;
    const works = await DoubanAPI.fetchActorWorks(actorId, sort_by, start, count);
    
    return works.filter(work => work.work.id != null).map(work => ({
      id: work.work.id,
      type: "douban"
    }));
  }
}

// 豆瓣首页轮播图功能
class DoubanCarousel {
  static async getCarouselItems() {
    try {
      const response = await fetch(`https://gist.githubusercontent.com/huangxd-/5ae61c105b417218b9e5bad7073d2f36/raw/douban_carousel.json`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error("获取轮播图失败:", error);
      return [];
    }
  }
}

// 导出所有功能
export {
  DoubanInterests,
  DoubanSuggestions,
  DoubanCollections,
  DoubanRecommendations,
  PreferenceRecommendations,
  DoubanActorWorks,
  DoubanCarousel
};