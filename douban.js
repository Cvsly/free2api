WidgetMetadata = {
  id: "douban_simple",
  title: "豆瓣测试",
  modules: [{
    title: "豆瓣热门电影",
    functionName: "loadDoubanHot",
    cacheDuration: 3600
  }],
  version: "1.4.18",
  requiredVersion: "1.4.18"
};

async function loadDoubanHot() {
  const url = "https://m.douban.com/rexxar/api/v2/subject_collection/movie_hot_gaia/items?start=0&count=10";
  const response = await fetch(url, {
    headers: { "User-Agent": "Forward Widget" }
  });
  const data = await response.json();
  
  return data.subject_collection_items.map(item => ({
    id: item.id,
    title: item.title,
    type: "douban"
  }));
}