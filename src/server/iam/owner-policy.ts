export function isOwnerMembership(membership: { isOwner: boolean }): boolean {
  return membership.isOwner === true;
}
