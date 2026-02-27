import { createHmac, timingSafeEqual } from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

type JwtPayload = { sub: string; email: string; exp: number };

export type Session = { userId: string; email: string } | null;

export function signJwt(payload: JwtPayload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) throw new Error("invalid-token");

  const expected = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest();
  const provided = Buffer.from(signature, "base64url");

  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new Error("invalid-signature");
  }

  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8"),
  ) as JwtPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("token-expired");
  }

  return payload;
}

export async function resolveSession(
  authHeader?: string | null,
): Promise<Session> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7).trim();
    const payload = verifyJwt(token);
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
