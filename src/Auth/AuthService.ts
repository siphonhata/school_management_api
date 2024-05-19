import { PrismaClient } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import { env } from "process";
import { prisma } from "../app.js";
import jwt from 'jsonwebtoken';

export class AuthService {
    static #verifyToken = async (token: string): Promise<JwtPayload | void> => {
        try {
            return jwt.verify(token, env.ACCESS_TOKEN_SECRET, async (err: any, decoded: any) => {
                if (err) {
                    return null;
                }
                const { id } = decoded;
                const u = await prisma.users.findUnique({
                    where: { id }
                });
                return u;
            });
        } catch (error) {
            console.log("Error", error);
            return null;
        }
    };

    static isAuthenticated = async (authorization: any) => {
        try {
            const tk = authorization ? authorization.split("Bearer ")[1] : null
            if (!tk) return null;
            return await this.#verifyToken(tk)
        } catch (error) {
            return null;
        }
    };
}










