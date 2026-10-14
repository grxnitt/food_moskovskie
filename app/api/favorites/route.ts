import { withBackend } from "@/lib/backend";
import { dishes } from "@/lib/catalog";
import { database, json, errorResponse, identity, guard, readObject, validString } from "@/lib/server";
async function handleGET(request: Request) {
  const owner = identity(request); if (!owner) return json({ favorites: [] });
  try {
    const { results } = await database().prepare("SELECT dish_id FROM favorites WHERE owner_id = ?").bind(owner).all<{ dish_id: string }>();
    return json({ favorites: results.map(r => r.dish_id) });
  } catch { return errorResponse(); }
}
async function handlePOST(request: Request) {
  const denied = guard(request); if (denied) return denied;
  try {
    const { dishId, saved } = await readObject(request);
    if (!validString(dishId, 1, 50) || !dishes.some(d => d.id === dishId) || typeof saved !== "boolean") return json({ error: "Блюдо не найдено" }, 400);
    if (saved) await database().prepare("INSERT OR IGNORE INTO favorites (owner_id, dish_id) VALUES (?, ?)").bind(identity(request), dishId).run();
    else await database().prepare("DELETE FROM favorites WHERE owner_id = ? AND dish_id = ?").bind(identity(request), dishId).run();
    return json({ ok: true });
  } catch { return errorResponse(); }
}

export const GET = withBackend(handleGET);
export const POST = withBackend(handlePOST);
