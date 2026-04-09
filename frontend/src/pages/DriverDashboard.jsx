import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { deliveriesApi, damageReportsApi, ecoScoresApi, dashboardApi, syncApi } from '../services/api';
import { Button } from '../components/ui/button';
import { 
  Truck, Package, Camera, CheckCircle, MapPin, LogOut, 
  Wifi, WifiOff, AlertTriangle, ChevronRight, Clock,
  Navigation, Leaf, Shield, RefreshCw, X, Upload
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import SignatureCanvas from './SignatureCanvas';

const statusLabels = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En cours',
  delivered: 'Livré',
  failed: 'Échoué'
};

export const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { isOnline, queueLength, addToQueue, processQueue } = useOfflineSync();
  const [activeTab, setActiveTab] = useState('deliveries');
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [ecoScore, setEcoScore] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [delRes, statsRes, ecoRes] = await Promise.all([
        deliveriesApi.getAll(),
        dashboardApi.getStats(),
        ecoScoresApi.getAll()
      ]);
      setDeliveries(delRes.data);
      setStats(statsRes.data);
      if (ecoRes.data.length > 0) {
        setEcoScore(ecoRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!isOnline) {
        toast.error('Mode hors-ligne activé');
      }
    }
    setLoading(false);
  }, [isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process sync queue when coming back online
  useEffect(() => {
    if (isOnline && queueLength > 0) {
      processQueue(async (item) => {
        if (item.type === 'delivery_update') {
          await deliveriesApi.update(item.data.tracking_id, item.data);
        } else if (item.type === 'damage_report') {
          await damageReportsApi.create(item.data);
        }
      }).then((processed) => {
        if (processed > 0) {
          toast.success(`${processed} éléments synchronisés`);
          fetchData();
        }
      });
    }
  }, [isOnline, queueLength, processQueue, fetchData]);

  const handleStartDelivery = async (tracking_id) => {
    try {
      if (isOnline) {
        await deliveriesApi.update(tracking_id, { status: 'in_transit' });
        toast.success('Livraison démarrée !');
        // Update local state immediately
        setDeliveries(prev => prev.map(d => 
          d.tracking_id === tracking_id ? { ...d, status: 'in_transit' } : d
        ));
      } else {
        addToQueue('delivery_update', { tracking_id, status: 'in_transit' });
        toast.info('Mise à jour en file d\'attente (mode hors-ligne)');
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error('Erreur lors du démarrage');
    }
  };

  const handleCompleteDelivery = async (tracking_id, signatureData) => {
    try {
      if (isOnline) {
        await deliveriesApi.update(tracking_id, { 
          status: 'delivered', 
          signature_data: signatureData 
        });
        toast.success('Livraison terminée avec succès !');
        // Update local state immediately
        setDeliveries(prev => prev.map(d => 
          d.tracking_id === tracking_id ? { ...d, status: 'delivered' } : d
        ));
      } else {
        addToQueue('delivery_update', { 
          tracking_id, 
          status: 'delivered',
          signature_data: signatureData
        });
        toast.info('Mise à jour en file d\'attente (mode hors-ligne)');
      }
      setShowSignature(false);
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleDamageReport = async (tracking_id, photoBase64) => {
    try {
      const data = {
        delivery_id: tracking_id,
        photo_base64: photoBase64,
        description: 'Photo prise par chauffeur'
      };
      
      if (isOnline) {
        const response = await damageReportsApi.create(data);
        if (response.data.ai_analysis?.is_damaged) {
          toast.warning('Dommage détecté par IA !');
        } else {
          toast.success('Colis en bon état');
        }
      } else {
        addToQueue('damage_report', data);
        toast.info('Photo enregistrée (sync au retour)');
      }
      setShowCamera(false);
    } catch (error) {
      toast.error('Erreur lors de l\'analyse');
    }
  };

  const pendingDeliveries = deliveries.filter(d => d.status === 'assigned' || d.status === 'in_transit');
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <Toaster richColors position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#121214] border-b border-[#27272A] px-4 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0066FF] rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Transporter-Pro</h1>
              <p className="text-xs text-zinc-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Online Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isOnline ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
            }`} data-testid="online-status">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : `Hors-ligne (${queueLength})`}
            </div>
            <Button 
              onClick={fetchData} 
              size="icon" 
              variant="ghost"
              className="text-zinc-400"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-[#0066FF]">{stats?.pending || 0}</p>
          <p className="text-xs text-zinc-400">En cours</p>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-green-400">{stats?.completed_today || 0}</p>
          <p className="text-xs text-zinc-400">Livrées</p>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold font-mono ${
            (ecoScore?.score || stats?.eco_score || 0) >= 80 ? 'text-green-400' : 
            (ecoScore?.score || stats?.eco_score || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>{ecoScore?.score || stats?.eco_score || 0}</p>
          <p className="text-xs text-zinc-400">Éco-score</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'deliveries' && (
          <>
            {/* Current Deliveries */}
            <div className="space-y-3" data-testid="pending-deliveries">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0066FF]" />
                Livraisons en cours ({pendingDeliveries.length})
              </h2>
              
              {pendingDeliveries.length === 0 ? (
                <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-zinc-400">Aucune livraison assignée</p>
                </div>
              ) : (
                pendingDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.tracking_id}
                    delivery={delivery}
                    onStart={() => handleStartDelivery(delivery.tracking_id)}
                    onPhoto={() => { setSelectedDelivery(delivery); setShowCamera(true); }}
                    onComplete={() => { setSelectedDelivery(delivery); setShowSignature(true); }}
                  />
                ))
              )}
            </div>

            {/* Completed Deliveries */}
            {completedDeliveries.length > 0 && (
              <div className="space-y-3 pt-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Terminées aujourd'hui ({completedDeliveries.length})
                </h2>
                {completedDeliveries.slice(0, 3).map((delivery) => (
                  <div 
                    key={delivery.tracking_id}
                    className="bg-[#121214] border border-[#27272A] rounded-xl p-4 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-zinc-400">{delivery.tracking_id}</p>
                        <p className="font-medium">{delivery.recipient_name}</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'eco' && (
          <div className="space-y-4">
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-6 text-center">
              <Leaf className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-6xl font-bold font-mono text-green-400 mb-2">
                {ecoScore?.score || 0}
              </p>
              <p className="text-zinc-400">Votre score d'éco-conduite</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
                <p className="text-sm text-zinc-400 mb-1">Distance</p>
                <p className="text-xl font-bold font-mono">{ecoScore?.distance_km || 0} km</p>
              </div>
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
                <p className="text-sm text-zinc-400 mb-1">CO2</p>
                <p className="text-xl font-bold font-mono">{ecoScore?.co2_kg || 0} kg</p>
              </div>
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
                <p className="text-sm text-zinc-400 mb-1">Freinages brusques</p>
                <p className="text-xl font-bold font-mono text-yellow-400">{ecoScore?.harsh_braking_count || 0}</p>
              </div>
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
                <p className="text-sm text-zinc-400 mb-1">Accélérations</p>
                <p className="text-xl font-bold font-mono text-yellow-400">{ecoScore?.harsh_acceleration_count || 0}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Économie Assurance</p>
                  <p className="text-sm text-zinc-400">
                    Avec un score de {ecoScore?.score || 0}/100, vous pouvez négocier jusqu'à 
                    <span className="text-green-400 font-bold"> -15%</span> sur vos primes d'assurance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - One Hand Design */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#121214] border-t border-[#27272A] px-4 py-2 safe-area-inset-bottom">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('deliveries')}
            data-testid="nav-deliveries"
            className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
              activeTab === 'deliveries' ? 'text-[#0066FF]' : 'text-zinc-400'
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs mt-1">Livraisons</span>
          </button>
          <button
            onClick={() => setActiveTab('eco')}
            data-testid="nav-eco"
            className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
              activeTab === 'eco' ? 'text-[#0066FF]' : 'text-zinc-400'
            }`}
          >
            <Leaf className="w-6 h-6" />
            <span className="text-xs mt-1">Éco-score</span>
          </button>
          <button
            onClick={logout}
            data-testid="logout-btn-driver"
            className="flex flex-col items-center py-2 px-6 rounded-xl text-zinc-400"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs mt-1">Quitter</span>
          </button>
        </div>
      </nav>

      {/* Camera Modal */}
      {showCamera && selectedDelivery && (
        <CameraModal
          delivery={selectedDelivery}
          onCapture={(photo) => handleDamageReport(selectedDelivery.tracking_id, photo)}
          onClose={() => { setShowCamera(false); setSelectedDelivery(null); }}
        />
      )}

      {/* Signature Modal */}
      {showSignature && selectedDelivery && (
        <SignatureModal
          delivery={selectedDelivery}
          onSign={(sig) => handleCompleteDelivery(selectedDelivery.tracking_id, sig)}
          onClose={() => { setShowSignature(false); setSelectedDelivery(null); }}
        />
      )}
    </div>
  );
};

const DeliveryCard = ({ delivery, onStart, onPhoto, onComplete }) => {
  const isInTransit = delivery.status === 'in_transit';

  return (
    <div 
      className="bg-[#1A1A1E] rounded-2xl p-5 active:scale-[0.98] transition-transform"
      data-testid={`delivery-card-${delivery.tracking_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono text-sm text-zinc-400">{delivery.tracking_id}</p>
          <p className="text-lg font-semibold mt-1">{delivery.recipient_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${
          isInTransit ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'
        }`}>
          {statusLabels[delivery.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{delivery.recipient_address}</span>
      </div>

      {/* Action Buttons - Large for thumb operation */}
      <div className="space-y-2">
        {!isInTransit && (
          <Button 
            onClick={onStart}
            className="w-full h-14 text-base bg-[#0066FF] hover:bg-[#0052CC] rounded-xl"
            data-testid={`start-delivery-${delivery.tracking_id}`}
          >
            <Navigation className="w-5 h-5 mr-2" />
            Démarrer la livraison
          </Button>
        )}

        {isInTransit && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={onPhoto}
                variant="outline"
                className="h-14 text-base border-[#27272A] rounded-xl"
                data-testid={`photo-btn-${delivery.tracking_id}`}
              >
                <Camera className="w-5 h-5 mr-2" />
                Photo
              </Button>
              <Button 
                onClick={onComplete}
                className="h-14 text-base bg-green-600 hover:bg-green-700 rounded-xl"
                data-testid={`complete-btn-${delivery.tracking_id}`}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Terminé
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CameraModal = ({ delivery, onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Impossible d\'accéder à la caméra');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      setPhoto(base64);
      
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmit = async () => {
    if (photo) {
      setAnalyzing(true);
      await onCapture(photo);
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Camera/Photo view */}
      <div className="h-full flex flex-col">
        <div className="flex-1 relative">
          {!photo ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={`data:image/jpeg;base64,${photo}`}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay info */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-2 rounded-lg">
            <p className="text-sm font-mono">{delivery.tracking_id}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-[#121214] safe-area-inset-bottom">
          {!photo ? (
            <Button 
              onClick={takePhoto}
              className="w-full h-16 text-lg bg-[#0066FF] hover:bg-[#0052CC] rounded-xl"
            >
              <Camera className="w-6 h-6 mr-2" />
              Prendre une photo
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => { setPhoto(null); startCamera(); }}
                variant="outline"
                className="h-16 text-lg border-[#27272A] rounded-xl"
              >
                Reprendre
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={analyzing}
                className="h-16 text-lg bg-green-600 hover:bg-green-700 rounded-xl"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Analyse IA...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SignatureModal = ({ delivery, onSign, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0B] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#27272A]">
        <div>
          <p className="font-mono text-sm text-zinc-400">{delivery.tracking_id}</p>
          <p className="font-semibold">{delivery.recipient_name}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-[#1A1A1E] rounded-full flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Signature Canvas */}
      <div className="flex-1 p-4">
        <SignatureCanvas onComplete={onSign} />
      </div>
    </div>
  );
};

export default DriverDashboard;
