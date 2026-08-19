import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken, cookieOptions } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit("register", 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        balance: 5000,
        isAdmin: userCount === 0,
      },
    });

    // Create admin notification
    try {
      await prisma.notification.create({
        data: {
          type: "signup",
          title: "New User Registered",
          message: `${name} (${email}) just created an account with $5,000 starting balance.`,
          userId: user.id,
        },
      });
    } catch (e) {
      // Notification table may not exist yet
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      balance: user.balance,
    });

    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    response.cookies.set("apex-token", token, cookieOptions());
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const rl = rateLimit("auth", 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  try {
    const body = await request.json();

    if (body.mode === "login") {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        balance: user.balance,
      });

      const { password: _, ...userWithoutPassword } = user;
      const response = NextResponse.json({ user: userWithoutPassword });
      response.cookies.set("apex-token", token, cookieOptions());
      return response;
    }

    // Update profile
    const { userId, name, avatar } = body;
    if (userId) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { ...(name && { name }), ...(avatar && { avatar }) },
      });

      // Issue new token with updated info
      const token = await createToken({
        userId: updated.id,
        email: updated.email,
        name: updated.name,
        isAdmin: updated.isAdmin,
        balance: updated.balance,
      });

      const { password: _, ...userWithoutPassword } = updated;
      const response = NextResponse.json({ user: userWithoutPassword });
      response.cookies.set("apex-token", token, cookieOptions());
      return response;
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("apex-token", "", cookieOptions(0));
  return response;
}
