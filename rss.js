const WidgetMetadata = {
  id: "rss.test.mini",
  title: "RSS极简测试",
  author: "test",
  version: "1.0.0",
  requiredVersion: "1.0.0",
  modules: [
    {
      title: "RSS订阅",
      functionName: "loadData",
      cacheDuration: 60,
      params: [
        {
          name: "rssUrl",
          title: "RSS地址",
          type: "input",
          required: true
        }
      ]
    }
  ]
};

async function loadData(params) {
  return [
    {
      id: "test1",
      type: "url",
      mediaType: "movie",
      title: "测试视频",
      videoUrl: "https://www.baidu.com",
      playerType: "system"
    }
  ];
}