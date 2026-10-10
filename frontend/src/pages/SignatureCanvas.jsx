import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Eraser, Check, Shield } from 'lucide-react';

const SignatureCanvas = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set buffer size
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    const timer = setTimeout(initCanvas, 50);
    window.addEventListener('resize', initCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initCanvas);
    };
  }, [initCanvas]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
  };

  const submitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    onComplete(base64);
  };

  return (
    <div className="flex flex-col h-full min-h-0 justify-between">
      <div className="text-center mb-2 flex-shrink-0">
        <p className="text-base sm:text-lg font-semibold text-white">Signature du client</p>
        <p className="text-xs text-zinc-400">Signez dans la zone ci-dessous (tactile ou souris)</p>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-[160px] max-h-[380px] bg-[#121214] border-2 border-dashed border-[#27272A] rounded-2xl overflow-hidden relative touch-none my-2"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="text-zinc-600 text-sm sm:text-base font-medium">✍️ Signez ici</p>
          </div>
        )}
      </div>

      {/* Blockchain info */}
      <div className="flex items-center justify-center sm:justify-start gap-2 py-1.5 text-xs text-zinc-400 flex-shrink-0">
        <Shield className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        <span>Signature horodatée & certifiée e-CMR</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2 flex-shrink-0">
        <Button 
          type="button"
          onClick={clearCanvas}
          variant="outline"
          className="h-12 text-sm sm:text-base border-[#27272A] hover:bg-[#1A1A1E] text-zinc-300 rounded-xl"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Effacer
        </Button>
        <Button 
          type="button"
          onClick={submitSignature}
          disabled={!hasSignature}
          className="h-12 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:opacity-40"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirmer
        </Button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
