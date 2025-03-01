const API_KEY = "sk-your-api-key";

import { parse } from "https://deno.land/std@0.182.0/flags/mod.ts";
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

// 默认端口号
const DEFAULT_PORT = 8080;
const DEFAULT_HEADERS = {
  "sec-ch-ua":
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "*/*",
  "content-type": "text/plain;charset=UTF-8",
  origin: "https://scira.app/api/chat",
  "sec-fetch-site": "same-site",
  "sec-fetch-mode": "cors",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "zh-CN,zh;q=0.9",
  priority: "u=1, i",
};

async function handleStreamResponse(response, model) {
  // 设置响应头
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  try {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");

    // 创建响应流
    const stream = response.body;
    let buffer = "";
    let reasoning = false;
    // 处理响应流
    const reader = stream.getReader();
    const sentText = async (text: string) => {
      const obj = `data: ${JSON.stringify({
        id: crypto.randomUUID(),
        object: "chat.completion.chunk",
        created: new Date().getTime(),
        choices: [
          {
            index: 0,
            delta: {
              content: text,
              role: "assistant",
            },
          },
        ],
      })}\n\n`;
      await writer.write(encoder.encode(obj));
    };
    (async () => {
      try {
        let thinking = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            await writer.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            if (!line.includes(":")) {
              continue;
            }

            const [type, ...rest] = line.split(":");
            const content = rest.join(":");
            const data = JSON.parse(content);

            if (type === "g" && !thinking) {
              thinking = true;
              await sentText("<think>");
            }
            if (type !== "g" && thinking) {
              thinking = false;
              await sentText("</think>");
            }
            if (type === "0" || type === "g") {
              await sentText(data);
            }
          }
        }
      } catch (error) {
        console.error("流处理错误:", error);
        await sentText("流处理错误:" + error);
        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
      }
    })();

    // 返回新的响应对象
    return new Response(readable, { headers });
  } catch (error) {
    console.error("处理响应错误:", error);
    return new Response("data: [DONE]\n\n", { headers });
  }
}

// 验证 API 密钥
function verifyApiKey(request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const apiKey = authorization.replace("Bearer ", "").trim();
  if (apiKey !== API_KEY) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return null;
}

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url = new URL(request.url);

  // 验证 API 密钥（除了 OPTIONS 请求）
  const authError = verifyApiKey(request);
  if (authError) return authError;

  if (request.method === "GET" && url.pathname === "/v1/models") {
    return new Response(
      JSON.stringify({
        object: "list",
        data: [
          {
            id: "scira-sonnet",
            object: "model",
            created: 1686935002,
            owned_by: "scira",
          },
          {
            id: "scira-llama",
            object: "model",
            created: 1686935002,
            owned_by: "scira",
          },
          {
            id: "scira-default",
            object: "model",
            created: 1686935002,
            owned_by: "scira",
          },
          {
            id: "scira-r1",
            object: "model",
            created: 1686935002,
            owned_by: "scira",
          },
        ],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (request.method === "POST" && url.pathname === "/v1/chat/completions") {
    const body = await request.json();
    try {
      const response = await fetch("https://scira.app/api/chat", {
        method: "POST",
        headers: {
          ...DEFAULT_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body, group: "chat" }),
      });
      return await handleStreamResponse(response, body.model);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            message: `${error.message}`,
            type: "server_error",
            param: null,
            code: error.code || null,
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }

  return new Response("Not Found", { status: 404 });
}

async function startServer(port: number) {
  console.log(`Starting proxy server on port ${port}`);
  await serve(handleRequest, {
    port,
    onListen: () => {
      console.log(`Listening on http://localhost:${port}`);
    },
  });
}

if (import.meta.main) {
  const { args } = Deno;
  const parsedArgs = parse(args);
  const port = parsedArgs.port ? Number(parsedArgs.port) : DEFAULT_PORT;
  startServer(port);
}

脚本
