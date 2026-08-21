"use client";

export type ToolEvent = "tool_viewed" | "upload_started" | "processing_started" | "processing_success" | "processing_failure" | "download";

export function trackToolEvent(event: ToolEvent, tool: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("file-tools:event", { detail: { event, tool } }));
}