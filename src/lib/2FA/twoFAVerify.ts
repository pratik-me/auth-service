import type { Response } from "express";
import prisma from "../../config/prisma.js";
import { verify } from "otplib";

export const twoFAVerifyHandler = async (req: any, res: Response) => {
    const authUser = req.user;

    if (!authUser) return res.status(401).json({ message: "Not authenticated" });

    try {
        const { code } = req.body as { code: string };
        if (!code) res.status(400).json({ message: "Two factor code is required" });

        const user = await prisma.user.findUnique({
            where: {
                id: authUser.id,
            }
        });
        if(!user) res.status(404).json({message: "User not found"});
        if(!user?.twoFactorSecret) {
            return res.status(400).json({message: "No 2FA setup found"});
        };
        const isValid = verify({token: code, secret: user.twoFactorSecret});
        if(!isValid) return res.status(400).json({message: "Invalid 2FA code"});
        await prisma.user.update({
            where: {
                id: authUser.id,
            },
            data: {
                twoFactorEnabled: true,
            }
        });

        return res.status(200).json({message: "2FA enabled successfully", twoFactorEnabled: user.twoFactorEnabled})
    } catch (error) {

    }
}