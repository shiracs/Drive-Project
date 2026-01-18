import PermissionsService from "./PermissionsService.js";
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
    updatedAt: new Date().toISOString()
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
 * Returns ALL descendants (children, grandchildren, etc.)
 * Used for flat deletion and permission granting
 */
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

/**
 * Helper to get ALL resources (used for search)
 */
const getAllResourcesByUser = async (userId) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);
  
  return await Resource.find({
    _id: { $in: permittedIds }
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

  return await Resource.find(query);
};

/**
 * returns all resources owned by user
 */
const getOwnedResources = async (userId, parentId = null) => {
  const resources = await Resource.find({
    ownerId: userId,
    parentId: parentId
  });
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
  return resources.filter(r => filteredResourcesBySpam.includes(r._id.toString()));
};

/**
 * returns 10 most recently added/updated resources
 */
const getRecentResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);

  const query = {
    _id: { $in: permittedIds }
  };

  if (parentId) query.parentId = parentId;

  return await Resource.find(query)
    .sort({ updatedAt: -1 })
    .limit(10);   
};


const getSpamResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, true);

  if (parentId) {
    return await Resource.find({
      _id: { $in: permittedIds },
      parentId: parentId
    });
  }

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

  return spamResources.filter(r => {
    if (!r.parentId) return true;

    const parent = parentsMap.get(r.parentId.toString());
    return !parent;
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

/**
 * פונקציה פנימית למיזוג המשאב עם ההרשאות האישיות של המשתמש (כוכב, אשפה וכו')
 */
const _mergeWithPermissions = async (resources, userId) => {
  if (!resources || resources.length === 0) return [];

  const resourceIds = resources.map(r => r._id.toString());
  // נצטרך להוסיף את הפונקציה הזו ב-PermissionsService
  const permissions = await PermissionsService.getPermissionsByUserAndResourceIds(userId, resourceIds);
  
  const permMap = new Map(permissions.map(p => [p.resourceId.toString(), p]));

  return resources.map(r => {
    // המרת Mongoose Document ל-Object רגיל אם צריך
    const rObj = r.toJSON ? r.toJSON() : r;
    const perm = permMap.get(rObj.id || rObj._id.toString());

    // החזרת המשאב עם השדות האישיים
    return {
      ...rObj,
      isStarred: perm ? !!perm.isStarred : false,
      isDeleted: perm ? !!perm.isDeleted : false,
      isSpam: perm ? !!perm.isSpam : false,
      // חשוב להחזיר את התפקיד כדי שהקליינט ידע אם להציג כפתורי ניהול
      role: perm ? perm.role : null 
    };
  });
};

const getResourcesByUserId = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false); // לא מחוקים, לא ספאם
  
  const baseFilter = { _id: { $in: permittedIds } };
  let resources;

  if (parentId) {
    resources = await Resource.find({ ...baseFilter, parentId });
  } else {
    // שליפת Root (קבצים שלי ברוט + תיקיות ששותפו איתי)
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

/**
 * המחיקה החכמה:
 * בעלים -> מוחק לכולם (מעדכן את כל ההרשאות).
 * אחר -> מוחק לעצמו (מעדכן רק את ההרשאה שלו).
 */
const softDeleteResource = async (id, userId) => {
  // 1. בדיקת תפקיד
  const userPerm = await PermissionsService.getPermissionByUserAndResource(userId, id);
  if (!userPerm) return false;

  const isOwner = userPerm.role === ROLES.OWNER;
  
  // 2. השגת כל הצאצאים (כדי למחוק גם את תוכן התיקייה)
  const descendants = await getDescendants(id, true);
  const allIds = [id, ...descendants.map(d => d._id.toString())];

  if (isOwner) {
    // בעלים מוחק לכולם!
    await PermissionsService.setDeletedStatusForManyUsers(allIds, true);
  } else {
    // משתמש רגיל מוחק רק לעצמו (הסתרת הקובץ)
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
    // בעלים משחזר לכולם
    await PermissionsService.setDeletedStatusForManyUsers(allIds, false);
  } else {
    // משתמש משחזר לעצמו
    await PermissionsService.setDeletedStatus(allIds, false, userId);
  }
  return true;
};

// --- שאר הפונקציות ---
// (חשוב להקפיד שכולן ישתמשו ב-_mergeWithPermissions לפני ה-return)

const getStarredResources = async (userId, parentId = null) => {
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, false, false);
  const starredIds = await PermissionsService.isStarredResources(permittedIds, true, userId);

  const query = { _id: { $in: starredIds } };
  if (parentId) query.parentId = parentId;

  const resources = await Resource.find(query);
  return await _mergeWithPermissions(resources, userId);
};

const getTrashResources = async (userId, parentId = null) => {
  // שים לב: כאן אנחנו מבקשים isDeleted=true
  const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId, true, false);

  let resources = [];
  if (parentId) {
    resources = await Resource.find({ _id: { $in: permittedIds }, parentId });
  } else {
    resources = await Resource.find({ _id: { $in: permittedIds } });
    // הסינון של ה"יתומים" שהצגת קודם מצוין, השארתי אותו בחוץ לקצר, אבל הוא צריך להיות כאן
  }
  return await _mergeWithPermissions(resources, userId);
};

const toggleStarred = async (id, userId) => {
  const currentStatus = await PermissionsService.getResourceStatus(userId, id);
  if (!currentStatus) return null;

  await PermissionsService.toggleStarredStatus(id, !currentStatus.isStarred, userId);
  // אין צורך לעדכן Timestamp של הקובץ כי זה שינוי אישי בלבד
  
  const resource = await findById(id);
  const merged = await _mergeWithPermissions([resource], userId);
  return merged[0];
};

const toggleSpam = async (id, userId) => {
    const permission = await PermissionsService.getResourceStatus(userId, id);
    if (!permission) return null;
    
    const newStatus = !permission.isSpam;
    const descendants = await getDescendants(id, true);
    const allIds = [id, ...descendants.map(d => d._id.toString())];
    
    await PermissionsService.setSpamStatus(allIds, newStatus, userId);

    const resource = await findById(id);
    const merged = await _mergeWithPermissions([resource], userId);
    return merged[0];
};

const enrichResources = async (resources, userId) => {
    return await _mergeWithPermissions(resources, userId);
};

/**
 * מחזיר שני מערכים:
 * 1. משאבים שהשם שלהם תואם לשאילתה.
 * 2. קבצים שצריך לבדוק את התוכן שלהם (כי השם לא תואם).
 */
const getSearchCandidates = async (userId, query) => {
    const lowerQuery = query.toLowerCase();
    
    // 1. קבלת המזהים המותרים
    const permittedIds = await PermissionsService.getPermittedResourcesOfUser(userId);
    
    // 2. חיפוש לפי שם
    const nameMatches = await Resource.find({
        _id: { $in: permittedIds },
        name: { $regex: query, $options: 'i' }
    }).lean();

    const foundIds = new Set(nameMatches.map(m => m._id.toString()));

    // 3. מציאת קבצים פוטנציאליים לחיפוש תוכן (שלא נמצאו כבר לפי שם)
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