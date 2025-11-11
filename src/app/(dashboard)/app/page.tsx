import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AppHome() {
  const session = await getServerSession(authOptions);

  console.log(session);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-neutral-600">
        Logado como <strong>{session?.user?.email}</strong>
      </p>
      <p className="text-sm text-neutral-600">
        Vá testando o fluxo e a gente encaixa menu, org e permissões na
        sequência.
      </p>
    </div>
  );
}

