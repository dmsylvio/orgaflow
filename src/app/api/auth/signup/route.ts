import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint has been replaced by Better Auth.",
      message: "Use /api/auth/* endpoints for signup.",
    },
    { status: 410 },
  );
}
