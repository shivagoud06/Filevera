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
      return errorResponse("Authentication required. Please log in to convert images to PDF.", 401, {
        code: "AUTH_REQUIRED",
      });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    if (!files.length) return errorResponse("Choose at least one JPG or PNG image.", 400);
    if (files.some((file) => !["image/jpeg", "image/png"].includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name))) {
      return errorResponse("Only JPG and PNG images are supported.", 415);
    }

    // Plan limits check (batch count & image size)
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
        fileType: "image",
      });
      if (!fileCheck.valid) {
        return errorResponse(fileCheck.error || "One of the images exceeds your plan size limit.", 413, {
          code: "LIMIT_EXCEEDED",
        });
      }
    }

    // Reserve & deduct credits (5 credits for jpg_to_pdf)
    const deduction = await reserveAndDeductCredits(session.user.id, "jpg_to_pdf");
    if (!deduction.success) {
      return errorResponse(deduction.error || "Not enough credits for this operation.", 402, {
        code: "INSUFFICIENT_CREDITS",
        required: deduction.required,
        available: deduction.remaining,
      });
    }

    reservedUserId = session.user.id;
    reservedCredits = deduction.required;

    const pdf = await PDFDocument.create();
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const image = /\.png$/i.test(file.name) || file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    const output = await pdf.save();

    // Commit usage record
    await commitCreditUsage(session.user.id, "jpg_to_pdf", deduction.required, deduction.remaining);

    return new Response(Buffer.from(output), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="images.pdf"',
        "Cache-Control": "no-store",
        "X-Credits-Used": String(deduction.required),
        "X-Credits-Remaining": String(deduction.remaining),
      },
    });
  } catch (error) {
    if (reservedUserId && reservedCredits > 0) {
      await refundReservedCredits(reservedUserId, reservedCredits);
    }
    console.error("jpg-to-pdf failed", error);
    return errorResponse("We could not turn the selected images into a PDF.", 500);
  }
}
