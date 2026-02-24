// src/app/invite/[token]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerCaller } from "@/server/api/caller";
import { getServerSessionSafe } from "@/server/auth/session";

type PageParams = Promise<{ token: string }>;

// SERVER ACTIONS — com "use server" e bind do token
async function acceptInvite(token: string, _formData: FormData) {
  "use server";
  const session = await getServerSessionSafe();
  if (!session?.user?.id) {
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }
  const caller = await getServerCaller();
  await caller.invitations.accept({ token });
  redirect("/app");
}

async function rejectInvite(token: string, _formData: FormData) {
  "use server";
  const session = await getServerSessionSafe();
  if (!session?.user?.id) {
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }
  const caller = await getServerCaller();
  await caller.invitations.reject({ token });
  redirect("/");
}

export default async function InvitePage({ params }: { params: PageParams }) {
  const { token } = await params;

  const caller = await getServerCaller();

  // carrega convite no servidor
  let invite: Awaited<ReturnType<typeof caller.invitations.getByToken>>;
  try {
    invite = await caller.invitations.getByToken({ token });
  } catch {
    return (
      <div className="max-w-lg mx-auto py-10">
        <p className="text-red-600">Convite inválido.</p>
        <Link href="/" className="text-sm text-red-700 underline">
          Voltar
        </Link>
      </div>
    );
  }

  if (invite.expired) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <p className="text-red-600">Este convite expirou.</p>
        <Link href="/" className="text-sm text-red-700 underline">
          Voltar
        </Link>
      </div>
    );
  }

  if (invite.acceptedAt) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <p>Convite já aceito.</p>
        <Link href="/app" className="text-sm text-red-700 underline">
          Ir para o app
        </Link>
      </div>
    );
  }

  // bind do token nas server actions
  const accept = acceptInvite.bind(null, token);
  const reject = rejectInvite.bind(null, token);

  return (
    <div className="max-w-lg mx-auto py-10 space-y-5">
      <h1 className="text-2xl font-semibold">
        Convite para entrar em {invite.org.name}
      </h1>
      <p className="text-sm text-gray-600">
        Você foi convidado para fazer parte da organização{" "}
        <strong>{invite.org.name}</strong>
        {invite.role ? (
          <>
            {" "}
            com o papel <strong>{invite.role.name}</strong>
          </>
        ) : null}
        .
      </p>

      <form action={accept} className="inline">
        <button
          type="submit"
          className="rounded bg-red-700 text-white px-4 py-2"
        >
          Aceitar convite
        </button>
      </form>

      <form action={reject} className="inline ml-2">
        <button type="submit" className="rounded border px-4 py-2">
          Rejeitar
        </button>
      </form>

      <div className="pt-4">
        <p className="text-xs text-gray-500">
          Se você não estiver autenticado, enviaremos você para o login e depois
          voltaremos a esta página.
        </p>
      </div>
    </div>
  );
}
