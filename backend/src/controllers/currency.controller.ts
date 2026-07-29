import { Response } from "express";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getCurrencies, convertAmount } from "../services/currency";

export const listCurrencies = async (req: AuthRequest, res: Response) => {
  try {
    const currencies = await getCurrencies();
    sendSuccess(res, "Currencies retrieved", currencies);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const convertCurrency = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, to } = req.body;
    if (!amount || !to) return sendError(res, "Amount and target currency required.", 400);

    const result = await convertAmount(amount, to.toUpperCase());
    sendSuccess(res, "Currency converted", result);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
