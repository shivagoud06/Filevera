import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    if (files.length < 2) return errorResponse("Choose at least two PDF files to merge.", 400);
    if (files.some((file) => file.size === 0)) return errorResponse("Empty PDF files cannot be merged.", 400);
    if (files.some((file) => file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) return errorResponse("Only PDF files are supported for merging.", 415);

    const merged = await PDFDocument.create();
    for (const file of files) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pageIndices = source.getPageIndices();
      const pages = await merged.copyPages(source, pageIndices);
      pages.forEach((page) => merged.addPage(page));
    }

    const bytes = await merged.save();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("merge-pdf failed", error);
    return errorResponse("We could not merge these PDF files.", 500);
  }
}
