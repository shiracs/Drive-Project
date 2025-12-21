import { v4 as uuidv4 } from "uuid";
import { ROLES } from "../enums/Roles.js";

//! Volatile storage for files and permissions
/**
 * Permissions structure:
 * {
 *   id: PERMISSION_ID,
 *   fileId: FILE_ID,
 *   userId: USER_ID,
 *   role: READER | WRITER | OWNER
 */
const PERMISSIONS = [];

/**
 * Creates a new permission record for a user on a specific file
 * @param {*} fileId
 * @param {*} userId
 * @param {*} role
 * @returns the permission record
 */
const createFilePermission = (fileId, userId, role) => {
  const permission = {
    id: uuidv4(), //This is the pId
    fileId: fileId,
    userId: userId,
    role,
  };
  PERMISSIONS.push(permission);
  console.log(`[STORAGE UPDATE]`, { PERMISSIONS });
  return permission;
};

/**
 * Checks if a user has sufficient permissions for a specific action
 * @param {string} userId
 * @param {string} fileId
 * @param {string} requiredRole - Minimum role required (reader/writer/owner)
 * @returns true if user has permission
 */
const checkPermission = (userId, fileId, requiredRole) => {
  // find the permission record for the userId and fileId
  const permission = PERMISSIONS.find(
    (p) => p.fileId === fileId && p.userId === userId
  );

  if (!permission) return false;
  if (requiredRole === ROLES.READER) return true; // Anyone with a permission record can read
  if (requiredRole === ROLES.WRITER)
    return permission.role === ROLES.OWNER || permission.role === ROLES.WRITER;
  if (requiredRole === ROLES.OWNER) return permission.role === ROLES.OWNER;

  return false;
};

/**
 * Returns all files that a user has access to view
 * @param {string} userId - ID of the user
 * @returns {Array} List of authorized file objects
 */
const getPermittedFilesOfUser = (userId) => {
  const fileIds = PERMISSIONS.filter((p) => p.userId === userId).map(
    (p) => p.fileId
  );
  return fileIds;
};

/**
 * Removes all permission records associated with a file
 * @param {*} fileId
 */
const removeAllPermissionsOfFile = (fileId) => {
  for (let i = PERMISSIONS.length - 1; i >= 0; i--) {
    if (PERMISSIONS[i].fileId === fileId) {
      PERMISSIONS.splice(i, 1);
    }
  }
};

export default {
  createFilePermission,
  checkPermission,
  getPermittedFilesOfUser,
  removeAllPermissionsOfFile,
};
