import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const { createCanvas } = await import("@napi-rs/canvas");
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return errorResponse("Choose a PDF file to convert.", 400);
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return errorResponse("Only PDF files are supported.", 415);

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
    return new Response(Buffer.from(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="pages.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("pdf-to-jpg failed", error);
    return errorResponse("We could not convert this PDF to JPG images.", 500);
  }
}
