import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      stripeCustomerId: true,
      stripeAccountId: true,
      stripeOnboarding: true,
    },
  });

  return NextResponse.json({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    stripeCustomerId: user?.stripeCustomerId || null,
    stripeAccountId: user?.stripeAccountId || null,
    stripeOnboarding: user?.stripeOnboarding || false,
  });
}
