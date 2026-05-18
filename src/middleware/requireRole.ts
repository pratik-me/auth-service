import type { Response, NextFunction } from "express";
import type { ROLES } from "../config/consts.js";

const requireRole = (role: typeof ROLES[number]) => {
    return (req: any, res: Response, next: NextFunction) => {
        const authUser = req.user;
        if(!authUser) return res.status(401).json({message: "Not authenticated."});

        if(authUser.role !== role) return res.status(403).json({message: "Not authorized"});
        next();
    }
}

export default requireRole;