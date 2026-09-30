// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  console.log("🔔 Webhook received");

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("❌ No signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
    console.log("✅ Webhook signature verified:", event.type);
  } catch (error: any) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    console.log("💳 Payment completed:", session.id);
    console.log("📋 Metadata:", metadata);

    if (!metadata) {
      console.error("❌ No metadata found in session");
      return NextResponse.json({ error: "No metadata" }, { status: 400 });
    }

    try {
      const slotIds = JSON.parse(metadata.slotIds);

      if (
        !metadata.userId ||
        !metadata.turfId ||
        !slotIds ||
        slotIds.length === 0
      ) {
        throw new Error("Missing required metadata fields");
      }

      // For BDT, amount_total is already in paisa (smallest unit)
      // 1 BDT = 100 paisa, so divide by 100
      const totalPrice = (session.amount_total || 0) / 100;

      const bookingId = await convex.mutation(api.bookings.createBooking, {
        userId: metadata.userId,
        turfId: metadata.turfId as any,
        slotIds: slotIds as any,
        date: metadata.date,
        startTime: metadata.startTime,
        endTime: metadata.endTime,
        totalPrice: totalPrice, // This will now be in BDT
        paymentId: session.payment_intent as string,
      });

      console.log("✅ Booking created successfully:", bookingId);

      // Send confirmation email
      try {
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || "Customer";

        if (customerEmail) {
          await resend.emails.send({
            from: "TurfBook AI <onboarding@resend.dev>",
            to: customerEmail,
            subject: "Booking Confirmation - TurfBook AI",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-label { font-weight: bold; color: #6b7280; }
                    .detail-value { color: #111827; }
                    .total { font-size: 1.2em; font-weight: bold; color: #4F46E5; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 Booking Confirmed!</h1>
                    </div>
                    <div class="content">
                      <p>Hi ${customerName},</p>
                      <p>Your turf booking has been successfully confirmed. We're excited to see you on the field!</p>
                      
                      <div class="booking-details">
                        <h2 style="margin-top: 0; color: #4F46E5;">Booking Details</h2>
                        
                        <div class="detail-row">
                          <span class="detail-label">Booking ID:</span>
                          <span class="detail-value">#${bookingId}</span>
                        </div>
                        
                        <div class="detail-row">
                          <span class="detail-label">Date:</span>
                          <span class="detail-value">${metadata.date}</span>
                        </div>
                        
                        <div class="detail-row">
                          <span class="detail-label">Time:</span>
                          <span class="detail-value">${metadata.startTime} - ${metadata.endTime}</span>
                        </div>
                        
                        <div class="detail-row" style="border-bottom: none;">
                          <span class="detail-label">Total Amount:</span>
                          <span class="detail-value total">৳${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <p>Please arrive 10 minutes before your booking time. If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
                      
                      <p>Thank you for choosing TurfBook AI!</p>
                      
                      <div class="footer">
                        <p>Questions? Contact us at support@turfbook.com</p>
                        <p>&copy; 2026 TurfBook AI. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });

          console.log("📧 Confirmation email sent to:", customerEmail);
        }
      } catch (emailError) {
        console.error("⚠️ Error sending confirmation email:", emailError);
      }

      return NextResponse.json({
        received: true,
        bookingId,
        message: "Booking created successfully",
      });
    } catch (error: any) {
      console.error("❌ Error processing webhook:", error);
      return NextResponse.json(
        {
          error: "Error processing booking",
          details: error.message,
        },
        { status: 500 },
      );
    }
  }

  console.log("ℹ️ Webhook event type not handled:", event.type);
  return NextResponse.json({ received: true });
}
