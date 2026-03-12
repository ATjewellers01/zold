import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import * as paymentService from "../services/paymentService";

export const getPaymentMethods = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const methods = await paymentService.getUserPaymentMethods(userId);

    res.json({
      success: true,
      data: methods,
    });
  } catch (error: any) {
    console.error("Error getting payment methods:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment methods",
      error: error.message,
    });
  }
};

export const addPaymentMethod = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const method = await paymentService.addPaymentMethod(userId, req.body);

    res.json({
      success: true,
      message: "Payment method added successfully",
      data: method,
    });
  } catch (error: any) {
    console.error("Error adding payment method:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add payment method",
      error: error.message,
    });
  }
};

export const updatePaymentMethod = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updated = await paymentService.updatePaymentMethod(
      id,
      userId,
      req.body,
    );

    res.json({
      success: true,
      message: "Payment method updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating payment method:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update payment method",
      error: error.message,
    });
  }
};

export const deletePaymentMethod = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await paymentService.deletePaymentMethod(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete payment method",
      error: error.message,
    });
  }
};

export const setPrimaryMethod = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await paymentService.setPrimaryPaymentMethod(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error setting primary method:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to set primary method",
      error: error.message,
    });
  }
};
