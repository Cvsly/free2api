// ==================== API地址自动补全 ====================
function normalizeApiUrl(apiUrl, format) {
  if (!apiUrl) return "";

  apiUrl = apiUrl.replace(/\/+$/, "");

  if (format === "gemini") return apiUrl;

  if (
    apiUrl.indexOf("/chat/completions") !== -1 ||
    apiUrl.indexOf("/responses") !== -1
  ) {
    return apiUrl;
  }

  if (apiUrl.endsWith("/v1")) {
    return apiUrl + "/chat/completions";
  }

  if (apiUrl.indexOf("/v1") === -1) {
    return apiUrl + "/v1/chat/completions";
  }

  return apiUrl;
}
