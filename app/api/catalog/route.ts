import { withBackend } from "@/lib/backend";
import { dishes, enrichDish, CHECKED_AT } from "@/lib/catalog";
import { database, json, errorResponse } from "@/lib/server";
async function handleGET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const budget = Number(params.get("budget") || 100000);
    const minutes = Number(params.get("minutes") || 100000);
    const radius = Math.min(2000, Math.max(0, Number(params.get("radius") || 2000)));
    if (![budget, minutes, radius].every(Number.isFinite) || budget < 0 || minutes < 0) return json({ error: "Некорректные фильтры" }, 400);
    const { results } = await database().prepare("SELECT dish_id, AVG(rating) AS rating, COUNT(*) AS count FROM reviews GROUP BY dish_id").all<{ dish_id: string; rating: number; count: number }>();
    const ratings = new Map(results.map(r => [r.dish_id, r]));
    const items = dishes.map(enrichDish).filter(d => d.distance <= radius && d.price <= budget && d.totalMinutes <= minutes && (!params.get("cuisine") || params.get("cuisine") === "any" || d.cuisine === params.get("cuisine"))).map(d => ({ ...d, rating: ratings.get(d.id) ? Math.round(ratings.get(d.id)!.rating * 10) / 10 : null, reviewCount: ratings.get(d.id)?.count || 0 }));
    return json({ dishes: items, checkedAt: CHECKED_AT });
  } catch { return errorResponse(); }
}

export const GET = withBackend(handleGET);
