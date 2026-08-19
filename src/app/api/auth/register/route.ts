import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

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
      // Notification table may not exist yet — non-critical
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { email, password, mode } = await request.json();

    if (mode === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password required" },
          { status: 400 }
        );
      }

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

      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({ user: userWithoutPassword });
    }

    // Update profile
    const { userId, name, avatar } = await request.json();
    if (userId) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { ...(name && { name }), ...(avatar && { avatar }) },
      });
      const { password: _, ...userWithoutPassword } = updated;
      return NextResponse.json({ user: userWithoutPassword });
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
