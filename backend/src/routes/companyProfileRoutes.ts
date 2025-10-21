import { Router } from "express";
import { analyze, getProfileById, listProfiles, updateProfileById } from "../controllers/companyProfileController.js";

const router = Router();

router.post("/analyze", analyze);
router.get("/profiles", listProfiles);
router.get("/profiles/:id", getProfileById);
router.put("/profiles/:id", updateProfileById);

export default router;
