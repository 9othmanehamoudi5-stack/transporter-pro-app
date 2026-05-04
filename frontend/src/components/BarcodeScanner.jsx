import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine, Camera, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const latestCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [detectedCode, setDetectedCode] = useState(null);

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
            formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          },
          (decodedText) => {
            if (!mounted) return;
            // Continuous detection: keep updating latest code without stopping the stream
            latestCodeRef.current = decodedText;
            setDetectedCode(decodedText);
          },
          () => {}
        );

        if (mounted) setScanning(true);
      } catch (err) {
        if (mounted) setError(err.message || "Impossible d'accéder à la caméra");
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopCameraStream = async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const handleConfirm = async () => {
    const code = latestCodeRef.current || detectedCode;
    if (!code) return;
    await stopCameraStream();
    onScan(code);
    onClose();
  };

  const handleClose = async () => {
    await stopCameraStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" data-testid="barcode-scanner">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-[#0066FF]" />
          <span className="font-semibold text-white">Scanner un code-barres</span>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 bg-white/[0.05] rounded-full flex items-center justify-center hover:bg-white/[0.1]"
          data-testid="scanner-close"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center px-6">
            <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-300 font-medium mb-2">Caméra non disponible</p>
            <p className="text-sm text-zinc-500 mb-4">{error}</p>
            <Button onClick={handleClose} variant="outline" className="border-[#27272A]">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <div id="barcode-reader" ref={scannerRef} className="w-full h-full" />
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-72 h-40 border-2 rounded-xl relative transition-colors duration-300 ${
                    detectedCode ? 'border-green-500' : 'border-[#0066FF]/50'
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl ${
                      detectedCode ? 'border-green-500' : 'border-[#0066FF]'
                    }`}
                  />
                  <div
                    className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr ${
                      detectedCode ? 'border-green-500' : 'border-[#0066FF]'
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl ${
                      detectedCode ? 'border-green-500' : 'border-[#0066FF]'
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br ${
                      detectedCode ? 'border-green-500' : 'border-[#0066FF]'
                    }`}
                  />
                  <div
                    className={`absolute inset-x-4 top-1/2 h-0.5 animate-pulse ${
                      detectedCode ? 'bg-green-500/70' : 'bg-[#0066FF]/60'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Live detected code badge */}
            {detectedCode && (
              <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                <div
                  className="bg-green-500/15 border border-green-500/40 rounded-full px-4 py-1.5 backdrop-blur-md flex items-center gap-2"
                  data-testid="scanned-result"
                >
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 font-mono text-sm font-semibold">{detectedCode}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions — primary "CONFIRMER LE SCAN" button always visible under camera */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0A0A0B] safe-area-inset-bottom">
        <div className="space-y-2 max-w-sm mx-auto">
          <Button
            onClick={handleConfirm}
            disabled={!detectedCode || !!error}
            className="w-full h-14 text-base bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-[#0066FF]/30 disabled:text-white/60 rounded-xl font-semibold"
            data-testid="confirm-scan-btn"
          >
            <Check className="w-5 h-5 mr-2" />
            CONFIRMER LE SCAN
          </Button>
          <p className="text-center text-[11px] text-zinc-500">
            {detectedCode
              ? 'Code détecté — appuyez sur Confirmer pour valider'
              : 'Placez le code-barres ou QR code dans le cadre'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
