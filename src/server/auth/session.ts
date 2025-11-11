import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getServerSessionSafe() {
  return await getServerSession(authOptions);
}
