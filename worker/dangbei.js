const API_DOMAIN = 'https://ai-api.dangbei.net';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
const VALID_API_KEY = 'sk_gUXNcLwm0rnnEt55Mg8hq88';
const MAX_CONVERSATION_COUNT = 50;

class ChatManage {
  constructor() {
    this.currentDeviceId = null;
    this.currentConversationId = null;
    this.conversationCount = 0;
  }

  getOrCreateIds(forceNew = false) {
    if (forceNew || !this.currentDeviceId || this.conversationCount >= MAX_CONVERSATION_COUNT) {
      this.currentDeviceId = this.generateDeviceId();
      this.currentConversationId = null;
      this.conversationCount = 0;
    } else {
      this.conversationCount++;
    }
    return {
      deviceId: this.currentDeviceId,
      conversationId: this.currentConversationId
    };
  }

  generateDeviceId() {
    const uuid = crypto.randomUUID();
    const urlAlphabet = 'useandom26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
    const nanoid = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => urlAlphabet[b % urlAlphabet.length])
      .join('');
    return `${uuid.replace(/-/g, '')}_${nanoid}`;
  }
}

class Pipe {
  constructor() {
    this.dataPrefix = 'data:';
    this.chatManage = new ChatManage();
  }

  // 创建新的会话
  async _create_conversation(deviceId) {
    const payload = { botCode: "AI_SEARCH" };
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.nanoid(21);
    const sign = await this.generateSign(timestamp, payload, nonce);

    const headers = {
      "Origin": "https://ai.dangbei.com",
      "Referer": "https://ai.dangbei.com/",
      "User-Agent": USER_AGENT,
      "deviceId": deviceId,
      "nonce": nonce,
      "sign": sign,
      "timestamp": timestamp,
      "Content-Type": "application/json"
    };

    try {
      const response = await fetch(`${API_DOMAIN}/ai-search/conversationApi/v1/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.conversationId;
        }
      }
    } catch (e) {
      console.error('Error creating conversation:', e);
    }
    return null;
  }

  // 新增方法：构建完整提示
  _buildFullPrompt(messages) {
    if (!messages || messages.length === 0) {
      return '';
    }
    let systemPrompt = '';
    const history = [];
    let lastUserMessage = '';
    
    // 解析消息结构
    for (const msg of messages) {
      if (msg.role === 'system' && !systemPrompt) {
        systemPrompt = msg.content;
      } else if (msg.role === 'user') {
        history.push(`user: ${msg.content}`);
        lastUserMessage = msg.content;
      } else if (msg.role === 'assistant') {
        history.push(`assistant: ${msg.content}`);
      }
    }

    // 构建最终提示
    const parts = [];
    if (systemPrompt) {
      parts.push(`[System Prompt]\n${systemPrompt}`);
    }
    if (history.length > 1) {
      parts.push(`[Chat History]\n${history.slice(0, -1).join('\n')}`);
    }
    parts.push(`[Question]\n${lastUserMessage}`);
    
    return parts.join('\n\n');
  }

  async* pipe(body) {
    const thinkingState = { thinking: -1 };
    const userMessage = body.messages[body.messages.length - 1].content;
    
    let userAction = "";
    if (body.model === "DeepSeek-R1") {
      userAction = "deep";
    }
    // 检查是否需要联网
    if (userMessage.trim().endsWith("@online") || userMessage.trim().endsWith("@联网")) {
      userAction = userAction === "deep" ? "deep,online" : "online";
    }

    // 映射模型
    let realModel = body.model;
    if (body.model === "DeepSeek-R1" || body.model === "DeepSeek-V3") {
      realModel = "deepseek";
    }

    // 强制创建新会话（修改部分）
    const { deviceId } = this.chatManage.getOrCreateIds(false);
    let conversationId = await this._create_conversation(deviceId);
    
    if (!conversationId) {
      console.error('Failed to create conversation');
      yield { error: 'Failed to create conversation' };
      return;
    }

    // 移除清除上下文的处理逻辑（因为每次都是新会话）
    const fullPrompt = this._buildFullPrompt(body.messages);
    const payload = {
      stream: true,
      botCode: 'AI_SEARCH',
      userAction: userAction,  // 使用动态的 userAction
      model: realModel,
      conversationId: conversationId,
      question: fullPrompt,  // 使用完整提示
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.nanoid(21);
    const sign = await this.generateSign(timestamp, payload, nonce);

    const headers = {
      'Origin': 'https://ai.dangbei.com',
      'Referer': 'https://ai.dangbei.com/',
      'User-Agent': USER_AGENT,
      'deviceId': deviceId,
      'nonce': nonce,
      'sign': sign,
      'timestamp': timestamp,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${API_DOMAIN}/ai-search/chatApi/v1/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('HTTP Error:', response.status, error);
        yield { error: `HTTP ${response.status}: ${error}` };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let cardMessages = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith(this.dataPrefix)) continue;

          try {
            const data = JSON.parse(line.slice(this.dataPrefix.length));
            if (data.type === 'answer') {
              const content = data.content;
              const contentType = data.content_type;

              if (thinkingState.thinking === -1 && contentType === 'thinking') {
                thinkingState.thinking = 0;
                yield { choices: [{ delta: { content: '<think>\n\n' }, finish_reason: null }] };
              } else if (thinkingState.thinking === 0 && contentType === 'text') {
                thinkingState.thinking = 1;
                yield { choices: [{ delta: { content: '\n' }, finish_reason: null }] };
                yield { choices: [{ delta: { content: '</think>' }, finish_reason: null }] };
                yield { choices: [{ delta: { content: '\n\n' }, finish_reason: null }] };
              }

              if (contentType === 'card') {
                // 格式化 cardMessages 内容为 Markdown
                const cardContent = JSON.parse(content);
                const cardItems = cardContent.cardInfo.cardItems;
                let markdownOutput = '\n\n---\n\n';

                // 处理搜索关键词（type: 2001）
                const searchKeywords = cardItems.find(item => item.type === '2001');
                if (searchKeywords) {
                  const keywords = JSON.parse(searchKeywords.content);
                  markdownOutput += `搜索关键字：${keywords.join('; ')}\n`;
                }

                // 处理搜索结果（type: 2002）
                const searchResults = cardItems.find(item => item.type === '2002');
                if (searchResults) {
                  const results = JSON.parse(searchResults.content);
                  markdownOutput += `共找到 ${results.length} 个搜索结果：\n`;
                  
                  results.forEach((result) => {
                    markdownOutput += `[${result.idIndex}] [${result.name}](${result.url}) 来源：${result.siteName}\n`;
                  });
                }

                cardMessages.push(markdownOutput);
              }

              if (content && (contentType === 'text' || contentType === 'thinking')) {
                yield { choices: [{ delta: { content }, finish_reason: null }] };
              }
            }
          } catch (e) {
            console.error('Parse error:', e, 'Line:', line);
            yield { error: `JSONDecodeError: ${e.message}` };
            return;
          }
        }
      }

      if (cardMessages.length > 0) {
        yield { choices: [{ delta: { content: cardMessages.join('') }, finish_reason: null }] };
      }

      yield {
        choices: [{
          delta: {
            meta: {
              device_id: deviceId,
              conversation_id: conversationId
            }
          },
          finish_reason: null
        }]
      };

    } catch (e) {
      console.error('Error in pipe:', e);
      yield { error: `${e.name}: ${e.message}` };
      return;
    }
  }

  nanoid(size = 21) {
    const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).reverse().map(b => urlAlphabet[b & 63]).join('');
  }

  async generateSign(timestamp, payload, nonce) {
    const payloadStr = JSON.stringify(payload);
    const signStr = `${timestamp}${payloadStr}${nonce}`;
    const msgBuffer = new TextEncoder().encode(signStr);
    const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

const pipe = new Pipe();

// 验证 API 密钥
function verifyApiKey(request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const apiKey = authorization.replace('Bearer ', '').trim();
  if (apiKey !== VALID_API_KEY) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return null;
}

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const url = new URL(request.url);

  // 验证 API 密钥（除了 OPTIONS 请求）
  const authError = verifyApiKey(request);
  if (authError) return authError;

  if (request.method === 'GET' && url.pathname === '/v1/models') {
    return new Response(JSON.stringify({
      object: 'list',
      data: [{
        id: 'DeepSeek-R1',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'library'
      },
      {
        id: 'DeepSeek-V3',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'library'
      },
      {
        id: 'doubao',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'library'
      },
      {
        id: 'qwen',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'library'
      }
    ]
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  if (request.method === 'POST' && url.pathname === '/v1/chat/completions') {
    const body = await request.json();
    const isStream = body.stream || false;

    if (isStream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of pipe.pipe(body)) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!isStream) {
      let content = '';
      let meta = null;
      try {
        for await (const chunk of pipe.pipe(body)) {
          if (chunk.choices?.[0]?.delta?.content) {
            content += chunk.choices[0].delta.content;
          }
          if (chunk.choices?.[0]?.delta?.meta) {
            meta = chunk.choices[0].delta.meta;
          }
        }

        const parts = content.split('\n\n\n', 2);
        const reasoningContent = parts[0] || '';
        const finalContent = parts[1] || '';

        return new Response(JSON.stringify({
          id: crypto.randomUUID(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: body.model,
          choices: [{
            message: {
              role: 'assistant',
              reasoning_content: reasoningContent,
              content: finalContent,
              meta: meta
            },
            finish_reason: 'stop'
          }]
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        console.error('Error processing chat request:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
  }

  return new Response('Not Found', { status: 404 });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
