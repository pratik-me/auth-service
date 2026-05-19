import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import { forgotPassword, loginSchema, registerSchema } from "../lib/zod/auth.schema.js"
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { FORNTEND_URL, PASSWORD_SALT, SITE_NAME, VERIFY_EMAIL_URL } from "../config/consts.js";
import jwt from "jsonwebtoken";
import { sendEmail, sendResetEmail } from "../lib/email/emailRender.js";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../lib/token/token.js";
import { getGoogleClient } from "../lib/OAuth/google.oauth.js";
import axios, { AxiosError } from "axios";
import { verify } from "otplib";


export const registerHandler = async (req: Request, res: Response) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({
            message: "Invalid data",
            error: result.error
        });

        const { name, email, password, role } = result.data;
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
                role,
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

export const verifyEmailHandler = async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    if (!token) return res.status(400).json({ message: "Verification token missing" });
    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { id: string };
        const user = await prisma.user.findUnique({
            where: {
                id: payload.id,
            }
        });

        if (!user) return res.status(400).json({ message: "User not found" });
        if (user.isEmailVerified) return res.status(200).json({ message: "Email already verified" });

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                isEmailVerified: true,
            }
        });

        return res.status(200).json({ message: "Email is now verified" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while verifying email",
        })
    }
}

export const loginHandler = async (req: Request, res: Response) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({
            message: "Invalid data",
            error: result.error,
        });

        const { email, password, twoFactorCode } = result.data;
        const normalisedEmail = email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalisedEmail,
            }
        });
        if (!existingUser) return res.status(404).json({
            message: "Invalid email or password",
        })

        const correctPassword = await bcrypt.compare(password, existingUser.password);
        if (!correctPassword) return res.status(404).json({
            message: "Invalid email or password",
        })

        if (!existingUser.isEmailVerified) return res.status(403).json({
            message: "Please verify your email before logging",
        })

        if(existingUser.twoFactorEnabled) {
            if(!twoFactorCode || typeof twoFactorCode !== 'string')
                return res.status(400).json({message: "Two factor code is required"})
            if(!existingUser.twoFactorSecret) return res.status(400).json({message: "Two factor misconfigured for this account"})
        };

        // Verifying otp code
        const isValidCode = verify({token: twoFactorCode, secret: existingUser.twoFactorSecret})
        if(!isValidCode) return res.status(400).json({message: "Invalid two factor code"})

        const accessToken = createAccessToken(existingUser.id, existingUser.role, existingUser.tokenVersion);
        const refreshToken = createRefreshToken(existingUser.id, existingUser.tokenVersion);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login successfully done",
            accessToken,
            user: {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
                isEmailVerified: existingUser.isEmailVerified,
                twoFactorEnabled: existingUser.twoFactorEnabled,
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while login",
        })
    }
}

export const refreshHandler = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken as string | undefined;
        if (!token) return res.status(401).json({
            message: "Refresh token not found",
        });

        const payload = verifyRefreshToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: payload.id,
            }
        });
        if (!user) res.status(401).json({ message: "User not found" });
        if (payload.tokenVersion !== user?.tokenVersion) return res.status(401).json({ message: "Refresh token invalidated" });

        const newAccessToken = createAccessToken(user.id, user.role, user.tokenVersion);
        const newRefreshToken = createRefreshToken(user.id, user.tokenVersion);
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Token refreshed",
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled: user.twoFactorEnabled,
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error in refresh handler",
        })
    }
}

export const logoutHandler = async (req: Request, res: Response) => {
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({
        message: "Logged out"
    })
}

export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const result = forgotPassword.safeParse(req.body)
    if (!result.success) return res.status(401).json({
        message: "Invalid data",
        error: result.error,
    });

    const { email } = result.data;

    const normalisedEmail = email.toLowerCase().trim();
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: normalisedEmail,
            }
        });
        if (!user) return res.status(403).json({ message: "Account associated with given email id is not present" });
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        await prisma.user.update({
            where: {
                email: normalisedEmail,
            },
            data: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: new Date(Date.now() + 5 * 60 * 1000),
            }
        })

        const resetURL = `${FORNTEND_URL}/auth/reset-password?token=${rawToken}`;
        await sendResetEmail(user.email, "Reset your password", user?.name, resetURL, SITE_NAME);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error in reset password handler" });
    }
}

export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token, password } = req.body as { token?: string, password?: string };

    if (!token) return res.status(400).json({ message: "Reset token is missing" });
    if (!password || password.length < 6) return res.status(400).json({ message: "Password must be atleast 6 characters long." })

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: { gte: new Date() }
            }
        })

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });
        const newHashedPassword = await bcrypt.hash(password, PASSWORD_SALT);
        await prisma.user.update({
            where: {
                email: user.email,
            },
            data: {
                password: newHashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                tokenVersion: user.tokenVersion + 1,
            }
        });

        return res.status(200).json({
            message: "Password reset successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error in reset password handler"
        })
    }
}

export const googleAuthStartHandler = async (req: Request, res: Response) => {
    try {
        const client = getGoogleClient();
        const url = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: ['openid', 'email', 'profile'],
        });

        return res.redirect(url);
    } catch (error) {
        console.log("Error while authentication with google\n", error);
        return res.status(500).json({ message: "Error in google auth start handler" });
    }
}

export const googleAuthCallbackHandler = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string | undefined;
        if (!code) return res.status(400).json({ message: "Missing code in callback" });
        const client = getGoogleClient();
        const { tokens } = await client.getToken(code);
        if (!tokens.id_token) return res.status(400).json({ message: "No google id_token present" });
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID!,
        });
        const payload = ticket.getPayload();

        const email = payload?.email;
        const name = payload?.name;
        const emailVerified = payload?.email_verified;
        if (!name) return res.status(400).json({ message: "Name is not provided by google" })
        if (!email || !emailVerified) return res.status(400).json({ message: "Google account is not verified." });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomBytes, PASSWORD_SALT);
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: passwordHash,
                    role: 'user',
                    isEmailVerified: true,
                    twoFactorEnabled: false,
                }
            })
        } else {
            if (!user.isEmailVerified) {
                await prisma.user.update({
                    where: { email },
                    data: {
                        isEmailVerified: true,
                    }
                })
            }
        }

        if (!user?.id || !user?.role || !user?.tokenVersion) return res.status(400).json({ message: "User data is corrupted" });
        const accessToken = createAccessToken(user.id, user?.role, user?.tokenVersion);
        const refreshToken = createRefreshToken(user.id, user.tokenVersion);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Google login successfully",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            }
        })
    } catch (error) {
        console.log("Error in google auth callback\n", error);
        return res.status(500).json({ message: "Error in google auth callback handler" })
    }
}

export const discordAuthStartHandler = async (req: Request, res: Response) => {
    try {
        const url = process.env.DISCORD_REDIRECT_URI!;
        return res.redirect(url);
    } catch (error) {
        console.log("Error while authentication with discord\n", error);
        return res.status(500).json({ message: "Error in discord auth start handler" });
    }
}

export const discordAuthCallbackHandler = async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;

    if (!code) return res.status(400).send('No authorization code provided');
    try {
        const tokenParams = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI!
        });

        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            tokenParams.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, token_type } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token_type} ${access_token}`
            }
        });

        // const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
        //     headers: {
        //         authorization: `${token_type} ${access_token}`
        //     }
        // });

        const userData = userResponse.data as {
            id: string,
            username: string,
            avatar: string, discriminator: string,
            email: string,
            verified: boolean
        };
        // const userGuilds = guildsResponse.data;

        const { username, email, verified } = userData;
        if (!username) return res.status(400).json({ message: "Username is not provided by discord" })
        if (!email || !verified) return res.status(400).json({ message: "Discord account is not verified." });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomBytes, PASSWORD_SALT);
            await prisma.user.create({
                data: {
                    name: username,
                    email,
                    password: passwordHash,
                    role: 'user',
                    isEmailVerified: true,
                    twoFactorEnabled: false,
                }
            })
        } else {
            if (!user.isEmailVerified) {
                await prisma.user.update({
                    where: { email },
                    data: {
                        isEmailVerified: true,
                    }
                })
            }
        }

        if (!user?.id || !user?.role || !user?.tokenVersion) return res.status(400).json({ message: "User data is corrupted" });
        const accessToken = createAccessToken(user.id, user?.role, user?.tokenVersion);
        const refreshToken = createRefreshToken(user.id, user.tokenVersion);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Discord login successfully",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            }
        })
    } catch (error) {
        if (error instanceof AxiosError)
            console.error('Error during Discord OAuth:', error.response ? error.response.data : error.message);
        else console.error('Error during Discord OAuth:', error)
        return res.status(500).send('Authentication failed. Check your server console for details.');
    }
}

