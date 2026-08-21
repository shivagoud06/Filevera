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
    if (!files.length) return errorResponse("Choose at least one JPG or PNG image.", 400);
    if (files.some((file) => !["image/jpeg", "image/png"].includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name))) {
      return errorResponse("Only JPG and PNG images are supported.", 415);
    }

    const pdf = await PDFDocument.create();
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const image = /\.png$/i.test(file.name) || file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    const output = await pdf.save();
    return new Response(Buffer.from(output), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="images.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("jpg-to-pdf failed", error);
    return errorResponse("We could not turn the selected images into a PDF.", 500);
  }
}
