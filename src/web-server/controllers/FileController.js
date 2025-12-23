import FileModel from "../models/FileModel.js";
import UserModel from "../models/UserModel.js";
import PermissionsModel from "../models/PermissionsModel.js";
import { sendToCpp } from "../services/cppService.js";
import { ROLES } from "../enums/Roles.js";

/**
 * GET /api/files
 * Returns a list of files the user has permission to view
 */
const getUserFiles = async (req, res) => {
  const userId = req.headers["authorization"];

  if (!UserModel.isValidId(userId))
    return res.status(401).json({ error: "Unauthorized" });

  const userFiles = FileModel.getFilesByUserId(userId);
  res.json(userFiles.map((f) => ({ id: f.id, name: f.name })));
};

/**
 * POST /api/files
 * Creates records of the file here and sends file content to C++ server
 */
const uploadFile = async (req, res) => {
  const userId = req.headers["authorization"];
  const { filename, content } = req.body;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!filename || !content) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    // Create file record and owner permission
    const fileRecord = FileModel.createFileRecord(
      userId,
      filename,
      content.length
    );
    PermissionsModel.createFilePermission(fileRecord.id, userId, ROLES.OWNER);

    const cppResponse = await sendToCpp(`POST ${fileRecord.id} ${content}`);

    if (cppResponse.includes("201 Created")) {
      return res.status(201).json(fileRecord);
    }
    res.status(500).json({ error: "Storage error", detail: cppResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/files/:id
 * Fetches file content if user has at least READER role
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
 * Removes file from storage and cleans up records here
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
    const cppResponse = await sendToCpp(`DELETE ${id}`);

    if (cppResponse.includes("204 No Content") || cppResponse.includes("404 Not Found")) {
      FileModel.removeFileRecord(id);
      PermissionsModel.removeAllPermissionsOfFile(id);
      return res
        .status(cppResponse.includes("204 No Content") ? 204 : 404)
        .send({
          message: cppResponse.includes("204 No Content")
            ? "Deleted successfully"
            : "File not found",
        });
    }
    res.status(500).json({ error: "Delete failed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** 
 * GET /api/search/:query
 * Searches files by name or content containing the query string 
 */
const searchFilesByQuery = async (req, res) => {
  const userId = req.headers["authorization"];
  const { query } = req.params;

  // check user authorization - every user must be authorized
  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // check if query is provided
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  // First, get the user's permitted files
  // then filter by name match
  try {
    const allUsersFiles = FileModel.getFilesByUserId(userId);
    const cppResponse = await sendToCpp(`SEARCH ${query}`);
    let contentMatchIds = [];

    if (cppResponse.includes("200 Ok")) {
      const parts = cppResponse.split("\n\n");
      contentMatchIds = parts.length > 1 ? parts[1].trim().split(" ") : [];
    }

    const foundFiles = allUsersFiles.filter(file => 
      file.name.includes(query) || contentMatchIds.includes(file.id)
    );

    const finalResponse = foundFiles.map(f => f.name);
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ error: "Search failed", detail: error.message });
  }
}

export default {
  getUserFiles,
  uploadFile,
  getFileContent,
  updateFile,
  deleteFile,
  searchFilesByQuery
};
