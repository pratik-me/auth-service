import { type Request, type Response, type NextFunction, Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import prisma from "../config/prisma.js";
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";

const router = Router();

router.get('/users', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            }
        });

        const result = users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        }));

        return res.status(200).json({ users: result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Error while retrieving users data"})
    }
})

export default router;