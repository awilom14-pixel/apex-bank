import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, formatAmountForStripe, APP_URL, CURRENCY } from "@/lib/stripe";
import { z } from "zod";

const depositSchema = z.object({
  amount: z.number().min(10, "Minimum deposit is $10").max(10000, "Maximum deposit is $10,000"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = depositSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        status: "pending",
      },
    });

    // Create Stripe Checkout Session for deposit
    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: "Apex Bank Deposit",
              description: `Deposit $${amount.toFixed(2)} into your Apex Bank account`,
            },
            unit_amount: formatAmountForStripe(amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${APP_URL}/wallet?deposit=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/wallet?deposit=cancelled`,
      metadata: {
        userId: user.id,
        depositId: deposit.id,
        type: "deposit",
      },
    });

    // Update deposit with session ID
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
