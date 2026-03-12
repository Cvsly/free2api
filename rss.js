const WidgetMetadata = {
  id: "rss.video.base",
  title: "RSS视频订阅",
  author: "user",
  version: "1.0",
  requiredVersion: "1.0",
  modules: [
    {
      title: "订阅源",
      functionName: "load",
      cacheDuration: 60,
      params: [
        {
          name: "url",
          title: "RSS地址",
          type: "input",
          required: true
        }
      ]
    }
  ]
}

async function load(params) {
  return [
    {
      id: "rss-1",
      type: "url",
      mediaType: "movie",
      title: "测试视频",
      videoUrl: "https://www.baidu.com",
      playerType: "system"
    }
  ]
}