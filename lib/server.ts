import { env } from "@/lib/runtime";
export function database() {
  if (!env.DB) throw new Error("База данных недоступна");
  return env.DB;
}
export function identity(request: Request) {
  const account = request.headers.get("oai-authenticated-user-id");
  if (account) return "account:" + account;
  const value = request.headers.get("cookie")?.match(/(?:^|;\s*)peremena_session=([a-f0-9-]{36})/i)?.[1];
  return value ? "guest:" + value : null;
}
export function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
export function guard(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return json({ error: "Запрос с другого сайта отклонён" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Нужен JSON" }, 415);
  if (!identity(request)) return json({ error: "Обновите страницу и повторите" }, 401);
  return null;
}
export function validString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}
export async function readObject(request: Request): Promise<Record<string, unknown>> {
  try { const body = await request.text(); if (body.length > 8192) return {}; const data: unknown = JSON.parse(body); return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {}; } catch { return {}; }
}
export const errorResponse = () => json({ error: "Не удалось связаться с базой. Попробуйте ещё раз." }, 503);
