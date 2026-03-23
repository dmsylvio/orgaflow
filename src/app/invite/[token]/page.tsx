import { InviteScreen } from "./invite-screen";

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  return <InviteScreen token={token} />;
}
