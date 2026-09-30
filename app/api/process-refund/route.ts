import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, paymentIntentId, amount } = await req.json();

    if (!bookingId || !paymentIntentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: "requested_by_customer",
    });

    // Update booking in Convex with refund ID
    await convex.mutation(api.bookings.markRefundProcessed, {
      bookingId: bookingId as any,
      stripeRefundId: refund.id,
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
    });
  } catch (error: any) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process refund",
      },
      { status: 500 },
    );
  }
}
