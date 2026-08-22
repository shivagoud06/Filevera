export type PlanId = "free" | "pro" | "pro_plus";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge?: string;
  tagline: string;
  price: string;
  period: string;
  popular?: boolean;
  starterCredits: number;
  monthlyCredits: number;
  maxPdfSizeMB: number;
  maxImageSizeMB: number;
  maxBatchCount: number;
  priorityProcessing: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Essential file tools for everyday use and trial.",
    price: "$0",
    period: "forever",
    starterCredits: Number(process.env.FREE_STARTER_CREDITS || 100),
    monthlyCredits: Number(process.env.FREE_MONTHLY_CREDITS || 50),
    maxPdfSizeMB: 25,
    maxImageSizeMB: 10,
    maxBatchCount: 10,
    priorityProcessing: false,
    features: [
      "100 Starter credits upon sign up",
      "50 Monthly renewal credits",
      "Standard 25MB PDF file size limit",
      "Standard 10MB image upload limit",
      "Batch process up to 10 files",
      "Standard processing speed",
      "All PDF & image tools included"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    badge: "Recommended",
    tagline: "For professionals and regular heavy users.",
    price: "$9",
    period: "/month",
    popular: true,
    starterCredits: Number(process.env.PRO_MONTHLY_CREDITS || 1000),
    monthlyCredits: Number(process.env.PRO_MONTHLY_CREDITS || 1000),
    maxPdfSizeMB: 100,
    maxImageSizeMB: 30,
    maxBatchCount: 30,
    priorityProcessing: true,
    features: [
      "1,000 Monthly processing credits",
      "Generous 100MB PDF file size limit",
      "Up to 30MB per image upload",
      "Batch process up to 30 files",
      "Priority processing queue",
      "Fine-tuned custom target compression",
      "Priority email support"
    ]
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro Plus",
    badge: "Power User",
    tagline: "For demanding workflows and large document batches.",
    price: "$19",
    period: "/month",
    starterCredits: Number(process.env.PRO_PLUS_MONTHLY_CREDITS || 5000),
    monthlyCredits: Number(process.env.PRO_PLUS_MONTHLY_CREDITS || 5000),
    maxPdfSizeMB: 250,
    maxImageSizeMB: 50,
    maxBatchCount: 50,
    priorityProcessing: true,
    features: [
      "5,000 Monthly processing credits",
      "Maximum 250MB PDF file size limit",
      "Up to 50MB per image upload",
      "Batch process up to 50 files",
      "Highest priority server allocation",
      "Early access to newly released tools",
      "Dedicated VIP support"
    ]
  }
};

export function getPlan(id: string): PlanDefinition {
  if (id === "pro") return PLANS.pro;
  if (id === "pro_plus") return PLANS.pro_plus;
  return PLANS.free;
}
