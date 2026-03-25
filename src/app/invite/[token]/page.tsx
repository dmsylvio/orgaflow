import type { Metadata } from "next";
import { InviteScreen } from "./invite-screen";

export const metadata: Metadata = {
  title: "Invitation",
  description: "Accept your Orgaflow invitation.",
  robots: { index: false, follow: false },
};

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  return <InviteScreen token={token} />;
}
