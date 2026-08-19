import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { execSync } = require("child_process");
    execSync("npx prisma db push --skip-generate", {
      cwd: process.cwd(),
      timeout: 30000,
    });
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error: any) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "avatar" TEXT,
          "balance" DOUBLE PRECISION NOT NULL DEFAULT 5000,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
          "mfaSecret" TEXT,
          "failedLogins" INTEGER NOT NULL DEFAULT 0,
          "lockedUntil" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Transaction" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "senderId" TEXT NOT NULL,
          "receiverId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "note" TEXT,
          "status" TEXT NOT NULL DEFAULT 'completed',
          "type" TEXT NOT NULL DEFAULT 'transfer',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("senderId") REFERENCES "User"("id"),
          FOREIGN KEY ("receiverId") REFERENCES "User"("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "userId" TEXT,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AuditLog" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "details" TEXT,
          "ip" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RecurringTransfer" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "senderId" TEXT NOT NULL,
          "receiverId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "note" TEXT,
          "frequency" TEXT NOT NULL,
          "nextExecDate" TIMESTAMP NOT NULL,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("senderId") REFERENCES "User"("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Deposit" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "stripeSessionId" TEXT UNIQUE,
          "stripePaymentId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Withdrawal" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "stripePayoutId" TEXT UNIQUE,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id")
        )
      `);

      // Add new columns if they don't exist
      const newColumns = [
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLogins" INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeOnboarding" BOOLEAN NOT NULL DEFAULT false`,
      ];

      for (const sql of newColumns) {
        try {
          await prisma.$executeRawUnsafe(sql);
        } catch (e: any) {
          // Column already exists
        }
      }

      return NextResponse.json({ success: true, message: "Database initialized via SQL" });
    } catch (sqlError: any) {
      return NextResponse.json({ error: sqlError.message }, { status: 500 });
    }
  }
}
