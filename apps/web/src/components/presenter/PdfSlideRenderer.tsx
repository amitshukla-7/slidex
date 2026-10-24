import * as React from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PdfSlideRendererProps {
  pdfUrl?: string;
  pdfData?: ArrayBuffer;
  pageNumber: number;
  onDocumentLoaded?: (numPages: number) => void;
  className?: string;
}

export function PdfSlideRenderer({
  pdfUrl,
  pdfData,
  pageNumber,
  onDocumentLoaded,
  className,
}: PdfSlideRendererProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load PDF Document
  React.useEffect(() => {
    let active = true;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfData
          ? pdfjsLib.getDocument({ data: pdfData })
          : pdfUrl
          ? pdfjsLib.getDocument(pdfUrl)
          : null;

        if (!loadingTask) return;

        const doc = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(doc);
        onDocumentLoaded?.(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        if (!active) return;
        console.error('PDF load error:', err);
        setError(err.message || 'Failed to render PDF document');
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      active = false;
    };
  }, [pdfUrl, pdfData]);

  // Render active page onto canvas
  React.useEffect(() => {
    let renderTask: any = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (err) {
        // Page render cancelled or failed
      }
    }

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white font-mono">
          Loading PDF slide...
        </div>
      )}
      <canvas ref={canvasRef} className={className || 'max-h-full max-w-full object-contain'} />
    </div>
  );
}
