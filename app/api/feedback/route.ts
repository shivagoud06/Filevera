import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getApprovedFeedback, submitFeedback } from "@/lib/feedback";

// Simple in-memory rate limiting for feedback submissions
const submissionTimestamps = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 5, windowMs = 600000): boolean {
  const now = Date.now();
  const timestamps = (submissionTimestamps.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    return false;
  }
  timestamps.push(now);
  submissionTimestamps.set(key, timestamps);
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const result = await getApprovedFeedback(limit, offset);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown";
    const rateKey = session?.user.id || ip;

    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many feedback submissions. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { displayName, rating, message, tool } = body;

    const finalName = (displayName || session?.user.name || "Anonymous User").trim();
    if (!finalName || finalName.length < 2) {
      return NextResponse.json({ error: "Please enter a valid display name." }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Please provide a rating between 1 and 5 stars." }, { status: 400 });
    }

    const trimmedMsg = (message || "").trim();
    if (!trimmedMsg || trimmedMsg.length < 5) {
      return NextResponse.json({ error: "Feedback message must be at least 5 characters long." }, { status: 400 });
    }

    const feedback = await submitFeedback({
      userId: session?.user.id || null,
      displayName: finalName,
      rating: numRating,
      message: trimmedMsg,
      tool: tool ? String(tool).trim() : null
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback! It will be reviewed by our team before appearing publicly.",
      feedback: {
        id: feedback.id,
        displayName: feedback.displayName,
        rating: feedback.rating,
        status: feedback.status
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback. Please try again." }, { status: 500 });
  }
}
