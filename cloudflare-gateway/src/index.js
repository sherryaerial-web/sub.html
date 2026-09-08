import { hasRoutePath, matchRoute } from './routes.js';
import {
  GatewayError,
  corsHeaders,
  readJsonBody,
  validateOrigin,
} from './security.js';

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
    const requestedMethod = request.method === 'OPTIONS'
      ? request.headers.get('Access-Control-Request-Method') || ''
      : request.method;
    const route = matchRoute(requestedMethod, url.pathname);

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

    let origin;
    try {
      origin = validateOrigin(request, env.ALLOWED_ORIGINS);
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(origin, route.method),
        });
      }
      if (route.method === 'POST') {
        await readJsonBody(request, route.maxBodyBytes);
      }
    } catch (error) {
      if (error instanceof GatewayError) {
        return jsonResponse({
          status: 'error',
          error: { code: error.code, message: error.message },
        }, error.status, origin ? corsHeaders(origin, route.method) : {});
      }
      return jsonResponse({
        status: 'error',
        error: { code: 'invalid_request', message: '無法處理這次請求。' },
      }, 400, origin ? corsHeaders(origin, route.method) : {});
    }

    return jsonResponse({
      status: 'error',
      error: { code: 'not_implemented', message: '服務尚未完成設定。' },
    }, 501, corsHeaders(origin, route.method));
  },
};
