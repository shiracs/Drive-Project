import ResourcesService from "../services/ResourcesService.js";
import UsersService from "../services/UsersService.js";
import permissionsService from "../services/PermissionsService.js";
import { sendToCpp } from "../services/cppService.js";
import { ROLES } from "../enums/Roles.js";
import { RESOURCE_TYPE, isValidResourceType } from "../enums/ResourceType.js";

/**
 * GET /api/files?parentId=
 * Returns a list of resources the user has permission to view in the specified folder (or root if none specified)
 */
const getUserResourcesInDir = async (req, res) => {
  try{
    const userId = req.userId;
    const parentId = req.query.parentId || null;

    const validUser = await UsersService.findById(userId);
    if (!validUser)
      return res.status(401).json({ error: "Unauthorized" });

    // Get resources only for this specific level (right now we use null for root)
    const userResources = await ResourcesService.getResourcesByUserId(userId, parentId);

    res.json(userResources);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/files
 * Creates records of the resource here and sends file content to C++ server
 */
const uploadResource = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      content = "",
      type = RESOURCE_TYPE.FILE,
      parentId = null,
    } = req.body;

    // --- VALIDATIONS --- //
    const validUser = await UsersService.findById(userId);
    if (!validUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Validate Resource Type
    if (!isValidResourceType(type)) {
      return res.status(400).json({ error: `Invalid type.` });
    }
    // Name is required
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
  }
    // Validate Parent Id
    const parentCheck = await ResourcesService.validateParent(parentId);
    if (!parentCheck.valid) {
      return res.status(parentCheck.status).json({ error: parentCheck.error });
    }

    const resourceRecord = await ResourcesService.createResourceRecord(userId, name, type, parentId);
    await permissionsService.createResourcePermission(resourceRecord.id, userId, ROLES.OWNER);

    const resourceUrl = `/api/files/${resourceRecord.id}`;

      // HANDLE FOLDERS: folders are virtual, no C++ storage needed
    if (type === RESOURCE_TYPE.FOLDER) {
        return res.status(201).location(resourceUrl).json(resourceRecord.toJSON());
    } 
      // HANDLE FILES: send content to C++
    else {
      const cppResponse = await sendToCpp(`POST ${resourceRecord.id} ${content}`);

      if (cppResponse.includes("201 Created")) {
        return res.status(201).location(resourceUrl).json(resourceRecord.toJSON());
      }

      // Rollback records if C++ storage fails
      await ResourcesService.removeResourceRecord(resourceRecord.id);
      await permissionsService.removeAllPermissionsOfResource(resourceRecord.id);
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
try {
  const userId = req.userId;
  const { id } = req.params;

  const validUser = await UsersService.findById(userId);
  if (!validUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resource =  await ResourcesService.findById(id);
  if (!resource) return res.status(404).json({ error: "File not found" });

  // Check permission in storage here before going to C++ server
  const hasPermission = await permissionsService.checkPermission(userId, id, ROLES.READER);
  if (!hasPermission) {
    return res.status(403).json({ error: "Forbidden: No read access" });
  }

  const enrichedList = await ResourcesService.enrichResources([resource], userId);
  const enrichedResource = enrichedList[0];

  // HANDLE FOLDER: Return list of children names
  if (resource && resource.type === RESOURCE_TYPE.FOLDER) {
    // We use the existing function, passing the current folder ID as the parentId
    const children = await ResourcesService.getResourcesByUserId(userId, id);
    return res.status(200).json(children.map(c => c.toJSON() ? c.toJSON() : c));
  }

  // HANDLE FILE: Fetch content from C++
  try {
    const cppResponse = await sendToCpp(`GET ${id}`);
    const content = cppResponse.split("\n\n")[1] || "";
    res.status(200).json({...enrichedResource, content: content });
  } catch (error) {
    console.error(`[ResourceController] Error getting resource ${id}:`, error);
    res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * PATCH /api/files/:id
 * Updates existing resource's name and/or content
 */
const updateResource = async (req, res) => {
try {
  const userId = req.userId;
  const { id } = req.params;
  const { name, content } = req.body;

  const validUser = await UsersService.findById(userId);
  if (!validUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resourceRecord = await ResourcesService.findById(id);
  if (!resourceRecord) {
      return res.status(404).json({ error: "Resource not found" });
  }

  // Check permission in storage here before going to C++ server
  const hasPermission = await permissionsService.checkPermission(userId, id, ROLES.WRITER);
  if (!hasPermission) {
    return res.status(403).json({ error: "Forbidden: No write access" });
  }

  try {
    let isChanged = false;

    // Rename if needed
    if (name && name !== resourceRecord.name) {
      await ResourcesService.renameResource(id, name);
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
      await ResourcesService.updateTimestamp(id); 
    }

    return res.status(204).send();
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} catch (error) {
  res.status(500).json({ error: error.message }); 
}
};

/**
 * DELETE /api//files/permanent-delete/:id
 * Uses Flat Deletion logic for folders (using Path) to delete all descendants
 */
const deleteResource = async (req, res) => {
try {
  const userId = req.userId;
  const { id } = req.params;

  const validUser = await UsersService.findById(userId);
  if (!validUser) return res.status(401).json({ error: "Unauthorized" });

  const resourceRecord = await ResourcesService.findById(id);
  if (!resourceRecord) return res.status(404).json({ error: "Resource not found" });

  const checkPermission = await permissionsService.checkPermission(userId, id, ROLES.OWNER);
  if (!checkPermission) { 
    return res.status(403).json({ error: "Forbidden: Only owners can delete" });
  }

  try {
    const targetResource = await ResourcesService.findById(id);
    const descendants = await ResourcesService.getDescendants(id, true);
    const allToDelete = [targetResource, ...descendants];

    for (const resource of allToDelete) {
      const rId = resource._id || resource.id;
      if (resource.type === RESOURCE_TYPE.FILE) {
        try {
          await sendToCpp(`DELETE ${rId}`);
        } catch (e) {
          console.error(`Failed to delete physical file ${rId}`, e.message);
        }
      }
      await permissionsService.removeAllPermissionsOfResource(rId)
    }
    
    await ResourcesService.removeResourceRecord(id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} catch (error) {
  res.status(500).json({ error: error.message }); 
}
};

/** 
 * GET /api/search/:query
 * Searches resources by name or content containing the query string 
 */
const searchResourcesByQuery = async (req, res) => {
try {
  const userId = req.userId;
  const { query } = req.params;

  // check user authorization - every user must be authorized
  const validUser = await UsersService.findById(userId);
  if (!validUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // check if query is provided
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  const lowerQuery = query.toLowerCase();
  const { nameMatches, potentialFiles } = await ResourcesService.getSearchCandidates(userId, query);
  const fetchContentForFile = async (file) => {
        if (file.type === RESOURCE_TYPE.FOLDER) return file; // לתיקיות אין תוכן
        try {
            const cppResponse = await sendToCpp(`GET ${file._id}`);
            if (!cppResponse || !cppResponse.includes("\n\n")) return { ...file, content: "" };
            
            const base64Content = cppResponse.split("\n\n")[1] || "";
            const decodedContent = Buffer.from(base64Content, 'base64').toString('utf-8');
            return { ...file, content: decodedContent };
        } catch (e) {
            return { ...file, content: "" };
        }
    };

    const nameResults = await Promise.all(nameMatches.map(fetchContentForFile));

    const contentResultsPromises = potentialFiles.map(async (file) => {
        const fileWithContent = await fetchContentForFile(file);
        if (fileWithContent.content && fileWithContent.content.toLowerCase().includes(lowerQuery)) {
            return fileWithContent;
        }
        return null;
    });
    
    const contentResults = (await Promise.all(contentResultsPromises)).filter(r => r !== null);

    const allMatches = [...nameResults, ...contentResults];

    const enrichedResults = await ResourcesService.enrichResources(allMatches, userId);

    const finalResponse = enrichedResults.map(r => ({
        id: r.id || r._id.toString(),
        name: r.name,
        type: r.type,
        content: r.content,
        ownerId: r.ownerId,
        parentId: r.parentId,
        updatedAt: r.updatedAt,
        isStarred: !!r.isStarred,
        isDeleted: !!r.isDeleted,
        isSpam: !!r.isSpam,
        role: r.role
    }));

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ error: "Search failed", detail: error.message });
  }
};

/**
 * GET /api/shared
 * returns only resources that were shared with userId
 */
const getSharedResources = async (req, res) => {
  const userId = req.userId;
  const parentId = req.query.parentId || null;

  const validUser = await UsersService.findById(userId);
  if (!validUser)
    return res.status(401).json({ error: "Unauthorized" });

  // Get resources only for this specific level (right now we use null for root)
  const sharedResources = await ResourcesService.getSharedResourcesByUserId(userId, parentId);
  
  res.json(sharedResources);
};

/**
 * GET /api/owned
 * returns resources owned by userId
 */
const getOwnedResources = async (req, res) => {
  const userId = req.userId;
  const parentId = req.query.parentId || null;

  const validUser = await UsersService.findById(userId);
  if (!validUser) return res.status(401).json({ error: "Unauthorized" });

  const resources = await ResourcesService.getOwnedResources(userId, parentId);
  res.json(resources);
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

    const resources = await ResourcesService.getRecentResources(userId, parentId);
    res.json(resources);
};

/**
 * GET /api/starred
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getStarredResources = async (req, res) => {
    try {
        const userId = req.userId;
        const parentId = req.query.parentId || null;

        const validUser = await UsersService.findById(userId);  
        if (!validUser) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const resources = await ResourcesService.getStarredResources(userId, parentId);

        res.json(resources).status(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** * POST /api/files/toggle-starred/:id
 */
const toggleStarred = async (req, res) => {
    const { id } = req.params;
    const updated = await ResourcesService.toggleStarred(id, req.userId);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
};

/**
 * GET /api/trash
 * @param {`*`} req 
 * @param {*} res 
 * @returns 
 */
const getTrashResources = async (req, res) => {
    try {
        const userId = req.userId;
        const parentId = req.query.parentId || null;

        const validUser = await UsersService.findById(userId);
        if (!validUser) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const resources = await ResourcesService.getTrashResources(userId, parentId);
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/files/restore/:id
 * @param {`*`} req 
 * @param {*} res 
 * @returns 
 */
export const restoreResource = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const validUser = await UsersService.findById(userId);
        if (!validUser) return res.status(401).json({ error: "Unauthorized" });

        // only owners can restore

        const checkPermission = await permissionsService.checkPermission(userId, id, ROLES.OWNER);
        if (!checkPermission) {
             return res.status(403).json({ error: "Forbidden: Only owners can restore resources" });
        }

        const success = await ResourcesService.restoreResource(id, userId);

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

  const validUser = await UsersService.findById(userId);
  if (!validUser) return res.status(401).json({ error: "Unauthorized" });

  const checkPermission = await permissionsService.checkPermission(userId, id, ROLES.OWNER);
  if (!checkPermission) {
    return res.status(403).json({ error: "Forbidden: Only owners can delete" });
  }

  try {
    const success = await ResourcesService.softDeleteResource(id, userId); 

    if (!success) return res.status(404).json({ error: "Action failed" });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/spam
 */
const getSpamResources = async (req, res) => {
    try {
        const userId = req.userId;
        const parentId = req.query.parentId || null;

        const validUser = await UsersService.findById(userId);
        if (!validUser) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const resources = await ResourcesService.getSpamResources(userId, parentId);
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/files/toggle-spam/:id
 */
const toggleSpam = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;

    const updated = await ResourcesService.toggleSpam(id, userId);
    if (!updated) return res.status(404).json({ error: "Resource not found" });
    res.json(updated);
};

/**
 *  POST /api/files/move/:id
 */
const moveResource = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { newParentId } = req.body;

  const validUser = await UsersService.findById(userId);
  if (!validUser) return res.status(401).json({ error: "Unauthorized" });

  // moving is only allowed for owners
  const checkPermission = await permissionsService.checkPermission(userId, id, ROLES.OWNER);
  if (!checkPermission) {
    return res.status(403).json({ error: "Forbidden: No owner access" });
  }

  const success = await ResourcesService.moveResource(id, newParentId);
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
