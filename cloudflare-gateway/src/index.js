import { hasRoutePath, matchRoute } from './routes.js';

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8', ...headers },
  });
}

function isConfigured(env) {
  return Boolean(
    typeof env.GAS_UPSTREAM_URL === 'string' && env.GAS_UPSTREAM_URL.trim()
    && typeof env.GAS_GATEWAY_SECRET === 'string' && env.GAS_GATEWAY_SECRET.length >= 32
    && typeof env.TURNSTILE_SECRET_KEY === 'string' && env.TURNSTILE_SECRET_KEY.trim()
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = matchRoute(request.method, url.pathname);

    if (!route) {
      if (hasRoutePath(url.pathname)) {
        return jsonResponse({
          status: 'error',
          error: { code: 'method_not_allowed', message: '不支援此操作方式。' },
        }, 405, { Allow: 'GET, POST, OPTIONS' });
      }
      return jsonResponse({
        status: 'error',
        error: { code: 'route_not_found', message: '找不到此服務。' },
      }, 404);
    }

    if (route.action === 'health') {
      return jsonResponse({
        status: 'success',
        data: { configured: isConfigured(env) },
      }, isConfigured(env) ? 200 : 503);
    }

    return jsonResponse({
      status: 'error',
      error: { code: 'not_implemented', message: '服務尚未完成設定。' },
    }, 501);
  },
};
