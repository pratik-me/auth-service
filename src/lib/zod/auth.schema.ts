import {z} from "zod";
import { ROLES } from "../../config/consts.js";

export const registerSchema = z.object({
    name: z.string(),
    password: z.string().min(6),
    email: z.email(),
    role: z.enum(ROLES),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
})