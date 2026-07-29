import { Router } from "express";
import { listCurrencies, convertCurrency } from "../controllers/currency.controller";

const router = Router();

router.get("/", listCurrencies);
router.post("/convert", convertCurrency);

export default router;
