import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  : null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripePriceId(
  plan: "pro" | "pro_plus",
  isIntroEligible: boolean
): { priceId: string | undefined; isIntro: boolean } {
  if (plan === "pro") {
    if (isIntroEligible && process.env.STRIPE_PRO_INTRO_PRICE_ID) {
      return { priceId: process.env.STRIPE_PRO_INTRO_PRICE_ID, isIntro: true };
    }
    return {
      priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      isIntro: false,
    };
  }

  if (plan === "pro_plus") {
    if (isIntroEligible && process.env.STRIPE_PRO_PLUS_INTRO_PRICE_ID) {
      return {
        priceId: process.env.STRIPE_PRO_PLUS_INTRO_PRICE_ID,
        isIntro: true,
      };
    }
    return {
      priceId: process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID,
      isIntro: false,
    };
  }

  return { priceId: undefined, isIntro: false };
}
