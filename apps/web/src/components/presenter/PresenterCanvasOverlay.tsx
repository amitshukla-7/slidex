import * as React from 'react';
import { usePresentationStore, type SlideAnnotation } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';

interface PresenterCanvasOverlayProps {
  containerWidth: number;
  containerHeight: number;
}

export function PresenterCanvasOverlay({ containerWidth, containerHeight }: PresenterCanvasOverlayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { 
    laserPointer, 
    presentations, 
    currentPresentationId, 
    currentSlideIndex, 
    activeColor, 
    strokeWidth, 
    addAnnotation 
  } = usePresentationStore();

  const { highContrast } = useAppStore();

  // Mouse fallback drawing state
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const currentMousePoints = React.useRef<{ x: number; y: number }[]>([]);

  const currentDeck = presentations.find((p) => p.id === currentPresentationId);
  const currentSlide = currentDeck?.slides[currentSlideIndex];
  const annotations = currentSlide?.annotations || [];

  // Redraw canvas whenever annotations or laser pointer change
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw saved slide annotations
    annotations.forEach((ann) => {
      if (!ann.points || ann.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = ann.color || '#ef4444';
      ctx.lineWidth = ann.width || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const first = ann.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      for (let i = 1; i < ann.points.length; i++) {
        const pt = ann.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    });

    // 2. Draw active mouse stroke if drawing
    if (currentMousePoints.current.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const first = currentMousePoints.current[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
      for (let i = 1; i < currentMousePoints.current.length; i++) {
        const pt = currentMousePoints.current[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    }

    // 3. Draw Virtual Laser Pointer
    if (laserPointer.active) {
      const px = laserPointer.x * canvas.width;
      const py = laserPointer.y * canvas.height;

      // Outer glowing halo
      const gradient = ctx.createRadialGradient(px, py, 2, px, py, highContrast ? 28 : 20);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
      gradient.addColorStop(0.4, 'rgba(239, 68, 68, 0.4)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, highContrast ? 28 : 20, 0, Math.PI * 2);
      ctx.fill();

      // Sharp intense core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [annotations, laserPointer, containerWidth, containerHeight, activeColor, strokeWidth, highContrast]);

  // Mouse fallback handlers for presenters with stylus or touchpad
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setIsMouseDown(true);
    currentMousePoints.current = [{ x, y }];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    currentMousePoints.current.push({ x, y });

    // Trigger frame redraw
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx && currentMousePoints.current.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const prev = currentMousePoints.current[currentMousePoints.current.length - 2];
        ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
        ctx.lineTo(x * canvas.width, y * canvas.height);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (isMouseDown && currentMousePoints.current.length >= 2) {
      addAnnotation(currentSlideIndex, {
        id: `ann-${Date.now()}`,
        points: [...currentMousePoints.current],
        color: activeColor,
        width: strokeWidth,
        timestamp: Date.now(),
      });
    }
    setIsMouseDown(false);
    currentMousePoints.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth || 1280}
      height={containerHeight || 720}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="absolute inset-0 w-full h-full z-20 cursor-crosshair select-none"
    />
  );
}
