import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import * as bankService from "../services/bankService";

export const getBankAccounts = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const accounts = await bankService.getUserBankAccounts(userId);

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error("Error getting bank accounts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bank accounts",
      error: error.message,
    });
  }
};

export const addBankAccount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const account = await bankService.addBankAccount(userId, req.body);

    res.json({
      success: true,
      message: "Bank account added successfully",
      data: account,
    });
  } catch (error: any) {
    console.error("Error adding bank account:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add bank account",
      error: error.message,
    });
  }
};

export const updateBankAccount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updated = await bankService.updateBankAccount(id, userId, req.body);

    res.json({
      success: true,
      message: "Bank account updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating bank account:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update bank account",
      error: error.message,
    });
  }
};

export const deleteBankAccount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await bankService.deleteBankAccount(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting bank account:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete bank account",
      error: error.message,
    });
  }
};

export const setPrimaryAccount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await bankService.setPrimaryBankAccount(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error setting primary account:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to set primary account",
      error: error.message,
    });
  }
};
