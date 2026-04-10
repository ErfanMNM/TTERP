/**
 * Cloudflare Worker — ERPNext4V
 *
 * Serve SPA + API proxy cho ERPNext trong 1 Worker duy nhất.
 *
 * Deploy:
 *   npm run deploy
 *
 * Secrets:
 *   wrangler secret put SESSION_COOKIE
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // === API Proxy ===
    if (url.pathname.startsWith('/api/')) {
      return handleApiProxy(request, env);
    }

    // === SPA Fallback ===
    let response = await env.ASSETS.fetch(request);

    // Nếu 404 và là đường dẫn SPA (không phải file tĩnh) → fallback về index.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', url.origin);
      response = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return response;
  },
};

async function handleApiProxy(request, env) {
  const url = new URL(request.url);
  const erpTarget = env.ERP_TARGET || 'https://erp.mte.vn';

  const targetPath = url.pathname.replace('/api/', '');
  const targetUrl = `${erpTarget}/api/${targetPath}${url.search}`;

  // Merge user's session cookie with optional static session cookie
  const userCookie = request.headers.get('Cookie') || '';
  const staticCookie = env.SESSION_COOKIE ? `; ${env.SESSION_COOKIE}` : '';
  const mergedCookie = userCookie + staticCookie;

  const headers = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
    'Accept': request.headers.get('Accept') || 'application/json',
    'X-Forwarded-Host': url.host,
    'Origin': url.origin,
    'Referer': url.origin + '/',
    'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
    'X-Real-IP': request.headers.get('CF-Connecting-IP') || '',
    'User-Agent': request.headers.get('User-Agent') || '',
  };

  if (mergedCookie) {
    headers['Cookie'] = mergedCookie;
  }

  try {
    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? request.body
        : undefined,
    });

    const response = await fetch(proxyReq);

    // Handle redirect — rewrite location
    if (response.status === 302 || response.status === 303) {
      const location = response.headers.get('Location') || '';
      const newLocation = location.replace(erpTarget, '');
      const newHeaders = new Headers();
      response.headers.forEach((v, k) => {
        if (k.toLowerCase() !== 'location') {
          newHeaders.set(k, v);
        }
      });
      newHeaders.set('Location', newLocation);
      return new Response(null, { status: response.status, headers: newHeaders });
    }

    // Binary response (images, PDFs)
    const contentType = response.headers.get('Content-Type') || '';
    const isBinary = contentType.startsWith('image/') ||
      contentType.includes('octet-stream') ||
      contentType.includes('application/pdf');

    if (isBinary) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // JSON response — forward all relevant headers including Set-Cookie
    const newHeaders = new Headers();
    newHeaders.set('Content-Type', 'application/json');
    newHeaders.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With, X-Frappe-CSRF-Token');
    newHeaders.set('Access-Control-Allow-Credentials', 'true');

    // Forward Set-Cookie headers (critical for session auth)
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) {
      newHeaders.set('Set-Cookie', setCookie);
    }

    // Forward csrf-token for POST/PUT/PATCH
    const csrfToken = response.headers.get('csrf-token');
    if (csrfToken) {
      newHeaders.set('X-CSRF-Token', csrfToken);
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({
      exception: 'Proxy error',
      message: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
