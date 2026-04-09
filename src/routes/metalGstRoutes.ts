import { Router } from "express";
import { getGstRate } from "../controllers/gstController.js";

const router = Router();

router.get("/gst", getGstRate);

export default router;
