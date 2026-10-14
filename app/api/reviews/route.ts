import { dishes } from "@/lib/catalog";
import { database, json, errorResponse, guard, identity, validString, readObject } from "@/lib/server";
export async function GET(request: Request) {
  const dishId = new URL(request.url).searchParams.get("dishId");
  if (!dishes.some(d => d.id === dishId)) return json({ error: "Блюдо не найдено" }, 404);
  try {
    const owner = identity(request);
    const { results } = await database().prepare("SELECT id, author, rating, body, created_at AS createdAt, CASE WHEN owner_id = ? THEN 1 ELSE 0 END AS mine FROM reviews WHERE dish_id = ? ORDER BY created_at DESC LIMIT 100").bind(owner || "", dishId).all();
    return json({ reviews: results });
  } catch { return errorResponse(); }
}
export async function POST(request: Request) {
  const denied = guard(request); if (denied) return denied;
  try {
    const data = await readObject(request);
    if (!validString(data.dishId, 1, 50) || !dishes.some(d => d.id === data.dishId) || !validString(data.author, 2, 40) || !validString(data.body, 10, 1000) || typeof data.rating !== "number" || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) return json({ error: "Укажите имя, оценку и отзыв от 10 до 1000 символов" }, 400);
    const owner = identity(request)!;
    const recent = await database().prepare("SELECT COUNT(*) AS count FROM reviews WHERE owner_id = ? AND created_at > ?").bind(owner, new Date(Date.now() - 60000).toISOString()).first<{ count: number }>();
    if ((recent?.count || 0) >= 3) return json({ error: "Можно отправить до трёх отзывов в минуту. Попробуйте позже." }, 429);
    await database().prepare("INSERT INTO reviews (id, dish_id, owner_id, author, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id, dish_id) DO UPDATE SET author = excluded.author, rating = excluded.rating, body = excluded.body, created_at = excluded.created_at").bind(crypto.randomUUID(), data.dishId, owner, data.author.trim(), data.rating, data.body.trim(), new Date().toISOString()).run();
    return json({ ok: true }, 201);
  } catch { return errorResponse(); }
}
export async function DELETE(request: Request) {
  const denied = guard(request); if (denied) return denied;
  try {
    const { dishId } = await readObject(request);
    if (!validString(dishId, 1, 50) || !dishes.some(d => d.id === dishId)) return json({ error: "Блюдо не найдено" }, 404);
    await database().prepare("DELETE FROM reviews WHERE owner_id = ? AND dish_id = ?").bind(identity(request), dishId).run();
    return json({ ok: true });
  } catch { return errorResponse(); }
}
