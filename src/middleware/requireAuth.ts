import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { ROLES } from "../config/consts.js";
import prisma from "../config/prisma.js"

const requireAuth = async (req: any, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
        return res.status(401).json({ message: "You are not authorized user" });

    const token = header.split(" ")[1] as string;
    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
            id: string,
            role: typeof ROLES[number],
            tokenVersion: number,
        };

        const user = await prisma.user.findUnique({
            where: { id: payload.id, }
        })
        if (!user) return res.status(401).json({ message: "User not found" });
        if (user.tokenVersion !== payload.tokenVersion) return res.status(401).json({ message: "Token invalidated" });

        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        };

        next();
    } catch (error) {
        return res.status(500).json({ message: "Invalid token", error });
    }
}

export default requireAuth;