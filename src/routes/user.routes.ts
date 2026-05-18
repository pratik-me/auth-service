import { Router, type Response } from "express";
import requireAuth from "../middleware/requireAuth.js";
import type { ROLES } from "../config/consts.js";

const router = Router();

router.get("/me", requireAuth, (req: any, res: Response) => {
    const authUser = req.user as { id: string, name: string, email: string, role: typeof ROLES[number], isEmailVerified: boolean };
    return res.json({ user: authUser })
});

export default router;