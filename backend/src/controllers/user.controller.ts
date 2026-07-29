import { Response } from "express";
import bcrypt from "bcryptjs";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await getOne(
      `UPDATE users SET "firstName" = $1, "lastName" = $2, phone = $3, "updatedAt" = NOW()
       WHERE id = $4
       RETURNING id, email, "firstName", "lastName", phone, "profilePicture", role`,
      [firstName, lastName, phone, req.user!.id]
    );
    sendSuccess(res, "Profile updated", user);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, "Current and new password are required.", 400);
    }

    const user = await getOne(`SELECT password FROM users WHERE id = $1`, [req.user!.id]);
    if (!user) return sendError(res, "User not found.", 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return sendError(res, "Current password is incorrect.", 401);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query(`UPDATE users SET password = $1, "updatedAt" = NOW() WHERE id = $2`, [hashedPassword, req.user!.id]);

    sendSuccess(res, "Password updated successfully.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return sendError(res, "No file uploaded.", 400);

    const profilePicture = `/uploads/profiles/${req.file.filename}`;
    const user = await getOne(
      `UPDATE users SET "profilePicture" = $1, "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, email, "firstName", "lastName", "profilePicture"`,
      [profilePicture, req.user!.id]
    );
    sendSuccess(res, "Profile picture updated", user);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const role = req.query.role as string;
    const search = req.query.search as string;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      params.push(role);
    }
    if (search) {
      conditions.push(`("firstName" ILIKE $${paramIndex} OR "lastName" ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await getOne(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const users = await getMany(
      `SELECT id, email, "firstName", "lastName", phone, role, "isVerified", "createdAt"
       FROM users ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    sendSuccess(res, "Users retrieved", users, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne(
      `SELECT id, email, "firstName", "lastName", phone, role, "isVerified", "createdAt"
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!user) return sendError(res, "User not found.", 404);

    const counts = await getOne(
      `SELECT
        (SELECT COUNT(*) FROM bookings WHERE "userId" = $1) as "bookingCount",
        (SELECT COUNT(*) FROM reviews WHERE "userId" = $1) as "reviewCount"`,
      [req.params.id]
    );

    sendSuccess(res, "User retrieved", { ...user, _count: { bookings: parseInt(counts.bookingCount), reviews: parseInt(counts.reviewCount) } });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!role) return sendError(res, "Role is required.", 400);

    const user = await getOne(
      `UPDATE users SET role = $1, "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, email, "firstName", "lastName", role`,
      [role, req.params.id]
    );
    sendSuccess(res, "User role updated", user);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "User deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
