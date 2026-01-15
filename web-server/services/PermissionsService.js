import { ROLES, isValidRole } from "../enums/Roles.js";
import PermissionModel from "../models/PermissionsModel.js";

/**
 * Creates a new permission record for a user on a specific resource
 * @param {*} resourceId
 * @param {*} userId
 * @param {*} role
 * @returns the permission record
 */
const createResourcePermission = async (resourceId, userId, role) => {
  const newPermission = await PermissionModel.create({
    resourceId,
    userId,
    role,
  });
  return newPermission;
};

/**
 * Checks if a user has sufficient permissions for a specific action
 * @param {string} userId
 * @param {string} resourceId
 * @param {string} requiredRole - Minimum role required (reader/writer/owner)
 * @returns true if user has permission
 */
const checkPermission = async (userId, resourceId, requiredRole) => {

  // find the permission record for the userId and resourceId
  const permission = await PermissionModel.findOne({
    resourceId,
    userId,
  });

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
const getPermittedResourcesOfUser = async (userId) => {
    const permissions = await PermissionModel.find({ userId })
    return permissions.map(p => p.resourceId);
};

/**
 * Removes all permission records associated with a resource
 * @param {*} resourceId
 */
const removeAllPermissionsOfResource = async (resourceId) => {
    await PermissionModel.deleteMany({ resourceId });
};
const getPermissionsByResourceId = async(resourceId) => {
    return await PermissionModel.find({ resourceId });
};

/**
 * Updates a specific permission record's role
 * @param {string} pId - The permission record ID
 * @param {string} newRole - The new role to assign
 * @returns {Object|null} The updated record or null if not found
 */
const updatePermission = async (pId, newRole) => {
  if (!isValidRole(newRole)) {
    throw new Error(`Invalid role: ${newRole}. Must be one of: ${Object.values(ROLES).join(", ")}`);
  }
  const updatedPermission = await PermissionModel.findByIdAndUpdate(pId, { role: newRole }, { new: true });
  if (updatedPermission) {
    return updatedPermission;
  }
  return null;
};

/**
 * Deletes a specific permission record
 * @param {string} pId - The permission record ID
 * @returns {boolean} true if deleted
 */
const deletePermission = async (pId) => {
  const result = await PermissionModel.findByIdAndDelete(pId);
  return result !== null;
};


const getUserRoleOnResource = async (userId, resourceId) => {
  const permission = await PermissionModel.findOne({
    resourceId,
    userId,
  });
  return permission ? permission.role : null;
};

const getPermissionByUserAndResource = async (userId, resourceId) => {
  return await PermissionModel.findOne({ userId, resourceId });
};

/// Bulk update permissions for a user across multiple resources
const updatePermissionsBulk = async (resourceIds, userId, newRole) => {
    return await PermissionModel.updateMany(
        { 
            resourceId: { $in: resourceIds }, 
            userId: userId 
        },
        { $set: { role: newRole } }
    );
};

// Bulk delete permissions for a user across multiple resources
const deletePermissionsBulk = async (resourceIds, userId) => {
    return await PermissionModel.deleteMany({
        resourceId: { $in: resourceIds },
        userId: userId
    });
};

/// Bulk create permission records
const createPermissionsBulk = async (permissionRecords) => {
    return await PermissionModel.insertMany(permissionRecords);
};

// Get permission by its ID
const getPermissionById = async (pId) => {
    return await PermissionModel.findById(pId);
};

// Get userID from permission ID
const getUserIdFromPermissionId = async (pId) => {
    const permission = await PermissionModel.findById(pId);
    return permission ? permission.userId : null;
};



export default {
  createResourcePermission,
  checkPermission,
  getPermittedResourcesOfUser,
  removeAllPermissionsOfResource,
  getPermissionsByResourceId,
  updatePermission,
  deletePermission,
  getUserRoleOnResource,
  getPermissionByUserAndResource,
  updatePermissionsBulk,
  deletePermissionsBulk,
  createPermissionsBulk,
  getPermissionById,
  getUserIdFromPermissionId,
};

