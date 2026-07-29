import { Response } from "express";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getRecommendations, generateRecommendations } from "../services/recommendation";

export const getMyRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await getRecommendations(req.user!.id);
    sendSuccess(res, "Recommendations retrieved", recommendations);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const refreshRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await generateRecommendations(req.user!.id);
    sendSuccess(res, "Recommendations refreshed", recommendations);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
