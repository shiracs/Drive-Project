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

export default { createFileRecord, getFilesByUserId };
