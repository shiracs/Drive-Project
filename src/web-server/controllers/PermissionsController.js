import UserModel from "../models/UserModel.js";
import PermissionsModel from "../models/PermissionsModel.js";
import { ROLES } from "../enums/Roles.js";

/**
 * GET /api/files/:id/permissions
 * Returns all permission records for a specific file - only for the OWNER
 */
const getFilePermissions = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: fileId } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Only the OWNER can see the full list of permissions
  if (!PermissionsModel.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can view permission lists" });
  }

  const permissions = PermissionsModel.getPermissionsByFileId(fileId);
  res.json(permissions);
};

/**
 * POST /api/files/:id/permissions
 * Grants a new permission to a user for a specific file
 */
const grantPermission = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: fileId } = req.params;
  const { targetUserId, role } = req.body;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!targetUserId || !role) {
    return res.status(400).json({ error: "Missing targetUserId or role" });
  }

  // Verify the target user exists
  if (!UserModel.isValidId(targetUserId)) {
    return res.status(404).json({ error: "Target user not found" });
  }

  // Only the OWNER of the file can grant new permissions
  if (!PermissionsModel.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can grant permissions" });
  }

  const newPermission = PermissionsModel.createFilePermission(fileId, targetUserId, role);
  res.status(201).json(newPermission);
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
 * Revokes a specific user's access to a file
 */
const deletePermission = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id: fileId, pId } = req.params;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  // Only the OWNER can revoke permissions
  if (!PermissionsModel.checkPermission(userId, fileId, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete permissions" });
  }

  const success = PermissionsModel.deletePermission(pId);
  if (!success) return res.status(404).json({ error: "Permission record not found" });

  res.status(204).send();
};

export default {
  getFilePermissions,
  grantPermission,
  updatePermission,
  deletePermission,
};