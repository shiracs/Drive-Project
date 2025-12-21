import FileModel from "../models/FileModel.js";
import UserModel from "../models/UserModel.js";
import PermissionsModel from "../models/PermissionsModel.js";
import { sendToCpp } from "../services/cppService.js";
import { ROLES } from "../enums/Roles.js";

/**
 * GET /api/files
 * Returns list of files the user has permission to view
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
    // Create file record
    const fileRecord = FileModel.createFileRecord(
      userId,
      filename,
      content.length
    );

    // create OWNER permissions for the uploader
    PermissionsModel.createFilePermission(fileRecord.id, userId, ROLES.OWNER);

    // Send content to C++ using the unique UUID as the filename
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

export default { getUserFiles, uploadFile, getFileContent };
