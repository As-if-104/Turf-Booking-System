// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingData } = body;

    console.log("💰 Original price:", bookingData.totalPrice);

    // CRITICAL FIX: BDT uses paisa (100 paisa = 1 BDT)
    // So we need to multiply by 100 to convert to paisa
    const amountInPaisa = Math.round(bookingData.totalPrice * 100);

    console.log("💵 Amount in paisa:", amountInPaisa);

    // Validate minimum amount (Stripe requires at least ৳10 = 1000 paisa)
    if (amountInPaisa < 1000) {
      return NextResponse.json(
        { error: "Minimum booking amount is ৳10" },
        { status: 400 },
      );
    }

    // Create Stripe checkout session with BDT currency
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `${bookingData.turfName} - Turf Booking`,
              description: `${bookingData.date} at ${bookingData.startTime} - ${bookingData.endTime}`,
            },
            // BDT amount in paisa (smallest unit)
            // ৳150 = 15000 paisa
            unit_amount: amountInPaisa,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing?cancelled=true`,
      metadata: {
        userId,
        turfId: bookingData.turfId,
        slotIds: JSON.stringify(bookingData.slotIds),
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      },
    });

    console.log("✅ Checkout session created:", session.id);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
