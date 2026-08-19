import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const recurringSchema = z.object({
  receiverId: z.string().min(1),
  amount: z.number().positive().max(1000000),
  note: z.string().max(200).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
});

function getNextExecDate(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
  }
  return now;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transfers = await prisma.recurringTransfer.findMany({
      where: { senderId: session.userId, active: true },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch receiver info manually
    const transfersWithReceiver = await Promise.all(
      transfers.map(async (t) => {
        const receiver = await prisma.user.findUnique({
          where: { id: t.receiverId },
          select: { id: true, name: true, email: true },
        });
        return { ...t, receiver };
      })
    );

    return NextResponse.json({ transfers: transfersWithReceiver });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = recurringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { receiverId, amount, note, frequency } = parsed.data;

    if (session.userId === receiverId) {
      return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const transfer = await prisma.recurringTransfer.create({
      data: {
        senderId: session.userId,
        receiverId,
        amount,
        note: note || null,
        frequency,
        nextExecDate: getNextExecDate(frequency),
      },
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    await prisma.recurringTransfer.updateMany({
      where: { id, senderId: session.userId },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
