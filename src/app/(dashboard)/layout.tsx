import { redirect } from "next/navigation";
import { getServerSessionSafe } from "@/server/auth/session";
import { Sidebar } from "./components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionSafe();
  if (!session) redirect("/signin?callbackUrl=/app");

  return (
    <div className="h-full">
      <header className="fixed top-0 left-0 z-20 flex items-center justify-between w-full px-4 py-3 md:h-16 md:px-8 bg-linear-to-r from-red-700 to-red-500"></header>
      <Sidebar />
      <main className="h-screen h-screen-ios overflow-y-auto md:pl-56 xl:pl-64 min-h-0">
        <div className="py-16">{children}</div>
      </main>
    </div>
  );
}
