import { redirect } from "next/navigation";
import { getServerSessionSafe } from "@/server/auth/session";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionSafe();
  if (!session) redirect("/auth/sign-in?callbackUrl=/app");

  return (
    <div className="h-full">
      <Topbar />
      <Sidebar />
      <main className="h-screen h-screen-ios overflow-y-auto md:pl-56 xl:pl-64 min-h-0">
        <div className="pt-16 pb-16">{children}</div>
      </main>
    </div>
  );
}
