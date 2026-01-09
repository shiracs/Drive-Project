import { v4 as uuidv4 } from "uuid";
import PermissionsModel from "./PermissionsModel.js";
import { RESOURCE_TYPE } from "../enums/ResourceType.js";

//! Volatile storage for resources
/**
 * Resource records structure:
 * {
 *  id: UUID,
 *  ownerId: USER_ID,
 *  name: ORIGINAL_RESOURCENAME,
 *  type: RESOURCE_TYPE,
 *  parentId: PARENT_FOLDER_ID (or null),
 *  path: STRING (e.g., ",parent_id,child_id,")
 * }
 */
//TODOL remove hardcoded data
let RESOURCES = [
  {
    id: "file_shared_id",
    name: "shared_file.txt",
    type: "FILE",
    ownerId: "user_a_id", // שייך למשתמש א'
    parentId: null
  },
  {
    id: "file_private_id",
    name: "private_file.txt",
    type: "FILE",
    ownerId: "user_a_id", // שייך למשתמש א'
    parentId: null
  }
];

/**
 * Returns a resource object by its ID
 */
const findById = (id) => {
  return RESOURCES.find((r) => r.id === id);
};

/**
 * Creates a new file/folder record with path
 */
const createResourceRecord = (userId, name, type = RESOURCE_TYPE.FILE, parentId = null) => {
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
    path 
  };

  RESOURCES.push(record);
  console.log(`[STORAGE UPDATE]`, { RESOURCES });
  return record;
};

/**
 * Returns all resources that a user has access to view in a specific folder (default is null -> Root)
 * @param {string} userId - ID of the user
 * @param {string | null} parentId - The folder we are listing (or null for root)
 * @returns {Array} List of authorized resource objects
 */
const getResourcesByUserId = (userId, parentId = null) => {
  const permittedIds = PermissionsModel.getPermittedResourcesOfUser(userId);
  return RESOURCES.filter(r => 
      permittedIds.includes(r.id) && 
      r.parentId === parentId
  );
};

/**
 * Returns ALL descendants (children, grandchildren, etc.)
 * Used for flat deletion and permission granting
 */
const getDescendants = (folderId) => {
  // We search for resources whose path contains ",folderId,"
  const searchPattern = `,${folderId},`;
  return RESOURCES.filter(f => f.path.includes(searchPattern));
};

/**
 * Helper to get ALL resources (used for search)
 */
const getAllResourcesByUser = (userId) => {
  const permittedIds = PermissionsModel.getPermittedResourcesOfUser(userId);
  return RESOURCES.filter((r) => permittedIds.includes(r.id));
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
    return { valid: false, error: "Parent ID must refer to a folder", status: 400 };
  }
  return { valid: true };
};

/**
 * Removes a resource record by id
 */
const removeResourceRecord = (id) => {
  const index = RESOURCES.findIndex(r => r.id === id);
  if (index !== -1) RESOURCES.splice(index, 1);
};

/**
 * Updates the name of a resource
 * @param {string} id - The resource ID
 * @param {string} newName - The new name
 * @returns {boolean} true if successful, false if not found
 */
const renameResource = (id, newName) => {
  const resource = RESOURCES.find(r => r.id === id);
  if (resource) {
    resource.name = newName;
    return true;
  }
  return false;
};

/**
 * Returns all resources shared with the user (where user is NOT the owner)
 */
const getSharedResourcesByUserId = (userId) => {
  const permittedIds = PermissionsModel.getPermittedResourcesOfUser(userId);
  return RESOURCES.filter(r => 
      permittedIds.includes(r.id) && 
      r.ownerId !== userId
  );
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
  getSharedResourcesByUserId
};