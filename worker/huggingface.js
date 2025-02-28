//对接one-api/new-api使用
const API_KEY = "sk-xxxxxx";

//你的hugging face api key去hugging face申请
const HUGGINGFACE_API_KEY = "hf_xxxxxxx";

//目前发现的可用模型，请求时如模型不在该列表内，则使用你请求的模型
const CUSTOMER_MODEL_MAP = {
    "qwen2.5-72b-instruct": "Qwen/Qwen2.5-72B-Instruct",
    "gemma2-2b-it": "google/gemma-2-2b-it",
    "gemma2-27b-it": "google/gemma-2-27b-it",
    "llama-3-8b-instruct": "meta-llama/Meta-Llama-3-8B-Instruct",
    "llama-3.2-1b-instruct": "meta-llama/Llama-3.2-1B-Instruct",
    "llama-3.2-3b-instruct": "meta-llama/Llama-3.2-3B-Instruct",
    "phi-3.5": "microsoft/Phi-3.5-mini-instruct"
};

async function handleRequest(request) {
    try {
        if (request.method === "OPTIONS") {
            return getResponse("", 204);
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
            return getResponse("Unauthorized", 401);
        }

        if (request.url.endsWith("/v1/models")) {
            const arrs = [];
            Object.keys(CUSTOMER_MODEL_MAP).map(element => arrs.push({ id: element, object: "model" }))
            const response = {
                data: arrs,
                success: true
            };

            return getResponse(JSON.stringify(response), 200);
        }

        if (request.method !== "POST") {
            return getResponse("Only POST requests are allowed", 405);
        }

        if (!request.url.endsWith("/v1/chat/completions")) {
            return getResponse("Not Found", 404);
        }

        const data = await request.json();
        const messages = data.messages || [];
        const model = CUSTOMER_MODEL_MAP[data.model] || data.model;
        const temperature = data.temperature || 0.7;
        const max_tokens = data.max_tokens || 8196;
        const top_p = Math.min(Math.max(data.top_p || 0.9, 0.0001), 0.9999);
        const stream = data.stream || false;

        const requestBody = {
            model: model,
            stream: stream,
            temperature: temperature,
            max_tokens: max_tokens,
            top_p: top_p,
            messages: messages
        };

        const apiUrl = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return getResponse(`Error from API: ${response.statusText} - ${errorText}`, response.status);
        }

        const newResponse = new Response(response.body, {
            status: response.status,
            headers: {
                ...Object.fromEntries(response.headers),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': '*'
            }
        });

        return newResponse;
    } catch (error) {
        return getResponse(JSON.stringify({
            error: `处理请求失败: ${error.message}`
        }), 500);
    }
}

function getResponse(resp, status) {
    return new Response(resp, {
        status: status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        }
    });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})
