import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, APP_URL } from "@/lib/stripe";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeAccountId: true,
        stripeOnboarding: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If already onboarded, return success
    if (user.stripeAccountId && user.stripeOnboarding) {
      return NextResponse.json({ success: true, alreadyOnboarded: true });
    }

    let accountId = user.stripeAccountId;

    // Create Stripe Express account if not exists
    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: "express",
        email: user.email,
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { userId: user.id },
        settings: {
          payouts: {
            schedule: {
              interval: "manual",
            },
          },
        },
      });

      accountId = account.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    // Create onboarding link
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/wallet?stripe=refresh`,
      return_url: `${APP_URL}/wallet?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
