import { v4 as uuidv4 } from "uuid";
import PermissionsModel from "./PermissionsModel.js";
import { FILE_TYPE } from "../enums/FileType.js";

//! Volatile storage for files and permissions
/**
 * File records structure:
 * {
 *    id: UUID,
 *    ownerId: USER_ID,
 *    name: ORIGINAL_FILENAME,
 *    type: FILE_TYPE,
 *    parentId: PARENT_FOLDER_ID (or null)
 * }
 */
const FILES = [];

/**
 * Creates a new file/folder record and creates new permissions for the owner
 * @param {string} userId - ID of the user uploading the file
 * @param {string} name - original name of the file
 * @param {string} type - type of the file (FILE or FOLDER)
 * @param {string | null} parentId - ID of the parent folder, or null for root
 * @returns {Object} The created file record
 */
const createFileRecord = (userId, name, type = FILE_TYPE.FILE, parentId = null) => {
  const fileRecord = {
    id: uuidv4(), 
    ownerId: userId,
    name,
    type,
    parentId
  };

  FILES.push(fileRecord);
  console.log(`[STORAGE UPDATE]`, { FILES });
  return fileRecord;
};

/**
 * Returns all files that a user has access to view in a specific folder (default is null -> Root)
 * @param {string} userId - ID of the user
 * @param {string | null} parentId - The folder to list (or null for root)
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
 * Returns a file object by its Id
 */
const findById = (id) => {
  return FILES.find((f) => f.id === id);
};

/**
 * Returns all immediate children of a folder
 */
const getFilesByParentId = (parentId) => {
  return FILES.filter((f) => f.parentId === parentId);
};

/**
 * Helper to get ALL files (used for search)
 */
const getAllFilesByUser = (userId) => {
  const permittedIds = PermissionsModel.getPermittedFilesOfUser(userId);
  return FILES.filter((f) => permittedIds.includes(f.id));
};

/**
 * Removes a file record by the fileId
 * @param {*} id 
 */
const removeFileRecord = (id) => {
  const index = FILES.findIndex(f => f.id === id);
  if (index !== -1) FILES.splice(index, 1);
};

/**
 * Validates a Parent Folder ID
 * @param {string|null} parentId 
 * @returns {Object} { valid: boolean, error?: string, status?: number }
 */
const validateParent = (parentId) => {
  if (!parentId) return { valid: true };

  const parent = FILES.find(f => f.id === parentId);
  if (!parent) {
    return { valid: false, error: "Parent folder not found", status: 404 };
  }
  if (parent.type !== FILE_TYPE.FOLDER) {
    return { valid: false, error: "Parent ID must refer to a folder", status: 400 };
  }
  return { valid: true };
};

export default { 
  createFileRecord, 
  getFilesByUserId, 
  removeFileRecord,
  findById,
  getFilesByParentId,
  getAllFilesByUser,
  validateParent
};