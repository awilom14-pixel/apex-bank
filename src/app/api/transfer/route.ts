import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { senderId, receiverId, amount, note } = await request.json();

    if (!senderId || !receiverId || !amount) {
      return NextResponse.json(
        { error: "Sender, receiver, and amount are required" },
        { status: 400 }
      );
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    if (sender.balance < numAmount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      );
    }

    // Atomic transaction: deduct sender, credit receiver, create record
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          senderId,
          receiverId,
          amount: numAmount,
          note: note || null,
          status: "completed",
          type: "transfer",
        },
      }),
      prisma.user.update({
        where: { id: senderId },
        data: { balance: { decrement: numAmount } },
      }),
      prisma.user.update({
        where: { id: receiverId },
        data: { balance: { increment: numAmount } },
      }),
    ]);

    // Fetch updated sender
    const updatedSender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, name: true, email: true, balance: true, avatar: true },
    });

    return NextResponse.json({
      transaction,
      sender: updatedSender,
      message: `Successfully transferred $${numAmount.toFixed(2)} to ${receiver.name}`,
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
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
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
