import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/app");

  return (
    <div className="min-h-dvh flex">
      {/* aqui você pode colocar Sidebar/Topbar depois */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
