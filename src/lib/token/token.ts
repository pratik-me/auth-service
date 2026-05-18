import jwt from "jsonwebtoken";

export const createAccessToken = (userId: string, role: string, tokenVersion: number) => {
    const payload = { id: userId, role, tokenVersion };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "30m" });
}

export const createRefreshToken = (userId: string, tokenVersion: number) => {
    const payload = {id: userId, tokenVersion};
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: "7d",
    });
}

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        id: string,
        tokenVersion: number,
    };
}