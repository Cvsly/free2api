async function generateImage(prompt) {
  const URL = "https://fluximg.com/api/image/generateImage";
  const DEFAULT_SIZE = "1:1";
  let size = DEFAULT_SIZE;
  let cleanPrompt = prompt;


  // 处理图像规格
  if (prompt) {
    const lastDashIndex = prompt.lastIndexOf('---');
    if (lastDashIndex !== -1) {
      const possibleSize = prompt.slice(lastDashIndex + 3).trim(); // 获取---后面的内容
      const cleanSize = possibleSize.trim();
      if (isSizeValid(cleanSize)) {
        size = cleanSize;
        cleanPrompt = prompt.slice(0, lastDashIndex).trim();
      }
    }
  }

  console.log(`Clean Prompt: ${cleanPrompt}, Size: ${size}`); // 用于调试

  const jsonBody = {
    textStr: cleanPrompt || " ",
    model: "black-forest-labs/flux-schnell",
    size: size
  };

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify(jsonBody)
    });

    if (response.ok) {
      const url = await response.text();
      return {
        created: Math.floor(Date.now() / 1000),
        data: [{ url: url }],
        size: size
      };
    }
  } catch (e) {
    console.error("Error generating image:", e);
  }

  // 默认响应
  return {
    created: Math.floor(Date.now() / 1000),
    data: [{ url: "https://pic.netbian.com/uploads/allimg/240808/192001-17231160015724.jpg" }],
    size: size
  };
}

function isSizeValid(size) {
  return ["16:9", "1:1", "9:16", "3:2", "3:4", "1:2"].includes(size);
}

function generateFakeStream(imageData, prompt) {
  const encoder = new TextEncoder();
  const chunks = [
    `🎨 使用提示词：\n${prompt}\n`,
    `📐 图像规格：${imageData.size}\n`,
    "🖼️ 正在根据提示词生成图像...\n",
    "🔄 图像正在处理中...\n",
    "⏳ 即将完成...\n",
    `🌟 生成成功！\n图像生成完毕，以下是结果：\n\n![生成的图像](${imageData.data[0].url})`
  ];

  let index = 0;

  return new ReadableStream({
    start(controller) {
      function push() {
        if (index < chunks.length) {
          const chunk = chunks[index++];
          const data = JSON.stringify({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: imageData.created,
            model: 'flux-ai-image-generator',
            choices: [{
              index: 0,
              delta: { role: 'assistant', content: chunk },
              finish_reason: index === chunks.length ? 'stop' : null
            }]
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          setTimeout(push, 500); // Simulate processing time
        } else {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
      push();
    }
  });
}

function generateNonStreamResponse(imageData, prompt) {
  const content = `🎨 使用提示词：${prompt}\n` +
                  `📐 图像规格：${imageData.size}\n` +
                  `🌟 图像生成成功！\n` +
                  `以下是结果：\n\n` +
                  `![生成的图像](${imageData.data[0].url})`;

  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: imageData.created,
    model: 'flux-ai-image-generator',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: content
      },
      finish_reason: 'stop'
    }]
  };
}

async function handleRequest(request) {
  // 处理 GET 请求
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      object: "list",
      data: [
        {
          id: "flux-schnell",
          object: "model",
          created: 1685474247,
          owned_by: "black-forest-labs"
        }
      ]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 处理 POST 请求
  if (request.method !== 'POST') {
    return new Response('Only POST requests are allowed', { status: 405 });
  }

  let json;
  try {
    json = await request.json();
  } catch (err) {
    return new Response('Invalid JSON', { status: 400 });
  }

  // 从 OpenAI 格式的请求中提取用户的最后一条消息
  const messages = json.messages || [];
  const lastUserMessage = messages.reverse().find(msg => msg.role === 'user');
  const prompt = lastUserMessage ? lastUserMessage.content : '';

  if (!prompt) {
    return new Response('No valid prompt found in the request', { status: 400 });
  }

  const imageData = await generateImage(prompt);

  // 检查是否请求流式响应
  const isStreamRequested = json.stream === true;

  if (isStreamRequested) {
    const stream = generateFakeStream(imageData, prompt);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } else {
    const response = generateNonStreamResponse(imageData, prompt);
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
