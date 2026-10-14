import { database, json, errorResponse, identity, guard, validString, readObject } from "@/lib/server";
export async function GET(request: Request) {
  if (!identity(request)) return json({ suggestions: [] });
  try {
    const { results } = await database().prepare("SELECT id, name, address, note, status, created_at AS createdAt FROM suggestions WHERE owner_id = ? ORDER BY created_at DESC LIMIT 30").bind(identity(request)).all();
    return json({ suggestions: results });
  } catch { return errorResponse(); }
}
export async function POST(request: Request) {
  const denied = guard(request); if (denied) return denied;
  try {
    const data = await readObject(request);
    if (!validString(data.name, 2, 100) || !validString(data.address, 5, 200) || !validString(data.note, 0, 500)) return json({ error: "Проверьте название и адрес места" }, 400);
    const recent = await database().prepare("SELECT COUNT(*) AS count FROM suggestions WHERE owner_id = ? AND created_at > ?").bind(identity(request), new Date(Date.now() - 3600000).toISOString()).first<{ count: number }>();
    if ((recent?.count || 0) >= 5) return json({ error: "Вы уже предложили пять мест за час. Попробуйте позже." }, 429);
    const id = crypto.randomUUID();
    await database().prepare("INSERT INTO suggestions (id, owner_id, name, address, note, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)").bind(id, identity(request), data.name.trim(), data.address.trim(), data.note.trim(), new Date().toISOString()).run();
    return json({ ok: true, id }, 201);
  } catch { return errorResponse(); }
}
