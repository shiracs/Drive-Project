import UserModel from "../models/UserModel.js";
import PermissionsModel from "../models/PermissionsModel.js";
import ResourceModel from "../models/ResourceModel.js"; 
import { ROLES } from "../enums/Roles.js";

/**
 * GET /api/files/:id/permissions
 * Returns all permission records for a specific file - only for the OWNER
 */
const getResourcePermissions = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: resourceId } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Only the OWNER can see the list of permissions
  if (!PermissionsModel.checkPermission(userId, resourceId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can view permission lists" });
  }

  const permissions = PermissionsModel.getPermissionsByResourceId(resourceId);
  res.json(permissions);
};

/**
 * POST /api/files/:id/permissions
 * Grants a permission to a user for a specific file / folder and all its descendants
 */
const grantPermission = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: fileId } = req.params;
  const { targetUserId, role } = req.body;

  // Validations
  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });
  if (!targetUserId || !role) return res.status(400).json({ error: "Missing fields" });
  if (!UserModel.isValidId(targetUserId)) return res.status(404).json({ error: "Target user not found" });

  // Only the OWNER of the file can grant new permissions
  if (!PermissionsModel.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can grant permissions" });
  }

  // Get resource and ALL descendants
  const descendants = ResourceModel.getDescendants(fileId);
  const allIdsToGrant = [fileId, ...descendants.map(f => f.id)];

  // Grant permissions to all these files/folders
  allIdsToGrant.forEach(targetId => {
      // Check for EXISTING permission record for this user&file
      const filePerms = PermissionsModel.getPermissionsByResourceId(targetId);
      const existingPerm = filePerms.find(p => p.userId === targetUserId);

      if (existingPerm) {
          PermissionsModel.updatePermission(existingPerm.id, role);
      } else {
          PermissionsModel.createResourcePermission(targetId, targetUserId, role);
      }
  });
  
  res.status(201).json({ message: "Permission granted tree-wide" });
};

/**
 * PATCH /api/files/:id/permissions/:pId
 * Updates a specific user's role for a file
 */
const updatePermission = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: fileId, pId } = req.params;
  const { role: newRole } = req.body;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });
  if (!newRole) return res.status(400).json({ error: "Missing new role" });

  // Only the OWNER can modify permissions
  if (!PermissionsModel.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can update permissions" });
  }

  const updated = PermissionsModel.updatePermission(pId, newRole);
  if (!updated) return res.status(404).json({ error: "Permission record not found" });

  res.status(200).json(updated);
};

/**
 * DELETE /api/files/:id/permissions/:pId
 * deletes a specific user's permission for a file / folder and all its descendants
 */
const deletePermission = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: fileId, pId } = req.params;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  // Only the OWNER can revoke permissions
  if (!PermissionsModel.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete permissions" });
  }

  // Find the permission to know WHO we are revoking from
  const allPerms = PermissionsModel.getPermissionsByResourceId(fileId);
  const rootPermToDelete = allPerms.find(p => p.id === pId);
  
  if (!rootPermToDelete) return res.status(404).json({ error: "Permission record not found" });
  
  const revokedUserId = rootPermToDelete.userId;

  // Get ALL descendants + current file
  const descendants = ResourceModel.getDescendants(fileId);
  const allFilesToCheck = [fileId, ...descendants.map(f => f.id)];

  // Remove permission for this user on all these files
  allFilesToCheck.forEach(fid => {
      // Find the specific permission ID for this user on this file
      const filePerms = PermissionsModel.getPermissionsByResourceId(fid);
      const userPermToDelete = filePerms.find(p => p.userId === revokedUserId);
      
      if (userPermToDelete) {
          PermissionsModel.deletePermission(userPermToDelete.id);
      }
  });

  res.status(204).send();
};

export default {
  getResourcePermissions,
  grantPermission,
  updatePermission,
  deletePermission,
};