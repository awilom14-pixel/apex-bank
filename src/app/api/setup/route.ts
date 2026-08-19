import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Push schema to create tables
    const { execSync } = require("child_process");
    execSync("npx prisma db push --skip-generate", {
      cwd: process.cwd(),
      timeout: 30000,
    });

    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error: any) {
    // If prisma push fails (e.g. in serverless), try raw SQL
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "avatar" TEXT,
          "balance" REAL NOT NULL DEFAULT 5000,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Transaction" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "senderId" TEXT NOT NULL,
          "receiverId" TEXT NOT NULL,
          "amount" REAL NOT NULL,
          "note" TEXT,
          "status" TEXT NOT NULL DEFAULT 'completed',
          "type" TEXT NOT NULL DEFAULT 'transfer',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("senderId") REFERENCES "User"("id"),
          FOREIGN KEY ("receiverId") REFERENCES "User"("id")
        )
      `);

      return NextResponse.json({ success: true, message: "Database initialized via SQL" });
    } catch (sqlError: any) {
      return NextResponse.json({ error: sqlError.message }, { status: 500 });
    }
  }
}
