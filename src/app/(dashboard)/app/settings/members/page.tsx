"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";

type OrgOption = { id: string; name: string; isOwner?: boolean };

export default function MembersSettingsPage() {
  // USER ORGS
  const orgsQ = trpc.org.listMine.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    if (!orgId && orgsQ.data?.length) {
      setOrgId(orgsQ.data[0].id);
    }
  }, [orgsQ.data, orgId]);

  const orgOptions: OrgOption[] = useMemo(
    () =>
      (orgsQ.data ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        isOwner: o.isOwner,
      })),
    [orgsQ.data],
  );

  // QUERIES FOR CURRENT ORG
  const rolesQ = trpc.roles.listByOrg.useQuery(
    { orgId },
    { enabled: !!orgId, refetchOnWindowFocus: false },
  );
  const membersQ = trpc.members.listByOrg.useQuery(
    { orgId },
    { enabled: !!orgId, refetchOnWindowFocus: false },
  );
  const pendingQ = trpc.invitations.listPendingByOrg.useQuery(
    { orgId },
    { enabled: !!orgId, refetchOnWindowFocus: false },
  );

  // MUTATIONS
  const inviteM = trpc.invitations.create.useMutation({
    onSuccess: () => pendingQ.refetch(),
  });
  const revokeInviteM = trpc.invitations.revoke.useMutation({
    onSuccess: () => pendingQ.refetch(),
  });
  const assignRolesM = trpc.members.assignRoles.useMutation({
    onSuccess: () => membersQ.refetch(),
  });
  const removeMemberM = trpc.members.removeMember.useMutation({
    onSuccess: () => membersQ.refetch(),
  });
  const transferOwnerM = trpc.members.transferOwnership.useMutation({
    onSuccess: () => membersQ.refetch(),
  });

  // INVITE FORM
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !inviteEmail) return;
    await inviteM.mutateAsync({
      orgId,
      email: inviteEmail,
      roleId: inviteRoleId || undefined,
      expiresInDays: 7,
    });
    setInviteEmail("");
    setInviteRoleId("");
  };

  // MEMBER DETAILS (simple drawer)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedMember = useMemo(
    () => membersQ.data?.find((m) => m.id === selectedUserId) ?? null,
    [membersQ.data, selectedUserId],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (selectedMember) {
      setSelectedRoleIds(selectedMember.roles.map((r) => r.id));
    } else {
      setSelectedRoleIds([]);
    }
  }, [selectedMember]);

  const toggleMemberRole = (roleId: string) => {
    setSelectedRoleIds((old) =>
      old.includes(roleId) ? old.filter((x) => x !== roleId) : [...old, roleId],
    );
  };

  const persistMemberRoles = async () => {
    if (!orgId || !selectedUserId) return;
    await assignRolesM.mutateAsync({
      orgId,
      userId: selectedUserId,
      roleIds: selectedRoleIds,
    });
  };

  const removeMember = async () => {
    if (!orgId || !selectedUserId) return;
    if (!confirm("Remove this member from the organization?")) return;
    await removeMemberM.mutateAsync({ orgId, userId: selectedUserId });
    setSelectedUserId(null);
  };

  const transferOwnership = async (userId: string) => {
    if (!orgId) return;
    if (
      !confirm(
        "Transfer ownership to this user? You will lose owner status.",
      )
    )
      return;
    await transferOwnerM.mutateAsync({ orgId, toUserId: userId });
  };

  // UI
  return (
    <div className="space-y-10">
      {/* Organization selection */}
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">Members</h1>
        <div className="flex items-end gap-4">
          <div>
            <label htmlFor="org-select" className="block text-sm font-medium">
              Organization
            </label>
            <select
              id="org-select"
              className="mt-1 w-72 border rounded px-3 py-2 bg-white"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.isOwner ? " (Owner)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Invitations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invitations</h2>

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={createInvite}
        >
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium">
              Invitee email
            </label>
            <input
              id="invite-email"
              className="mt-1 w-72 border rounded px-3 py-2"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="person@company.com"
              type="email"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium">
              Role (optional)
            </label>
            <select
              id="invite-role"
              className="mt-1 w-64 border rounded px-3 py-2 bg-white"
              value={inviteRoleId}
              onChange={(e) => setInviteRoleId(e.target.value)}
            >
              <option value="">No specific role</option>
              {rolesQ.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviteM.isPending || !inviteEmail || !orgId}
            className="rounded bg-red-700 text-white px-4 py-2"
          >
            {inviteM.isPending ? "Generating…" : "Generate invite"}
          </button>
          {inviteM.error && (
            <p className="text-sm text-red-600">{inviteM.error.message}</p>
          )}
          {inviteM.data && (
            <p className="text-sm text-gray-600">
              Link:{" "}
              <span className="underline">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/invite/${inviteM.data.token}`
                  : `/invite/${inviteM.data.token}`}
              </span>
            </p>
          )}
        </form>

        <div className="rounded border">
          <div className="px-4 py-2 border-b font-medium">Pending</div>
          <div className="divide-y">
            {pendingQ.data?.length ? (
              pendingQ.data.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">{inv.email}</div>
                    <div className="text-gray-500">
                      {inv.roleName ? `Role: ${inv.roleName} · ` : ""}
                      Expires: {new Date(inv.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/invite/${inv.token}`,
                        )
                      }
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeInviteM.mutate({ inviteId: inv.id })}
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500">
                No pending invitations.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="rounded border">
          <div className="px-4 py-2 border-b font-medium">Team</div>
          <div className="divide-y">
            {membersQ.data?.length ? (
              membersQ.data.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(m.id)}
                    className="text-left"
                  >
                    <div className="text-sm">
                      <div className="font-medium">{m.name || m.email}</div>
                      <div className="text-gray-500">
                        {m.email} ·{" "}
                        {m.isOwner
                          ? "Owner"
                          : m.roles.map((r) => r.name).join(", ") || "No role"}
                      </div>
                    </div>
                  </button>
                  {!m.isOwner && (
                    <button
                      type="button"
                      onClick={() => transferOwnership(m.id)}
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Make Owner
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500">
                No members.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Simple drawer: edit member */}
      {selectedMember && (
        <section className="space-y-3">
          <div className="rounded border p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">
                Edit member: {selectedMember.name || selectedMember.email}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded border px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Roles</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rolesQ.data?.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(r.id)}
                        onChange={() => toggleMemberRole(r.id)}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
                <div className="pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={persistMemberRoles}
                    disabled={assignRolesM.isPending}
                    className="rounded bg-red-700 text-white px-4 py-2"
                  >
                    {assignRolesM.isPending ? "Saving…" : "Save roles"}
                  </button>
                  {!selectedMember.isOwner && (
                    <button
                      type="button"
                      onClick={removeMember}
                      disabled={removeMemberM.isPending}
                      className="rounded border px-4 py-2"
                    >
                      {removeMemberM.isPending
                        ? "Removing…"
                        : "Remove from org"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
