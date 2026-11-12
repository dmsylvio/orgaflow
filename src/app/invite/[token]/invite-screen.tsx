"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, LogIn, Mail, ShieldCheck, UserRoundPlus } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { appPaths } from "@/lib/app-paths";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "No expiration";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function InviteScreen({ token }: { token: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const nextTarget = appPaths.invite(token);

  const { data, isPending } = useQuery(
    trpc.team.getInvitationByToken.queryOptions(token),
  );

  const setActiveOrganization = useMutation(
    trpc.workspace.setActiveOrganization.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.push(appPaths.home);
        router.refresh();
      },
      onError: (error) =>
        toast.error("Couldn't open workspace", {
          description: error.message,
        }),
    }),
  );

  const acceptInvitation = useMutation(
    trpc.team.acceptInvitation.mutationOptions({
      onSuccess: async (result) => {
        toast.success("Invitation accepted", {
          description: `You're now part of ${result.organizationName}.`,
        });
        await setActiveOrganization.mutateAsync({
          organizationId: result.organizationId,
        });
      },
      onError: (error) =>
        toast.error("Couldn't accept invitation", {
          description: error.message,
        }),
    }),
  );

  async function handleOpenWorkspace() {
    if (!data || !("organizationId" in data) || !data.organizationId) {
      return;
    }

    await setActiveOrganization.mutateAsync({
      organizationId: data.organizationId,
    });
  }

  if (isPending || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <Spinner className="size-5 text-primary" label="Loading invitation" />
      </div>
    );
  }

  const authLinks = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button asChild>
        <NextLink href={`/login?next=${encodeURIComponent(nextTarget)}`}>
          <LogIn className="h-4 w-4" />
          Sign in
        </NextLink>
      </Button>
      <Button asChild variant="outline">
        <NextLink href={`/register?next=${encodeURIComponent(nextTarget)}`}>
          <UserRoundPlus className="h-4 w-4" />
          Create account
        </NextLink>
      </Button>
    </div>
  );

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[45vh] overflow-hidden bg-[#070A1A]"
      >
        <div className="app-aurora absolute inset-0" />
        <div className="app-grid absolute inset-0" />
      </div>
      <Card className="app-fade-in relative w-full max-w-xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(30,27,75,0.5)]">
        <div aria-hidden className="app-gradient h-1.5 w-full" />
        <CardHeader className="space-y-3">
          <Badge variant="soft" className="w-fit gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Workspace invitation
          </Badge>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-extrabold tracking-[-0.03em]">
              {data.status === "invalid"
                ? "Invitation not found"
                : `Join ${data.organizationName}`}
            </CardTitle>
            <CardDescription>
              {data.status === "invalid"
                ? "This invite link is no longer valid. Ask the workspace owner for a new one."
                : `${data.invitedByName} invited you to collaborate in this Orgaflow workspace.`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {data.status !== "invalid" ? (
            <>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Invited email
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {data.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Role
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {data.roleName ?? "No role assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-1">
                      <Badge
                        variant={
                          data.status === "expired"
                            ? "destructive"
                            : data.status === "accepted"
                              ? "secondary"
                              : "soft"
                        }
                      >
                        {data.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Expires
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDateTime(data.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          ) : null}

          {data.status === "invalid" ? authLinks : null}

          {data.status === "expired" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                This invitation expired. Ask the workspace owner to resend it.
              </div>
              {authLinks}
            </div>
          ) : null}

          {data.status === "accepted" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                This invitation has already been accepted.
              </div>

              {data.viewerIsAuthenticated && data.viewerMatchesInvitation ? (
                <Button
                  type="button"
                  loading={setActiveOrganization.isPending}
                  disabled={setActiveOrganization.isPending}
                  onClick={handleOpenWorkspace}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Open workspace
                </Button>
              ) : (
                authLinks
              )}
            </div>
          ) : null}

          {data.status === "pending" ? (
            <div className="space-y-4">
              {!data.viewerIsAuthenticated ? (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Sign in or create an account with{" "}
                    <strong>{data.email}</strong> to accept this invitation.
                  </div>
                  {authLinks}
                </>
              ) : !data.viewerMatchesInvitation ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    You're signed in as {data.viewerEmail}. This invite was sent
                    to {data.email}.
                  </div>
                  {authLinks}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Ready to join
                    </div>
                    <p className="mt-2">
                      Accept the invitation to activate this workspace in your
                      account.
                    </p>
                  </div>

                  <Button
                    type="button"
                    loading={
                      acceptInvitation.isPending ||
                      setActiveOrganization.isPending
                    }
                    disabled={
                      acceptInvitation.isPending ||
                      setActiveOrganization.isPending
                    }
                    onClick={() =>
                      acceptInvitation.mutate({
                        token,
                      })
                    }
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Accept invitation
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
