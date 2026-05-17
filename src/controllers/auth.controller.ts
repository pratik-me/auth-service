import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import { registerSchema } from "../lib/zod/auth.schema.js"
import bcrypt from "bcryptjs";
import { FORNTEND_URL, PASSWORD_SALT, SITE_NAME, VERIFY_EMAIL_URL } from "../config/consts.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/email/emailRender.js";

export const registerHandler = async (req: Request, res: Response) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({
            message: "Invalid data",
            error: result.error
        });

        const { name, email, password } = result.data;
        const normalisedEmail = email.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalisedEmail,
            }
        })

        if (existingUser) return res.status(409).json({
            message: "Email is already registered",
        })

        const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT);

        const newUser = await prisma.user.create({
            data: {
                name,
                email: normalisedEmail,
                password: hashedPassword,
                role: "user",
            }
        })

        const verifyToken = jwt.sign({
            id: newUser.id,
        }, process.env.JWT_ACCESS_SECRET!, {
            expiresIn: '1d',
        });

        const verify = `${VERIFY_EMAIL_URL}?token=${verifyToken}`;

        await sendEmail(newUser.email, "Verify your email", newUser.name, SITE_NAME, verify);

        return res.status(201).json({
            message: "User registered",
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                isEmailVerified: newUser.isEmailVerified,
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Error while registering"
        })
    }
}

export const verifyEmailHandler = async(req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    if(!token) return res.status(400).json({message: "Verification token missing"});
    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {id: string};
        const user = await prisma.user.findUnique({
            where: {
                id: payload.id,
            }
        });

        if(!user) return res.status(400).json({message: "User not found"});
        if(user.isEmailVerified) return res.status(200).json({message: "Email already verified"});

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                isEmailVerified: true,
            }
        });

        return res.status(200).json({message: "Email is now verified"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while verifying email",
        })
    }
}

export const loginHandler = async(req: Request, res: Response) => {
    
}