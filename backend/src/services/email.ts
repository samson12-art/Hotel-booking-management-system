import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const isSmtpConfigured = smtpUser && smtpPass && smtpUser !== "your-email@gmail.com";

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

const from = `"${process.env.FROM_NAME || "Hotel Booking System"}" <${process.env.FROM_EMAIL || "noreply@hotelbooking.com"}>`;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const logOrSend = async (to: string, subject: string, html: string, logFallback: string) => {
  if (transporter) {
    try {
      await transporter.sendMail({ from, to, subject, html });
    } catch (err) {
      console.error(`[Email] Failed to send "${subject}" to ${to}:`, err);
    }
  } else {
    console.log(`[Email] ${logFallback}`);
  }
};

export const sendVerificationEmail = async (email: string, token: string, firstName: string) => {
  const link = `${frontendUrl}/auth/verify-email?token=${token}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>Welcome, ${firstName}!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a>
    <p style="margin-top:20px;font-size:13px;color:#666">This link expires in 24 hours.</p>
  </div>`;
  await logOrSend(email, "Verify your email address", html, `Verification email for ${email}:\n  ${link}`);
};

export const sendPasswordResetEmail = async (email: string, token: string, firstName: string) => {
  const link = `${frontendUrl}/auth/reset-password?token=${token}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>Hi ${firstName},</h2>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a>
    <p style="margin-top:20px;font-size:13px;color:#666">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  </div>`;
  await logOrSend(email, "Reset your password", html, `Password reset email for ${email}:\n  ${link}`);
};

export const sendBookingConfirmationEmail = async (
  email: string,
  firstName: string,
  bookingNumber: string,
  hotelName: string,
  checkIn: string,
  checkOut: string,
  totalAmount: number
) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>Booking Confirmed!</h2>
    <p>Thank you, ${firstName}!</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700">Booking #</td><td style="padding:8px;border:1px solid #ddd">${bookingNumber}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700">Hotel</td><td style="padding:8px;border:1px solid #ddd">${hotelName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700">Check-in</td><td style="padding:8px;border:1px solid #ddd">${new Date(checkIn).toLocaleDateString()}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700">Check-out</td><td style="padding:8px;border:1px solid #ddd">${new Date(checkOut).toLocaleDateString()}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700">Total</td><td style="padding:8px;border:1px solid #ddd">$${totalAmount.toFixed(2)}</td></tr>
    </table>
    <p>View your booking: <a href="${frontendUrl}/bookings/${bookingNumber}">${frontendUrl}/bookings/${bookingNumber}</a></p>
  </div>`;
  await logOrSend(email, `Booking Confirmed - ${bookingNumber}`, html, `Booking confirmation for ${email} (${bookingNumber}): ${hotelName}`);
};

export const sendCheckInReminderEmail = async (email: string, firstName: string, bookingNumber: string, hotelName: string, checkIn: string) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>Check-in Reminder</h2>
    <p>Hi ${firstName},</p>
    <p>This is a reminder that your check-in at <strong>${hotelName}</strong> is <strong>tomorrow</strong> (${new Date(checkIn).toLocaleDateString()}).</p>
    <p>Booking #: ${bookingNumber}</p>
    <p>We look forward to welcoming you!</p>
  </div>`;
  await logOrSend(email, `Reminder: Check-in tomorrow - ${bookingNumber}`, html, `Check-in reminder for ${email} (${bookingNumber}): ${hotelName}`);
};
