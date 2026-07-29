import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import dns from "dns";
import util from "util";
import { getOne, query } from "../config/database";
import { registerSchema, loginSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email";

const resolveMx = util.promisify(dns.resolveMx);

const checkEmailDomain = async (email: string): Promise<boolean> => {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const mxRecords = await resolveMx(domain);
    return mxRecords.length > 0;
  } catch {
    return false;
  }
};

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: 60 * 60 * 24 * 7,
  } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await getOne(`SELECT id FROM users WHERE email = $1`, [data.email]);
    if (existingUser) {
      return sendError(res, "Email already registered.", 409);
    }

    const domainValid = await checkEmailDomain(data.email);
    if (!domainValid) {
      return sendError(res, "Email domain does not appear to be valid.", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verificationToken = uuidv4();

    const result = await query(
      `INSERT INTO users (id, email, password, "firstName", "lastName", phone, "verificationToken", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", role`,
      [data.email, hashedPassword, data.firstName, data.lastName, data.phone || null, verificationToken]
    );
    const user = result.rows[0];

    const token = generateToken(user);

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Welcome!", `Welcome to Hotel Booking System, ${user.firstName}! Please verify your email to get full access.`, "REGISTRATION", user.id]
    );

    sendVerificationEmail(data.email, verificationToken, data.firstName);

    sendSuccess(res, "Registration successful. Please verify your email.", { user, token }, 201);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, error.errors[0].message, 400);
    }
    sendError(res, error.message, 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await getOne(`SELECT * FROM users WHERE email = $1`, [data.email]);
    if (!user) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const token = generateToken(user);

    sendSuccess(res, "Login successful", {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, error.errors[0].message, 400);
    }
    sendError(res, error.message, 500);
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, "Verification token is required.", 400);

    const user = await getOne(`SELECT id, email FROM users WHERE "verificationToken" = $1`, [token]);
    if (!user) return sendError(res, "Invalid or expired verification token.", 400);

    await query(
      `UPDATE users SET "isVerified" = true, "verificationToken" = NULL, "updatedAt" = NOW() WHERE id = $1`,
      [user.id]
    );

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Email Verified", "Your email has been successfully verified!", "GENERAL", user.id]
    );

    sendSuccess(res, "Email verified successfully.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const resendVerification = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne(
      `SELECT id, email, "firstName", "isVerified" FROM users WHERE id = $1`,
      [req.user!.id]
    );
    if (!user) return sendError(res, "User not found.", 404);
    if (user.isVerified) return sendError(res, "Email is already verified.", 400);

    const domainValid = await checkEmailDomain(user.email);
    if (!domainValid) {
      return sendError(res, "Email domain does not appear to be valid.", 400);
    }

    const newToken = uuidv4();
    await query(
      `UPDATE users SET "verificationToken" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [newToken, user.id]
    );

    sendVerificationEmail(user.email, newToken, user.firstName);
    sendSuccess(res, "Verification email resent.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, "Email is required.", 400);

    const user = await getOne(`SELECT id, "firstName" FROM users WHERE email = $1`, [email]);
    if (!user) {
      return sendSuccess(res, "If the email exists, a reset link has been sent.");
    }

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
    await query(
      `UPDATE users SET "resetPasswordToken" = $1, "resetPasswordExpire" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [resetToken, new Date(Date.now() + 3600000), user.id]
    );

    sendPasswordResetEmail(email, resetToken, user.firstName);

    sendSuccess(res, "If the email exists, a reset link has been sent.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return sendError(res, "Token and password are required.", 400);

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await getOne(
      `SELECT id FROM users WHERE id = $1 AND "resetPasswordToken" = $2 AND "resetPasswordExpire" > NOW()`,
      [decoded.id, token]
    );

    if (!user) {
      return sendError(res, "Invalid or expired reset token.", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await query(
      `UPDATE users SET password = $1, "resetPasswordToken" = NULL, "resetPasswordExpire" = NULL, "updatedAt" = NOW() WHERE id = $2`,
      [hashedPassword, user.id]
    );

    sendSuccess(res, "Password reset successful.");
  } catch (error: any) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid or expired reset token.", 400);
    }
    sendError(res, error.message, 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne(
      `SELECT id, email, "firstName", "lastName", phone, "profilePicture", role, "isVerified", "createdAt"
       FROM users WHERE id = $1`,
      [req.user!.id]
    );
    sendSuccess(res, "Profile retrieved", user);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
