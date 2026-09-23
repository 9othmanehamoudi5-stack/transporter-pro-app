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

    // HTTPS / MediaDevices prerequisite check
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // eslint-disable-next-line no-console
      console.error(
        '[BarcodeScanner] navigator.mediaDevices est indisponible. ' +
          'La caméra nécessite un contexte sécurisé (HTTPS) ou localhost. ' +
          'Contexte actuel:',
        typeof window !== 'undefined' ? window.location.protocol : 'unknown',
        typeof window !== 'undefined' ? window.location.hostname : 'unknown'
      );
      setError(
        "Caméra indisponible : l'accès requiert une connexion sécurisée (HTTPS). " +
          "Vérifiez que l'URL commence par https://"
      );
      return () => {};
    }

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('barcode-reader');
        scannerInstanceRef.current = scanner;

        await scanner.start(
          // Force caméra arrière (mobile) — fallback sur caméra disponible si absente
          { facingMode: { exact: 'environment' } },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
            formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          },
          (decodedText) => {
            if (!mounted) return;
            latestCodeRef.current = decodedText;
            setDetectedCode(decodedText);
          },
          () => {}
        ).catch(async (err) => {
          // Fallback si la contrainte 'exact environment' n'est pas satisfaisable (desktop)
          // eslint-disable-next-line no-console
          console.warn('[BarcodeScanner] exact:environment non supporté, fallback', err);
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
              latestCodeRef.current = decodedText;
              setDetectedCode(decodedText);
            },
            () => {}
          );
        });

        if (mounted) setScanning(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BarcodeScanner] Erreur démarrage caméra:', err);
        if (mounted) setError(err?.message || "Impossible d'accéder à la caméra");
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

  const handleValidate = async () => {
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

      {/* Scanner area — button is absolute-positioned inside */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="text-center">
              <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-300 font-medium mb-2">Caméra non disponible</p>
              <p className="text-sm text-zinc-500 mb-4">{error}</p>
              <Button onClick={handleClose} variant="outline" className="border-[#27272A]">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div id="barcode-reader" ref={scannerRef} className="w-full h-full" />

            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-72 h-40 border-2 rounded-xl relative transition-colors duration-300 ${
                    detectedCode ? 'border-green-500' : 'border-[#0066FF]/50'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl ${detectedCode ? 'border-green-500' : 'border-[#0066FF]'}`} />
                  <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr ${detectedCode ? 'border-green-500' : 'border-[#0066FF]'}`} />
                  <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl ${detectedCode ? 'border-green-500' : 'border-[#0066FF]'}`} />
                  <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br ${detectedCode ? 'border-green-500' : 'border-[#0066FF]'}`} />
                  <div className={`absolute inset-x-4 top-1/2 h-0.5 animate-pulse ${detectedCode ? 'bg-green-500/70' : 'bg-[#0066FF]/60'}`} />
                </div>
              </div>
            )}

            {/* Live detected code chip */}
            {detectedCode && (
              <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none px-4">
                <div
                  className="bg-green-500/15 border border-green-500/40 rounded-full px-4 py-1.5 backdrop-blur-md flex items-center gap-2 max-w-full"
                  data-testid="scanned-result"
                >
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-green-300 font-mono text-sm font-semibold truncate">{detectedCode}</span>
                </div>
              </div>
            )}

            {/* Bouton VALIDER LE SCAN — position absolute, bottom: 20px */}
            <button
              type="button"
              onClick={handleValidate}
              disabled={!detectedCode}
              data-testid="validate-scan-btn"
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 40px)',
                maxWidth: '420px',
                height: '56px',
                padding: '0 24px',
                background: detectedCode ? '#0066FF' : 'rgba(0, 102, 255, 0.3)',
                color: detectedCode ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '0.03em',
                cursor: detectedCode ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: detectedCode ? '0 10px 30px rgba(0, 102, 255, 0.35)' : 'none',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
            >
              <Check className="w-5 h-5" />
              VALIDER LE SCAN
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
