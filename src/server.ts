import { createApp } from "./app";

const port = Number(process.env.API_PORT ?? 4000);

createApp().listen(port);

console.log(`Orgaflow backend API running at http://localhost:${port}/api`);
