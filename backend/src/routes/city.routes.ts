import { Router } from "express";
import { createCity, getAllCities, deleteCity, createCountry, getAllCountries } from "../controllers/city.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/countries", getAllCountries);
router.post("/countries", authenticate, authorize("ADMIN"), createCountry);
router.get("/cities", getAllCities);
router.post("/cities", authenticate, authorize("ADMIN"), createCity);
router.delete("/cities/:id", authenticate, authorize("ADMIN"), deleteCity);

export default router;
