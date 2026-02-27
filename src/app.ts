import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";
import { registerAuthRoutes } from "./routes/auth";
import { registerCustomerRoutes } from "./routes/customers";
import { registerMeRoutes } from "./routes/me";
import { registerOrgRoutes } from "./routes/org";

export function createApp() {
  const app = new Elysia({ adapter: node() })
    .use(
      openapi({
        documentation: {
          info: {
            title: "Orgaflow Backend API",
            version: "1.0.0",
            description:
              "API multi-tenant do Orgaflow. A seleção de tenant ocorre por x-org-id, x-org-slug ou activeOrgId do usuário.",
          },
        },
      }),
    )
    .onRequest(({ set }) => {
      set.headers["access-control-allow-origin"] = "*";
      set.headers["access-control-allow-headers"] =
        "content-type, authorization, x-org-slug, x-org-id";
      set.headers["access-control-allow-methods"] =
        "GET,POST,PATCH,DELETE,OPTIONS";
    })
    .options("/*", () => new Response(null, { status: 204 }))
    .group("/api", (api) => {
      api.get("/health", () => ({ ok: true }));
      registerAuthRoutes(api as any);
      registerMeRoutes(api as any);
      registerOrgRoutes(api as any);
      registerCustomerRoutes(api as any);
      return api;
    });

  return app;
}
