const accessToken = ""
// 填写你的 access_token

const formatPayload = (jsonData) => {
  return {
    body: {
      messages: jsonData.messages || [],
      max_tokens: jsonData.max_tokens || 3200,
      stop: ["<|eot_id|>"],
      stream: true,
      stream_options: { include_usage: true },
      model: jsonData.model
    },
    env_type: "text"
  };
};

const errorResponse = (message, status = 400) => {
  return new Response(JSON.stringify({
    success: false,
    message: message
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
    }
  });
};

const models = [
  "DeepSeek-R1-Distill-Llama-70B",
  "Llama-3.1-Tulu-3-405B",
  "Meta-Llama-3.1-405B-Instruct",
  "Meta-Llama-3.1-70B-Instruct",
  "Meta-Llama-3.1-8B-Instruct",
  "Meta-Llama-3.2-1B-Instruct",
  "Meta-Llama-3.2-3B-Instruct",
  "Meta-Llama-3.3-70B-Instruct",
  "Meta-Llama-Guard-3-8B",
  "Qwen2.5-72B-Instruct",
  "Qwen2.5-Coder-32B-Instruct",
  "QwQ-32B-Preview",
  "DeepSeek-R1",
  "Qwen2-Audio-7B-Instruct",
  "Llama-3.2-11B-Vision-Instruct",
  "Llama-3.2-90B-Vision-Instruct"
];

const getModelsResponse = () => {
  const currentTime = Math.floor(Date.now() / 1000);
  const data = models.map((modelId) => ({
    id: modelId,
    object: "model",
    created: 1686935002,
    owned_by: "SambaNova Cloud"
  }));

  return new Response(JSON.stringify({
    object: "list",
    data: data
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理模型列表请求（允许 GET 方法）
    if (url.pathname === "/v1/models") {
      return getModelsResponse();
    }

    // 验证 POST 方法
    if (request.method !== "POST") {
      return errorResponse("请使用 POST 请求方法", 405);
    }

    // 提取 Bearer Token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("需要有效的 Bearer Token 认证", 401);
    }
    
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      return errorResponse("访问令牌不能为空", 401);
    }

    try {
      // 验证内容类型
      const contentType = request.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return errorResponse("请求格式必须为 JSON", 415);
      }

      // 解析请求数据
      let jsonData;
      try {
        jsonData = await request.json();
      } catch (error) {
        return errorResponse("JSON 解析失败: " + error.message);
      }

      // 验证 messages 字段
      if (!jsonData.messages || !Array.isArray(jsonData.messages)) {
        return errorResponse("请求数据缺少有效的 messages 字段");
      }

      // 构建转发请求
      const payload = formatPayload(jsonData);
      return fetch('https://cloud.sambanova.ai/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `access_token=${accessToken}`
        },
        body: JSON.stringify(payload)
      });

    } catch (error) {
      return errorResponse(`服务器内部错误: ${error.message}`, 500);
    }
  },
};
