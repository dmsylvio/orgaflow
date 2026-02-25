import { redirect } from "next/navigation";
import { getServerCaller } from "@/server/api/caller";
import { getServerSessionSafe } from "@/server/auth/session";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSessionSafe();

  if (!session?.user?.id) {
    redirect(`/invite/${encodeURIComponent(token)}/signup`);
  }

  const caller = await getServerCaller();
  await caller.invitations.accept({ token });
  redirect("/app");
}
