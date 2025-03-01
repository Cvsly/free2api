export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      const authHeader = request.headers.get('authorization');
      const expectedAuth = env.AUTH || 'sk-123';
      if (!authHeader || (!authHeader.startsWith('Bearer ') && authHeader !== expectedAuth)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (path === '/v1/chat/completions') {
        return handleChatCompletions(request, env, ctx);
      } else if (path === '/v1/models') {
        return handleModels();
      } else {
        return new Response(JSON.stringify({ error: 'Not Found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          message: "Internal server error",
          type: "server_error",
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};

async function handleChatCompletions(request, env, ctx) {
  try {
    const { token, projectId } = await getTokenAndProjectId(env);
    const userRequest = await request.json().catch(() => ({}));
    let { model, messages, max_tokens } = userRequest;

    // Add spn3/ prefix if not present for specific models
    if (!model.startsWith('spn3/')) {
      if (model.toLowerCase().includes('qwen') || 
          model.toLowerCase().includes('deepseek-r1-distill')) {
        model = `spn3/${model}`;
      } else if (model.toLowerCase() === 'deepseek-chat' || 
                 model.toLowerCase() === 'deepseek-v3') {
        model = 'spn3/DeepSeek-chat';
      }
    }

    if (!model || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({
        error: {
          message: "Invalid request parameters",
          type: "invalid_request_error"
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const availableModels = [
      { modelFamily: 'spn3/Qwen2.5-72B-Instruct', maxTokens: 4096 },
      { modelFamily: 'DeepSeek-R1', maxTokens: 8192 },
      { modelFamily: 'spn3/DeepSeek-chat', maxTokens: 8192 },
      { modelFamily: 'spn3/DeepSeek-R1-Distill-Qwen-32B', maxTokens: 8192 },
    ];

    let requestedModel = availableModels.find(m => m.modelFamily.toLowerCase() === model.toLowerCase());

    if (!requestedModel) {
      if (model.toLowerCase().includes('deepseek')) {
        requestedModel = availableModels.find(m => m.modelFamily === 'DeepSeek-R1');
      } else {
        return new Response(JSON.stringify({
          error: {
            message: `Model ${model} does not exist`,
            type: "invalid_request_error",
            code: "model_not_found"
          }
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const targetUrl = `https://sophnet.com/api/open-apis/projects/${projectId}/chat/completions`;
    const targetBody = {
      max_tokens: max_tokens ? Math.min(max_tokens, requestedModel.maxTokens) : 2048,
      stop: [],
      stream: true,
      model_id: requestedModel.modelFamily,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }],
      })),
    };

    const targetResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'accept': 'text/event-stream',
        'authorization': `Bearer sess-${token}`,
        'content-type': 'application/json',
        'origin': 'https://sophnet.com',
        'referer': 'https://sophnet.com/',
      },
      body: JSON.stringify(targetBody),
    });

    if (!targetResponse.ok) {
      return new Response(JSON.stringify({
        error: {
          message: "Upstream API error",
          type: "api_error",
        }
      }), {
        status: targetResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(targetResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        message: "Internal server error",
        type: "server_error",
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleModels() {
  const formattedModels = [
    {
      id: 'spn3/Qwen2.5-72B-Instruct',
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'spn3/Qwen2.5-72B-Instruct',
      permission: null,
      root: 'spn3/Qwen2.5-72B-Instruct',
      parent: null,
      available: true,
      supportedStream: true,
      max_tokens: 4096,
    },
    {
      id: 'DeepSeek-R1',
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'DeepSeek-R1',
      permission: null,
      root: 'DeepSeek-R1',
      parent: null,
      available: true,
      supportedStream: true,
      max_tokens: 8192,
    },
    {
      id: 'spn3/DeepSeek-chat',
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'spn3/DeepSeek-chat',
      permission: null,
      root: 'spn3/DeepSeek-chat',
      parent: null,
      available: true,
      supportedStream: true,
      max_tokens: 8192,
    },
    {
      id: 'spn3/DeepSeek-R1-Distill-Qwen-32B',
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'spn3/DeepSeek-R1-Distill-Qwen-32B',
      permission: null,
      root: 'spn3/DeepSeek-R1-Distill-Qwen-32B',
      parent: null,
      available: true,
      supportedStream: true,
      max_tokens: 8192,
    }
  ];

  return new Response(JSON.stringify({ data: formattedModels }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getTokenAndProjectId(env) {
  try {
    const cached = await env.SOPHNET.get('token_data', { type: 'json' });
    const now = Math.floor(Date.now() / 1000);

    if (cached && cached.exp > now) {
      return cached;
    }

    const jsUrl = env.JSURL || 'https://sophnet.com/static/js/text_logo_mobile_gray-CjUXHG9E.js';
    const jsResponse = await fetch(jsUrl);
    const jsText = await jsResponse.text();

    const tokenMatch = jsText.match(/token:\s*"([^"]+)"/);
    const projectIdMatch = jsText.match(/projectId:\s*"([^"]+)"/);

    if (!tokenMatch || !projectIdMatch) {
      const fallbackToken = 'eyJhbGciOiJIUzI1NiJ9.eyJydGkiOjQsIm5hbWUiOiLov5zop4HljZPor4YwODQ0IiwidXNlcklkIjoxLCJleHAiOjE3NzAyMTE5OTR9.Xt9jFJZoKbhN3LVlr_FScKdE-WOQqJduOYcxskBvgfk';
      const fallbackProjectId = 'Ar79PWUQUAhjJOja2orHs';
      const payload = JSON.parse(atob(fallbackToken.split('.')[1]));
      const exp = payload.exp;

      await env.SOPHNET.put('token_data', JSON.stringify({ token: fallbackToken, projectId: fallbackProjectId, exp }), { expiration: exp });
      return { token: fallbackToken, projectId: fallbackProjectId };
    }

    const token = tokenMatch[1].trim();
    const projectId = projectIdMatch[1].trim();

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    await env.SOPHNET.put('token_data', JSON.stringify({ token, projectId, exp }), { expiration: exp });

    return { token, projectId };
  } catch (error) {
    const fallbackToken = 'eyJhbGciOiJIUzI1NiJ9.eyJydGkiOjQsIm5hbWUiOiLov5zop4HljZPor4YwODQ0IiwidXNlcklkIjoxLCJleHAiOjE3NzAyMTE5OTR9.Xt9jFJZoKbhN3LVlr_FScKdE-WOQqJduOYcxskBvgfk';
    const fallbackProjectId = 'Ar79PWUQUAhjJOja2orHs';
    const payload = JSON.parse(atob(fallbackToken.split('.')[1]));
    const exp = payload.exp;

    await env.SOPHNET.put('token_data', JSON.stringify({ token: fallbackToken, projectId: fallbackProjectId, exp }), { expiration: exp });
    return { token: fallbackToken, projectId: fallbackProjectId };
  }
}
