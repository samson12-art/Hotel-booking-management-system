import { Response } from "express";
import { getMany, getOne, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export const getTranslations = async (req: AuthRequest, res: Response) => {
  try {
    const locale = req.query.locale as string || "en";
    const translations = await getMany(
      `SELECT key, value FROM translations WHERE locale = $1`,
      [locale]
    );
    const result: Record<string, string> = {};
    translations.forEach((t: any) => { result[t.key] = t.value; });

    sendSuccess(res, "Translations retrieved", result);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getSupportedLocales = async (req: AuthRequest, res: Response) => {
  try {
    const locales = await getMany(
      `SELECT locale, COUNT(*) as count FROM translations GROUP BY locale`,
      []
    );
    sendSuccess(res, "Supported locales", locales.map((l: any) => ({ locale: l.locale, count: parseInt(l.count) })));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const createTranslation = async (req: AuthRequest, res: Response) => {
  try {
    const { locale, key, value } = req.body;
    if (!locale || !key || !value) return sendError(res, "Locale, key, and value required.", 400);

    await query(
      `INSERT INTO translations (id, locale, key, value, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW())
       ON CONFLICT (locale, key) DO UPDATE SET value = $3, "updatedAt" = NOW()`,
      [locale, key, value]
    );

    sendSuccess(res, "Translation saved.", null, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
