import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const withdrawSchema = z.object({
  amount: z.number().min(10, "Minimum withdrawal is $10").max(10000, "Maximum withdrawal is $10,000"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = withdrawSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        balance: true,
        stripeAccountId: true,
        stripeOnboarding: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check sufficient balance
    if (user.balance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. You have $${user.balance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check if Stripe Connect onboarding is complete
    if (!user.stripeAccountId || !user.stripeOnboarding) {
      return NextResponse.json(
        { error: "Please complete bank account setup before withdrawing" },
        { status: 400 }
      );
    }

    // Verify account is still active
    const account = await getStripe().accounts.retrieve(user.stripeAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      return NextResponse.json(
        { error: "Your bank account setup is incomplete. Please finish onboarding." },
        { status: 400 }
      );
    }

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        status: "pending",
      },
    });

    // Create Stripe payout to the connected account's bank
    const payout = await getStripe().transfers.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      destination: user.stripeAccountId,
      description: `Apex Bank withdrawal - $${amount.toFixed(2)}`,
      metadata: {
        userId: user.id,
        withdrawalId: withdrawal.id,
      },
    });

    // Deduct from balance
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: amount } },
    });

    // Update withdrawal record
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        stripePayoutId: payout.id,
        status: "processing",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "WITHDRAWAL",
        details: `$${amount.toFixed(2)} withdrawal initiated via Stripe`,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal.id,
      message: `Withdrawal of $${amount.toFixed(2)} initiated. Funds will arrive in 1-2 business days.`,
    });
  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
