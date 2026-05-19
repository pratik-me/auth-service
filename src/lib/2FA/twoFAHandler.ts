import type { Response } from "express";
import prisma from "../../config/prisma.js";
import { generateSecret, generateURI } from "otplib";

export const twoFASetupHandler = async (req: any, res: Response) => {
    const authUser = req.user;
    if (!authUser) return res.status(401).json({ message: "Not authenticated" });

    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id }
        });

        if (!user)
            res.status(404).json({ message: "User not found" });
        if (!user.email)
            res.status(404).json({ message: "No email associated with user" })
        const secret = generateSecret();
        const otpAuthUrl = generateURI({
            issuer: 'NodeAdvancedAuthApp',
            label: user.email,
            secret,
        });

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                twoFactorSecret: secret,
                twoFactorEnabled: false,
            }
        });

        return res.status(200).json({ message: "2FA setup is done", otpAuthUrl, secret });
    } catch (error) {
        console.log("Error while two factor authenticating: ", error);
        return res.status(500).json({ message: "Error in 2FAHandler" });
    }
}