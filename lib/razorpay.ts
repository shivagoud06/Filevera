import Razorpay from "razorpay";
import crypto from "node:crypto";

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

export const RAZORPAY_PRO_INTRO_PLAN_ID = process.env.RAZORPAY_PRO_INTRO_PLAN_ID || "";
export const RAZORPAY_PRO_MONTHLY_PLAN_ID = process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || "";
export const RAZORPAY_PRO_PLUS_INTRO_PLAN_ID = process.env.RAZORPAY_PRO_PLUS_INTRO_PLAN_ID || "";
export const RAZORPAY_PRO_PLUS_YEARLY_PLAN_ID = process.env.RAZORPAY_PRO_PLUS_YEARLY_PLAN_ID || "";

export const isRazorpayConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

export const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    })
  : null;

export function getRazorpayPlanId(plan: "pro" | "pro_plus", isIntroEligible: boolean): string | null {
  if (plan === "pro") {
    if (isIntroEligible && RAZORPAY_PRO_INTRO_PLAN_ID) {
      return RAZORPAY_PRO_INTRO_PLAN_ID;
    }
    return RAZORPAY_PRO_MONTHLY_PLAN_ID || null;
  }
  if (plan === "pro_plus") {
    if (isIntroEligible && RAZORPAY_PRO_PLUS_INTRO_PLAN_ID) {
      return RAZORPAY_PRO_PLUS_INTRO_PLAN_ID;
    }
    return RAZORPAY_PRO_PLUS_YEARLY_PLAN_ID || null;
  }
  return null;
}

export const RAZORPAY_PRICING = {
  pro: {
    regularAmountPaise: 14900, // ₹149 in paise
    introAmountPaise: 9900,     // ₹99 in paise
    period: "monthly",
    interval: 1,
    planName: "Filevera Pro",
  },
  pro_plus: {
    regularAmountPaise: 178800, // ₹1,788 in paise
    introAmountPaise: 149900,   // ₹1,499 in paise
    period: "yearly",
    interval: 1,
    planName: "Filevera Pro Plus",
  },
} as const;

/**
 * Verify Razorpay Subscription signature:
 * generated_signature = hmac_sha256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
 */
export function verifySubscriptionSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;
  const body = `${paymentId}|${subscriptionId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

/**
 * Verify Razorpay Order signature:
 * generated_signature = hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, secret)
 */
export function verifyOrderSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

/**
 * Verify Razorpay Webhook signature:
 * generated_signature = hmac_sha256(raw_body, webhook_secret)
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}
