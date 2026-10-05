export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Only handle POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Validate Authorization header
    const authHeader = request.headers.get("Authorization");
    const TOKEN = Deno.env.get("TOKEN");
    if (TOKEN) {
      if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
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
      // Enforce a maximum request body size to prevent memory exhaustion DoS
      const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB
      const contentLength = request.headers.get("Content-Length");
      if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
        return new Response(JSON.stringify({ error: "Request body too large" }), {
          status: 413,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // Clone request body
      const rawBody = await request.text();
      if (rawBody.length > MAX_BODY_SIZE) {
        return new Response(JSON.stringify({ error: "Request body too large" }), {
          status: 413,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      const body = JSON.parse(rawBody);

      // Construct new request headers
      const headers = new Headers({
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
      });

      // Send request to DeepInfra
      const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });

      // Construct response
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        }
      });

      return newResponse;

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
