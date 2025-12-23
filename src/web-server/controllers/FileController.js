import FileModel from "../models/FileModel.js";
import UserModel from "../models/UserModel.js";
import PermissionsModel from "../models/PermissionsModel.js";
import { sendToCpp } from "../services/cppService.js";
import { ROLES } from "../enums/Roles.js";
import { FILE_TYPE, isValidFileType } from "../enums/FileType.js";

/**
 * GET /api/files?parentId=...
 * Returns a list of files the user has permission to view
 */
const getUserFiles = async (req, res) => {
  const userId = req.headers["authorization"];
  const parentId = req.query.parentId || null; 

  if (!UserModel.isValidId(userId))
    return res.status(401).json({ error: "Unauthorized" });

  // Get files only for this specific level (folder or root)
  const userFiles = FileModel.getFilesByUserId(userId, parentId);
  
  // Return list with types so client knows if it's a folder or file
  res.json(userFiles.map((f) => ({ 
      id: f.id, 
      name: f.name, 
      type: f.type 
  })));
};

/**
 * POST /api/files
 * Creates records of the file here and sends file content to C++ server
 */
const uploadFile = async (req, res) => {
  const userId = req.headers["authorization"];
  const {
    filename,
    content,
    type = FILE_TYPE.FILE,
    parentId = null,
  } = req.body;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validate File Type
  if (!isValidFileType(type)) {
    return res.status(400).json({ 
        error: `Invalid type. Must be one of: ${Object.values(FILE_TYPE).join(", ")}` 
    });
  }

  // Validate Parent Id
  if (!FileModel.validateParent(parentId).valid) {
      return res.status(parentCheck.status).json({ error: parentCheck.error });
  }

  // Validate Content vs Type
  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }
  if (type === FILE_TYPE.FILE && (content === undefined || content === null)) {
    return res.status(400).json({ error: "Missing content for file" });
  }
  try {
    // Create file record and owner permission
    const fileRecord = FileModel.createFileRecord(
      userId,
      filename,
      type,
      parentId
    );
    PermissionsModel.createFilePermission(fileRecord.id, userId, ROLES.OWNER);

    if (type === FILE_TYPE.FOLDER) {
      // Folders are virtual, no C++ storage needed
      return res.status(201).json(fileRecord);
    } else {
      const cppResponse = await sendToCpp(`POST ${fileRecord.id} ${content}`);

      if (cppResponse.includes("201 Created")) {
        return res.status(201).json(fileRecord);
      }

      // Rollback records if C++ storage fails
      FileModel.removeFileRecord(fileRecord.id);
      PermissionsModel.removeAllPermissionsOfFile(fileRecord.id);
      res.status(500).json({ error: "Storage error", detail: cppResponse });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/files/:id
 * Fetches file content if user has at least READER role
 * IF FOLDER: Returns array of its children.
 */
const getFileContent = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check permission in storage here before going to C++ server
  if (!PermissionsModel.checkPermission(userId, id, ROLES.READER)) {
    return res.status(403).json({ error: "Forbidden: No read access" });
  }

  const file = FileModel.findById(id);

  // Handle Folder: Return list of children names
  if (file && file.type === FILE_TYPE.FOLDER) {
    // We use the existing function, passing the current folder ID as the parentId
    const children = FileModel.getFilesByUserId(userId, id);
    return res.status(200).json(children.map(c => ({ id: c.id, name: c.name, type: c.type })));
  }

  // Handle File: Fetch content from C++
  try {
    const cppResponse = await sendToCpp(`GET ${id}`);
    const content = cppResponse.split("\n\n")[1] || "";
    res.status(200).send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/files/:id
 * Updates existing file content if user has at least WRITER role
 */
const updateFile = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id } = req.params;
  const { content } = req.body;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check permission in storage here before going to C++ server
  if (!PermissionsModel.checkPermission(userId, id, ROLES.WRITER)) {
    return res.status(403).json({ error: "Forbidden: No write access" });
  }

  // Guard: Folders cannot have content updated
  const file = FileModel.findById(id);
  if (file && file.type === FILE_TYPE.FOLDER) {
    return res.status(400).json({ error: "Cannot update content of a folder" });
  }

  try {
    // C++ server AddCommand prevents overwriting, so we delete first, then post the new version
    await sendToCpp(`DELETE ${id}`);
    const cppResponse = await sendToCpp(`POST ${id} ${content}`);

    if (cppResponse.includes("201 Created")) {
      return res.status(200).json({ message: "Updated successfully" });
    }
    res.status(500).json({ error: "Update failed", detail: cppResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/files/:id
 * Recursively removes files/folders
 */
const deleteFile = async (req, res) => {
  const userId = req.headers["authorization"];
  const { id } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!PermissionsModel.checkPermission(userId, id, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete" });
  }

  try {
    // Use recursive delete helper
    await deleteRecursive(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper Recursive function to delete folders and their content
 */
async function deleteRecursive(fileId) {
  const file = FileModel.findById(fileId);
  if (!file) return; 

  if (file.type === FILE_TYPE.FOLDER) {
    // If it's a folder, find all immediate children
    const children = FileModel.getFilesByParentId(fileId);
    
    // Recursively delete each child
    for (const child of children) {
      await deleteRecursive(child.id);
    }
  } else {
    // If it's a FILE, ask C++ server to delete physical data
    try {
        await sendToCpp(`DELETE ${fileId}`);
    } catch (err) {
        console.error(`[DELETE ERROR] Failed to delete physical file ${fileId}:`, err.message);
    }
  }

  // Finally, remove Metadata and Permissions
  FileModel.removeFileRecord(fileId);
  PermissionsModel.removeAllPermissionsOfFile(fileId);
}

export default {
  getUserFiles,
  uploadFile,
  getFileContent,
  updateFile,
  deleteFile,
};