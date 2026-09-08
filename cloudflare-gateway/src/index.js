import { hasRoutePath, matchRoute } from './routes.js';
import {
  buildRateLimitKey,
  GatewayError,
  corsHeaders,
  readJsonBody,
  validateOrigin,
} from './security.js';
import { verifyTurnstile } from './turnstile.js';
import { callGas } from './upstream.js';

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
  async fetch(request, env, ctx) {
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
      let body = {};
      if (route.method === 'POST') {
        body = await readJsonBody(request, route.maxBodyBytes);
      }

      if (route.turnstileRequired) {
        const turnstileToken = typeof body.turnstileToken === 'string'
          ? body.turnstileToken.trim()
          : '';
        if (!turnstileToken) {
          throw new GatewayError(400, 'turnstile_required', '請先完成人機驗證。');
        }

        const limiter = env.PUBLIC_WRITE_LIMITER;
        if (!limiter || typeof limiter.limit !== 'function') {
          throw new GatewayError(503, 'gateway_not_configured', '服務尚未完成設定。');
        }
        const rateKey = await buildRateLimitKey(
          route,
          body,
          request.headers.get('CF-Connecting-IP') || '',
        );
        let limitResult;
        try {
          limitResult = await limiter.limit({ key: rateKey });
        } catch (_error) {
          throw new GatewayError(503, 'rate_limit_unavailable', '服務暫時忙碌，請稍後再試。');
        }
        if (!limitResult || limitResult.success !== true) {
          throw new GatewayError(429, 'rate_limited', '操作太頻繁，請稍後再試。');
        }

        await verifyTurnstile({
          token: turnstileToken,
          expectedAction: route.turnstileAction,
          remoteIp: request.headers.get('CF-Connecting-IP') || '',
          secret: env.TURNSTILE_SECRET_KEY,
          allowedHostnames: env.TURNSTILE_HOSTNAMES,
          fetchImpl: typeof env.fetch === 'function' ? env.fetch : fetch,
        });
      } else {
        const limiter = env.PUBLIC_READ_LIMITER;
        if (limiter && typeof limiter.limit === 'function') {
          const rateKey = await buildRateLimitKey(
            route,
            body,
            request.headers.get('CF-Connecting-IP') || '',
          );
          const result = await limiter.limit({ key: rateKey });
          if (!result || result.success !== true) {
            throw new GatewayError(429, 'rate_limited', '操作太頻繁，請稍後再試。');
          }
        }
      }

      const payload = route.action === 'getStudentPracticeAvailability'
        ? { date: url.searchParams.get('date') || '' }
        : route.action === 'getVvipMembers'
          ? {}
          : route.action === 'submitStudentPractice'
            ? { practice: body.practice }
            : route.action === 'getVvipSelection'
              ? { vvipId: body.vvipId }
              : { vvipId: body.vvipId, calendarIds: body.calendarIds };

      const fetchImpl = typeof env.fetch === 'function' ? env.fetch : fetch;
      const cache = route.action === 'getStudentPracticeAvailability'
        && globalThis.caches && globalThis.caches.default
        ? globalThis.caches.default
        : null;
      const cacheKey = cache
        ? new Request(`https://gateway-cache.invalid/student-practice?date=${encodeURIComponent(payload.date)}`)
        : null;
      if (cache && cacheKey) {
        const cached = await cache.match(cacheKey);
        if (cached) {
          return jsonResponse(await cached.json(), 200, corsHeaders(origin, route.method));
        }
      }

      const data = await callGas({ action: route.action, payload, env, fetchImpl });
      const successPayload = { status: 'success', data };
      if (cache && cacheKey) {
        const cacheResponse = jsonResponse(successPayload, 200, { 'Cache-Control': 'public, max-age=30' });
        const pending = cache.put(cacheKey, cacheResponse);
        if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(pending);
        else await pending;
      }
      return jsonResponse(successPayload, 200, corsHeaders(origin, route.method));
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
