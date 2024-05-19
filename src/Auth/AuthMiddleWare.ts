import { env } from "process";
import { AuthService } from "./AuthService.js";


const authMiddleware = async (req: any, res: any, next: any) => {
    const token = env.TOKEN;
    if (!token) {
        req.user = null;
    } else {
        try {
            const user = await AuthService.isAuthenticated(token);
            req.user = user;
        } catch (error) {
            console.error('Authentication error:', error);
            req.user = null;
        }
    }

    next();
};


export default authMiddleware;