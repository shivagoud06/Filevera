import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createSupportTicket } from "@/lib/support";

const ticketTimestamps = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 5, windowMs = 600000): boolean {
  const now = Date.now();
  const timestamps = (ticketTimestamps.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    return false;
  }
  timestamps.push(now);
  ticketTimestamps.set(key, timestamps);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown";
    const rateKey = session?.user.id || ip;

    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many support requests sent. Please wait a few minutes before submitting again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, category, message } = body;

    const finalName = (name || session?.user.name || "").trim();
    if (!finalName || finalName.length < 2) {
      return NextResponse.json({ error: "Please provide your name." }, { status: 400 });
    }

    const finalEmail = (email || session?.user.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const validCategories = [
      "file-processing",
      "account",
      "payment-plan",
      "bug-report",
      "privacy-request",
      "other"
    ];
    const finalCategory = validCategories.includes(category) ? category : "other";

    const trimmedMsg = (message || "").trim();
    if (!trimmedMsg || trimmedMsg.length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters long." }, { status: 400 });
    }

    const ticket = await createSupportTicket({
      userId: session?.user.id || null,
      name: finalName,
      email: finalEmail,
      category: finalCategory,
      message: trimmedMsg
    });

    return NextResponse.json({
      success: true,
      message: "Your support request has been received. Our team will get back to you shortly via email.",
      ticketId: ticket.id
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit support request. Please try again." }, { status: 500 });
  }
}
