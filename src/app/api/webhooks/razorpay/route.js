import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET not set, skipping verification");
    } else {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    await dbConnect();

    switch (eventType) {
      case "payment.captured": {
        // Payment successful – add credits to user
        const payment = event.payload.payment.entity;
        const userId = payment.notes?.user_id;
        const credits = parseInt(payment.notes?.credits || "0", 10);

        console.log(`Payment captured: ${payment.id} for user ${userId}, ${credits} credits`);

        if (userId && credits > 0) {
          await User.findByIdAndUpdate(userId, {
            $inc: { credits: credits }
          });
          console.log(`Successfully added ${credits} credits to user ${userId}`);
        }

        break;
      }

      case "subscription.activated": {
        // Pro subscription started
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.user_id;

        console.log(`Subscription activated: ${subscription.id} for user ${userId}`);

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            role: "admin", // Or "pro" if we add a pro role
            $inc: { credits: 500 }
          });
        }

        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
