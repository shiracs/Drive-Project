import UserModel from "../models/UserModel.js";
import * as permissionsService from "../services/PermissionsService.js";
import ResourceModel from "../models/ResourceModel.js"; 
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
  if (!await permissionsService.checkPermission(userId, resourceId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can view permission lists" });
  }

  const permissions = await permissionsService.getPermissionsByResourceId(resourceId);
  res.json(permissions);
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
  if (!await permissionsService.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can grant permissions" });
  }

  // Get resource and ALL descendants (including deleted to maintain consistency)
  const descendants = await ResourceModel.getDescendants(fileId, true);
  const allIdsToGrant = [fileId, ...descendants.map(f => f.id)];

  // Grant permissions to all these files/folders
  allIdsToGrant.forEach(async rid => {
    // Check if permission already exists
    const existingPerm = await permissionsService.getPermissionByUserAndResource(targetUserId, rid);
    if (existingPerm) {
      // Update role if permission exists
      await permissionsService.updatePermission(existingPerm.id, role);
    } else {
      // Create new permission
      await permissionsService.createResourcePermission(rid, targetUserId, role);
    }
  });
  
  res.status(201).json({ message: "Permission granted tree-wide" });
};

/**
 * PATCH /api/files/:id/permissions/:pId
 * Updates a specific user's role for a file and all its descendants
 */
const updatePermission = async (req, res) => {
  const userId = req.userId;
  const { id: fileId, pId } = req.params;
  const { role: newRole } = req.body;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });
  if (!newRole) return res.status(400).json({ error: "Missing new role" });

  // Only the OWNER can modify permissions
  if (!await permissionsService.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can update permissions" });
  }

  const allPerms = await permissionsService.getPermissionsByResourceId(fileId);
  const rootPerm = allPerms.find(p => p.id === pId);
  if (!rootPerm) return res.status(404).json({ error: "Permission record not found" });

  const targetUserId = rootPerm.userId;
  const descendants = await ResourceModel.getDescendants(fileId, true);
  const allFiles = [fileId, ...descendants.map(d => d.id)];

  // Update permission for this user on all these files
  for (const fid of allFiles) {
      const filePerms = await permissionsService.getPermissionsByResourceId(fid);
      const userPerm = filePerms.find(p => p.userId === targetUserId);
      
      if (userPerm) {
          await permissionsService.updatePermission(userPerm.id, newRole);
      }
  }

  res.status(200).json({ message: "Permissions updated tree-wide" });
};

/**
 * DELETE /api/files/:id/permissions/:pId
 * deletes a specific user's permission for a file / folder and all its descendants
 */
const deletePermission = async (req, res) => {
  const userId = req.userId;
  const { id: fileId, pId } = req.params;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  // Only the OWNER can revoke permissions
  if (!await permissionsService.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete permissions" });
  }

  // Find the permission to know WHO we are revoking from
  const allPerms = await permissionsService.getPermissionsByResourceId(fileId);
  const rootPermToDelete = allPerms.find(p => p.id === pId);
  
  if (!rootPermToDelete) return res.status(404).json({ error: "Permission record not found" });
  
  const revokedUserId = rootPermToDelete.userId;

  // Get ALL descendants + current file (including deleted)
  const descendants = await ResourceModel.getDescendants(fileId, true);
  const allFilesToCheck = [fileId, ...descendants.map(f => f.id)];

  // Remove permission for this user on all these files
  for (const fid of allFilesToCheck) {
      const filePerms = await permissionsService.getPermissionsByResourceId(fid);
      const userPerm = filePerms.find(p => p.userId === revokedUserId);
      
      if (userPerm) {
          await permissionsService.deletePermission(userPerm.id);
      }
  }

  res.status(204).send();
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

  // TODO:
  const resource = ResourceModel.findById(resourceId);
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