import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createToken, cookieOptions } from "@/lib/auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, token } = await request.json();

    if (action === "enable") {
      // Generate new secret
      const secret = speakeasy.generateSecret({
        name: `Apex Bank (${session.email})`,
        issuer: "Apex Bank",
      });

      // Store secret temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: session.userId },
        data: { mfaSecret: secret.base32 },
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return NextResponse.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
      });
    }

    if (action === "verify") {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user?.mfaSecret) {
        return NextResponse.json({ error: "MFA not set up" }, { status: 400 });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token,
        window: 1,
      });

      if (!verified) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }

      // Enable MFA
      await prisma.user.update({
        where: { id: session.userId },
        data: { mfaEnabled: true },
      });

      return NextResponse.json({ success: true, message: "MFA enabled" });
    }

    if (action === "disable") {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user?.mfaSecret) {
        return NextResponse.json({ error: "MFA not set up" }, { status: 400 });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token,
        window: 1,
      });

      if (!verified) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: session.userId },
        data: { mfaEnabled: false, mfaSecret: null },
      });

      return NextResponse.json({ success: true, message: "MFA disabled" });
    }

    if (action === "login-verify") {
      // Verify MFA during login (uses the pending cookie)
      const cookieStore = await import("next/headers").then((m) => m.cookies());
      const mfaToken = cookieStore.get("apex-mfa-pending")?.value;

      if (!mfaToken) {
        return NextResponse.json({ error: "MFA session expired" }, { status: 400 });
      }

      const { verifyToken } = await import("@/lib/auth");
      const payload = await verifyToken(mfaToken);
      if (!payload) {
        return NextResponse.json({ error: "Invalid MFA session" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user?.mfaSecret) {
        return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token,
        window: 1,
      });

      if (!verified) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 400 });
      }

      // Issue full session token
      const fullToken = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        balance: user.balance,
      });

      const { password: _, ...userWithoutPassword } = user;
      const response = NextResponse.json({ user: userWithoutPassword });
      response.cookies.set("apex-token", fullToken, cookieOptions());
      response.cookies.set("apex-mfa-pending", "", cookieOptions(0));
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("MFA error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
