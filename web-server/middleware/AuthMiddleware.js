import jwt from "jsonwebtoken";
const key = process.env.JWT_SECRET || "fallback_key_for_local_dev";

/**
 * Middleware to check if user is logged in
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns adds userId to req if token is valid, else returns 401/403
 */
const isLoggedIn = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        // Extract token from "Bearer <token>"
        const token = authHeader.split(" ")[1];
        
        try {
            const decoded = jwt.verify(token, key);
            // attach user ID to request object
            req.userId = decoded.id; 
            
            return next();
        } catch (err) {
            return res.status(401).send("Invalid Token");
        }
    } else {
        return res.status(403).send('Token required');
    }
};

export { isLoggedIn };