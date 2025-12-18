import { sendToCpp } from '../services/cppService.js';

const uploadFile = async (req, res) => {
    const { filename, content } = req.body;
    // Extract user ID from authorization header
    const userId = req.headers['authorization']; 

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing user ID in header" });
    }

    if (!filename || content === undefined) {
        return res.status(400).json({ error: "Missing filename or content" });
    }

    try {
        // Create a user-specific filename
        const userSpecificFilename = `${userId}_${filename}`;
        const command = `POST ${userSpecificFilename} ${content}`;
        
        const cppResponse = await sendToCpp(command);
        const statusCode = parseInt(cppResponse.substring(0, 3));

        if (!isNaN(statusCode)) {
            return res.status(statusCode).json({ message: cppResponse });
        }
        res.status(500).json({ error: "Unexpected response", raw: cppResponse });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getFiles = async (req, res) => {
    const userId = req.headers['authorization'];

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing user ID in header" });
    }

    try {
        // search for files belonging to the user
        const command = `SEARCH ${userId}_`;
        const cppResponse = await sendToCpp(command);

        if (cppResponse.includes("200 Ok")) {
            const parts = cppResponse.split('\n\n');
            const filesString = (parts[1] || "").trim(); 
            if (!filesString) {
                return res.status(200).json([]);
            }

            const fileList = filesString.split(' ')
                .filter(name => name.startsWith(`${userId}_`))
                .map(name => name.replace(`${userId}_`, "")); 

            return res.status(200).json(fileList);
        }
        
        res.status(500).json({ error: "Failed to retrieve files", raw: cppResponse });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default { uploadFile, getFiles };