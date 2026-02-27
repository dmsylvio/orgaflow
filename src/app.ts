import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";
import { registerAuthRoutes } from "./routes/auth";
import { registerCustomerRoutes } from "./routes/customers";
import { registerMeRoutes } from "./routes/me";
import { registerOrgRoutes } from "./routes/org";

export function createApp() {
  const app = new Elysia({ adapter: node() })
    .use(openapi())
    .onRequest(({ set }) => {
      set.headers["access-control-allow-origin"] = "*";
      set.headers["access-control-allow-headers"] =
        "content-type, authorization";
      set.headers["access-control-allow-methods"] =
        "GET,POST,PATCH,DELETE,OPTIONS";
    })
    .options("/*", () => new Response(null, { status: 204 }))
    .get("/health", () => ({ ok: true }));

  registerAuthRoutes(app as any);
  registerMeRoutes(app as any);
  registerOrgRoutes(app as any);
  registerCustomerRoutes(app as any);

  return app;
}
