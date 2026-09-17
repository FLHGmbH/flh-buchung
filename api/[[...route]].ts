import { handle } from "@hono/node-server/vercel";
import { app } from "../server/app.ts";

export const config = { runtime: "nodejs", maxDuration: 30 };
export default handle(app);
