// src/app/api/stripe/check-pix-status/[paymentIntentId]/route.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_YOUR_KEY", {
  apiVersion: "2022-11-15",
});

export async function GET(
  request: Request,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const { paymentIntentId } = params;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Return the status and full payment intent if succeeded
    return NextResponse.json({
      status: paymentIntent.status,
      paymentIntent: paymentIntent.status === 'succeeded' ? paymentIntent : null,
    });

  } catch (error: any) {
    console.error("Check Pix status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check payment status" },
      { status: 500 }
    );
  }
}
