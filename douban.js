/**
 * @title 豆瓣我看&豆瓣个性化推荐
 * @version 1.0.16
 * @author huangxd
 * @description 解析豆瓣想看、在看、已看以及根据个人数据生成的个性化推荐
 * @site https://github.com/huangxd-/ForwardWidgets
 * @minVersion 0.0.1
 */

const WidgetMetadata = {
  // ... (保留原有的WidgetMetadata结构不变)
};

// 增强的网络请求工具函数
class DoubanAPI {
  static async request(url, options = {}) {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      'Referer': 'https://m.douban.com/',
      'Accept': 'application/json'
    };

    try {
      const response = await Widget.http.get(url, {
        headers: {...defaultHeaders, ...options.headers},
        timeout: 10000,
        ...options
      });

      if (!response.data) {
        throw new Error('API返回数据为空');
      }

      // 检查豆瓣API特有的错误格式
      if (response.data.code && response.data.code !== 200) {
        throw new Error(response.data.msg || '豆瓣API错误');
      }

      return response.data;
    } catch (error) {
      console.error(`请求失败: ${url}`, error);
      throw new Error(`网络请求失败: ${error.message}`);
    }
  }

  // 数据校验函数
  static validateData(data, fields = []) {
    if (!data) throw new Error('数据不存在');
    
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`缺少必要字段: ${field}`);
      }
    }
    return true;
  }
}

// 豆瓣我看 - 完全重写的数据获取逻辑
async function loadInterestItems(params = {}) {
  try {
    // 参数校验
    const { user_id = '', status = 'mark', page = 1 } = params;
    const isRandom = status === 'random_mark';
    const actualStatus = isRandom ? 'mark' : status;

    if (!user_id) {
      throw new Error('必须提供用户ID');
    }

    // 构建请求URL
    const count = isRandom ? 50 : 20;
    const start = (page - 1) * count;
    const url = `https://m.douban.com/rexxar/api/v2/user/${encodeURIComponent(user_id)}/interests?status=${actualStatus}&start=${start}&count=${count}`;

    // 发送请求
    const data = await DoubanAPI.request(url, {
      headers: {
        'Referer': `https://m.douban.com/people/${user_id}/`
      }
    });

    // 数据校验
    DoubanAPI.validateData(data, ['interests']);
    
    // 数据处理
    const items = data.interests
      .filter(item => item?.subject?.id)
      .map(item => ({
        id: String(item.subject.id),
        type: 'douban',
        title: item.subject.title || '未知标题',
        rating: item.subject.rating?.value || 0
      }));

    // 去重处理
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());

    // 随机模式处理
    if (isRandom && page === 1) {
      return this.shuffleArray(uniqueItems).slice(0, 9);
    }

    return uniqueItems;
  } catch (error) {
    console.error('获取豆瓣我看数据失败:', error.message);
    return {
      error: true,
      message: error.message,
      data: []
    };
  }
}

// 豆瓣个性化推荐 - 重写版
async function loadSuggestionItems(params = {}) {
  try {
    const { cookie = '', type = 'movie', page = 1 } = params;
    const count = 20;
    const start = (page - 1) * count;

    // 提取ck参数
    const ck = cookie.match(/ck=([^;]+)/)?.[1] || '';

    const url = `https://m.douban.com/rexxar/api/v2/${type}/suggestion?start=${start}&count=${count}&new_struct=1&with_review=1&ck=${ck}`;

    const data = await DoubanAPI.request(url, {
      headers: {
        'Cookie': cookie,
        'Referer': `https://m.douban.com/${type}`
      }
    });

    DoubanAPI.validateData(data, ['items']);

    return data.items
      .filter(item => item?.id)
      .map(item => ({
        id: String(item.id),
        type: 'douban',
        title: item.title || '未知标题',
        rating: item.rating?.value || 0
      }));
  } catch (error) {
    console.error('获取个性化推荐失败:', error.message);
    return {
      error: true,
      message: error.message,
      data: []
    };
  }
}

// 豆瓣片单(TMDB版) - 重写版
async function loadCardItems(params = {}) {
  try {
    const { url: listUrl, page = 1 } = params;
    
    if (!listUrl) {
      throw new Error('必须提供片单URL');
    }

    // 判断片单类型
    if (listUrl.includes('douban.com/doulist/')) {
      return this.loadDoulistItems(listUrl, page);
    } else if (listUrl.includes('douban.com/subject_collection/')) {
      return this.loadSubjectCollectionItems(listUrl, page);
    }
    
    throw new Error('不支持的URL格式');
  } catch (error) {
    console.error('获取片单数据失败:', error.message);
    return {
      error: true,
      message: error.message,
      data: []
    };
  }
}

// 辅助函数
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 导出模块
module.exports = {
  WidgetMetadata,
  loadInterestItems,
  loadSuggestionItems,
  loadCardItems,
  // ...其他函数
};