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

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setRotation(0);
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
              disabled={zoom <= 0.5}
              className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
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
            { (zoom !== 1 || rotation !== 0) && (
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
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: zoom, 
              rotate: rotation,
              opacity: 1 
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="max-w-full max-h-[82vh] flex items-center justify-center p-2 rounded-2xl overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-white/5 cursor-zoom-out"
              onClick={onClose}
            />
          </motion.div>
        </div>

        {/* Footer instruction */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute bottom-4 text-[10px] text-white/70 font-medium font-sans tracking-wide select-none bg-slate-900/40 px-3 py-1.5 rounded-full"
        >
          Tap image or press ESC to close full screen
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
