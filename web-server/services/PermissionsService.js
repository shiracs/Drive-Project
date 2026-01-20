import { ROLES, isValidRole } from "../enums/Roles.js";
import Permission from "../models/Permission.js";

/**
 * Creates a new permission record for a user on a specific resource
 * @param {*} resourceId
 * @param {*} userId
 * @param {*} role
 * @returns the permission record
 */
const createResourcePermission = async (resourceId, userId, role) => {
  const newPermission = await Permission.create({
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
  const permission = await Permission.findOne({
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
const getPermittedResourcesOfUser = async (userId, isDeleted = false, isSpam = false) => {
    const permissions = await Permission.find({ userId, isDeleted, isSpam });
    if (!permissions) return [];

    return permissions.map(p => p.resourceId);
};

/**
 * Removes all permission records associated with a resource
 * @param {*} resourceId
 */
const removeAllPermissionsOfResource = async (resourceId) => {
    await Permission.deleteMany({ resourceId });
};
const getPermissionsByResourceId = async(resourceId) => {
    return await Permission.find({ resourceId });
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
  const updatedPermission = await Permission.findByIdAndUpdate(pId, { role: newRole }, { new: true });
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
  const result = await Permission.findByIdAndDelete(pId);
  return result !== null;
};


const getUserRoleOnResource = async (userId, resourceId) => {
  const permission = await Permission.findOne({
    resourceId,
    userId,
  });
  return permission ? permission.role : null;
};

const getPermissionByUserAndResource = async (userId, resourceId) => {
  return await Permission.findOne({ userId, resourceId });
};

/// Bulk update permissions for a user across multiple resources
const updatePermissionsBulk = async (resourceIds, userId, newRole) => {
    return await Permission.updateMany(
        { 
            resourceId: { $in: resourceIds }, 
            userId: userId 
        },
        { $set: { role: newRole } }
    );
};

// Bulk delete permissions for a user across multiple resources
const deletePermissionsBulk = async (resourceIds, userId) => {
    return await Permission.deleteMany({
        resourceId: { $in: resourceIds },
        userId: userId
    });
};

/// Bulk create permission records
const createPermissionsBulk = async (permissionRecords) => {
    return await Permission.insertMany(permissionRecords);
};

// Get permission by its ID
const getPermissionById = async (pId) => {
    return await Permission.findById(pId);
};

// Get userID from permission ID
const getUserIdFromPermissionId = async (pId) => {
    const permission = await Permission.findById(pId);
    return permission ? permission.userId : null;
};

const isDeletedResources = async (resources, isDeleted, userId) => {
    const permissions = await Permission.find({
        resourceId: { $in: resources },
        isDeleted,
        userId
    });

    return permissions.map(p => p.resourceId);
};

const isSpamResources = async (resources, isSpam, userId) => {
    const permissions = await Permission.find({
        resourceId: { $in: resources },
        isSpam,
        userId
    });

    return permissions.map(p => p.resourceId);
};

const isStarredResources = async (resources, isStarred, userId) => {
    const permissions = await Permission.find({
        resourceId: { $in: resources },
        isStarred,
        userId
    });

    return permissions.map(p => p.resourceId);
};

const setDeletedStatus = async (resourceIds, isDeleted, userId) => {
    await Permission.updateMany(
        { resourceId: { $in: resourceIds }, userId },
        { $set: { isDeleted } }
    );
};

const setSpamStatus = async (resourceIds, isSpam, userId) => {
     await Permission.updateMany(
        { resourceId: { $in: resourceIds }, userId },
        { $set: { isSpam } }
    );
};

const toggleStarredStatus = async (resourceId, isStarred, userId) => {
     await Permission.updateOne(
        { resourceId, userId },
        { $set: { isStarred } }
    );
};

const toggleSpamStatus = async (resourceId, isSpam, userId) => {
     await Permission.updateOne(
        { resourceId, userId },
        { $set: { isSpam } }
    );
};

const toggleStarredStatusForMany = async (resourcesId, isStarred, userId) => {
      await Permission.updateMany(
        { resourceId: { $in: resourcesId }, userId },
        { $set: { isStarred } }
    );
};

const toggleSpamStatusForMany = async (resourcesId, isSpam, userId) => {
      await Permission.updateMany(
        { resourceId: { $in: resourcesId }, userId },
        { $set: { isSpam } }
    );
};

const getResourceStatus = async (userId, resourceId) => {
    return await Permission.findOne({ userId, resourceId });
};

const setDeletedStatusForManyUsers = async (resourceIds, isDeleted) => {
    await Permission.updateMany(
        { resourceId: { $in: resourceIds } },
        { $set: { isDeleted } }
    );
};


const getPermissionsByUserAndResourceIds = async (userId, resourceIds) => {
    return await Permission.find({
        userId,
        resourceId: { $in: resourceIds }
    });
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
  isDeletedResources,
  isSpamResources,
  isStarredResources,
  setDeletedStatus,
  setSpamStatus,
  toggleSpamStatus,
  toggleStarredStatusForMany,
  toggleSpamStatusForMany,
  toggleStarredStatus,
  getResourceStatus,
  setDeletedStatusForManyUsers,
  getPermissionsByUserAndResourceIds,
};

