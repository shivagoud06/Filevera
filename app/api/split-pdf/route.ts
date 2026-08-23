import JSZip from "jszip";
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

function parseRanges(input: string): number[] {
  const ranges = input.split(",").map((part) => part.trim()).filter(Boolean);
  const pages = new Set<number>();
  for (const range of ranges) {
    if (!range.includes("-")) {
      const page = Number(range);
      if (Number.isFinite(page) && page >= 1) pages.add(page);
      continue;
    }
    const [startText, endText] = range.split("-");
    const start = Number(startText);
    const end = Number(endText);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) continue;
    for (let page = start; page <= end; page += 1) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

export async function POST(request: Request) {
  let reservedUserId: string | null = null;
  let reservedCredits = 0;

  try {
    const reqHeaders = await nextHeaders();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return errorResponse("Authentication required. Please log in to split PDF files.", 401, {
        code: "AUTH_REQUIRED",
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const ranges = parseRanges(String(formData.get("ranges") ?? ""));

    if (!(file instanceof File)) return errorResponse("Choose a PDF file to split.", 400);
    if (!ranges.length) return errorResponse("Enter at least one page range, for example 1-3,5.", 400);

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

    // Reserve & deduct credits (5 credits for split_pdf)
    const deduction = await reserveAndDeductCredits(session.user.id, "split_pdf");
    if (!deduction.success) {
      return errorResponse(deduction.error || "Not enough credits for this operation.", 402, {
        code: "INSUFFICIENT_CREDITS",
        required: deduction.required,
        available: deduction.remaining,
      });
    }

    reservedUserId = session.user.id;
    reservedCredits = deduction.required;

    const source = await PDFDocument.load(await file.arrayBuffer());
    const maxPages = source.getPageCount();
    const selected = ranges.filter((page) => page >= 1 && page <= maxPages);
    if (!selected.length) {
      await refundReservedCredits(session.user.id, deduction.required);
      return errorResponse(`The selected pages must be between 1 and ${maxPages}.`, 400);
    }

    if (selected.length === 1) {
      const pageNumber = selected[0];
      const extracted = await PDFDocument.create();
      const [page] = await extracted.copyPages(source, [pageNumber - 1]);
      extracted.addPage(page);
      const pdfBytes = await extracted.save();

      // Commit usage record
      await commitCreditUsage(session.user.id, "split_pdf", deduction.required, deduction.remaining);

      return new Response(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="page-${pageNumber}.pdf"`,
          "Cache-Control": "no-store",
          "X-Credits-Used": String(deduction.required),
          "X-Credits-Remaining": String(deduction.remaining),
        },
      });
    }

    const zip = new JSZip();
    for (const pageNumber of selected) {
      const extracted = await PDFDocument.create();
      const [page] = await extracted.copyPages(source, [pageNumber - 1]);
      extracted.addPage(page);
      zip.file(`page-${pageNumber}.pdf`, Buffer.from(await extracted.save()));
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    // Commit usage record
    await commitCreditUsage(session.user.id, "split_pdf", deduction.required, deduction.remaining);

    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="split-pages.zip"',
        "Cache-Control": "no-store",
        "X-Credits-Used": String(deduction.required),
        "X-Credits-Remaining": String(deduction.remaining),
      },
    });
  } catch (error) {
    if (reservedUserId && reservedCredits > 0) {
      await refundReservedCredits(reservedUserId, reservedCredits);
    }
    console.error("split-pdf failed", error);
    return errorResponse("We could not split this PDF file.", 500);
  }
}
