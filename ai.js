var WidgetMetadata = {
  id: "ai.movie.recommendation",
  title: "AI 影视推荐",
  description: "OpenAI / Gemini / 自定义API + TMDB智能解析",
  author: "crush7s",
  version: "5.2.2-fix",
  requiredVersion: "0.0.2",
  detailCacheDuration: 3600,

  globalParams: [

    // ================= API（稳定版UI）=================
    {
      name: "aiApiUrl",
      title: "AI API 地址",
      type: "input",
      required: true,
      defaultValue: "https://api.openai.com/v1/chat/completions"
    },

    {
      name: "aiApiFormat",
      title: "API 格式",
      type: "enumeration",
      enumOptions: [
        { title: "OpenAI / 硅基流动（通用）", value: "openai" },
        { title: "Gemini", value: "gemini" }
      ],
      defaultValue: "openai"
    },

    {
      name: "aiApiKey",
      title: "API Key",
      type: "input",
      required: true
    },

    {
      name: "aiModel",
      title: "模型名称",
      type: "input",
      defaultValue: "gpt-4o-mini"
    },

    {
      name: "TMDB_API_KEY",
      title: "TMDB API Key",
      type: "input",
      required: false
    },

    {
      name: "recommendCount",
      title: "推荐数量",
      type: "enumeration",
      enumOptions: [
        { title: "6部", value: "6" },
        { title: "9部", value: "9" },
        { title: "12部", value: "12" }
      ],
      defaultValue: "9"
    }
  ],

  modules: [
    {
      id: "smartRecommend",
      title: "AI智能推荐",
      functionName: "loadAIList",
      params: [
        {
          name: "prompt",
          title: "想看什么",
          type: "input",
          required: true
        }
      ]
    },

    {
      id: "similarRecommend",
      title: "相似推荐",
      functionName: "loadSimilarList",
      params: [
        {
          name: "referenceTitle",
          title: "喜欢的作品",
          type: "input",
          required: true
        }
      ]
    }
  ]
};