import { env } from "@/lib/runtime";

type Handler = (request: Request) => Response | Promise<Response>;
const methods: Record<string, string[]> = {
  "/api/catalog": ["GET"],
  "/api/session": ["GET"],
  "/api/favorites": ["GET", "POST"],
  "/api/reviews": ["GET", "POST", "DELETE"],
  "/api/suggestions": ["GET", "POST"],
};
const jsonError = (error: string, status: number) => Response.json({ error }, {
  status, headers: { "Cache-Control": "no-store" },
});

function isLocal(url: URL) {
  return !process.env.VERCEL && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
}

// Only these API paths are forwarded. Never forward user-supplied identity,
// Vercel authentication cookies, or redirects carrying the service credential.
export async function proxyBackend(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  if (!methods[incoming.pathname]?.includes(request.method)) {
    return jsonError("Метод не поддерживается", 405);
  }
  const writes = request.method !== "GET";
  // Next.js may use an internal hostname in request.url. The HTTP Host is
  // the browser-facing authority and must match Origin for browser writes.
  const protocol = process.env.VERCEL ? "https:" : incoming.protocol;
  const publicOrigin = new URL(`${protocol}//${request.headers.get("host") || incoming.host}`).origin;
  if (writes && request.headers.get("origin") !== publicOrigin) {
    return jsonError("Запрос с другого сайта отклонён", 403);
  }
  if (writes && !request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError("Нужен JSON", 415);
  }
  const backendUrl = process.env.PEREMENA_BACKEND_URL;
  const token = process.env.PEREMENA_BACKEND_TOKEN;
  if (!backendUrl || !token) {
    return jsonError("Не настроено подключение к серверу. Нужны PEREMENA_BACKEND_URL и PEREMENA_BACKEND_TOKEN.", 503);
  }
  let backend: URL;
  try {
    backend = new URL(backendUrl);
    if ((backend.protocol !== "https:" && !isLocal(backend)) || backend.username || backend.password) {
      return jsonError("Некорректный адрес сервера", 503);
    }
  } catch { return jsonError("Некорректный адрес сервера", 503); }

  const body = writes ? await request.text() : undefined;
  if (body && new TextEncoder().encode(body).length > 8192) {
    return jsonError("Слишком большой запрос", 413);
  }
  const headers = new Headers({
    Accept: "application/json",
    "OAI-Sites-Authorization": `Bearer ${token}`,
  });
  const session = request.headers.get("cookie")?.match(/(?:^|;\s*)peremena_session=([a-f0-9-]{36})(?:;|$)/i)?.[1];
  if (session) headers.set("Cookie", `peremena_session=${session}`);
  if (writes) {
    headers.set("Content-Type", "application/json");
    headers.set("Origin", backend.origin);
  }
  try {
    const upstream = await fetch(new URL(incoming.pathname + incoming.search, backend.origin), {
      method: request.method, headers, body, redirect: "manual", cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.headers.get("content-type")?.includes("application/json")) {
      return jsonError("Сервер временно недоступен. Попробуйте ещё раз.", 503);
    }
    const responseHeaders = new Headers({
      "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Vary: "Cookie",
    });
    const cookie = upstream.headers.get("set-cookie");
    if (cookie?.startsWith("peremena_session=")) {
      responseHeaders.set("Set-Cookie", incoming.protocol === "http:" && isLocal(incoming)
        ? cookie.replace(/;\s*Secure\b/gi, "") : cookie);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return jsonError("Не удалось связаться с сервером. Попробуйте ещё раз.", 503);
  }
}

export function withBackend(handler: Handler): Handler {
  return request => env.DB ? handler(request) : proxyBackend(request);
}
