import { redirect } from "next/navigation";
import { getServerSessionSafe } from "@/server/auth/session";
import AdminShell from "@/components/admin/admin-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionSafe();
  if (!session) redirect("/auth/sign-in?callbackUrl=/app");

  return <AdminShell>{children}</AdminShell>;
}
