import PermissionsService from "./PermissionsService.js";
import { RESOURCE_TYPE } from "../enums/ResourceType.js";
import { ROLES } from "../enums/Roles.js";
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
  let path = ",";
  if (parentId) {
    const parent = await findById(parentId);
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
    updatedAt: new Date().toISOString()
  };

  const createdResource = await Resource.create(record);
  return createdResource;
};

const updateTimestamp = async (id) => {
  const result = await Resource.findByIdAndUpdate(
    id,
    { updatedAt: new Date() },
    { new: true }
  );
  if (!result) return false;
    return true;
};

const getDescendants = async (folderId, includeDeleted = false, userId) => {
  const searchPattern = `,${folderId},`;
  
  const query = {
    path: { $regex: searchPattern }
  };

  const descendants = await Resource.find(query);

  if (includeDeleted) {
    return descendants;
  } else {
    const allowedIds = await PermissionsService.isDeletedResources(
      descendants.map(d => d._id.toString()),
      false,
      userId
    );
    return descendants.filter(d => allowedIds.includes(d._id.toString()));
  }
};

const getAllResourcesByUser = async (userId) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);
  
  const resources = await Resource.find({
    _id: { $in: permittedIds }
  });
  // תיקון: מיזוג
  return await _mergeWithPermissions(resources, userId);
};

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

const removeResourceRecord = async (id) => {
  const searchPattern = `,${id},`;
  return await Resource.deleteMany({
    $or: [
      { _id: id }, 
      { path: { $regex: searchPattern } }
    ]
  });
};

const renameResource = async (id, newName) => {
    try {
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { name: newName },
      { runValidators: true, new: true }
    );
    return !!updatedResource;
  } catch (error) {
    console.error("Rename Resource Error:", error);
    return false;
  }
};

// --- כאן התיקונים הקריטיים ל"באנרים" ---

const getSharedResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);
  
  const query = {
    _id: { $in: permittedIds },
    ownerId: { $ne: userId }
  };

  if (parentId) {
    query.parentId = parentId;
  } else {
    query.parentId = { $nin: permittedIds }
  }

  const resources = await Resource.find(query);
  // הוספת המיזוג כדי שהפרונט יקבל את המידע המלא
  return await _mergeWithPermissions(resources, userId);
};

const getOwnedResources = async (userId, parentId = null) => {
  const resources = await Resource.find({
    ownerId: userId,
    parentId: parentId
  });
  
  // סינון לפי הרשאות (לא מחוק ולא ספאם)
  const filteredResourcesByDeleted = await PermissionsService.isDeletedResources(
    resources.map(r => r._id.toString()),
    false,
    userId
  );
  const filteredResourcesBySpam = await PermissionsService.isSpamResources(
    filteredResourcesByDeleted,
    false,
    userId
  );
  
  const finalResources = resources.filter(r => filteredResourcesBySpam.includes(r._id.toString()));
  
  // הוספת המיזוג
  return await _mergeWithPermissions(finalResources, userId);
};

const getRecentResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);

  const query = {
    _id: { $in: permittedIds }
  };

  if (parentId) query.parentId = parentId;

  const resources = await Resource.find(query)
    .sort({ updatedAt: -1 })
    .limit(10);
    
  // הוספת המיזוג - קריטי כדי שהכוכבים יופיעו ב"אחרונים"
  return await _mergeWithPermissions(resources, userId);
};

const getStarredResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);
  const starredIds = await PermissionsService.isStarredResources(
    permittedIds,
    true,
    userId
  );

  const query = {
    _id: { $in: starredIds }
  };

  if (parentId) query.parentId = parentId;

  const resources = await Resource.find(query);
  // הוספת המיזוג
  return await _mergeWithPermissions(resources, userId);
};

const getTrashResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, true, false);

  let resources = [];
  if (parentId) {
    resources = await Resource.find({
      _id: { $in: permittedIds },
      parentId: parentId,
    });
  } else {
    const trashedResources = await Resource.find({
      _id: { $in: permittedIds }
    });

    const parentIds = [...new Set(
      trashedResources
        .map(r => r.parentId)
        .filter(id => id != null)
    )];

    const parents = await Resource.find({ _id: { $in: parentIds } });
    const parentsMap = new Map(parents.map(p => [p._id.toString(), p]));

    resources = trashedResources.filter(r => {
      if (!r.parentId) return true;
      const parent = parentsMap.get(r.parentId.toString());
      return !parent;
    });
  }
  
  // הוספת המיזוג
  return await _mergeWithPermissions(resources, userId);
};

const getSpamResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, true);

  let resources = [];
  if (parentId) {
    resources = await Resource.find({
      _id: { $in: permittedIds },
      parentId: parentId
    });
  } else {
    const spamResources = await Resource.find({
      _id: { $in: permittedIds }
    });

    const parentIds = [...new Set(
      spamResources
        .map(r => r.parentId)
        .filter(id => id != null)
    )];

    const parents = await Resource.find({ _id: { $in: parentIds } });
    const parentsMap = new Map(parents.map(p => [p._id.toString(), p]));

    resources = spamResources.filter(r => {
      if (!r.parentId) return true;
      const parent = parentsMap.get(r.parentId.toString());
      return !parent;
    });
  }
  
  // הוספת המיזוג
  return await _mergeWithPermissions(resources, userId);
};

// --- פונקציות טוגל ומחיקה ---

const toggleStarred = async (id, userId) => {
  const currentStatus = await PermissionsService.getResourceStatus(userId, id);
  if (!currentStatus) return null;

  await PermissionsService.toggleStarredStatus(id, !currentStatus.isStarred, userId);
  // לא חובה לעדכן Timestamp בשינוי כוכב
  
  const resource = await findById(id);
  const merged = await _mergeWithPermissions([resource], userId);
  return merged[0];
};

const toggleSpam = async(id, userId) => {
    const permission = await PermissionsService.getResourceStatus(userId, id);
    if (!permission) return null;

    const newSpamStatus = !permission.isSpam;
    await PermissionsService.setSpamStatus([id], newSpamStatus, userId);

    const descendants = await getDescendants(id, false, userId);
    if (descendants.length > 0) {
        await PermissionsService.setSpamStatus(
            descendants.map(r => r._id.toString()),
            newSpamStatus,
            userId
        );
    }

    const resource = await findById(id);
    const merged = await _mergeWithPermissions([resource], userId);
    return merged[0];
};

const softDeleteResource = async (id, userId) => {
  const userPerm = await PermissionsService.getPermissionByUserAndResource(userId, id);
  if (!userPerm) return false;

  const isOwner = userPerm.role === ROLES.OWNER;
  const descendants = await getDescendants(id, true);
  const allIds = [id, ...descendants.map(d => d._id.toString())];

  if (isOwner) {
    await PermissionsService.setDeletedStatusForManyUsers(allIds, true);
  } else {
    await PermissionsService.setDeletedStatus(allIds, true, userId);
  }
  return true;
};

const restoreResource = async (id, userId) => {
  const userPerm = await PermissionsService.getPermissionByUserAndResource(userId, id);
  if (!userPerm) return false;

  const isOwner = userPerm.role === ROLES.OWNER;
  const descendants = await getDescendants(id, true);
  const allIds = [id, ...descendants.map(d => d._id.toString())];

  if (isOwner) {
    await PermissionsService.setDeletedStatusForManyUsers(allIds, false);
  } else {
    await PermissionsService.setDeletedStatus(allIds, false, userId);
  }
  return true;
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

// --- Helpers ---

const normalizeResource = (r, perm) => {
    const rObj = r.toJSON ? r.toJSON() : r;
    return {
        id: rObj.id || rObj._id.toString(),
        name: rObj.name,
        type: rObj.type,
        ownerId: rObj.ownerId,
        parentId: rObj.parentId,
        path: rObj.path,
        updatedAt: rObj.updatedAt,
        createdAt: rObj.createdAt,
        isStarred: perm ? !!perm.isStarred : false,
        isDeleted: perm ? !!perm.isDeleted : false,
        isSpam: perm ? !!perm.isSpam : false,
        role: perm ? perm.role : null
    };
};

const _mergeWithPermissions = async (resources, userId) => {
    if (!resources || resources.length === 0) return [];
    
    const resourceIds = resources.map(r => r._id.toString());
    const permissions = await PermissionsService.getPermissionsByUserAndResourceIds(userId, resourceIds);
    const permMap = new Map(permissions.map(p => [p.resourceId.toString(), p]));

    return resources.map(r => {
        const perm = permMap.get(r.id || r._id.toString());
        return normalizeResource(r, perm);
    });
};

const getResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);
  
  const baseFilter = { _id: { $in: permittedIds } };
  let resources;

  if (parentId) {
    resources = await Resource.find({ ...baseFilter, parentId });
  } else {
    resources = await Resource.find({
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

  return await _mergeWithPermissions(resources, userId);
};

const enrichResources = async (resources, userId) => {
    return await _mergeWithPermissions(resources, userId);
};

const getSearchCandidates = async (userId, query) => {
    const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);
    
    const nameMatches = await Resource.find({
        _id: { $in: permittedIds },
        name: { $regex: query, $options: 'i' }
    }).lean();

    const foundIds = new Set(nameMatches.map(m => m._id.toString()));

    const potentialFiles = await Resource.find({
        _id: { $in: permittedIds },
        type: RESOURCE_TYPE.FILE,
        _id: { $nin: Array.from(foundIds) }
    }).lean();

    return { nameMatches, potentialFiles };
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
  moveResource,
  enrichResources,
  getSearchCandidates
};