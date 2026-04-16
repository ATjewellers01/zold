import { createSipService, createSipRzpOrder, getSipService, verifySipTransaction, activeSipService } from "../services/sip.service.js"

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

export const createSipOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sipId, name, metal, amount, day_of_month } = req.body;
        const order = await createSipRzpOrder(userId, sipId, name, metal, amount, day_of_month);
        return res.status(200).json({
            success: true,
            message: "SIP order created successfully",
            data: order
        });
    }
    catch(error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};

export const verifySip = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sipId, orderId, paymentId, signature, sipDetails, orderDetails } = req.body;
        const result = await verifySipTransaction(userId, sipId, orderId, paymentId, signature, sipDetails, orderDetails);
        return res.status(200).json({
            success: true,
            message: "SIP transaction verified",
            data: result
        });
    }
    catch(error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};

export const activeSip = async (req, res) => {
    try {
        const result = await activeSipService(req.user.id);
        return res.status(200).json({
            success: true,
            message: "User's active sip fetched successfully",
            data: result
        });
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};