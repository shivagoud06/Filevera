import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";
import {
  checkPlanLimits,
  commitCreditUsage,
  ensureUserUsage,
  refundReservedCredits,
  reserveAndDeductCredits,
} from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: Request) {
  let reservedUserId: string | null = null;
  let reservedCredits = 0;

  try {
    const reqHeaders = await nextHeaders();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return errorResponse("Authentication required. Please log in to merge PDF files.", 401, {
        code: "AUTH_REQUIRED",
      });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    if (files.length < 2) return errorResponse("Choose at least two PDF files to merge.", 400);
    if (files.some((file) => file.size === 0)) return errorResponse("Empty PDF files cannot be merged.", 400);
    if (files.some((file) => file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) {
      return errorResponse("Only PDF files are supported for merging.", 415);
    }

    // Plan limits check (batch count + file size)
    const usage = await ensureUserUsage(session.user.id);
    const limitCheck = checkPlanLimits(usage.plan, {
      batchCount: files.length,
    });
    if (!limitCheck.valid) {
      return errorResponse(limitCheck.error || "Batch size exceeds your plan limit.", 413, {
        code: "LIMIT_EXCEEDED",
      });
    }

    for (const file of files) {
      const fileCheck = checkPlanLimits(usage.plan, {
        fileBytes: file.size,
        fileType: "pdf",
      });
      if (!fileCheck.valid) {
        return errorResponse(fileCheck.error || "One of the files exceeds your plan size limit.", 413, {
          code: "LIMIT_EXCEEDED",
        });
      }
    }

    // Reserve & deduct credits (5 credits for merge_pdf)
    const deduction = await reserveAndDeductCredits(session.user.id, "merge_pdf");
    if (!deduction.success) {
      return errorResponse(deduction.error || "Not enough credits for this operation.", 402, {
        code: "INSUFFICIENT_CREDITS",
        required: deduction.required,
        available: deduction.remaining,
      });
    }

    reservedUserId = session.user.id;
    reservedCredits = deduction.required;

    const merged = await PDFDocument.create();
    for (const file of files) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pageIndices = source.getPageIndices();
      const pages = await merged.copyPages(source, pageIndices);
      pages.forEach((page) => merged.addPage(page));
    }

    const bytes = await merged.save();

    // Commit usage record
    await commitCreditUsage(session.user.id, "merge_pdf", deduction.required, deduction.remaining);

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
        "Cache-Control": "no-store",
        "X-Credits-Used": String(deduction.required),
        "X-Credits-Remaining": String(deduction.remaining),
      },
    });
  } catch (error) {
    if (reservedUserId && reservedCredits > 0) {
      await refundReservedCredits(reservedUserId, reservedCredits);
    }
    console.error("merge-pdf failed", error);
    return errorResponse("We could not merge these PDF files.", 500);
  }
}
