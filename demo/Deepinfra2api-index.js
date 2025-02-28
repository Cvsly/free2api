export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 处理 /v1/models 请求
    if (url.pathname === "/v1/models" && request.method === "GET") {
      // 鉴权验证
      if (env.TOKEN) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || authHeader !== `Bearer ${env.TOKEN}`) {
          return new Response("Unauthorized", { 
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
      }

      // 构建模型列表
      const models = {
        object: "list",
        data: [
          {
            id: "deepseek-ai/DeepSeek-R1",
            object: "model",
            created: 1624980000,
            owned_by: "deepseek-ai"
          },
          {
            id: "deepseek-ai/DeepSeek-V3",
            object: "model",
            created: 1632000000,
            owned_by: "deepseek-ai"
          },
          {
            id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
            object: "model",
            created: 1640000000,
            owned_by: "deepseek-ai"
          },
          {
            id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
            object: "model",
            created: 1645000000,
            owned_by: "deepseek-ai"
          }
        ]
      };

      return new Response(JSON.stringify(models), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 处理其他 POST 请求
    if (request.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 验证鉴权头
    const authHeader = request.headers.get("Authorization");
    if (env.TOKEN) {
      if (!authHeader || authHeader !== `Bearer ${env.TOKEN}`) {
        return new Response("Unauthorized", { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    try {
      // 原始请求处理逻辑
      const body = await request.json();
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
        "Accept": "text/event-stream",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        "sec-ch-ua-platform": "Windows",
        "X-Deepinfra-Source": "web-page",
        "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Microsoft Edge\";v=\"133\", \"Chromium\";v=\"133\"",
        "sec-ch-ua-mobile": "?0",
        "Origin": "https://deepinfra.com",
        "Sec-Fetch-Site": "same-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://deepinfra.com/"
      };

      const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });

      return new Response(response.body, {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": response.headers.get("Content-Type")
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
