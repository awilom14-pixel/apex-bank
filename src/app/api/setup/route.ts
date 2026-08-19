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

      // Add isAdmin column if it doesn't exist
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false
        `);
      } catch (e: any) {
        // Column already exists — ignore
      }

      return NextResponse.json({ success: true, message: "Database initialized via SQL" });
    } catch (sqlError: any) {
      return NextResponse.json({ error: sqlError.message }, { status: 500 });
    }
  }
}
