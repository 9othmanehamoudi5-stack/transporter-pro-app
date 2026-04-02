import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trackingApi } from '../services/api';
import { 
  Truck, Package, CheckCircle, Clock, MapPin, 
  AlertTriangle, Shield, Loader2 
} from 'lucide-react';

const statusSteps = [
  { key: 'pending', label: 'Commande reçue', icon: Package },
  { key: 'assigned', label: 'Chauffeur assigné', icon: Truck },
  { key: 'in_transit', label: 'En cours de livraison', icon: MapPin },
  { key: 'delivered', label: 'Livré', icon: CheckCircle },
];

const statusOrder = ['pending', 'assigned', 'in_transit', 'delivered'];

export const ClientPortal = () => {
  const { trackingId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!trackingId) return;
      setLoading(true);
      try {
        const response = await trackingApi.track(trackingId);
        setDelivery(response.data);
        setError(null);
      } catch (err) {
        setError('Numéro de suivi introuvable');
        setDelivery(null);
      }
      setLoading(false);
    };

    fetchTracking();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTracking, 30000);
    return () => clearInterval(interval);
  }, [trackingId]);

  const currentStepIndex = delivery ? statusOrder.indexOf(delivery.status) : -1;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/2c49de5c-fb91-4633-a690-8bf119de3bcb/images/97ea60569b65de7a0c89896fd34600cafc5cea1557e38e75c9ffe2ba9915ce4c.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#0066FF] rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">Transporter-Pro</span>
        </div>

        {/* Tracking Card - Glass morphism */}
        <div className="glass rounded-2xl p-6" data-testid="tracking-card">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#0066FF] mb-4" />
              <p className="text-zinc-400">Recherche de votre colis...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-lg font-semibold mb-2">Colis introuvable</p>
              <p className="text-zinc-400 text-center">
                Vérifiez votre numéro de suivi et réessayez.
              </p>
            </div>
          ) : delivery ? (
            <>
              {/* Tracking ID */}
              <div className="text-center mb-6">
                <p className="text-sm text-zinc-400">Numéro de suivi</p>
                <p className="text-xl font-mono font-bold text-[#0066FF]" data-testid="tracking-id">
                  {delivery.tracking_id}
                </p>
              </div>

              {/* Current Status */}
              <div className={`p-4 rounded-xl mb-6 ${
                delivery.status === 'delivered' 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-[#0066FF]/10 border border-[#0066FF]/20'
              }`}>
                <div className="flex items-center gap-3">
                  {delivery.status === 'delivered' ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <Clock className="w-8 h-8 text-[#0066FF]" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {delivery.status === 'delivered' ? 'Livré' :
                       delivery.status === 'in_transit' ? 'En cours de livraison' :
                       delivery.status === 'assigned' ? 'Chauffeur en route' :
                       'En préparation'}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {delivery.status === 'delivered' && delivery.delivered_at
                        ? `Le ${new Date(delivery.delivered_at).toLocaleDateString('fr-FR')}`
                        : 'Mise à jour en temps réel'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-3 mb-6">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div 
                      key={step.key}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        isCompleted ? 'bg-[#1A1A1E]' : 'opacity-40'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? isCurrent 
                            ? 'bg-[#0066FF] text-white' 
                            : 'bg-green-500/20 text-green-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                          {step.label}
                        </p>
                      </div>
                      {isCompleted && !isCurrent && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Delivery Info */}
              <div className="p-4 bg-[#1A1A1E] rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-400">Destinataire</p>
                    <p className="font-medium">{delivery.recipient_name}</p>
                    <p className="text-sm text-zinc-400">{delivery.recipient_address}</p>
                  </div>
                </div>
              </div>

              {/* Blockchain Proof */}
              {delivery.has_proof && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">
                    Preuve de livraison sécurisée par blockchain
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-4">
          Powered by Transporter-Pro © 2026
        </p>
      </div>
    </div>
  );
};

// Search page for entering tracking ID
export const TrackingSearch = () => {
  const [trackingId, setTrackingId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      window.location.href = `/track/${trackingId.trim().toUpperCase()}`;
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/2c49de5c-fb91-4633-a690-8bf119de3bcb/images/97ea60569b65de7a0c89896fd34600cafc5cea1557e38e75c9ffe2ba9915ce4c.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#0066FF] rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">Transporter-Pro</span>
        </div>

        <div className="glass rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-center mb-2">
            Suivez votre colis
          </h1>
          <p className="text-zinc-400 text-center mb-6">
            Entrez votre numéro de suivi pour localiser votre colis
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              placeholder="Ex: TP-A1B2C3D4"
              className="w-full h-14 px-4 bg-[#0A0A0B] border border-[#27272A] rounded-xl text-white text-lg font-mono placeholder:text-zinc-600 focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] outline-none"
              data-testid="tracking-input"
            />
            <button
              type="submit"
              className="w-full h-14 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl transition-colors"
              data-testid="track-btn"
            >
              Suivre mon colis
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-4">
          Powered by Transporter-Pro © 2026
        </p>
      </div>
    </div>
  );
};

export default ClientPortal;
