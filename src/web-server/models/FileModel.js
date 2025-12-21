import { v4 as uuidv4 } from "uuid";


const ROLES = {
  OWNER: "owner",
  WRITER: "writer",
  READER: "reader",
};

//! Volatile storage for files and permissions
/**
 * File records structure:
 * {
 *   id: UUID,
 *   ownerId: USER_ID,
 *   name: ORIGINAL_FILENAME
 */
const files = [];
/**
 * Permissions structure:
 * {
 *   id: PERMISSION_ID,
 *   fileId: FILE_ID,
 *   userId: USER_ID,
 *   role: READER | WRITER | OWNER
 */
const permissions = [];

/**
 * Creates a new file record and creates new permissions for the owner
 * @param {string} userId - ID of the user uploading the file
 * @param {string} originalName - original name of the file
 * @returns {Object} The created file record
 */
const createFileRecord = (userId, originalName, size) => {
  const fileId = uuidv4(); // This ID will also be used as the filename on c++ server
  const fileRecord = {
    id: fileId,
    ownerId: userId,
    name: originalName,
  };
  files.push(fileRecord);

  // create OWNER permissions for the uploader
  permissions.push({
    id: uuidv4(), //This is the pId
    fileId: fileId,
    userId: userId,
    role: ROLES.OWNER,
  });

  logStorageChange("createFileRecord");

  return fileRecord;
};

/**
 * Checks if a user has sufficient permissions for a specific action
 * @param {string} userId - ID of the requesting user
 * @param {string} fileId - UUID of the file
 * @param {string} requiredRole - Minimum role required (reader/writer/owner)
 * @returns {boolean} True if access is granted
 */
const checkPermission = (userId, fileId, requiredRole) => {
  const perm = permissions.find(
    (p) => p.fileId === fileId && p.userId === userId
  );
  if (!perm) return false;

  if (requiredRole === ROLES.READER) return true; // Anyone with a role can read
  if (requiredRole === ROLES.WRITER)
    return [ROLES.OWNER, ROLES.WRITER].includes(perm.role);
  if (requiredRole === ROLES.OWNER) return perm.role === ROLES.OWNER;

  return false;
};

/**
 * Returns all files that a user has access to view
 * @param {string} userId - ID of the user
 * @returns {Array} List of authorized file objects
 */
const getFilesByUserId = (userId) => {
  const fileIds = permissions
    .filter((p) => p.userId === userId)
    .map((p) => p.fileId);

  return files.filter((f) => fileIds.includes(f.id));
};

//TODO: delete this
const logStorageChange = (label) => {
  console.log(`[STORAGE UPDATE] from ${label}:`, { files, permissions });
};

export default { ROLES, createFileRecord, checkPermission, getFilesByUserId };

