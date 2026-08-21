import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const ranges = parseRanges(String(formData.get("ranges") ?? ""));

    if (!(file instanceof File)) return errorResponse("Choose a PDF file to split.", 400);
    if (!ranges.length) return errorResponse("Enter at least one page range, for example 1-3,5.", 400);

    const source = await PDFDocument.load(await file.arrayBuffer());
    const maxPages = source.getPageCount();
    const selected = ranges.filter((page) => page >= 1 && page <= maxPages);
    if (!selected.length) return errorResponse(`The selected pages must be between 1 and ${maxPages}.`, 400);

    const zip = new JSZip();
    for (const pageNumber of selected) {
      const extracted = await PDFDocument.create();
      const [page] = await extracted.copyPages(source, [pageNumber - 1]);
      extracted.addPage(page);
      zip.file(`page-${pageNumber}.pdf`, Buffer.from(await extracted.save()));
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="split-pages.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("split-pdf failed", error);
    return errorResponse("We could not split this PDF file.", 500);
  }
}
