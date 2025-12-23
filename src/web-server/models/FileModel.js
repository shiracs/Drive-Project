import { v4 as uuidv4 } from "uuid";
import PermissionsModel from "./PermissionsModel.js";

//! Volatile storage for files and permissions
/**
 * File records structure:
 * {
 *   id: UUID,
 *   ownerId: USER_ID,
 *   name: ORIGINAL_FILENAME
 * }
 */
const FILES = [];

/**
 * Creates a new file record and creates new permissions for the owner
 * @param {string} userId - ID of the user uploading the file
 * @param {string} originalName - original name of the file
 * @returns {Object} The created file record
 */
const createFileRecord = (userId, originalName, size) => {
  const fileRecord = {
    id: uuidv4(), // this is the fileId
    ownerId: userId,
    name: originalName,
  };

  FILES.push(fileRecord);
   console.log(`[STORAGE UPDATE]`, { FILES });
  return fileRecord;
};

/**
 * Returns all files that a user has access to view
 * @param {string} userId - ID of the user
 * @returns {Array} List of authorized file objects
 */
const getFilesByUserId = (userId) => {
  const fileIds = PermissionsModel.getPermittedFilesOfUser(userId);
  return FILES.filter((f) => fileIds.includes(f.id));
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

/**
 * Finds a file record by ID
 * @param {string} id 
 * @returns {Object|undefined}
 */
const findById = (id) => {
  return FILES.find(f => f.id === id);
};

export default { createFileRecord, getFilesByUserId, removeFileRecord, renameFile, findById };