import { router } from "../../trpc";
import { accountsRouter } from "./accounts";
import { customersCrudRouter } from "./customers";
import { invitationsCrudRouter } from "./invitations";
import { organizationMembersRouter } from "./organizationMembers";
import { organizationsRouter } from "./organizations";
import { permissionsCrudRouter } from "./permissions";
import { rolePermissionsRouter } from "./rolePermissions";
import { rolesCrudRouter } from "./roles";
import { sessionsRouter } from "./sessions";
import { userPermissionOverridesRouter } from "./userPermissionOverrides";
import { userRolesRouter } from "./userRoles";
import { usersRouter } from "./users";
import { verificationRequestsRouter } from "./verificationRequests";

export const crudRouter = router({
  accounts: accountsRouter,
  sessions: sessionsRouter,
  users: usersRouter,
  verificationRequests: verificationRequestsRouter,
  organizations: organizationsRouter,
  organizationMembers: organizationMembersRouter,
  permissions: permissionsCrudRouter,
  roles: rolesCrudRouter,
  rolePermissions: rolePermissionsRouter,
  userRoles: userRolesRouter,
  userPermissionOverrides: userPermissionOverridesRouter,
  invitations: invitationsCrudRouter,
  customers: customersCrudRouter,
});
