import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AppHome() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-neutral-600">
        Signed in as <strong>{session?.user?.email}</strong>
      </p>
      <p className="text-sm text-neutral-600">
        We’ll add menu, org, and permissions next.
      </p>
    </div>
  );
}
