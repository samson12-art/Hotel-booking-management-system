import { query } from "../config/database";

interface SmsPayload {
  to: string;
  message: string;
  userId: string;
}

export const sendSmsSimulation = async (payload: SmsPayload): Promise<void> => {
  const smsId = `SMS-${Date.now().toString(36).toUpperCase()}`;

  console.log(`[SMS SIMULATION] To: ${payload.to}`);
  console.log(`[SMS SIMULATION] Message: ${payload.message}`);
  console.log(`[SMS SIMULATION] SMS ID: ${smsId}`);
  console.log(`[SMS SIMULATION] Status: DELIVERED (simulated)`);

  await query(
    `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())`,
    ["SMS Simulation", `[SMS to ${payload.to}]: ${payload.message}`, "GENERAL", payload.userId]
  );
};
