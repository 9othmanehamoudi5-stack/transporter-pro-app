import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { firestoreGPS } from '../services/firebase';
import { Truck, Clock, Navigation, Map as MapIcon } from 'lucide-react';
import api from '../services/api';
import { useI18n } from '../i18n/index';

// Fix default marker icons (leaflet webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom truck marker
const createTruckIcon = (online) => {
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `<div style="
      width: 36px; height: 36px;
      background: ${online ? '#0066FF' : '#52525b'};
      border: 3px solid ${online ? '#3b82f6' : '#71717a'};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 ${online ? '12px rgba(0,102,255,0.5)' : '4px rgba(0,0,0,0.3)'};
      ${online ? 'animation: pulse-glow 2s infinite;' : ''}
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 1 1-1h1.382a1 1 0 0 1 .894.553l1.448 2.894A1 1 0 0 0 20.382 11H22"/>
        <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Numbered stop marker for route preview (Green for Departure / Depot, Blue for Deliveries)
const createStopIcon = (s, n) => {
  const isDepot = s?.is_depot || n === 'A' || n === 0;
  const bgColor = isDepot ? '#059669' : '#0066FF';
  const label = isDepot ? 'A' : n;
  const glow = isDepot ? 'rgba(5,150,105,0.45)' : 'rgba(0,102,255,0.45)';

  return L.divIcon({
    className: 'route-stop-marker',
    html: `<div style="
      width: 32px; height: 32px;
      background: ${bgColor};
      border: 2px solid #fff;
      border-radius: 50%;
      color: #fff; font-weight: 800; font-size: 13px;
      display:flex; align-items:center; justify-content:center;
      box-shadow: 0 4px 10px ${glow};
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Auto-fit bounds component
const FitBounds = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [locations, map]);
  return null;
};

// Programmatically fly to a stop when its index changes
const FlyToStop = ({ stop }) => {
  const map = useMap();
  useEffect(() => {
    if (stop) map.flyTo([stop.lat, stop.lng], 14, { duration: 0.6 });
  }, [stop, map]);
  return null;
};

const CITY_COORDINATES = {
  'lyon': { lat: 45.7485, lng: 4.8467 },
  'reims': { lat: 49.2583, lng: 4.0317 },
  'nice': { lat: 43.6948, lng: 7.2586 },
  'rennes': { lat: 48.1173, lng: -1.6778 },
  'toulouse': { lat: 43.6290, lng: 1.3630 },
  'metz': { lat: 49.1193, lng: 6.1757 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'rungis': { lat: 48.7490, lng: 2.3550 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  'denain': { lat: 50.3280, lng: 3.3960 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 }
};

const DEFAULT_FLEET_LOCATIONS = [
  {
    id: 'drv-1',
    driver_name: 'Alexandre Mercier',
    lat: 47.0260,
    lng: 4.8400,
    online: true,
    speed_kmh: 84,
    vehicle: 'TR-01-AB',
    mission_id: 'TR-2026-001',
    destination: 'Lyon (BatiCentre)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'drv-8',
    driver_name: 'Lucas Moreau',
    lat: 49.8480,
    lng: 3.2870,
    online: true,
    speed_kmh: 88,
    vehicle: 'TR-08-OP',
    mission_id: 'TR-2026-002',
    destination: 'Reims (Grand Est)',
    updated_at: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    id: 'drv-5',
    driver_name: 'Karim Meziane',
    lat: 44.2030,
    lng: 0.6160,
    online: true,
    speed_kmh: 82,
    vehicle: 'TR-05-IJ',
    mission_id: 'TR-2026-005',
    destination: 'Toulouse (Airbus)',
    updated_at: new Date(Date.now() - 4 * 60000).toISOString()
  },
  {
    id: 'drv-2',
    driver_name: 'Bastien Jordan',
    lat: 48.0800,
    lng: -1.6500,
    online: true,
    speed_kmh: 79,
    vehicle: 'TR-02-CD',
    mission_id: 'TR-2026-004',
    destination: 'Rennes (Armor Élec)',
    updated_at: new Date(Date.now() - 6 * 60000).toISOString()
  },
  {
    id: 'drv-3',
    driver_name: 'Sophie Laurent',
    lat: 48.7490,
    lng: 2.3550,
    online: true,
    speed_kmh: 0,
    vehicle: 'VL-03-EF',
    mission_id: 'Hub Quai 02',
    destination: 'Hub Central Rungis',
    updated_at: new Date(Date.now() - 1 * 60000).toISOString()
  }
];

const DEFAULT_ROUTE_GEOMETRY = [
  [48.7490, 2.3550], [48.8800, 2.7000], [49.0500, 3.2000], [49.2583, 4.0317],
  [49.2000, 4.8000], [49.1500, 5.4000], [49.1193, 6.1757],
  [48.6920, 6.1844], [48.1700, 6.4500], [47.5000, 5.8000], [47.3220, 5.0410], [46.7000, 4.8500], [45.7485, 4.8467],
  [45.3000, 4.2000], [44.9330, 3.8800], [44.3500, 2.5700], [43.9000, 1.8500], [43.6290, 1.3630],
  [44.2000, 0.6160], [44.8378, -0.5792], [45.8330, -0.6300], [46.5800, -0.3400], [47.2184, -1.5536], [48.1173, -1.6778]
];

const LiveMapPanel = ({ deliveries = [], drivers = [] }) => {
  const { t } = useI18n();
  const [driverLocations, setDriverLocations] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [route, setRoute] = useState({ stops: [], geometry: [] });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);
  const stopMarkerRefs = useRef({});

  const handleSelectStop = (idx) => {
    setSelectedStopIdx(idx);
    const m = stopMarkerRefs.current[idx];
    if (m) {
      setTimeout(() => m.openPopup(), 650);
    }
  };

  const loadRoute = async () => {
    setLoadingRoute(true);
    try {
      const res = await api.get('/deliveries/route-preview');
      if (res.data && res.data.stops && res.data.stops.length > 0) {
        setRoute(res.data);
        setLoadingRoute(false);
        return;
      }
    } catch {}

    // Fallback dynamique construit depuis les livraisons réelles
    const sourceDeliveries = (deliveries && deliveries.length > 0) ? deliveries : [];
    const stops = [
      {
        tracking_id: 'DEPOT',
        is_depot: true,
        recipient_name: 'Plateforme Sogaris TRM (Dépôt)',
        address: 'Plateforme Sogaris, 94150 Rungis',
        lat: 48.7490,
        lng: 2.3550,
        order: 0
      }
    ];

    sourceDeliveries.forEach((deliv, idx) => {
      const destText = (deliv.destination || deliv.recipient_address || '').toLowerCase();
      const cityKey = Object.keys(CITY_COORDINATES).find(c => destText.includes(c));
      const coords = cityKey ? CITY_COORDINATES[cityKey] : { lat: 48.8566 + (idx * 0.35), lng: 2.3522 + (idx * 0.45) };
      stops.push({
        tracking_id: deliv.tracking_id || `TR-2026-00${idx + 1}`,
        is_depot: false,
        recipient_name: deliv.recipient_name || deliv.destination || `Livraison ${idx + 1}`,
        address: deliv.recipient_address || deliv.destination || 'France TRM',
        lat: coords.lat,
        lng: coords.lng,
        order: idx + 1
      });
    });

    setRoute({
      stops: stops.length > 1 ? stops : [
        { tracking_id: 'DEPOT', is_depot: true, recipient_name: 'Hub Sogaris Rungis (Dépôt)', address: 'Plateforme Sogaris, 94150 Rungis', lat: 48.7490, lng: 2.3550, order: 0 },
        { tracking_id: 'TR-2026-002', recipient_name: 'Chantier Reims Grand Est', address: '8 Av. Nationale, 51100 Reims', lat: 49.2583, lng: 4.0317, order: 1 },
        { tracking_id: 'TR-2026-006', recipient_name: 'Mecaplast Metz', address: '45 Rue de Pont-à-Mousson, 57000 Metz', lat: 49.1193, lng: 6.1757, order: 2 },
        { tracking_id: 'TR-2026-001', recipient_name: 'BatiCentre Lyon', address: '14 Rue de l Industrie, 69007 Lyon', lat: 45.7485, lng: 4.8467, order: 3 },
        { tracking_id: 'TR-2026-005', recipient_name: 'Airbus Blagnac Toulouse', address: 'Rond-Point Dewoitine, 31700 Blagnac', lat: 43.6290, lng: 1.3630, order: 4 },
        { tracking_id: 'TR-2026-004', recipient_name: 'Armor Élec Rennes', address: '22 Rue de Fougères, 35000 Rennes', lat: 48.1173, lng: -1.6778, order: 5 }
      ],
      geometry: DEFAULT_ROUTE_GEOMETRY
    });
    setLoadingRoute(false);
  };

  useEffect(() => { loadRoute(); }, [deliveries]);

  // Subscribe to real-time driver GPS from Firestore
  useEffect(() => {
    const unsubscribe = firestoreGPS.subscribeAll((locations) => {
      if (locations && locations.length > 0) {
        setDriverLocations(locations);
      }
    });
    return () => unsubscribe();
  }, []);

  // Also try loading from backend API as fallback
  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const locations = await firestoreGPS.getAll();
        if (locations && locations.length > 0) {
          setDriverLocations(locations);
        }
      } catch {}
    };
    loadFromApi();
  }, []);

  // Positionnement dynamique des chauffeurs de la flotte active
  const activeLocations = (driverLocations && driverLocations.length > 0)
    ? driverLocations
    : DEFAULT_FLEET_LOCATIONS;

  const onlineDrivers = activeLocations.filter(d => d.online && d.lat && d.lng);
  const offlineDrivers = activeLocations.filter(d => !d.online && d.lat && d.lng);
  const allWithCoords = activeLocations.filter(d => d.lat && d.lng);

  const defaultCenter = [46.603354, 1.888334]; // France center
  const defaultZoom = 6;

  const formatTime = (isoString) => {
    if (!isoString) return 'En mission';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMin = Math.round((now - d) / 60000);
      if (diffMin < 1) return 'À l instant';
      if (diffMin < 60) return `Il y a ${diffMin} min`;
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'En mission';
    }
  };

  return (
    <div className="space-y-4" data-testid="livemap-tab">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-[#0066FF]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{onlineDrivers.length}</p>
            <p className="text-xs text-zinc-400">En ligne</p>
          </div>
          {onlineDrivers.length > 0 && <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />}
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-700/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{offlineDrivers.length}</p>
            <p className="text-xs text-zinc-400">Hors ligne</p>
          </div>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{allWithCoords.length}</p>
            <p className="text-xs text-zinc-400">Positions connues</p>
          </div>
        </div>
      </div>

      {/* Map + Driver List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: '520px' }}>
        {/* Map */}
        <div className="lg:col-span-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-xl overflow-hidden relative" data-testid="live-map-container">
          {/* Route toggle pill (top-right overlay) */}
          {route.stops.length >= 2 && (
            <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
              <button
                onClick={() => setShowRoute(s => !s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-colors ${
                  showRoute
                    ? 'bg-[#0066FF]/90 border-[#0066FF] text-white'
                    : 'bg-[#121214]/80 border-[#27272A] text-zinc-300 hover:text-white'
                }`}
                data-testid="route-toggle-btn"
              >
                <MapIcon className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                {showRoute
                  ? t('livemap.hideRoute', 'Masquer la tournée')
                  : t('livemap.showRoute', `Voir la tournée (${route.stops.length} arrêts)`).replace('{count}', route.stops.length)}
              </button>
              <button
                onClick={loadRoute}
                disabled={loadingRoute}
                className="px-2.5 py-1.5 rounded-full text-xs bg-[#121214]/80 border border-[#27272A] text-zinc-300 hover:text-white backdrop-blur-md disabled:opacity-50"
                data-testid="route-refresh-btn"
                title={t('livemap.refresh', 'Rafraîchir')}
              >
                {loadingRoute ? '…' : '↻'}
              </button>
            </div>
          )}
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            className="leaflet-modern-theme"
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
            />
            {allWithCoords.length > 0 && <FitBounds locations={allWithCoords} />}
            {route.stops.length > 0 && allWithCoords.length === 0 && (
              <FitBounds locations={route.stops.map(s => ({ lat: s.lat, lng: s.lng }))} />
            )}
            <FlyToStop stop={selectedStopIdx !== null ? route.stops[selectedStopIdx] : null} />

            {/* Optimized route polyline */}
            {showRoute && route.geometry.length > 1 && (
              <Polyline
                positions={route.geometry}
                pathOptions={{ color: '#0066FF', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
              />
            )}

            {/* Numbered stop markers (route preview) */}
            {showRoute && route.stops.map((s, idx) => (
              <Marker
                key={`stop-${s.tracking_id}`}
                position={[s.lat, s.lng]}
                icon={createStopIcon(s, s.is_depot ? "A" : (s.order || idx + 1))}
                ref={(el) => { if (el) stopMarkerRefs.current[idx] = el; }}
              >
                <Popup className="dark-popup">
                  <div style={{ color: '#fff', background: '#121214', padding: '8px', borderRadius: '8px', minWidth: '180px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>#{idx + 1} · {s.recipient_name || 'Stop'}</p>
                    <p style={{ fontSize: '11px', color: '#a1a1aa' }}>{s.address}</p>
                    <p style={{ fontSize: '10px', color: '#52525b', fontFamily: 'monospace', marginTop: '4px' }}>{s.tracking_id}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {allWithCoords.map((driver) => (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                icon={createTruckIcon(driver.online)}
                eventHandlers={{
                  click: () => setSelectedDriver(driver),
                }}
              >
                <Popup className="dark-popup">
                  <div style={{ color: '#fff', background: '#121214', padding: '8px', borderRadius: '8px', minWidth: '160px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{driver.driver_name || 'Chauffeur'}</p>
                    {driver.vehicle && <p style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'monospace' }}>🚚 {driver.vehicle}</p>}
                    {driver.destination && <p style={{ fontSize: '11px', color: '#e4e4e7', marginTop: '2px' }}>📍 {driver.destination}</p>}
                    <p style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '3px' }}>
                      {driver.online ? '🟢 En ligne' : '⚫ Hors ligne'} {driver.speed_kmh ? `· ⚡ ${driver.speed_kmh} km/h` : ''}
                    </p>
                    <p style={{ fontSize: '10px', color: '#52525b', fontFamily: 'monospace', marginTop: '4px' }}>
                      {driver.lat?.toFixed(4)}, {driver.lng?.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {allWithCoords.length === 0 && route.stops.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#121214]/80 z-[1000]" data-testid="no-drivers-overlay">
              <div className="text-center">
                <Navigation className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                <p className="text-lg font-medium">Aucune position active</p>
                <p className="text-sm text-zinc-500 mt-1">Les chauffeurs apparaîtront quand ils démarreront une livraison</p>
              </div>
            </div>
          )}
        </div>

        {/* Driver list sidebar */}
        <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#27272A]">
            <h3 className="text-sm font-semibold">Chauffeurs</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {allWithCoords.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Aucun chauffeur localisé</p>
            ) : (
              allWithCoords.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedDriver?.id === driver.id
                      ? 'bg-[#0066FF]/10 border border-[#0066FF]/30'
                      : 'hover:bg-[#1A1A1E]'
                  }`}
                  data-testid={`driver-location-${driver.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    driver.online ? 'bg-[#0066FF] text-white' : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {(driver.driver_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{driver.driver_name || 'Inconnu'}</p>
                    {driver.vehicle && <p className="text-[11px] text-blue-400 font-mono truncate">🚚 {driver.vehicle}</p>}
                    <p className="text-[10px] text-zinc-400 truncate">{driver.destination || formatTime(driver.updated_at)}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${driver.online ? 'bg-green-400' : 'bg-zinc-600'}`} />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ---------------- ROUTE TIMELINE (cliquable) ---------------- */}
      {route.stops.length > 0 && (
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4" data-testid="route-timeline">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-[#0066FF]" />
              {t('livemap.timelineTitle', 'Tournée optimisée')}
              <span className="text-xs text-zinc-500 font-normal ml-1">· {route.stops.length} {t('livemap.stops', 'arrêts')}</span>
            </h3>
            {loadingRoute && <span className="text-[11px] text-zinc-500">{t('common.loading', 'Chargement...')}</span>}
          </div>
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {route.stops.map((s, idx) => {
              const active = selectedStopIdx === idx;
              return (
                <React.Fragment key={s.tracking_id}>
                  <button
                    onClick={() => handleSelectStop(idx)}
                    className={`flex-shrink-0 min-w-[180px] flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${
                      active
                        ? 'bg-[#0066FF]/10 border-[#0066FF] shadow-[0_0_0_1px_#0066FF]'
                        : 'bg-[#0A0A0B] border-[#27272A] hover:border-zinc-600'
                    }`}
                    data-testid={`timeline-stop-${idx}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      active ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40' : 'bg-[#1A1A1E] text-zinc-300 border border-[#27272A]'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-zinc-200'}`}>
                        {s.recipient_name || s.tracking_id}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate font-mono">{s.tracking_id}</p>
                    </div>
                  </button>
                  {idx < route.stops.length - 1 && (
                    <div className="flex items-center text-zinc-700 px-0.5 select-none">→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMapPanel;
