import PermissionsService from "./services/PermissionsService.js";
import { RESOURCE_TYPE } from "../enums/ResourceType.js";
import Resource from "../models/Resource.js";

/**
 * Returns a resource object by its ID
 */
const findById = (id) => {
  return Resource.findById(id);
};

/**
 * Creates a new file/folder record with path
 */
const createResourceRecord = async (
  userId,
  name,
  type = RESOURCE_TYPE.FILE,
  parentId = null
) => {
  // First, Calculate Path, the default root path is ","
  let path = ",";
  if (parentId) {
    const parent = await findById(parentId);
    // If parent exists, append parent's ID to its path
    if (parent) {
      path = `${parent.path}${parent._id},`;
    }
  }

  const record = {
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

  const createdResource = await Resource.create(record);
  return createdResource;
};

/**
 * Updates the UpdatedAt property of a resource
 * @param {*} id
 * @returns
 */
const updateTimestamp = async (id) => {
  const result = await Resource.findByIdAndUpdate(
    id,
    { updatedAt: new Date() },
    { new: true }
  );
  if (!result) return false;
    return true;
};

/**
 * Returns all resources that a user has access to view in a specific folder (default is null -> Root)
 * @param {string} userId - ID of the user
 * @param {string | null} parentId - The folder we are listing (or null for root)
 * @returns {Array} List of authorized resource objects
 */
const getResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);
  
  const baseFilter = {
    _id: { $in: permittedIds },
    isDeleted: false,
    isSpam: false
  };

  if (parentId) {
    return await Resource.find({ 
      ...baseFilter, 
      parentId: parentId 
    });
    } else {
    return await Resource.find({
        ...baseFilter,
        $or: [
            { ownerId: userId, parentId: null },
            { 
                ownerId: { $ne: userId },
                parentId: { $exists: true, $ne: null },
                parentId: { $nin: permittedIds }
            }
        ]
    });
  }
};

/**
 * Returns ALL descendants (children, grandchildren, etc.)
 * Used for flat deletion and permission granting
 */
const getDescendants = async (folderId, includeDeleted = false) => {
  const searchPattern = `,${folderId},`;
  
  const query = {
    path: { $regex: searchPattern }
  };

  if (!includeDeleted) {
    query.isDeleted = false;
  }

  return await Resource.find(query);
};

/**
 * Helper to get ALL resources (used for search)
 */
const getAllResourcesByUser = async (userId) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);
  
  return await Resource.find({
    _id: { $in: permittedIds }, 
    isDeleted: false,           
    isSpam: false 
  });
};

/**
 * Validates a Parent Folder ID
 */
const validateParent = async (parentId) => {
  if (!parentId) return { valid: true };

  const parent = await findById(parentId);
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
const removeResourceRecord = async (id) => {
  const searchPattern = `,${id},`;

  return await Resource.deleteMany({
    $or: [
      { _id: id }, 
      { path: { $regex: searchPattern } }
    ]
  });
};

/**
 * Updates the name of a resource
 * @param {string} id - The resource ID
 * @param {string} newName - The new name
 * @returns {boolean} true if successful, false if not found
 */
const renameResource = async (id, newName) => {
    try {
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { name: newName },
      { 
        runValidators: true,
        new: true           
      }
    );

    return !!updatedResource;

  } catch (error) {
    console.error("Rename Resource Error:", error);
    return false;
  }
};

/**
 * Returns all resources shared with the user (where user is NOT the owner)
 */
const getSharedResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);
  
  const query = {
    _id: { $in: permittedIds },
    ownerId: { $ne: userId }, 
    isDeleted: false,
    isSpam: false
  };

  if (parentId) {
    query.parentId = parentId;
  } else {
    query.parentId = { $nin: permittedIds }
  }

  return await Resource.find(query);
};

/**
 * returns all resources owned by user
 */
const getOwnedResources = async (userId, parentId = null) => {
  return await Resource.find({
    ownerId: userId,
    parentId: parentId,
    isDeleted: false,
    isSpam: false
  });
};

/**
 * returns 10 most recently added/updated resources
 */
const getRecentResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);

  const query = {
    _id: { $in: permittedIds },
    isDeleted: false,
    isSpam: false
  };

  if (parentId) query.parentId = parentId;

  return await Resource.find(query)
    .sort({ updatedAt: -1 })
    .limit(10);   
};

const getStarredResources = async (userId, parentId = null) => {
  // all resources permitted for the user
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);

  const query = {
    _id: { $in: permittedIds },
    isDeleted: false,
    isSpam: false
  };

  if (parentId) {
    query.parentId = parentId;
  } else {
    query.isStarred = true;
  }

  return await Resource.find(query);
};

const toggleStarred = async (id) => {
    const resource = await findById(id);
    if (!resource) return false;

    resource.isStarred = !resource.isStarred;
    resource.updatedAt = new Date().toISOString();
    await resource.save();
    return true;
};


/**
 * soft delete a resource
 */
const softDeleteResource = async (id) => {
  const searchPattern = `,${id},`;

  // mark the resource and all its descendants as deleted
  const result = await Resource.updateMany(
    { 
      $or: [
        { _id: id }, 
        { path: { $regex: searchPattern } }
      ] 
    },
    { $set: { isDeleted: true, updatedAt: new Date() } }
  );

  return result.matchedCount > 0;
};

/**
 * restore a resource that was soft deleted
 */
const restoreResource = async (id) => {
  const searchPattern = `,${id},`;

  const result = await Resource.updateMany(
    { 
      $or: [
        { _id: id }, 
        { path: { $regex: searchPattern } }
      ] 
    },
    { $set: { isDeleted: false, updatedAt: new Date() } }
  );

  return result.matchedCount > 0;
};

/**
 * get all soft deleted resources
 */
const getTrashResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);

  if (parentId) {
    return await Resource.find({
      _id: { $in: permittedIds },
      parentId: parentId,
    });
  }

  const trashedResources = await Resource.find({
    _id: { $in: permittedIds },
    isDeleted: true,
    isSpam: false
  });

  const parentIds = [...new Set(
    trashedResources
      .map(r => r.parentId)
      .filter(id => id != null)
  )];

  const parents = await Resource.find({ _id: { $in: parentIds } });
  const parentsMap = new Map(parents.map(p => [p._id.toString(), p]));

  return trashedResources.filter(r => {
    if (!r.parentId) return true;

    const parent = parentsMap.get(r.parentId.toString());
    return !parent || !parent.isDeleted;
  });
};

const toggleSpam = async(id) => {
    const resource = await findById(id);
    if (!resource) return null;

    const newState = !resource.isSpam;
    const searchPattern = `,${id},`;

    // update all descendants   
    await Resource.updateMany(
        {
            $or: [
                { _id: id },
                { path: { $regex: searchPattern } }
            ]
        },
        { 
            $set: { 
                isSpam: newState, 
                updatedAt: new Date() 
            } 
        }
    );

    resource.isSpam = newState;
    return resource;
};

const getSpamResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);

  if (parentId) {
    return await Resource.find({
      _id: { $in: permittedIds },
      parentId: parentId,
      isDeleted: false
    });
  }

  const spamResources = await Resource.find({
    _id: { $in: permittedIds },
    isSpam: true,
    isDeleted: false
  });

  const parentIds = [...new Set(
    spamResources
      .map(r => r.parentId)
      .filter(id => id != null)
  )];

  const parents = await Resource.find({ _id: { $in: parentIds } });
  const parentsMap = new Map(parents.map(p => [p._id.toString(), p]));

  return spamResources.filter(r => {
    if (!r.parentId) return true;

    const parent = parentsMap.get(r.parentId.toString());
    return !parent || !parent.isSpam;
  });
};

const moveResource = async (id, newParentId) => {
    const resource = await Resource.findById(id);
    if (!resource) return false;

    if (newParentId) {
        if (newParentId.toString() === id.toString()) return false;
        
        const descendants = await getDescendants(id, true);
        if (descendants.some(d => d._id.toString() === newParentId.toString())) return false;
        
        const newParent = await Resource.findById(newParentId);
        if (!newParent || newParent.type !== 'FOLDER') return false;
        
        var newPath = `${newParent.path}${newParent._id},`;
    } else {
        var newPath = ","; 
    }

    const oldFullPathPrefix = `${resource.path}${resource._id},`;
    const newFullPathPrefix = `${newPath}${resource._id},`;

    const descendantsToUpdate = await Resource.find({
        path: { $regex: `^${oldFullPathPrefix}` }
    });
    
    const updatePromises = descendantsToUpdate.map(child => {
        const updatedPath = child.path.replace(oldFullPathPrefix, newFullPathPrefix);
        return Resource.updateOne({ _id: child._id }, { $set: { path: updatedPath } });
    });

    await Promise.all(updatePromises);

    resource.parentId = newParentId;
    resource.path = newPath;
    resource.updatedAt = new Date();
    await resource.save();

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