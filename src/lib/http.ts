export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function badRequest(message = "Invalid payload") {
  return json({ error: message }, 400);
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: message }, 401);
}

export function forbidden(message = "Forbidden") {
  return json({ error: message }, 403);
}

export function notFound(message = "Not found") {
  return json({ error: message }, 404);
}

export function conflict(message: string) {
  return json({ error: message }, 409);
}

export function preconditionFailed(message: string) {
  return json({ error: message }, 412);
}
