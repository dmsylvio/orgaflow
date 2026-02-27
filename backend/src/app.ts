import { Elysia } from "elysia";
import { registerAuthRoutes } from "./routes/auth";
import { registerCustomerRoutes } from "./routes/customers";
import { registerMeRoutes } from "./routes/me";
import { registerOrgRoutes } from "./routes/org";

export function createApp() {
  const app = new Elysia({ prefix: "/api" })
    .onRequest(({ set }) => {
      set.headers["access-control-allow-origin"] = "*";
      set.headers["access-control-allow-headers"] =
        "content-type, authorization";
      set.headers["access-control-allow-methods"] =
        "GET,POST,PATCH,DELETE,OPTIONS";
    })
    .options("/*", () => new Response(null, { status: 204 }))
    .get("/health", () => ({ ok: true }));

  registerAuthRoutes(app);
  registerMeRoutes(app);
  registerOrgRoutes(app);
  registerCustomerRoutes(app);

  return app;
}
