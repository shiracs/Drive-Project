import { v4 as uuidv4 } from "uuid";
import * as PermissionsModel from "../services/PermissionsService.js";
import { RESOURCE_TYPE } from "../enums/ResourceType.js";

//! Volatile storage for resources
/**
 * Resource records structure:
 * {
 * id: UUID,
 * ownerId: USER_ID,
 * name: ORIGINAL_RESOURCENAME,
 * type: RESOURCE_TYPE,
 * parentId: PARENT_FOLDER_ID (or null),
 * path: STRING (e.g., ",parent_id,child_id,")
 * }
 */
let RESOURCES = [];

/**
 * Returns a resource object by its ID
 */
const findById = (id) => {
  return RESOURCES.find((r) => r.id === id);
};

/**
 * Creates a new file/folder record with path
 */
const createResourceRecord = (
  userId,
  name,
  type = RESOURCE_TYPE.FILE,
  parentId = null
) => {
  // First, Calculate Path, the default root path is ","
  let path = ",";
  if (parentId) {
    const parent = findById(parentId);
    // If parent exists, append parent's ID to its path
    if (parent) {
      path = `${parent.path}${parent.id},`;
    }
  }

  const record = {
    id: uuidv4(),
    ownerId: userId,
    name,
    type,
    parentId,
    path,
    updatedAt: new Date().toISOString(),
    isStarred: false,
    isDeleted: false,
    isSpam: false
  };

  RESOURCES.push(record);
  return record;
};

/**
 * Updates the UpdatedAt property of a resource
 * @param {*} id
 * @returns
 */
const updateTimestamp = (id) => {
  const resource = findById(id);
  if (resource) {
    resource.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
};

/**
 * Returns all resources that a user has access to view in a specific folder (default is null -> Root)
 * @param {string} userId - ID of the user
 * @param {string | null} parentId - The folder we are listing (or null for root)
 * @returns {Array} List of authorized resource objects
 */
const getResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsModel.getPermittedResourcesOfUser(userId);
  
  return RESOURCES.filter((r) => {
    const isPermitted = permittedIds.includes(r.id);
    const notDeletedOrSpam = !r.isDeleted && !r.isSpam;

    if (!isPermitted || !notDeletedOrSpam) return false;

    if (parentId) {
      // Inside a specific folder
      return r.parentId === parentId;
    } else {
      // At the Root level:
      // Show resources I own at the root
      if (r.ownerId === userId && r.parentId === null) return true;
      
      // Show shared resources where I don't have permission on the parent (Entry Points)
      const isNotOwner = r.ownerId !== userId;
      const isParentPermitted = r.parentId && permittedIds.includes(r.parentId);
      
      return isNotOwner && !isParentPermitted;
    }
  });
};

/**
 * Returns ALL descendants (children, grandchildren, etc.)
 * Used for flat deletion and permission granting
 */
const getDescendants = (folderId, includeDeleted = false) => {
  const searchPattern = `,${folderId},`;
  
  return RESOURCES.filter((f) => {
    const isMatch = f.path?.includes(searchPattern);
    if (includeDeleted) {
      return isMatch;
    }
    return isMatch && !f.isDeleted;
  });
};

/**
 * Helper to get ALL resources (used for search)
 */
const getAllResourcesByUser = async (userId) => {
  const permittedIds = await PermissionsModel.getPermittedResourcesOfUser(userId);
  return RESOURCES.filter((r) => permittedIds.includes(r.id) && !r.isDeleted && !r.isSpam);
};

/**
 * Validates a Parent Folder ID
 */
const validateParent = (parentId) => {
  if (!parentId) return { valid: true };

  const parent = findById(parentId);
  if (!parent) {
    return { valid: false, error: "Parent folder not found", status: 404 };
  }
  if (parent.type !== RESOURCE_TYPE.FOLDER) {
    return {
      valid: false,
      error: "Parent ID must refer to a folder",
      status: 400,
    };
  }
  return { valid: true };
};

/**
 * Removes a resource record by id
 */
const removeResourceRecord = (id) => {
  const searchPattern = `,${id},`;
  RESOURCES = RESOURCES.filter((r) => r.id !== id && !r.path?.includes(searchPattern));
};

/**
 * Updates the name of a resource
 * @param {string} id - The resource ID
 * @param {string} newName - The new name
 * @returns {boolean} true if successful, false if not found
 */
const renameResource = (id, newName) => {
  const resource = RESOURCES.find((r) => r.id === id);
  if (resource) {
    resource.name = newName;
    return true;
  }
  return false;
};

/**
 * Returns all resources shared with the user (where user is NOT the owner)
 */
const getSharedResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsModel.getPermittedResourcesOfUser(userId);
  
  return RESOURCES.filter((r) => {
    const isPermitted = permittedIds.includes(r.id);
    const isNotOwner = r.ownerId !== userId;
    const notDeletedOrSpam = !r.isDeleted && !r.isSpam;

    if (!isPermitted || !isNotOwner || !notDeletedOrSpam) return false;

    if (parentId) {
      return r.parentId === parentId;
    } else {
      const isParentPermitted = r.parentId && permittedIds.includes(r.parentId);
      return !isParentPermitted;
    }
  });
};

/**
 * returns all resources owned by user
 */
const getOwnedResources = (userId, parentId = null) => {
  return RESOURCES.filter((r) => r.ownerId === userId && r.parentId === parentId && !r.isDeleted && !r.isSpam);
};

/**
 * returns 10 most recently added/updated resources
 */
const getRecentResources = (userId, parentId = null) => {
  const allResources = getResourcesByUserId(userId, parentId);

  return [...allResources]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);
      return dateB - dateA;
    })
    .slice(0, 10);
};

const getStarredResources = async (userId, parentId = null) => {
  // all resources permitted for the user
  const permittedIds = await PermissionsModel.getPermittedResourcesOfUser(userId);

  // if we have parentId - it means user is inside a starred folder,so we want to display ALL its contents
  if (parentId) {
    return RESOURCES.filter(
      (r) => permittedIds.includes(r.id) && r.parentId === parentId && !r.isDeleted && !r.isSpam
    );
  }
  // else - we are in the root of the starred page, and we want to display ALL STARRED resources no matter their parent
  else{
    return RESOURCES.filter(
      (r) => permittedIds.includes(r.id) && r.isStarred === true && !r.isDeleted && !r.isSpam
    );
  }
};

const toggleStarred = (id) => {
  const resource = RESOURCES.find((r) => r.id === id);
  if (resource) {
    resource.isStarred = !resource.isStarred;
    resource.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
};


/**
 * soft delete a resource
 */
const softDeleteResource = (id) => {
    const resource = findById(id);
    if (resource) {
        const descendants = getDescendants(id);

        descendants.forEach(d => d.isDeleted = true);
        resource.isDeleted = true;
        return true;
    }
    return false;
};

/**
 * restore a resource that was soft deleted
 */
const restoreResource = (id) => {
    const resource = findById(id);
    if (resource) {
      const descendants = getDescendants(id, true);

      resource.isDeleted = false;
      descendants.forEach(d => d.isDeleted = false);
      return true;
    }
    return false;
};

/**
 * get all soft deleted resources
 */
const getTrashResources = async (userId, parentId) => {
  const permittedIds = await PermissionsModel.getPermittedResourcesOfUser(userId);

  // if we have parentId - it means user is inside a trashed folder,so we want to display ALL its contents
  if (parentId) {
    return RESOURCES.filter(
      (r) => permittedIds.includes(r.id) && r.parentId === parentId
    );
  }
  // else - we are in the root of the trash page, and we want to display ALL trashed resources no matter their parent
  return RESOURCES.filter((r) => {
      const isPermitted = permittedIds.includes(r.id);
      const isDeleted = r.isDeleted === true;
      const parent = r.parentId ? findById(r.parentId) : null;
      const isTopLevelDeleted = !parent || !parent.isDeleted;

      return isPermitted && isDeleted && isTopLevelDeleted;
    });
};

const toggleSpam = (id) => {
    const resource = findById(id);
    if (resource) {
        const descendants = getDescendants(id);
        const newState = !resource.isSpam;

        descendants.forEach(d => {
            d.isSpam = newState;
            d.updatedAt = new Date().toISOString();
        });

        resource.isSpam = newState;
        resource.updatedAt = new Date().toISOString();
        return resource;
    }
    return null;
};

const getSpamResources = async (userId, parentId) => {
    const permittedIds = await PermissionsModel.getPermittedResourcesOfUser(userId);

    // if we have parentId - it means user is inside a spam folder,so we want to display ALL its contents
    if (parentId) {
      return RESOURCES.filter(
        (r) => permittedIds.includes(r.id) && r.parentId === parentId
      );
    }
    // else - we are in the root of the spam page, and we want to display ALL spam resources no matter their parent
    return RESOURCES.filter((r) => {
    const isPermitted = permittedIds.includes(r.id);
    const isSpam = r.isSpam === true;
    const parent = r.parentId ? findById(r.parentId) : null;
    const isTopLevelSpam = !parent || !parent.isSpam;
    return isPermitted && isSpam && isTopLevelSpam && !r.isDeleted;
  });
};


const moveResource = (id, newParentId) => {
  const resource = findById(id);
  if (!resource) return false;

  // prevent moving a folder into itself or into one of its descendants
  if (newParentId) {
    if (newParentId === id) return false;
    const descendants = getDescendants(id, true);
    if (descendants.some(d => d.id === newParentId)) return false;
  }

  // calculate the new path
  let newPath = ",";
  if (newParentId) {
    const newParent = findById(newParentId);
    if (!newParent) return false;
    newPath = `${newParent.path}${newParent.id},`;
  }


  const oldFullPathPrefix = `${resource.path}${resource.id},`;
  const newFullPathPrefix = `${newPath}${resource.id},`;

  // update the paths of all the resource's descendants
  const descendants = getDescendants(id, true);
  descendants.forEach(child => {
      child.path = child.path.replace(oldFullPathPrefix, newFullPathPrefix);
  });

  // update the resource's path
  resource.parentId = newParentId;
  resource.path = newPath;
  resource.updatedAt = new Date().toISOString();

  return true;
};

export default {
  createResourceRecord,
  getResourcesByUserId,
  removeResourceRecord,
  findById,
  getDescendants,
  getAllResourcesByUser,
  validateParent,
  renameResource,
  getSharedResourcesByUserId,
  getOwnedResources,
  updateTimestamp,
  getRecentResources,
  getStarredResources,
  toggleStarred,
  softDeleteResource,
  restoreResource,
  getTrashResources,
  toggleSpam,
  getSpamResources,
  moveResource
};