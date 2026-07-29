import { Router } from "express";
import { addFavorite, removeFavorite, getMyFavorites } from "../controllers/favorite.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getMyFavorites);
router.post("/", authenticate, addFavorite);
router.delete("/:hotelId", authenticate, removeFavorite);

export default router;
