import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "current_org_id";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const { orgId } = await req.json().catch(() => ({}) as any);

  if (!orgId || typeof orgId !== "string" || !orgId.trim()) {
    return NextResponse.json({ error: "orgId inválido" }, { status: 400 });
  }

  cookieStore.set(COOKIE_NAME, orgId, {
    path: "/",
    sameSite: "lax",
    // secure: true, // habilite em produção (https)
    // httpOnly: true, // se quiser impedir leitura no client (opcional)
  });

  return NextResponse.json({ ok: true, orgId });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const c = cookieStore.get(COOKIE_NAME)?.value ?? null;
  return NextResponse.json({ orgId: c });
}
