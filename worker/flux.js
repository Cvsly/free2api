function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function generateImage(prompt, draw_model, requestUrl) {
    const URL_genspark = "https://gs.aytsao.cn/v1/images/generations";
    const AUTH_TOKEN_gs = `sk-genspark2api`;
    const DEFAULT_SIZE = "1:1";
    let size = DEFAULT_SIZE;
    let cleanPrompt = prompt;


    const paramPattern = /---(\S+)/g;
    let match;
    const params = {};
    while ((match = paramPattern.exec(prompt)) !== null) {
        const param = match[1].trim();
        params[param.toLowerCase()] = match.index;
    }

    // 检查和处理尺寸参数
    for (const param in params) {
        if (isSizeValid(param)) {
            size = param;
            cleanPrompt = cleanPrompt.slice(0, params[param]).trim();
            break; // 假设同一时间只会有一个有效尺寸
        }
    }

    if (draw_model.endsWith("-genspark")) {
        try {
            const jsonBody = {
                model: draw_model.replace(/-genspark$/, ""),
                prompt: cleanPrompt || " ",
                aspect_ratio: size,
                "safety_filter_level": "BLOCK_ONLY_HIGH",
                "person_generation": "ALLOW_ADULT"
            };
            const response = await fetch(URL_genspark, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN_gs}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonBody)
            });

            if (response.ok) {
                const jsonResponse = await response.json();
                return {
                    prompt: cleanPrompt,
                    created: Math.floor(Date.now() / 1000),
                    data: jsonResponse["data"],
                    size: size
                };
            }
            console.error(response);
        } catch (e) {
            console.error("Error generating image:", e);
        }
    }

    // 默认响应  
    return {
        prompt: cleanPrompt,
        created: Math.floor(Date.now() / 1000),
        data: [{ url: "https://pic.netbian.com/uploads/allimg/240808/192001-17231160015724.jpg" }],
        size: size
    };
}

function isSizeValid(size) {
    return ["16:9", "1:1", "9:16", "3:2", "3:4", "1:2"].includes(size);
}

function generateFakeStream(imageData, prompt, draw_model) {
    const encoder = new TextEncoder();
    const chunks = [
        `🎨 使用提示词：\n${prompt}\n`,
        `📐 图像规格：${imageData.size}\n`,
        "🖼️ 正在根据提示词生成图像...\n",
        "🔄 图像正在处理中...\n",
        "⏳ 即将完成...\n",
        `🌟 生成成功！\n图像生成完毕，以下是结果：\n\n${imageData.data
            .map((image, index) => `![生成的图像 ${index + 1}](${image.url})`)
            .join("\n\n")  // 使用换行符连接多个图像
        }`
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
                        model: draw_model,
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

function generateNonStreamResponse(imageData, prompt, draw_model) {
    const content = `🎨 使用提示词：${prompt}\n` +
        `📐 图像规格：${imageData.size}\n` +
        `🌟 图像生成成功！\n` +
        `以下是结果：\n\n` +
        `🌟 生成成功！\n图像生成完毕，以下是结果：\n\n${imageData.data
            .map((image, index) => `![生成的图像 ${index + 1}](${image.url})`)
            .join("\n\n")  // 使用换行符连接多个图像
        }`;
    return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: imageData.created,
        model: draw_model,
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
    if (request.method === "OPTIONS") {
        return new Response("OK", {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
        });
    }
    // 处理 GET 请求  
    if (request.method === 'GET') {
        return new Response(JSON.stringify({
            data: [
                {
                    "id": "flux-genspark",
                    "object": "model"
                },
                {
                    "id": "flux-speed-genspark",
                    "object": "model"
                },
                {
                    "id": "flux-pro/ultra-genspark",
                    "object": "model"
                },
                {
                    "id": "ideogram-genspark",
                    "object": "model"
                },
                {
                    "id": "recraft-v3-genspark",
                    "object": "model"
                },
                {
                    "id": "dall-e-3-genspark",
                    "object": "model"
                },
                {
                    "id": "imagen3-genspark",
                    "object": "model"
                }
            ],
            "success": true
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
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
    const draw_model = json.model || "flux-genspark";

    if (!prompt) {
        return new Response('No valid prompt found in the request', { status: 400 });
    }

    const imageData = await generateImage(prompt, draw_model, request.url);
    const prompt_ = imageData.prompt;
    // 检查是否请求流式响应  
    const isStreamRequested = json.stream === true;

    if (isStreamRequested) {
        const stream = generateFakeStream(imageData, prompt_, draw_model);
        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream' }
        });
    } else {
        const response = generateNonStreamResponse(imageData, prompt_, draw_model);
        return new Response(JSON.stringify(response), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            }
        });
    }
}

addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    event.respondWith(handleRequest(event.request));
});
