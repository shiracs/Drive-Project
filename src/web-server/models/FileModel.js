import { v4 as uuidv4 } from "uuid";
import PermissionsModel from "./PermissionsModel.js";
import { FILE_TYPE } from "../enums/FileType.js";

//! Volatile storage for files
/**
 * File records structure:
 * {
 *  id: UUID,
 *  ownerId: USER_ID,
 *  name: ORIGINAL_FILENAME,
 *  type: FILE_TYPE,
 *  parentId: PARENT_FOLDER_ID (or null),
 *  path: STRING (e.g., ",parent_id,child_id,")
 * }
 */
const FILES = [];

/**
 * Returns a file object by its ID
 */
const findById = (id) => {
  return FILES.find((f) => f.id === id);
};

/**
 * Creates a new file/folder record with Materialized Path
 */
const createFileRecord = (userId, name, type = FILE_TYPE.FILE, parentId = null) => {
  // First, Calculate Path, the default root path is ","
  let path = ","; 
  if (parentId) {
      const parent = findById(parentId);
      // If parent exists, append parent's ID to its path
      if (parent) {
          path = `${parent.path}${parent.id},`;
      }
  }

  const fileRecord = {
    id: uuidv4(), 
    ownerId: userId,
    name,
    type,
    parentId,
    path 
  };

  FILES.push(fileRecord);
  console.log(`[STORAGE UPDATE]`, { FILES });
  return fileRecord;
};

/**
 * Returns all files that a user has access to view in a specific folder (default is null -> Root)
 * @param {string} userId - ID of the user
 * @param {string | null} parentId - The folder we are listing (or null for root)
 * @returns {Array} List of authorized file objects
 */
const getFilesByUserId = (userId, parentId = null) => {
  const permittedIds = PermissionsModel.getPermittedFilesOfUser(userId);
  return FILES.filter(f => 
      permittedIds.includes(f.id) && 
      f.parentId === parentId
  );
};

/**
 * Returns all immediate children of a folder (needed for some logic)
 */
const getFilesByParentId = (parentId) => {
  return FILES.filter((f) => f.parentId === parentId);
};

/**
 * Returns ALL descendants (children, grandchildren, etc.)
 * Used for flat deletion and permission granting
 */
const getDescendants = (folderId) => {
  // We search for files whose path contains ",folderId,"
  const searchPattern = `,${folderId},`;
  return FILES.filter(f => f.path.includes(searchPattern));
};

/**
 * Helper to get ALL files (used for search)
 */
const getAllFilesByUser = (userId) => {
  const permittedIds = PermissionsModel.getPermittedFilesOfUser(userId);
  return FILES.filter((f) => permittedIds.includes(f.id));
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
  if (parent.type !== FILE_TYPE.FOLDER) {
    return { valid: false, error: "Parent ID must refer to a folder", status: 400 };
  }
  return { valid: true };
};

/**
 * Removes a file record by the fileId
 */
const removeFileRecord = (id) => {
  const index = FILES.findIndex(f => f.id === id);
  if (index !== -1) FILES.splice(index, 1);
};

/**
 * Updates the name of a file
 * @param {string} id - The file ID
 * @param {string} newName - The new name
 * @returns {boolean} true if successful, false if not found
 */
const renameFile = (id, newName) => {
  const file = FILES.find(f => f.id === id);
  if (file) {
    file.name = newName;
    return true;
  }
  return false;
};

export default { 
  createFileRecord, 
  getFilesByUserId, 
  removeFileRecord,
  findById,
  getFilesByParentId,
  getDescendants,
  getAllFilesByUser,
  validateParent,
  renameFile
};