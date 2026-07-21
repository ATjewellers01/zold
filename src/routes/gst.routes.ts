import { Router } from "express";
import { getGstRate } from "../controllers/gst.controller.js";

const router = Router();

router.get("/gst", getGstRate);

export default router;
