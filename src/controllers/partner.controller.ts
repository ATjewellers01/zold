import { addParterDetailsService, registerPartnerService } from "../services/partner.service.js";

export const registerPartner = async (req, res) => {
    try {
        const { name, username, email, password, phone } = req.body;
        if (!name || !username || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Required fields cannot be empty"
            });
        }
        const result = await registerPartnerService(name, username, email, password, phone);
        const { password: _, ...safeField } = result;
        return res.status(201).json({
            success: true,
            message: "Partner registered successfully",
            data: safeField
        });
    }
    catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};

export const addParterDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            businessName,
            ownerName,
            servicesOffers,
            area,
            city,
            fullAddress,
            pincode,
            timings,
            latitude,
            longitude
        } = req.body;

        const result = await addParterDetailsService(
            userId,
            businessName,
            ownerName,
            servicesOffers,
            area,
            city,
            fullAddress,
            pincode,
            timings,
            latitude,
            longitude
        );

        return res.status(201).json({
            success: true,
            message: "Partner details added successfully",
            data: result
        });
    }
    catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};