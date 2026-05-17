import { PrismaClient } from "../../generated/prisma/client.js";

declare global {
    namespace globalThis {
        var prismadb: PrismaClient | undefined;
    }
};


const prisma = globalThis.prismadb || new PrismaClient();

if(process.env.NODE_ENV === "production") globalThis.prismadb = prisma;

export default prisma;
export {};
