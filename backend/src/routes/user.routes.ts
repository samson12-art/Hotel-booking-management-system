import { Router } from "express";
import { updateProfile, updatePassword, uploadProfilePicture, getAllUsers, getUserById, updateUserRole, deleteUser } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";
import { uploadProfileImage } from "../middleware/upload";

const router = Router();

router.get("/me", authenticate, (req: any, res: any) => {
  const { getMe } = require("../controllers/auth.controller");
  getMe(req, res);
});
router.put("/profile", authenticate, updateProfile);
router.put("/password", authenticate, updatePassword);
router.post("/profile-picture", authenticate, uploadProfileImage.single("profile"), uploadProfilePicture);
router.get("/", authenticate, authorize("ADMIN"), getAllUsers);
router.get("/:id", authenticate, authorize("ADMIN"), getUserById);
router.put("/:id/role", authenticate, authorize("ADMIN"), updateUserRole);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteUser);

export default router;
