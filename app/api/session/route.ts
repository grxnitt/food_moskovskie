import { withBackend } from "@/lib/backend";
import { identity, json } from "@/lib/server";
async function handleGET(request: Request) {
  const owner = identity(request);
  if (owner) return json({ signedIn: owner.startsWith("account:"), ready: true });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return json({ signedIn: false, ready: true }, 200, { "Set-Cookie": `peremena_session=${crypto.randomUUID()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure}` });
}

export const GET = withBackend(handleGET);
