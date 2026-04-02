import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as partnerService from "../services/partnerService.js";

export const getAllPartners = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { city, isActive } = req.query;
    const isActiveVal = isActive !== undefined ? isActive === "true" : undefined;

    const partners = await partnerService.getAllPartnersService(city as string, isActiveVal);

    res.json({ success: true, partners });
  } catch (error: any) {
    console.error("Error fetching partners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch partners",
      error: error.message,
    });
  }
};

export const getPartnerById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const partner = await partnerService.getPartnerByIdService(id);

    res.json({ success: true, partner });
  } catch (error: any) {
    console.error("Error fetching partner:", error);
    const status = error.message === "Partner not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch partner",
      error: error.message,
    });
  }
};

export const createPartner = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, area, city, latitude, longitude, phone, timings } = req.body;

    if (!name || !area || !city || !latitude || !longitude || !phone || !timings) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const partner = await partnerService.createPartnerService(req.body);

    res.status(201).json({ success: true, message: "Partner created successfully", partner });
  } catch (error: any) {
    console.error("Error creating partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create partner",
      error: error.message,
    });
  }
};

export const createPartnerAccount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { businessName, ownerName, username, email, password, phone, city } = req.body;

    if (!businessName || !ownerName || !username || !email || !password || !phone || !city) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: businessName, ownerName, username, email, password, phone, city",
      });
      return;
    }

    const result = await partnerService.createPartnerAccountService(req.body);

    res.status(201).json({
      success: true,
      message: "Partner account created successfully",
      partner: result.partner,
      credentials: result.credentials,
    });
  } catch (error: any) {
    console.error("Error creating partner account:", error);
    const status = error.message === "Username or email already exists" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to create partner account",
      error: error.message,
    });
  }
};

export const updatePartner = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const partner = await partnerService.updatePartnerService(id, req.body);

    res.json({ success: true, message: "Partner updated successfully", partner });
  } catch (error: any) {
    console.error("Error updating partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update partner",
      error: error.message,
    });
  }
};

export const deletePartner = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    await partnerService.deletePartnerService(id);

    res.json({ success: true, message: "Partner deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete partner",
      error: error.message,
    });
  }
};

export const searchPartners = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ success: false, message: "Search query is required" });
      return;
    }

    const partners = await partnerService.searchPartnersService(query as string);

    res.json({ success: true, partners });
  } catch (error: any) {
    console.error("Error searching partners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search partners",
      error: error.message,
    });
  }
};
