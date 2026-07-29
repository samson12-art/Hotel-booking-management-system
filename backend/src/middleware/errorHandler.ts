import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "File too large. Maximum size is 5MB.", 400);
    }
    return sendError(res, err.message, 400);
  }

  if (err.message === "Only image files are allowed") {
    return sendError(res, err.message, 400);
  }

  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return sendError(res, `A record with this ${field} already exists.`, 409);
  }

  if (err.code === "P2025") {
    return sendError(res, "Record not found.", 404);
  }

  return sendError(res, err.message || "Internal server error", err.statusCode || 500);
};

export const notFound = (req: Request, res: Response) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};
