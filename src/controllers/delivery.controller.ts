import { initiateDeliveryService, trackDeliveryService, trackPartnerAssignedDeliveryService, updatePartnerDeliveryInformationService } from "../services/delivery.service.js";

export const initiateDelivery = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await initiateDeliveryService(userId, req.body);
        return res.status(201).json({
            success: true,
            message: "Delivery initiated successfully",
            data: result
        });
    }
    catch(error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error"
        }); 
    }
};

export const trackDelivery = async (req, res) => {
    try {
        const activeDelivery = await trackDeliveryService(req.user.id);
        return res.status(200).json({
            success: true,
            message: "Deliveries fetched successfully",
            data: activeDelivery
        });
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const trackPartnerAssignedDelivery = async (req, res) => {
    try {
        const result = await trackPartnerAssignedDeliveryService(req.user.id);
        return res.status(200).json({
            success: true,
            message: "Deliveries fetched successfully",
            data: result
        }); 
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const updatePartnerDeliveryInformation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deliveryId } = req.params;
        const { tentativeDate } = req.body;

        const result = await updatePartnerDeliveryInformationService(
            userId, 
            deliveryId, 
            tentativeDate
        );

        return res.status(200).json({
            success: true,
            message: "Delivery update successfully",
            data: result
        }); 
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};