import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, STRIPE_WEBHOOK_SECRET, formatAmountFromStripe } from "@/lib/stripe";
import { auditLog } from "@/lib/audit";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const depositId = session.metadata?.depositId;

        if (userId && depositId) {
          const amount = formatAmountFromStripe(session.amount_total || 0);

          // Credit user balance
          await prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: amount } },
          });

          // Update deposit record
          await prisma.deposit.update({
            where: { id: depositId },
            data: {
              status: "completed",
              stripePaymentId: session.payment_intent as string,
              completedAt: new Date(),
            },
          });

          // Audit log
          await auditLog(userId, "DEPOSIT", `$${amount.toFixed(2)} deposited via Stripe`);

          // Notification
          await prisma.notification.create({
            data: {
              type: "deposit",
              title: "Deposit Successful",
              message: `$${amount.toFixed(2)} has been added to your account`,
              userId,
            },
          });
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.userId;

        if (userId && account.charges_enabled && account.payouts_enabled) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeOnboarding: true },
          });

          await prisma.notification.create({
            data: {
              type: "system",
              title: "Bank Account Connected",
              message: "Your bank account is now verified. You can make withdrawals.",
              userId,
            },
          });
        }
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        const withdrawalId = payout.metadata?.withdrawalId;

        if (withdrawalId) {
          await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
              status: "completed",
              completedAt: new Date(),
            },
          });
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        const withdrawalId = payout.metadata?.withdrawalId;
        const userId = payout.metadata?.userId;

        if (withdrawalId && userId) {
          // Refund the balance
          const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
          });

          if (withdrawal) {
            await prisma.user.update({
              where: { id: userId },
              data: { balance: { increment: withdrawal.amount } },
            });

            await prisma.withdrawal.update({
              where: { id: withdrawalId },
              data: { status: "failed" },
            });

            await prisma.notification.create({
              data: {
                type: "system",
                title: "Withdrawal Failed",
                message: `Your $${withdrawal.amount.toFixed(2)} withdrawal failed. Funds have been refunded.`,
                userId,
              },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
