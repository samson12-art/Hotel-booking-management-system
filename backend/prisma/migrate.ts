import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migration...");

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT`);
    console.log("  + Added idDocumentUrl to users");

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "idVerificationStatus" TEXT DEFAULT 'NONE'`);
    console.log("  + Added idVerificationStatus to users");

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "idVerificationNote" TEXT`);
    console.log("  + Added idVerificationNote to users");

    await client.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "fileUrl" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "paymentMethod" TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        note TEXT,
        "verifiedBy" TEXT,
        "userId" TEXT NOT NULL,
        "bookingId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);
    console.log("  + Created receipts table");

    await client.query(`ALTER TABLE receipts ADD CONSTRAINT "receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`);
    console.log("  + Added userId foreign key");

    await client.query(`ALTER TABLE receipts ADD CONSTRAINT "receipts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE`);
    console.log("  + Added bookingId foreign key");

    await client.query(`CREATE INDEX IF NOT EXISTS "receipts_userId_idx" ON receipts("userId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "receipts_bookingId_idx" ON receipts("bookingId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "receipts_status_idx" ON receipts(status)`);
    console.log("  + Created indexes");

    console.log("\nMigration completed successfully!");
  } catch (error: any) {
    if (error.code === "42701") {
      console.log("Column already exists, skipping...");
    } else {
      console.error("Migration error:", error.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
