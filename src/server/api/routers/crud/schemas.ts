import { z } from "zod";
import { OverrideMode } from "@prisma/client";

export const accountCreateSchema = z.object({
  userId: z.string(),
  providerType: z.string(),
  providerId: z.string(),
  providerAccountId: z.string(),
  refreshToken: z.string().optional().nullable(),
  accessToken: z.string().optional().nullable(),
  accessTokenExpires: z.coerce.date().optional().nullable(),
});
export const accountUpdateSchema = accountCreateSchema.partial().extend({ id: z.string() });

export const sessionCreateSchema = z.object({
  userId: z.string(),
  expires: z.coerce.date(),
  sessionToken: z.string(),
  accessToken: z.string(),
});
export const sessionUpdateSchema = sessionCreateSchema.partial().extend({ id: z.string() });

export const userCreateSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email(),
  password: z.string(),
  emailVerified: z.coerce.date().optional().nullable(),
  image: z.string().optional().nullable(),
  activeOrgId: z.string().optional().nullable(),
});
export const userUpdateSchema = userCreateSchema.partial().extend({ id: z.string() });

export const verificationRequestCreateSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.coerce.date(),
});
export const verificationRequestUpdateSchema = verificationRequestCreateSchema
  .partial()
  .extend({ id: z.string() });

export const organizationCreateSchema = z.object({
  name: z.string(),
  slug: z.string(),
});
export const organizationUpdateSchema = organizationCreateSchema.partial().extend({ id: z.string() });

export const organizationMemberCreateSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  isOwner: z.boolean().optional(),
});
export const organizationMemberUpdateSchema = organizationMemberCreateSchema
  .partial()
  .extend({ id: z.string() });

export const permissionCreateSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
});
export const permissionUpdateSchema = permissionCreateSchema.partial().extend({ id: z.string() });

export const roleCreateSchema = z.object({
  orgId: z.string(),
  name: z.string(),
  key: z.string(),
});
export const roleUpdateSchema = roleCreateSchema.partial().extend({ id: z.string() });

export const rolePermissionCreateSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});
export const rolePermissionUpdateSchema = rolePermissionCreateSchema.partial().extend({ id: z.string() });

export const userRoleCreateSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  roleId: z.string(),
});
export const userRoleUpdateSchema = userRoleCreateSchema.partial().extend({ id: z.string() });

export const userPermissionOverrideCreateSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  permissionId: z.string(),
  mode: z.nativeEnum(OverrideMode),
});
export const userPermissionOverrideUpdateSchema = userPermissionOverrideCreateSchema
  .partial()
  .extend({ id: z.string() });

export const invitationCreateSchema = z.object({
  orgId: z.string(),
  email: z.string().email(),
  roleId: z.string().optional().nullable(),
  invitedBy: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  acceptedAt: z.coerce.date().optional().nullable(),
});
export const invitationUpdateSchema = invitationCreateSchema.partial().extend({ id: z.string() });

export const customerCreateSchema = z.object({
  orgId: z.string(),
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export const customerUpdateSchema = customerCreateSchema.partial().extend({ id: z.string() });
