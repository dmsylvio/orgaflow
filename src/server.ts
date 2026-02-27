import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.API_PORT ?? 3000);

createApp().listen(port);

console.log(`Orgaflow backend API running em http://localhost:${port}`);
console.log(`Health check em http://localhost:${port}/api/health`);
console.log(`OpenAPI disponível em http://localhost:${port}/openapi`);
