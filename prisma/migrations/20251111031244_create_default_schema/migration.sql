/*
  Warnings:

  - A unique constraint covering the columns `[orgId,userId]` on the table `OrganizationMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,permissionId]` on the table `RolePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,userId,permissionId]` on the table `UserPermissionOverride` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,userId,roleId]` on the table `UserRole` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_orgId_userId_permissionId_key" ON "UserPermissionOverride"("orgId", "userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_orgId_userId_roleId_key" ON "UserRole"("orgId", "userId", "roleId");
