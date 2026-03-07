export const MCP_SERVER_URL = 'https://mcp.i18nagent.ai';

const HEAVY_LOAD_PATTERNS = [
  /Our system is under heavy load/i,
  /system is under heavy load.*resume.*later/i,
];

export function isHeavyLoadError(message) {
  if (!message) return false;
  return HEAVY_LOAD_PATTERNS.some(p => p.test(message));
}

export function buildJsonRpcRequest(toolName, args) {
  return {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };
}

export function parseJsonRpcResponse(response) {
  if (response.error) {
    const msg = response.error.message || JSON.stringify(response.error);
    throw new Error(msg);
  }

  const result = response.result;
  if (result && result.content && result.content[0]) {
    const text = result.content[0].text;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return result;
}

export async function callTool(toolName, args, apiKey, opts = {}) {
  const timeout = opts.timeout || 300000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildJsonRpcRequest(toolName, args)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      handleHttpError(response.status, errorText, toolName);
    }

    const data = await response.json();
    return parseJsonRpcResponse(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout / 1000}s. For large translations, the job may still be processing. Check status with: i18nagent status <jobId>`);
    }
    if (isHeavyLoadError(error.message)) {
      throw new Error('System under heavy load. Your job has been saved -- resume later with: i18nagent resume <jobId>');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function handleHttpError(status, body, toolName) {
  if (status === 401) {
    throw new Error('Invalid or missing API key. Run: i18nagent login');
  }
  if (status === 402) {
    throw new Error('Insufficient credits. Top up at: https://app.i18nagent.ai');
  }
  if (status === 404) {
    throw new Error(`Resource not found (${toolName})`);
  }
  if (status === 503) {
    throw new Error('Service temporarily unavailable. Try again later.');
  }
  throw new Error(`HTTP ${status}: ${body}`);
}

export async function uploadFile(endpoint, fields, fileField, apiKey, opts = {}) {
  const timeout = opts.timeout || 60000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    if (fileField) {
      formData.append(fileField.name, new Blob([fileField.content]), fileField.fileName);
    }

    const response = await fetch(`${MCP_SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      handleHttpError(response.status, errorText, endpoint);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
