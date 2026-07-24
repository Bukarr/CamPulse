import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
  alt?: string;
}

export function Lightbox({ src, onClose, alt = 'Image Proof' }: LightboxProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

  const lastTapRef = React.useRef<number>(0);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const initialDistanceRef = React.useRef<number | null>(null);
  const initialZoomRef = React.useRef<number>(1);

  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when lightbox is open
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [src, onClose]);

  if (!src) return null;

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(prev => {
      const nextZoom = Math.min(prev + 0.5, 5);
      if (nextZoom === 1) setPosition({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(prev => {
      const nextZoom = Math.max(prev - 0.5, 1);
      if (nextZoom === 1) setPosition({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const toggleDoubleTapZoom = () => {
    setZoom(prev => {
      if (prev > 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      } else {
        return 2.5;
      }
    });
  };

  // Mouse Handlers for Desktop Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Pinch, Double-Tap, and Touch Dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (e.touches.length === 1 && now - lastTapRef.current < 300) {
      // Double tap detected - toggle zoom
      e.preventDefault();
      toggleDoubleTapZoom();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (e.touches.length === 2) {
      // Pinch to zoom initialization
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialDistanceRef.current = dist;
      initialZoomRef.current = zoom;
    } else if (e.touches.length === 1 && zoom > 1) {
      // Single finger drag initialization
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      // Handle zoom update
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / initialDistanceRef.current;
      const targetZoom = Math.min(Math.max(initialZoomRef.current * ratio, 1), 5);
      setZoom(targetZoom);
      if (targetZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Handle panning update
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    initialDistanceRef.current = null;
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 select-none"
      >
        {/* Top bar controls */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-[10000] pointer-events-none"
        >
          {/* Left: Info */}
          <div className="text-white/85 text-xs font-medium font-sans drop-shadow-md bg-slate-900/60 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/10">
            {alt}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <div className="text-white/80 text-[10px] font-mono px-1 select-none font-bold">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
            { (zoom !== 1 || rotation !== 0 || position.x !== 0 || position.y !== 0) && (
              <button
                onClick={handleReset}
                className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-white/10 hover:bg-white/20 text-white/90 rounded-full transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
            <div className="w-[1px] h-4 bg-white/15 mx-1" />
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shadow-md cursor-pointer"
              title="Close Full Screen"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>

        {/* Hero image canvas */}
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: zoom, 
              rotate: rotation,
              x: position.x,
              y: position.y,
              opacity: 1 
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={isDragging ? { type: 'just' } : { type: 'spring', damping: 25, stiffness: 220 }}
            className={`max-w-full max-h-[82vh] flex items-center justify-center p-2 rounded-2xl ${
              zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-white/5 pointer-events-none select-none"
            />
          </motion.div>
        </div>

        {/* Footer instruction */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute bottom-4 text-[10px] text-white/70 font-medium font-sans tracking-wide select-none bg-slate-900/40 px-3 py-1.5 rounded-full"
        >
          {zoom > 1 ? "Drag to pan image • Pinch or use controls to zoom" : "Pinch / Zoom to magnify • Tap overlay to close"}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
