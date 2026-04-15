import { createSipService, getSipService } from "../services/sip.service.js"

export const createSip = async (req, res) => {
    try {
        const { name, type, metal } = req.body;
        const sip = await createSipService(name, type, metal);
        return res.status(201).json({
            success: true,
            message: "SIP created successfully",
            data: sip
        });
    }
    catch(error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};

export const getSip = async (req, res) => {
    try {
        const sip = await getSipService();
        return res.status(200).json({
            success: true,
            message: "SIP fetched successfully",
            data: sip
        })
    }
    catch(error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};