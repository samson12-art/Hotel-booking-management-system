import { Response } from "express";
import { getMany } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getLoyaltyInfo, redeemPoints } from "../services/loyalty";

export const getMyLoyalty = async (req: AuthRequest, res: Response) => {
  try {
    const info = await getLoyaltyInfo(req.user!.id);
    sendSuccess(res, "Loyalty info retrieved", info);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getLoyaltyTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await getMany(
      `SELECT * FROM loyalty_transactions WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [req.user!.id]
    );
    sendSuccess(res, "Transactions retrieved", transactions);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const redeemLoyaltyPoints = async (req: AuthRequest, res: Response) => {
  try {
    const { points } = req.body;
    if (!points || points < 50) return sendError(res, "Minimum 50 points required.", 400);

    const success = await redeemPoints(req.user!.id, points);
    if (!success) return sendError(res, "Insufficient points.", 400);

    sendSuccess(res, "Points redeemed successfully.", { redeemed: points });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
