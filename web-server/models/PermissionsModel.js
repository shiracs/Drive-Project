import { v4 as uuidv4 } from "uuid";
import { ROLES, isValidRole } from "../enums/Roles.js";

//! Volatile storage for permissions
/**
 * Permissions structure:
 * {
 *   id: PERMISSION_ID,
 *   resourceId: RESOURCE_ID,
 *   userId: USER_ID,
 *   role: READER | WRITER | OWNER
 */
let PERMISSIONS = [
  { resourceId: "file_shared_id", userId: "user_a_id", role: "OWNER" },
  { resourceId: "file_private_id", userId: "user_a_id", role: "OWNER" },
  { resourceId: "file_shared_id", userId: "user_b_id", role: "READER" },
];

/**
 * Creates a new permission record for a user on a specific resource
 * @param {*} resourceId
 * @param {*} userId
 * @param {*} role
 * @returns the permission record
 */
const createResourcePermission = (resourceId, userId, role) => {
  const permission = {
    id: uuidv4(), //This is the pId
    resourceId,
    userId,
    role,
  };
  PERMISSIONS.push(permission);
  console.log(`[STORAGE UPDATE]`, { PERMISSIONS });
  return permission;
};

/**
 * Checks if a user has sufficient permissions for a specific action
 * @param {string} userId
 * @param {string} resourceId
 * @param {string} requiredRole - Minimum role required (reader/writer/owner)
 * @returns true if user has permission
 */
const checkPermission = (userId, resourceId, requiredRole) => {
  // find the permission record for the userId and resourceId
  const permission = PERMISSIONS.find(
    (p) => p.resourceId === resourceId && p.userId === userId
  );

  if (!permission) return false;
  if (requiredRole === ROLES.READER) return true; // Anyone with a permission record can read
  if (requiredRole === ROLES.WRITER)
    return permission.role === ROLES.OWNER || permission.role === ROLES.WRITER;
  if (requiredRole === ROLES.OWNER) return permission.role === ROLES.OWNER;

  return false;
};

/**
 * Returns all resources that a user has access to view
 * @param {string} userId - ID of the user
 * @returns {Array} List of authorized resource objects
 */
const getPermittedResourcesOfUser = (userId) => {
  const resourceIds = PERMISSIONS.filter((p) => p.userId === userId).map(
    (p) => p.resourceId
  );
  return resourceIds;
};

/**
 * Removes all permission records associated with a resource
 * @param {*} resourceId
 */
const removeAllPermissionsOfResource = (resourceId) => {
  for (let i = PERMISSIONS.length - 1; i >= 0; i--) {
    if (PERMISSIONS[i].resourceId === resourceId) {
      PERMISSIONS.splice(i, 1);
    }
  }
};
const getPermissionsByResourceId = (resourceId) => {
  return PERMISSIONS.filter(p => p.resourceId === resourceId);
};

/**
 * Updates a specific permission record's role
 * @param {string} pId - The permission record ID
 * @param {string} newRole - The new role to assign
 * @returns {Object|null} The updated record or null if not found
 */
const updatePermission = (pId, newRole) => {
  if (!isValidRole(newRole)) {
    throw new Error(`Invalid role: ${newRole}. Must be one of: ${Object.values(ROLES).join(", ")}`);
  }
  const permission = PERMISSIONS.find((p) => p.id === pId);
  if (permission) {
    permission.role = newRole;
    console.log(`[STORAGE UPDATE] Permission updated:`, permission);
    return permission;
  }
  return null;
};

/**
 * Deletes a specific permission record
 * @param {string} pId - The permission record ID
 * @returns {boolean} true if deleted
 */
const deletePermission = (pId) => {
  const index = PERMISSIONS.findIndex((p) => p.id === pId);
  if (index !== -1) {
    PERMISSIONS.splice(index, 1);
    console.log(`[STORAGE UPDATE] Permission deleted: ${pId}`);
    return true;
  }
  return false;
};

export default {
  createResourcePermission,
  checkPermission,
  getPermittedResourcesOfUser,
  removeAllPermissionsOfResource,
  getPermissionsByResourceId,
  updatePermission,
  deletePermission,
};
