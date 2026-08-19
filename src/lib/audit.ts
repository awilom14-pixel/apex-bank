import { prisma } from "./db";

export async function auditLog(
  userId: string,
  action: string,
  details?: string,
  request?: Request
) {
  try {
    const ip = request?.headers?.get("x-forwarded-for") || request?.headers?.get("x-real-ip") || "unknown";
    const userAgent = request?.headers?.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details || null,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
