import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { transferSchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`transfer:${session.userId}`, 10, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many transfers. Wait a minute." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { senderId, receiverId, amount, note } = parsed.data;

    if (senderId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized sender" }, { status: 403 });
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    if (sender.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          senderId,
          receiverId,
          amount,
          note: note || null,
          status: "completed",
          type: "transfer",
        },
      }),
      prisma.user.update({
        where: { id: senderId },
        data: { balance: { decrement: amount } },
      }),
      prisma.user.update({
        where: { id: receiverId },
        data: { balance: { increment: amount } },
      }),
    ]);

    const updatedSender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, name: true, email: true, balance: true, avatar: true },
    });

    await auditLog(senderId, "TRANSFER", `$${amount.toFixed(2)} sent to ${receiver.name} (${receiver.email})`, request);

    return NextResponse.json({
      transaction,
      sender: updatedSender,
      message: `Successfully transferred $${amount.toFixed(2)} to ${receiver.name}`,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
      },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
