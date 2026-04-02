import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Eraser, Check, Shield } from 'lucide-react';

const SignatureCanvas = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
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
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const submitSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    onComplete(base64);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <p className="text-lg font-semibold mb-1">Signature du client</p>
        <p className="text-sm text-zinc-400">Signez dans la zone ci-dessous</p>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-[#121214] border-2 border-dashed border-[#27272A] rounded-2xl overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-zinc-600 text-lg">Signez ici</p>
          </div>
        )}
      </div>

      {/* Blockchain info */}
      <div className="flex items-center gap-2 py-3 text-sm text-zinc-400">
        <Shield className="w-4 h-4 text-green-400" />
        <span>Signature horodatée et sécurisée par blockchain</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={clearCanvas}
          variant="outline"
          className="h-14 text-base border-[#27272A] rounded-xl"
        >
          <Eraser className="w-5 h-5 mr-2" />
          Effacer
        </Button>
        <Button 
          onClick={submitSignature}
          disabled={!hasSignature}
          className="h-14 text-base bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
        >
          <Check className="w-5 h-5 mr-2" />
          Confirmer
        </Button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
