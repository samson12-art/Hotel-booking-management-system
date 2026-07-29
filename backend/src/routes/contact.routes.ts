import { Router } from "express";
import { createContact, getHotelContacts, getAllContacts, markContactRead, deleteContact } from "../controllers/contact.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/", createContact);
router.get("/", authenticate, authorize("ADMIN"), getAllContacts);
router.get("/hotel/:hotelId", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), getHotelContacts);
router.put("/:id/read", authenticate, markContactRead);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteContact);

export default router;
