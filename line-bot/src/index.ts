/* LINE の Webhook を受ける入口。LINE Developers の「Webhook URL」には
   https://<worker の URL>/webhook を設定する */

import { type Env, type LineEvent, verifySignature } from "./line.ts";
import { handleEvent } from "./flow.ts";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(req.url);
    if (req.method === "GET" && pathname === "/") return new Response("umai-mise-dake line bot");
    if (req.method !== "POST" || pathname !== "/webhook") return new Response("Not Found", { status: 404 });

    const body = await req.text();
    if (!(await verifySignature(body, req.headers.get("x-line-signature"), env.LINE_CHANNEL_SECRET))) {
      return new Response("Unauthorized", { status: 401 });
    }
    // LINE には先に 200 を返し、処理はそのあと続ける（GitHub への書き込みで待たせないため）
    const { events = [] } = JSON.parse(body) as { events?: LineEvent[] };
    ctx.waitUntil(Promise.all(events.map((ev) => handleEvent(env, ev).catch((e) => console.error(e)))));
    return new Response("OK");
  },
} satisfies ExportedHandler<Env>;
