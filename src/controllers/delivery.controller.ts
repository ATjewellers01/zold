import { cancelDeliveryService, completeDeliveryService, initiateDeliveryService, trackDeliveryService, trackPartnerAssignedDeliveryService, updatePartnerDeliveryInformationService, verifyDeliveryService } from "../services/delivery.service.js";
import { ApiError } from "../utils/error_class.js";

const handleError = (error: any, res: any) => {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false, message: error.message 
        });
    }
    return res.status(500).json({
        success: false, message: "Server error" 
    });
};

export const initiateDelivery = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await initiateDeliveryService(userId, req.body);
        return res.status(201).json({
            success: true, message: "Delivery initiated successfully", data: result 
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const cancelDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const userId = req.user.id;
        const result = await cancelDeliveryService(userId, deliveryId);
        return res.status(200).json({
            success: true, message: "Delivery cancelled successfully", data: result 
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const trackDelivery = async (req, res) => {
    try {
        const activeDelivery = await trackDeliveryService(req.user.id);
        return res.status(200).json({ 
            success: true, message: "Deliveries fetched successfully", data: activeDelivery 
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const trackPartnerAssignedDelivery = async (req, res) => {
    try {
        const result = await trackPartnerAssignedDeliveryService(req.user.id);
        return res.status(200).json({
            success: true, message: "Deliveries fetched successfully", data: result 
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const updatePartnerDeliveryInformation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deliveryId } = req.params;
        const { tentativeDate } = req.body;
        const result = await updatePartnerDeliveryInformationService(
            userId, deliveryId, tentativeDate
        );
        return res.status(200).json({
            success: true, message: "Delivery updated successfully", data: result 
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const completeDelivery = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deliveryId } = req.params;
        const result = await completeDeliveryService(userId, deliveryId);

        return res.status(200).json({
            success: true,
            message: "Delivery completed",
            data: result
        });
    }
    catch(error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export const verifyDelivery = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deliveryId } = req.params;
        const { enteredOtp } = req.body;
        const result = await verifyDeliveryService(userId, deliveryId, enteredOtp);

        return res.status(200).json({
            success: true,
            message: "Delivery verified successfully",
            data: {}
        });
    }
    catch(error: any) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};
