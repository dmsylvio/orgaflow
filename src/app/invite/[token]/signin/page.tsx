import InviteSigninForm from "./form";

export default async function InviteSigninPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteSigninForm token={token} />;
}
