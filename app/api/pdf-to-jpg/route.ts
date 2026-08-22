import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
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
      return errorResponse("Authentication required. Please log in to convert PDF to JPG.", 401, {
        code: "AUTH_REQUIRED",
      });
    }

    const { createCanvas } = await import("@napi-rs/canvas");
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return errorResponse("Choose a PDF file to convert.", 400);
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      return errorResponse("Only PDF files are supported.", 415);
    }

    const usage = await ensureUserUsage(session.user.id);
    const limitCheck = checkPlanLimits(usage.plan, {
      fileBytes: file.size,
      fileType: "pdf",
    });
    if (!limitCheck.valid) {
      return errorResponse(limitCheck.error || "File exceeds your plan size limit.", 413, {
        code: "LIMIT_EXCEEDED",
      });
    }

    // Reserve & deduct credits (5 credits for pdf_to_jpg)
    const deduction = await reserveAndDeductCredits(session.user.id, "pdf_to_jpg");
    if (!deduction.success) {
      return errorResponse(deduction.error || "Not enough credits for this operation.", 402, {
        code: "INSUFFICIENT_CREDITS",
        required: deduction.required,
        available: deduction.remaining,
      });
    }

    reservedUserId = session.user.id;
    reservedCredits = deduction.required;

    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const zip = new JSZip();
    const pageCount = Math.min(pdf.numPages, 20);

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await (page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context,
        viewport,
      } as unknown as Parameters<typeof page.render>[0])).promise;
      const jpeg = canvas.toBuffer("image/jpeg", 0.9);
      zip.file(`page-${pageNumber}.jpg`, jpeg);
    }

    const archive = await zip.generateAsync({ type: "nodebuffer" });

    // Commit usage record
    await commitCreditUsage(session.user.id, "pdf_to_jpg", deduction.required, deduction.remaining);

    return new Response(Buffer.from(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="pages.zip"',
        "Cache-Control": "no-store",
        "X-Credits-Used": String(deduction.required),
        "X-Credits-Remaining": String(deduction.remaining),
      },
    });
  } catch (error) {
    if (reservedUserId && reservedCredits > 0) {
      await refundReservedCredits(reservedUserId, reservedCredits);
    }
    console.error("pdf-to-jpg failed", error);
    return errorResponse("We could not convert this PDF to JPG images.", 500);
  }
}
