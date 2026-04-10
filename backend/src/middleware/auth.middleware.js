import { verifyToken } from "../utils/jwt.js";

const authMiddleware = (req, res, next)=>{
    try {
        const authHeader = req.headers.authorization;

        // cehck header
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // get token
        const token = authHeader.split(" ")[1];

        // verify token
        const decoded = verifyToken(token);

        // attach user to request
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default authMiddleware;