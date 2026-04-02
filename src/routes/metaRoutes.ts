import { Router } from "express";
import { getGstRate } from "../controllers/gstController";

const router = Router();

// GET /meta/gst - Public endpoint for current GST rate
router.get("/gst", getGstRate);

export default router;
