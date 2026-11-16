"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, Download, Loader2, Minus, Plus, X } from "lucide-react";

type Props = { url: string; name: string; onClose: () => void };
const buttonClass = "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40";

export function PdfReader({ url, name, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let task: PDFDocumentLoadingTask | undefined;
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) {
          if (response.headers.get("content-type")?.includes("application/json")) {
            const data = await response.json();
            throw new Error(data.error || "Unable to open this PDF.");
          }
          throw new Error("Unable to open this PDF. Please try again.");
        }
        if (!response.headers.get("content-type")?.toLowerCase().includes("application/pdf")) {
          throw new Error("The server did not return a PDF document.");
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        const pdfjs = await import("pdfjs-dist");
        if (controller.signal.aborted) return;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        task = pdfjs.getDocument({ data: bytes, isEvalSupported: false });
        const document = await task.promise;
        if (!controller.signal.aborted) {
          setRendering(true);
          setPdf(document);
          setError("");
          setLoading(false);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to open this PDF.");
          setLoading(false);
        }
      }
    })();
    return () => {
      controller.abort();
      if (task) void task.destroy().catch((cause: unknown) => console.error("Unable to close PDF reader:", cause));
    };
  }, [url, revision]);

  useEffect(() => {
    if (!pdf || !width || !canvas.current) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    const target = canvas.current;
    void (async () => {
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(3, (Math.max(1, width - 32) / base.width) * zoom / 100);
        const viewport = pdfPage.getViewport({ scale });
        if (viewport.height > 30000 || viewport.width > 30000) throw new Error("This PDF page is too large to display.");
        const outputScale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16000000 / (viewport.width * viewport.height)));
        const context = target.getContext("2d");
        if (!context) throw new Error("Your browser could not create the PDF display.");
        target.width = Math.max(1, Math.floor(viewport.width * outputScale));
        target.height = Math.max(1, Math.floor(viewport.height * outputScale));
        target.style.width = `${viewport.width}px`;
        target.style.height = `${viewport.height}px`;
        renderTask = pdfPage.render({ canvasContext: context, viewport, transform: [outputScale, 0, 0, outputScale, 0, 0] });
        await renderTask.promise;
        if (!cancelled) { setRendering(false); setError(""); }
      } catch (cause) {
        if (!cancelled) {
          setRendering(false);
          setError(cause instanceof Error ? cause.message : "Unable to display this page.");
        }
      }
    })();
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [pdf, page, zoom, width]);

  const changePage = (next: number) => {
    setRendering(true);
    setPage(next);
    if (container.current) container.current.scrollTop = 0;
  };
  const changeZoom = (next: number) => { setRendering(true); setZoom(next); };

  return (
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby="pdf-reader-title" className="m-auto h-[calc(100dvh-1rem)] max-h-none w-[calc(100%_-_1rem)] max-w-6xl overflow-hidden rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100%_-_2rem)]">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Study reader</p>
            <h2 id="pdf-reader-title" className="truncate text-sm font-semibold sm:text-base">{name}</h2>
          </div>
          <a href={url} download className={buttonClass} aria-label="Download PDF"><Download className="h-5 w-5" /><span className="hidden sm:inline">Download</span></a>
          <button type="button" autoFocus onClick={onClose} className={buttonClass} aria-label="Close PDF reader"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-slate-200 px-2 py-1 sm:px-4">
          <div className="flex items-center">
            <button type="button" className={buttonClass} disabled={!pdf || page <= 1} onClick={() => changePage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-5 w-5" /></button>
            <span className="min-w-20 text-center text-sm tabular-nums" aria-live="polite">{pdf ? `${page} / ${pdf.numPages}` : "Page —"}</span>
            <button type="button" className={buttonClass} disabled={!pdf || page >= pdf.numPages} onClick={() => changePage(page + 1)} aria-label="Next page"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center">
            <button type="button" className={buttonClass} disabled={!pdf || zoom <= 50} onClick={() => changeZoom(zoom - 25)} aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <span className="min-w-14 text-center text-sm tabular-nums">{zoom}%</span>
            <button type="button" className={buttonClass} disabled={!pdf || zoom >= 200} onClick={() => changeZoom(zoom + 25)} aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        {error && <div role="alert" className="shrink-0 bg-amber-50 p-3 text-sm text-amber-900">{error} <button type="button" onClick={() => { setPdf(null); setLoading(true); setError(""); setPage(1); setRevision((value) => value + 1); }} className="ml-2 min-h-11 font-semibold underline">Try again</button></div>}
        <div ref={container} className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-slate-200 p-4">
          {(loading || rendering) && <div role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> {loading ? "Opening PDF..." : "Rendering page..."}</div>}
          <canvas ref={canvas} role="img" aria-label={`Page ${page} of ${name}`} className={`mx-auto bg-white shadow-lg ${pdf ? "block" : "hidden"}`} />
          <p className="mt-4 text-center text-xs text-slate-600">If the PDF cannot be displayed, use Download to open it on your device.</p>
        </div>
      </div>
    </dialog>
  );
}
