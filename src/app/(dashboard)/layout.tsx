import { getServerSessionSafe } from "@/server/auth/session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionSafe();
  if (!session) redirect("/signin?callbackUrl=/app");

  return ( 
    <div className="h-full">
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
