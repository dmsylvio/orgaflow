"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";

function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      {children}
    </div>
  );
}

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "No expiration";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default function TeamSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [latestInvitationUrl, setLatestInvitationUrl] = useState<string | null>(
    null,
  );

  const { data, isPending } = useQuery(trpc.team.list.queryOptions());
  const { data: roles = [] } = useQuery(trpc.role.list.queryOptions());

  function invalidateTeam() {
    queryClient.invalidateQueries(trpc.team.list.queryOptions());
  }

  const createInvitation = useMutation(
    trpc.team.createInvitation.mutationOptions({
      onSuccess: (result) => {
        setEmail("");
        setRoleId("");
        setLatestInvitationUrl(result.invitationUrl);
        invalidateTeam();
        toast.success("Invitation sent", {
          description:
            "The teammate will receive an email, and you can also copy the link below to share manually.",
        });
      },
      onError: (error) =>
        toast.error("Couldn't send invitation", {
          description: error.message,
        }),
    }),
  );

  const resendInvitation = useMutation(
    trpc.team.resendInvitation.mutationOptions({
      onSuccess: (result) => {
        setLatestInvitationUrl(result.invitationUrl);
        invalidateTeam();
        toast.success("Invitation resent", {
          description:
            "A fresh invitation email has been sent, and the new link is available to copy.",
        });
      },
      onError: (error) =>
        toast.error("Couldn't resend invitation", {
          description: error.message,
        }),
    }),
  );

  const cancelInvitation = useMutation(
    trpc.team.cancelInvitation.mutationOptions({
      onSuccess: () => {
        invalidateTeam();
        toast.success("Invitation canceled", {
          description: "The pending invitation has been removed.",
        });
      },
      onError: (error) =>
        toast.error("Couldn't cancel invitation", {
          description: error.message,
        }),
    }),
  );

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const members = data?.members ?? [];
  const invitations = data?.invitations ?? [];

  async function copyInvitationLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invitation link copied", {
        description:
          "You can now send it directly by WhatsApp or any other channel.",
      });
    } catch {
      toast.error("Couldn't copy invitation link", {
        description: "Copy the link manually from the field and try again.",
      });
    }
  }

  function openInvitationLink(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <SettingsPage
      title="Team"
      description="Invite teammates, review who already has access, and track pending invitations."
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Invite a teammate
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Send an email invitation with a secure link to join this
                workspace.
              </p>
            </div>
            <Badge variant="soft" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Resend email
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <NativeSelect
                id="invite-role"
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
              >
                <option value="">No role assigned</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <Button
              type="button"
              loading={createInvitation.isPending}
              disabled={createInvitation.isPending || email.trim().length === 0}
              onClick={() =>
                createInvitation.mutate({
                  email,
                  roleId: roleId || null,
                })
              }
            >
              Send invite
            </Button>
          </div>

          {roles.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              No roles yet. You can still invite teammates now and assign a role
              later in Settings → Roles.
            </p>
          ) : null}

          {latestInvitationUrl ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Latest invitation link
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share this link manually if you prefer to send the invite by
                WhatsApp or another channel.
              </p>
              <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                <Input
                  readOnly
                  value={latestInvitationUrl}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full lg:w-auto"
                  onClick={() => copyInvitationLink(latestInvitationUrl)}
                >
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full lg:w-auto"
                  onClick={() => openInvitationLink(latestInvitationUrl)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Current members
              </h2>
              <p className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {members.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No members found yet.
              </p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {member.isOwner ? (
                      <Badge variant="soft" className="gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        Owner
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {member.isOwner
                        ? "Full access"
                        : (member.roleName ?? "No role assigned")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Joined {formatDateTime(member.joinedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Pending invitations
              </h2>
              <p className="text-sm text-muted-foreground">
                Invitations waiting to be accepted.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {invitations.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No pending invitations.
              </p>
            ) : (
              invitations.map((invitation) => {
                const isResending =
                  resendInvitation.isPending &&
                  resendInvitation.variables?.id === invitation.id;
                const isCanceling =
                  cancelInvitation.isPending &&
                  cancelInvitation.variables?.id === invitation.id;

                return (
                  <div
                    key={invitation.id}
                    className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start"
                  >
                    <div className="min-w-0 space-y-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {invitation.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {invitation.roleName ?? "No role assigned"}
                        </Badge>
                        {invitation.isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        <span>
                          Invited by {invitation.invitedByName ?? "Unknown"}
                        </span>
                        <span>
                          Expires {formatDateTime(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={isResending}
                        disabled={isResending || isCanceling}
                        onClick={() =>
                          resendInvitation.mutate({ id: invitation.id })
                        }
                      >
                        <RefreshCw className="h-4 w-4" />
                        Resend
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={isCanceling}
                        disabled={isResending || isCanceling}
                        onClick={() =>
                          cancelInvitation.mutate({ id: invitation.id })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Invitation link
                      </p>
                      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                        <Input
                          readOnly
                          value={invitation.invitationUrl}
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full lg:w-auto"
                          disabled={isResending || isCanceling}
                          onClick={() =>
                            copyInvitationLink(invitation.invitationUrl)
                          }
                        >
                          <Copy className="h-4 w-4" />
                          Copy link
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full lg:w-auto"
                          disabled={isResending || isCanceling}
                          onClick={() =>
                            openInvitationLink(invitation.invitationUrl)
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </SettingsPage>
  );
}
