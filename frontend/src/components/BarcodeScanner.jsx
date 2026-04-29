import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine, Camera } from 'lucide-react';
import { Button } from '../components/ui/button';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('barcode-reader');
        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
            formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
          },
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              scanner.stop().catch(() => {});
            }
          },
          () => {} // ignore errors during scanning
        );

        if (mounted) setScanning(true);
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Impossible d\'accéder à la caméra');
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" data-testid="barcode-scanner">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-[#0066FF]" />
          <span className="font-semibold text-white">Scanner un code-barres</span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 bg-white/[0.05] rounded-full flex items-center justify-center hover:bg-white/[0.1]"
          data-testid="scanner-close"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center px-6">
            <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-300 font-medium mb-2">Caméra non disponible</p>
            <p className="text-sm text-zinc-500 mb-4">{error}</p>
            <Button onClick={onClose} variant="outline" className="border-[#27272A]">Fermer</Button>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <div id="barcode-reader" ref={scannerRef} className="w-full h-full" />
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-72 h-40 border-2 border-[#0066FF]/50 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#0066FF] rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#0066FF] rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#0066FF] rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#0066FF] rounded-br" />
                  {/* Scan line animation */}
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-[#0066FF]/60 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0A0A0B] text-center safe-area-inset-bottom">
        <p className="text-xs text-zinc-500">Placez le code-barres ou QR code dans le cadre</p>
        <p className="text-[10px] text-zinc-600 mt-1">EAN, Code 128, QR Code supportés</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
