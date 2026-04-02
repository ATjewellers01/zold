import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import prisma from "../config/db";

export const validateMetalPurchaseSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const sessionId = req.body?.sessionId || req.params?.sessionId || req.query?.sessionId;
    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session id is required"
        });
    }

    try {
        const session = await prisma.metalPurchaseSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Invalid session Id"
            });
        }

        if (session.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: `Session is already ${session.status.toLowerCase()}`
            });
        }

        if (new Date() > session.expires_at) {
            return res.status(403).json({
                success: false,
                message: "Session expired, create a new one"
            });
        }

        req.metalPurchaseSession = session;
        next();
    }
    catch (error) {
        console.error("Session validation error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};
