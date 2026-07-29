import { Response } from "express";
import { ApiResponse } from "../types";

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200, pagination?: any) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  if (pagination) {
    response.pagination = pagination;
  }
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 500) => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return res.status(statusCode).json(response);
};
