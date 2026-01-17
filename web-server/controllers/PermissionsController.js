import UserModel from "../models/UserModel.js";
import permissionsService from "../services/PermissionsService.js";
import ResourcesService from "../services/ResourcesService.js";
import { ROLES } from "../enums/Roles.js";

/**
 * GET /api/files/:id/permissions
 * Returns all permission records for a specific file - only for the OWNER
 */
const getResourcePermissions = async (req, res) => {
  const userId = req.userId;
  const { id: resourceId } = req.params;

  // TODO:
  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Only the OWNER can see the list of permissions
  const checkPermission = await permissionsService.checkPermission(userId, resourceId, ROLES.OWNER);
	if(!checkPermission) {
    return res.status(403).json({ error: "Forbidden: Only owners can view permission lists" });
  }

  const permissions = await permissionsService.getPermissionsByResourceId(resourceId);
  res.json(permissions.map(p => p.toJSON()));
};

/**
 * POST /api/files/:id/permissions
 * Grants a permission to a user for a specific file / folder and all its descendants
 */
const grantPermission = async (req, res) => {
  const userId = req.userId;
  const { id: fileId } = req.params;
  const { targetUserId, role } = req.body;

  // Validations
  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });
  if (!targetUserId || !role) return res.status(400).json({ error: "Missing fields" });
  if (!UserModel.isValidId(targetUserId)) return res.status(404).json({ error: "Target user not found" });

  // Only the OWNER of the file can grant new permissions
  const hasOwnerPermission = await permissionsService.checkPermission(
    userId, 
    fileId, 
    ROLES.OWNER
  );
  if (!hasOwnerPermission) {
    return res.status(403).json({ error: "Forbidden: Only owners can grant permissions" });
  }

  // Get resource and ALL descendants (including deleted to maintain consistency)
  const descendants = await ResourcesService.getDescendants(fileId, true);
  const allIds = [fileId, ...descendants.map(f => (f._id || f.id).toString())];
  
  await permissionsService.deletePermissionsBulk(allIds, targetUserId);

  const newPermissions = allIds.map(rid => ({
        resourceId: rid,
        userId: targetUserId,
        role: role
    }));

  await permissionsService.createPermissionsBulk(newPermissions);
  
  res.status(201).json({ message: "Permission granted tree-wide" });
};

/**
 * PATCH /api/files/:id/permissions/
 * Updates a specific user's role for a file and all its descendants
 */
const updatePermission = async (req, res) => {
  const userId = req.userId;
  const { id: fileId , permissionId } = req.params;
  const { role: newRole } = req.body;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });
  if (!newRole) return res.status(400).json({ error: "Missing new role" });
  if (!Object.values(ROLES).includes(newRole)) return res.status(400).json({ error: "Invalid role" });

  const isOwner = await permissionsService.checkPermission(
    userId, 
    fileId, 
    ROLES.OWNER
  );

  if (!isOwner) {
    return res.status(403).json({ error: "Forbidden: Only owners can update permissions" });
  }

  // Get the permission to find the target user
  const permission = await permissionsService.getPermissionById(permissionId);
  
  if (!permission || permission.resourceId.toString() !== fileId) {
    return res.status(404).json({ error: "Permission not found" });
  }

  // Get resource and ALL descendants (including deleted to maintain consistency)
  const descendants = await ResourcesService.getDescendants(fileId, true);
  const allIds = [fileId, ...descendants.map(f => (f._id || f.id).toString())];
  const allResourceIds = allIds.map(id => id.toString());
  const targetUserId = permission.userId;
  
  await permissionsService.deletePermissionsBulk(allResourceIds, targetUserId);

  const newPermissions = allIds.map(rid => ({
        resourceId: rid,
        userId: targetUserId,
        role: newRole
    }));

  await permissionsService.createPermissionsBulk(newPermissions);

  res.status(200).json({ 
    updatedCount: allIds.length,
    message: "Permissions updated successfully",
  });
};

/**
 * DELETE /api/files/:id/permissions
 * deletes a specific user's permission for a file / folder and all its descendants
 */
const deletePermission = async (req, res) => {
  const userId = req.userId;
  const { id: fileId , permissionId : permissionId } = req.params;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  const isOwner = await permissionsService.checkPermission(
    userId, 
    fileId, 
    ROLES.OWNER
  );

  // Only the OWNER can revoke permissions
  if (!isOwner) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete permissions" });
  }

  // Get the permission record to find the target user
  const permission = await permissionsService.getPermissionById(permissionId);

  if (!permission || permission.resourceId.toString() !== fileId) {
    return res.status(404).json({ error: "Permission not found" });
  }

  if (permission.role === ROLES.OWNER) {
    return res.status(403).json({ 
      error: "Cannot delete owner permissions" 
    });
  }

  const targetUserId = permission.userId;

  // Get resource and ALL descendants (including deleted to maintain consistency)
  const descendants = await ResourcesService.getDescendants(fileId, true);
  const allIds = [fileId, ...descendants.map(f => (f._id || f.id).toString())];
  const allResourceIds = allIds.map(id => id.toString());

  // Delete permissions for this user on all resources in the tree
  const result = await permissionsService.deletePermissionsBulk(
    allResourceIds, 
    targetUserId
  );

  res.status(200).json({ 
    message: "Permissions deleted successfully",
    deletedCount: result.deletedCount 
  });
};

/**
 * GET /api/files/:id/my-role
 */
const getMyRoleOnResource = async (req, res) => {
  const userId = req.userId; 
  const { id: resourceId } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resource = await ResourcesService.findById(resourceId);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const role = await permissionsService.getUserRoleOnResource(userId, resourceId);

  if (!role) {
    return res.status(403).json({ 
      role: null, 
      message: "You have no permissions for this resource" 
    });
  }

  res.json({ role });
};

export default {
  getResourcePermissions,
  grantPermission,
  updatePermission,
  deletePermission,
  getMyRoleOnResource
};