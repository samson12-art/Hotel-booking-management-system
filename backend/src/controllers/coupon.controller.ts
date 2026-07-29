import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { couponSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";

export const createCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const data = couponSchema.parse(req.body);
    const result = await query(
      `INSERT INTO coupons (id, code, description, "discountPercent", "maxDiscount", "minBookingAmount", "validFrom", "validUntil", "isActive", "usageLimit", "usedCount", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, $8, 0, NOW())
       RETURNING *`,
      [data.code, data.description || null, data.discountPercent, data.maxDiscount || null, data.minBookingAmount || null, new Date(data.validFrom), new Date(data.validUntil), data.usageLimit || null]
    );
    sendSuccess(res, "Coupon created", result.rows[0], 201);
  } catch (error: any) {
    if (error.name === "ZodError") return sendError(res, error.errors[0].message, 400);
    sendError(res, error.message, 500);
  }
};

export const getAllCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const coupons = await getMany(`SELECT * FROM coupons ORDER BY "createdAt" DESC`, []);
    sendSuccess(res, "Coupons retrieved", coupons);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, description, discountPercent, maxDiscount, minBookingAmount, validFrom, validUntil, isActive, usageLimit } = req.body;
    const coupon = await getOne(
      `UPDATE coupons SET
        code = COALESCE($1, code),
        description = COALESCE($2, description),
        "discountPercent" = COALESCE($3, "discountPercent"),
        "maxDiscount" = COALESCE($4, "maxDiscount"),
        "minBookingAmount" = COALESCE($5, "minBookingAmount"),
        "validFrom" = COALESCE($6, "validFrom"),
        "validUntil" = COALESCE($7, "validUntil"),
        "isActive" = COALESCE($8, "isActive"),
        "usageLimit" = COALESCE($9, "usageLimit")
       WHERE id = $10 RETURNING *`,
      [code, description, discountPercent, maxDiscount, minBookingAmount, validFrom ? new Date(validFrom) : null, validUntil ? new Date(validUntil) : null, isActive, usageLimit, req.params.id]
    );
    sendSuccess(res, "Coupon updated", coupon);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM coupons WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Coupon deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, bookingAmount } = req.body;
    const coupon = await getOne(
      `SELECT * FROM coupons
       WHERE code = $1 AND "isActive" = true
         AND "validFrom" <= NOW() AND "validUntil" >= NOW()`,
      [code.toUpperCase()]
    );

    if (!coupon) return sendError(res, "Invalid or expired coupon.", 400);
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return sendError(res, "Coupon usage limit reached.", 400);
    }
    if (coupon.minBookingAmount && bookingAmount < coupon.minBookingAmount) {
      return sendError(res, `Minimum booking amount is $${coupon.minBookingAmount}.`, 400);
    }

    let discount = (bookingAmount * coupon.discountPercent) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    sendSuccess(res, "Coupon valid", { discount, finalAmount: bookingAmount - discount });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
