import ResourceModel from "../models/ResourceModel.js";
import UserModel from "../models/UserModel.js";
import PermissionsModel from "../models/PermissionsModel.js";
import { sendToCpp } from "../services/cppService.js";
import { ROLES } from "../enums/Roles.js";
import { RESOURCE_TYPE, isValidResourceType } from "../enums/ResourceType.js";

/**
 * GET /api/files?parentId=
 * Returns a list of resources the user has permission to view in the specified folder (or root if none specified)
 */
const getUserResourcesInDir = async (req, res) => {
  const userId = req.userId;
  const parentId = req.query.parentId || null;

  if (!UserModel.isValidId(userId))
    return res.status(401).json({ error: "Unauthorized" });

  // Get resources only for this specific level (right now we use null for root)
  const userResources = ResourceModel.getResourcesByUserId(userId, parentId);
  
  // Return list with types so client knows if it's a folder or file
  res.json(userResources.map((r) => ({ 
      id: r.id, 
      name: r.name, 
      type: r.type,
      isStarred: r.isStarred,
      isDeleted: r.isDeleted,
      isSpam: r.isSpam
  })));
};

/**
 * POST /api/files
 * Creates records of the resource here and sends file content to C++ server
 */
const uploadResource = async (req, res) => {
  const userId = req.userId;
  const {
    name,
    content = "",
    type = RESOURCE_TYPE.FILE,
    parentId = null,
  } = req.body;

  // --- VALIDATIONS --- //
  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validate Resource Type
  if (!isValidResourceType(type)) {
    return res.status(400).json({ error: `Invalid type.` });
  }

  // Validate Parent Id
  const parentCheck = ResourceModel.validateParent(parentId);
  if (!parentCheck.valid) {
    return res.status(parentCheck.status).json({ error: parentCheck.error });
  }

  // Validate Content vs Type
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  // --- CREATION LOGIC --- //
  try {
    // Create resource record and create OWNER permission to uploader
    const resourceRecord = ResourceModel.createResourceRecord(
      userId,
      name,
      type,
      parentId
    );
    PermissionsModel.createResourcePermission(resourceRecord.id, userId, ROLES.OWNER);

    const resourceUrl = `/api/files/${resourceRecord.id}`;

    // HANDLE FOLDERS: folders are virtual, no C++ storage needed
    if (type === RESOURCE_TYPE.FOLDER) {
      return res.status(201).location(resourceUrl).json(resourceRecord);
    } 
    // HANDLE FILES: send content to C++
    else {
      const cppResponse = await sendToCpp(`POST ${resourceRecord.id} ${content}`);

      if (cppResponse.includes("201 Created")) {
        return res.status(201).location(resourceUrl).json(resourceRecord);
      }

      // Rollback records if C++ storage fails
      ResourceModel.removeResourceRecord(resourceRecord.id);
      PermissionsModel.removeAllPermissionsOfResource(resourceRecord.id);
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
const getResourceContent = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resource = ResourceModel.findById(id);
  if (!resource) return res.status(404).json({ error: "File not found" });

  // Check permission in storage here before going to C++ server
  if (!PermissionsModel.checkPermission(userId, id, ROLES.READER)) {
    return res.status(403).json({ error: "Forbidden: No read access" });
  }

  // HANDLE FOLDER: Return list of children names
  if (resource && resource.type === RESOURCE_TYPE.FOLDER) {
    // We use the existing function, passing the current folder ID as the parentId
    const children = ResourceModel.getResourcesByUserId(userId, id);
    return res.status(200).json(children.map(c => ({ id: c.id, name: c.name, type: c.type })));
  }

  // HANDLE FILE: Fetch content from C++
  try {
    const cppResponse = await sendToCpp(`GET ${id}`);
    const content = cppResponse.split("\n\n")[1] || "";
    res.status(200).json({...resource, content: content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/files/:id
 * Updates existing resource's name and/or content
 */
const updateResource = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { name, content } = req.body;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resourceRecord = ResourceModel.findById(id);
  if (!resourceRecord) {
      return res.status(404).json({ error: "Resource not found" });
  }

  // Check permission in storage here before going to C++ server
  if (!PermissionsModel.checkPermission(userId, id, ROLES.WRITER)) {
    return res.status(403).json({ error: "Forbidden: No write access" });
  }

  try {
    let isChanged = false;

    // Rename if needed
    if (name && name !== resourceRecord.name) {
      ResourceModel.renameResource(id, name);
      isChanged = true;
    }
    // C++ server AddCommand prevents overwriting, so we delete first, then post the new version
    if (content !== undefined) {

      // Folders content cannot be updated
      if (resourceRecord.type === RESOURCE_TYPE.FOLDER) {
         return res.status(400).json({ error: "Cannot update content of a folder" });
      }

      await sendToCpp(`DELETE ${id}`);
      const cppResponse = await sendToCpp(`POST ${id} ${content}`);

      if (!cppResponse.includes("201 Created")) {
            return res.status(500).json({ error: "Content update failed", detail: cppResponse });
      }
      isChanged = true;
    }

    if (isChanged) {
      ResourceModel.updateTimestamp(id); 
    }

    return res.status(204).send();
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api//files/permanent-delete/:id
 * Uses Flat Deletion logic for folders (using Path) to delete all descendants
 */
const deleteResource = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!PermissionsModel.checkPermission(userId, id, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete" });
  }

  try {
    // Get the resource to delete
    const targetResource = ResourceModel.findById(id);
    if (!targetResource) return res.status(404).json({ error: "Resource not found" });

    // Get ALL its descendants - if its a file, this will be an empty array
    const descendants = ResourceModel.getDescendants(id);

    // Combine into one list to delete
    const allToDelete = [targetResource, ...descendants];

    // Delete each one
    for (const resource of allToDelete) {
      // If it's a file, delete from C++, otherwise skip
      if (resource.type === RESOURCE_TYPE.FILE) {
        try {
          await sendToCpp(`DELETE ${resource.id}`);
        } catch (e) {
          console.error(`Failed to delete physical file ${resource.id}`, e.message);
        }
      }
      // Remove Metadata & Permissions
      ResourceModel.removeResourceRecord(resource.id);
      PermissionsModel.removeAllPermissionsOfResource(resource.id);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** 
 * GET /api/search/:query
 * Searches resources by name or content containing the query string 
 */
const searchResourcesByQuery = async (req, res) => {
  const userId = req.userId;
  const { query } = req.params;

  // check user authorization - every user must be authorized
  if (!UserModel.isValidId(userId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // check if query is provided
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    // First, get the user's permitted files
    const allUsersResources = ResourceModel.getAllResourcesByUser(userId);
    const cppResponse = await sendToCpp(`SEARCH ${query}`);
    let contentMatchIds = [];

    if (cppResponse.includes("200 Ok")) {
      const parts = cppResponse.split("\n\n");
      contentMatchIds = parts.length > 1 ? parts[1].trim().split(" ") : [];
    }

    // Filter resources that match by name or content
    const foundResources = allUsersResources.filter(file => {
      const nameMatch = file.name.includes(query);
      const contentMatch = file.type !== 'IMAGE' && contentMatchIds.includes(file.id);
      return nameMatch || contentMatch;
    });

    const finalResponse = foundResources.map(f => ({ id: f.id, name: f.name, type: f.type, isStarred: f.isStarred, isDeleted: f.isDeleted, isSpam: f.isSpam }));
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ error: "Search failed", detail: error.message });
  }
}

/**
 * GET /api/shared
 * returns only resources that were shared with userId
 */
const getSharedResources = async (req, res) => {
  const userId = req.userId;
  const parentId = req.query.parentId || null;


  if (!UserModel.isValidId(userId))
    return res.status(401).json({ error: "Unauthorized" });

  // Get resources only for this specific level (right now we use null for root)
  const sharedResources = ResourceModel.getSharedResourcesByUserId(userId, parentId);
  
  res.json(sharedResources.map((r) => ({ 
      id: r.id, 
      name: r.name, 
      type: r.type,
      isStarred: r.isStarred,
      isDeleted: r.isDeleted,
      isSpam: r.isSpam
  })));
};

/**
 * GET /api/owned
 * returns resources owned by userId
 */
const getOwnedResources = async (req, res) => {
  const userId = req.userId;
  const parentId = req.query.parentId || null;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  const resources = ResourceModel.getOwnedResources(userId, parentId);
  res.json(resources.map(r => ({ id: r.id, name: r.name, type: r.type, isStarred: r.isStarred, isDeleted: r.isDeleted, isSpam: r.isSpam })));
};

/**
 * GET /api/recent
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getRecentResources = async (req, res) => {
    const userId = req.userId;
    const parentId = req.query.parentId || null;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const resources = ResourceModel.getRecentResources(userId, parentId);
    res.json(resources.map(r => ({ id: r.id, name: r.name, type: r.type, isStarred: r.isStarred, isDeleted: r.isDeleted, isSpam: r.isSpam })));
};

const getStarredResources = async (req, res) => {
    try {
        const userId = req.userId;
        const parentId = req.query.parentId || null;

        if (!UserModel.isValidId(userId)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const resources = ResourceModel.getStarredResources(userId, parentId);

        res.json(resources.map(r => ({ 
            id: r.id, 
            name: r.name, 
            type: r.type, 
            isStarred: r.isStarred,
            isDeleted: r.isDeleted, 
            isSpam: r.isSpam
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleStarred = async (req, res) => {
    const { id } = req.params;
    const updated = ResourceModel.toggleStarred(id);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
};


export const getTrashResources = async (req, res) => {
    try {
        const userId = req.userId;
        const parentId = req.query.parentId || null;

        if (!UserModel.isValidId(userId)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const resources = ResourceModel.getTrashResources(userId, parentId);
        res.json(resources.map(r => ({ 
            id: r.id, 
            name: r.name, 
            type: r.type, 
            isStarred: r.isStarred,
            isDeleted: r.isDeleted, 
            isSpam: r.isSpam
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const restoreResource = async (req, res) => {
    try {
        const { id } = req.params;
        const success = ResourceModel.restoreResource(id);
        if (!success) return res.status(404).json({ error: "Resource not found" });
        res.json({ message: "Resource restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * DELETE /api/files/:id
 */
const softDeleteResource = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  if (!PermissionsModel.checkPermission(userId, id, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete" });
  }

  try {
    const targetResource = ResourceModel.findById(id);
    if (!targetResource) return res.status(404).json({ error: "Resource not found" });

    const descendants = ResourceModel.getDescendants(id);
    const allToTrash = [targetResource, ...descendants];

    for (const resource of allToTrash) {
      ResourceModel.softDeleteResource(resource.id);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSpamResources = async (req, res) => {
    try {
        const userId = req.userId;
        const parentId = req.query.parentId || null;

         if (!UserModel.isValidId(userId)) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const resources = ResourceModel.getSpamResources(userId, parentId);
        res.json(resources.map(r => ({ 
            id: r.id, name: r.name, type: r.type, isStarred: r.isStarred, isDeleted: r.isDeleted, isSpam: r.isSpam
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleSpam = async (req, res) => {
    const { id } = req.params;
    const updated = ResourceModel.toggleSpam(id);
    if (!updated) return res.status(404).json({ error: "Resource not found" });
    res.json(updated);
};

const moveResource = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { newParentId } = req.body;

  if (!UserModel.isValidId(userId)) return res.status(401).json({ error: "Unauthorized" });

  // moving is only allowed for owners
  if (!PermissionsModel.checkPermission(userId, id, ROLES.OWNER)) {
    return res.status(403).json({ error: "Forbidden: No owner access" });
  }

  const success = ResourceModel.moveResource(id, newParentId);
  if (!success) return res.status(400).json({ error: "Move failed" });

  res.status(200).json({ message: "Moved successfully" });
};


export default {
  getUserResourcesInDir,
  uploadResource,
  getResourceContent,
  updateResource,
  deleteResource,
  searchResourcesByQuery,
  getSharedResources,
  getOwnedResources,
  getRecentResources,
  getStarredResources,
  toggleStarred,
  getTrashResources,
  restoreResource,
  softDeleteResource,
  getSpamResources,
  toggleSpam,
  moveResource
};
