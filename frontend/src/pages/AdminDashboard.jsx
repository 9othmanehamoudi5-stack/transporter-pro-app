import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { dashboardApi, deliveriesApi, invoicesApi, driversApi, damageReportsApi, ecoScoresApi, adminDriversApi, notificationsApi } from '../services/api';
import { firestoreDrivers } from '../services/firebase';
import { generateInvoicePDF, generateAllInvoicesPDF } from '../services/pdfGenerator';
import BarcodeScanner from '../components/BarcodeScanner';
import ThemeToggle from '../components/ThemeToggle';
import SettingsPage from './SettingsPage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Truck, Package, DollarSign, AlertTriangle, Leaf, Users, 
  Clock, CheckCircle, XCircle, TrendingUp, LogOut, Menu, X,
  Plus, Eye, MapPin, FileText, Shield, RefreshCw, Bell,
  CreditCard, UserPlus, Trash2, Lock, Crown, Camera, Map, Settings as SettingsIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Toaster, toast } from 'sonner';
import SubscriptionPage from './SubscriptionPage';

const LiveMapPanel = lazy(() => import('./LiveMapPanel'));

const statusLabels = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En cours',
  delivered: 'Livré',
  failed: 'Échoué'
};

const statusColors = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  assigned: 'text-blue-400 bg-blue-400/10',
  in_transit: 'text-blue-400 bg-blue-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10'
};

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { plan, hasFeature, getRestrictionMessage, getPlanInfo, canAccessPage } = useSubscription();
  const planInfo = getPlanInfo();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [ecoSummary, setEcoSummary] = useState([]);
  const [ecoDailyAvg, setEcoDailyAvg] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNewDelivery, setShowNewDelivery] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(null);
  const [showNewDriver, setShowNewDriver] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [firestoreDriversList, setFirestoreDriversList] = useState([]);
  const [driverQuota, setDriverQuota] = useState({ driver_count: 0, max_drivers: 3, can_add: true, plan: 'solo' });

  // Fetch Firestore drivers
  useEffect(() => {
    const fetchFirestoreDrivers = async () => {
      try {
        const driversFromFirestore = await firestoreDrivers.getAll();
        setFirestoreDriversList(driversFromFirestore);
      } catch (error) {
        console.log('Firestore drivers not available, using backend');
      }
    };
    fetchFirestoreDrivers();
    
    // Subscribe to real-time updates
    const unsubscribe = firestoreDrivers.subscribe((drivers) => {
      setFirestoreDriversList(drivers);
    });
    
    return () => unsubscribe && unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getCashFlow(),
        deliveriesApi.getAll(),
        invoicesApi.getAll(),
        adminDriversApi.getAll(),
        damageReportsApi.getAll(),
        ecoScoresApi.getSummary(),
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount(),
        ecoScoresApi.getDailyAvg()
      ]);
      
      const get = (i) => results[i].status === 'fulfilled' ? results[i].value.data : null;
      
      if (get(0)) setStats(get(0));
      if (get(1)) setCashFlow(get(1));
      if (get(2)) setDeliveries(get(2));
      if (get(3)) setInvoices(get(3));
      if (get(4)) setDrivers(get(4));
      if (get(5)) setDamageReports(get(5));
      if (get(6)) setEcoSummary(get(6));
      if (get(7)) setNotifications(get(7));
      if (get(8)) setUnreadCount(get(8).count);
      if (get(9)) setEcoDailyAvg(get(9));

      // Fetch quota separately (non-blocking)
      try {
        const quotaRes = await adminDriversApi.getQuota();
        if (quotaRes.data) setDriverQuota(quotaRes.data);
      } catch {}

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`${failed.length} API(s) en erreur:`, failed.map(r => r.reason?.message));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Erreur chargement : ${error.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res.data.count);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleNewDelivery = async (data) => {
    try {
      await deliveriesApi.create(data);
      toast.success('Livraison créée avec succès');
      setShowNewDelivery(false);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(e => e.msg || e).join(', ')
        : detail || error.message;
      toast.error(`Erreur création : ${msg}`);
    }
  };

  const handleAssignDriver = async (trackingId, driverId) => {
    try {
      await deliveriesApi.assignDriver(trackingId, driverId);
      toast.success('Chauffeur assigné');
      setShowAssignDriver(null);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : error.message;
      toast.error(`Erreur assignation : ${msg}`);
    }
  };

  const handleCreateDriver = async (driverData) => {
    try {
      await adminDriversApi.create(driverData);
      toast.success('Chauffeur créé avec succès');
      setShowNewDriver(false);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : error.message;
      toast.error(`Erreur : ${msg}`);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Supprimer ce chauffeur ? Cette action est irréversible.')) return;
    try {
      await adminDriversApi.delete(driverId);
      setDrivers(prev => prev.filter(d => d.id !== driverId));
      toast.success('Chauffeur supprimé');
      fetchData();
    } catch (error) {
      toast.error(`Erreur suppression : ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await notificationsApi.markRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await invoicesApi.markPaid(invoiceId);
      toast.success('Facture marquée comme payée');
      fetchData();
    } catch (error) {
      toast.error(`Erreur paiement : ${error.response?.data?.detail || error.message}`);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'deliveries', label: 'Livraisons', icon: Package },
    { id: 'livemap', label: 'Carte Live', icon: Map },
    ...(user?.role === 'admin' ? [{ id: 'cashflow', label: 'Cash-Flow', icon: DollarSign }] : []),
    { id: 'drivers', label: 'Chauffeurs', icon: Users },
    { id: 'litiges', label: 'Litiges', icon: AlertTriangle },
    { id: 'eco', label: 'Éco-scores', icon: Leaf },
    ...(user?.role === 'admin' ? [{ id: 'subscription', label: 'Abonnement', icon: CreditCard }] : []),
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      <Toaster richColors position="top-right" />

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setShowScanner(false);
            toast.success(`Code scanné : ${code}`);
            setShowNewDelivery(true);
            // Auto-fill will be handled by the new delivery form
            window.__scannedBarcode = code;
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9998] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[9999] w-64 bg-[#0A0A0B] border-r border-[#27272A] transform transition-transform lg:transform-none flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 p-4 border-b border-[#27272A]">
          <div className="w-10 h-10 bg-[#0066FF] rounded-lg flex items-center justify-center overflow-hidden" data-testid="sidebar-logo">
            {user?.logo_base64 ? (
              <img src={user.logo_base64} alt="Logo" className="w-full h-full object-contain bg-white" />
            ) : (
              <Truck className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-lg block">Transporter-Pro</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${planInfo.color}`} data-testid="plan-badge">
              <Crown className="w-3 h-3" />
              {planInfo.badge}
            </span>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isLocked = !canAccessPage(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isLocked) {
                    const featureMap = { cashflow: 'cashFlowDashboard', eco: 'ecoScore', livemap: 'gpsMap' };
                    const msg = getRestrictionMessage(featureMap[item.id] || item.id);
                    toast.error(msg);
                    return;
                  }
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                data-testid={`nav-${item.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-[#0066FF] text-white' 
                    : isLocked
                      ? 'text-zinc-600 hover:bg-[#1A1A1E] cursor-not-allowed'
                      : 'text-zinc-400 hover:bg-[#1A1A1E] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isLocked && <Lock className="w-4 h-4 ml-auto text-zinc-600" />}
                {!isLocked && item.id === 'litiges' && damageReports.filter(r => r.ai_analysis?.is_damaged).length > 0 && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-[#0A0A0B] border-t border-[#27272A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1E] flex items-center justify-center">
              <span className="text-sm font-medium">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              onClick={logout} 
              variant="outline" 
              className="flex-1 border border-[#27272A] text-zinc-400 hover:text-white hover:bg-[#1A1A1E]"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0A0A0B]/95 backdrop-blur-lg border-b border-[#27272A] px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl lg:text-2xl font-bold">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications Bell */}
              <div className="relative">
                <Button 
                  onClick={() => { setShowNotifications(true); handleMarkNotificationsRead(); }} 
                  variant="outline" 
                  size="icon" 
                  className="border-[#27272A] relative"
                  data-testid="notifications-btn"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
              <Button onClick={fetchData} variant="outline" size="icon" className="border-[#27272A]">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {activeTab === 'deliveries' && (
                <Button onClick={() => setShowNewDelivery(true)} className="bg-[#0066FF] hover:bg-[#0052CC]" data-testid="new-delivery-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle livraison
                </Button>
              )}
              {activeTab === 'drivers' && driverQuota.can_add && (
                <Button onClick={() => setShowNewDriver(true)} className="bg-[#0066FF] hover:bg-[#0052CC]" data-testid="new-driver-btn">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nouveau chauffeur
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Livraisons totales"
                  value={stats?.total_deliveries || 0}
                  icon={Package}
                  color="blue"
                />
                <StatCard
                  title="En transit"
                  value={stats?.in_transit || 0}
                  icon={Truck}
                  color="blue"
                />
                <StatCard
                  title="Livrées aujourd'hui"
                  value={stats?.delivered_today || 0}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title="Litiges actifs"
                  value={stats?.active_litiges || 0}
                  icon={AlertTriangle}
                  color="red"
                  pulse={stats?.active_litiges > 0}
                />
              </div>

              {/* Cash Flow Card */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6" data-testid="cashflow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#0066FF]" />
                    Cash-Flow Instantané
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1A1A1E] rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">Argent bloqué (camions)</p>
                    <p className="text-2xl font-bold font-mono text-yellow-400">
                      {(cashFlow?.money_blocked_in_trucks || 0).toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{cashFlow?.blocked_deliveries_count || 0} livraisons</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1E] rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">Factures en attente</p>
                    <p className="text-2xl font-bold font-mono text-[#0066FF]">
                      {cashFlow?.pending_invoices_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1A1A1E] rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">CA ce mois</p>
                    <p className="text-2xl font-bold font-mono text-green-400">
                      {(cashFlow?.revenue_this_month || 0).toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions with Gating */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GatedButton
                  label="Générer e-CMR"
                  icon={FileText}
                  feature="pdfGeneration"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => {
                    const result = generateAllInvoicesPDF(invoices);
                    if (result.count > 0) {
                      toast.success(`${result.count} facture(s) PDF générée(s)`);
                    } else {
                      toast.info('Aucune facture en attente');
                    }
                  }}
                />
                <GatedButton
                  label="Carte GPS"
                  icon={MapPin}
                  feature="gpsMap"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => setActiveTab('livemap')}
                />
                <GatedButton
                  label="Scan Code-barre"
                  icon={Eye}
                  feature="scanBarcode"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => setShowScanner(true)}
                />
                <GatedButton
                  label="Portail Client"
                  icon={Users}
                  feature="clientPortal"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => window.open('/track', '_blank')}
                />
              </div>

              {/* Recent Deliveries */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#27272A]">
                  <h3 className="font-semibold">Dernières livraisons</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Tracking</th>
                        <th className="px-4 py-3 text-left">Destinataire</th>
                        <th className="px-4 py-3 text-left">Statut</th>
                        <th className="px-4 py-3 text-left">Chauffeur</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.slice(0, 5).map((d) => {
                        const hasDriver = !!(d.driver_id || d.driver_name);
                        const effectiveStatus = hasDriver && d.status === 'pending' ? 'assigned' : d.status;
                        return (
                        <tr key={d.tracking_id} className="hover:bg-[#1A1A1E]/50">
                          <td className="px-4 py-3 font-mono text-sm">{d.tracking_id}</td>
                          <td className="px-4 py-3">{d.recipient_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[effectiveStatus]}`} data-testid={`status-badge-${d.tracking_id}`}>
                              {statusLabels[effectiveStatus]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{d.driver_name || (d.driver_id ? drivers.find(dr => dr.id === d.driver_id)?.name : null) || '-'}</td>
                          <td className="px-4 py-3">
                            {!d.driver_id ? (
                              <button onClick={() => setShowAssignDriver(d.tracking_id)} className="text-xs text-[#0066FF] hover:underline font-medium" data-testid={`assign-btn-${d.tracking_id}`}>Assigner</button>
                            ) : (
                              <span className="text-xs text-zinc-500">Assigné</span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Deliveries Tab */}
          {activeTab === 'deliveries' && (
            <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="deliveries-table">
                  <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Tracking</th>
                      <th className="px-4 py-3 text-left">Destinataire</th>
                      <th className="px-4 py-3 text-left">Adresse</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-left">Chauffeur</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => {
                      const hasDriver = !!(d.driver_id || d.driver_name);
                      const effectiveStatus = hasDriver && d.status === 'pending' ? 'assigned' : d.status;
                      return (
                      <tr key={d.tracking_id} className="hover:bg-[#1A1A1E]/50">
                        <td className="px-4 py-3 font-mono text-sm">{d.tracking_id}</td>
                        <td className="px-4 py-3">{d.recipient_name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">{d.recipient_address}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[effectiveStatus]}`} data-testid={`deliveries-status-${d.tracking_id}`}>
                            {statusLabels[effectiveStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{d.driver_name || (d.driver_id ? drivers.find(dr => dr.id === d.driver_id)?.name : null) || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {!d.driver_id && d.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => setShowAssignDriver(d.tracking_id)}
                                className="bg-[#0066FF] hover:bg-[#0052CC]"
                                data-testid={`assign-driver-${d.tracking_id}`}
                              >
                                Assigner
                              </Button>
                            )}
                            {d.blockchain_proof && (
                              <Button size="sm" variant="outline" className="border-[#27272A]">
                                <Shield className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* Live Map Tab */}
          {activeTab === 'livemap' && (
            !hasFeature('gpsMap') ? (
              <LockedFeatureOverlay
                feature="gpsMap"
                message={getRestrictionMessage('gpsMap')}
                onUpgrade={() => setActiveTab('subscription')}
              />
            ) : (
              <Suspense fallback={
                <div className="flex items-center justify-center h-96">
                  <RefreshCw className="w-8 h-8 text-[#0066FF] animate-spin" />
                </div>
              }>
                <LiveMapPanel />
              </Suspense>
            )
          )}

          {/* Cash Flow Tab */}
          {activeTab === 'cashflow' && (
            !hasFeature('cashFlowDashboard') ? (
              <LockedFeatureOverlay
                feature="cashFlowDashboard"
                message={getRestrictionMessage('cashFlowDashboard')}
                onUpgrade={() => setActiveTab('subscription')}
              />
            ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Pont de Trésorerie
                  </h3>
                  <div className="text-4xl font-bold font-mono text-yellow-400 mb-2">
                    {(cashFlow?.money_blocked_in_trucks || 0).toLocaleString('fr-FR')} €
                  </div>
                  <p className="text-zinc-400">Argent bloqué dans les camions</p>
                  <p className="text-sm text-zinc-500 mt-2">
                    {cashFlow?.blocked_deliveries_count || 0} livraisons terminées en attente de paiement
                  </p>
                </div>

                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#0066FF]" />
                    Factures Factur-X
                  </h3>
                  <div className="text-4xl font-bold font-mono text-[#0066FF] mb-2">
                    {cashFlow?.pending_invoices_count || 0}
                  </div>
                  <p className="text-zinc-400">Factures en attente</p>
                  <Button 
                    onClick={() => {
                      if (!hasFeature('pdfGeneration')) {
                        toast.error(getRestrictionMessage('pdfGeneration'));
                        return;
                      }
                      const result = generateAllInvoicesPDF(invoices);
                      if (result.count > 0) {
                        toast.success(`${result.count} facture(s) PDF générée(s)`);
                      } else {
                        toast.info('Aucune facture en attente à générer');
                      }
                    }}
                    className={`mt-3 ${hasFeature('pdfGeneration') ? 'bg-[#0066FF] hover:bg-[#0052CC]' : 'bg-zinc-700 cursor-not-allowed'}`}
                    data-testid="generate-pdf-btn"
                  >
                    {!hasFeature('pdfGeneration') && <Lock className="w-4 h-4 mr-2" />}
                    <FileText className="w-4 h-4 mr-2" />
                    Générer e-CMR PDF
                  </Button>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#27272A]">
                  <h3 className="font-semibold">Factures récentes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="invoices-table">
                    <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">N° Facture</th>
                        <th className="px-4 py-3 text-left">Livraison</th>
                        <th className="px-4 py-3 text-left">Montant</th>
                        <th className="px-4 py-3 text-left">Statut</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.invoice_id} className="hover:bg-[#1A1A1E]/50">
                          <td className="px-4 py-3 font-mono text-sm">{inv.invoice_id}</td>
                          <td className="px-4 py-3 font-mono text-sm">{inv.delivery_id}</td>
                          <td className="px-4 py-3 font-mono">{inv.amount?.toLocaleString('fr-FR')} €</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              inv.status === 'paid' ? 'text-green-400 bg-green-400/10' : 
                              inv.status === 'ready_to_send' ? 'text-blue-400 bg-blue-400/10' :
                              'text-yellow-400 bg-yellow-400/10'
                            }`}>
                              {inv.status === 'paid' ? 'Payée' : inv.status === 'ready_to_send' ? 'Prête' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                if (!hasFeature('pdfGeneration')) {
                                  toast.error(getRestrictionMessage('pdfGeneration'));
                                  return;
                                }
                                generateInvoicePDF(inv);
                                toast.success(`PDF ${inv.invoice_id} téléchargé`);
                              }}
                              variant="outline"
                              className="border-[#27272A] text-zinc-400 hover:text-white"
                              data-testid={`pdf-${inv.invoice_id}`}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              PDF
                            </Button>
                            {inv.status !== 'paid' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkPaid(inv.invoice_id)}
                                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                                data-testid={`mark-paid-${inv.invoice_id}`}
                              >
                                Marquer payée
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
            )
          )}

          {/* Drivers Tab */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">
              {/* Quota bar */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-testid="driver-quota-bar">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0066FF]" />
                    Gestion de Flotte
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {driverQuota.max_drivers === -1 
                      ? `${drivers.length} chauffeurs (illimité)` 
                      : `${drivers.length} / ${driverQuota.max_drivers} chauffeurs`}
                    <span className="ml-2 text-xs uppercase tracking-wider text-zinc-500">Plan {driverQuota.plan}</span>
                  </p>
                  {/* Progress bar */}
                  {driverQuota.max_drivers !== -1 && (
                    <div className="w-48 h-1.5 bg-[#27272A] rounded-full mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${drivers.length < driverQuota.max_drivers ? 'bg-[#0066FF]' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, (drivers.length / driverQuota.max_drivers) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(driverQuota.max_drivers !== -1 && drivers.length >= driverQuota.max_drivers) && (
                    <Button
                      onClick={() => setActiveTab('subscription')}
                      className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                      data-testid="upgrade-fleet-btn"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Passer au niveau supérieur
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowNewDriver(true)}
                    className="bg-[#0066FF] hover:bg-[#0052CC]"
                    disabled={driverQuota.max_drivers !== -1 && drivers.length >= driverQuota.max_drivers}
                    data-testid="add-driver-btn"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter un chauffeur
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total chauffeurs"
                  value={drivers.length}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Actifs"
                  value={drivers.filter(d => d.status === 'active').length}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title="En mission"
                  value={drivers.filter(d => d.in_progress > 0).length}
                  icon={Truck}
                  color="yellow"
                />
                <StatCard
                  title="Score moyen"
                  value={Math.round(drivers.reduce((a, d) => a + (d.eco_score || 0), 0) / (drivers.length || 1))}
                  icon={Leaf}
                  color="green"
                />
              </div>

              {/* Drivers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <div key={driver.id} className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#1A1A1E] flex items-center justify-center">
                          <span className="text-lg font-medium">{driver.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-sm text-zinc-400">{driver.email}</p>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDeleteDriver(driver.id)}
                        onTouchEnd={(e) => { e.preventDefault(); handleDeleteDriver(driver.id); }}
                        className="text-zinc-400 hover:text-red-400 touch-manipulation"
                        data-testid={`delete-driver-${driver.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {driver.vehicle_plate && (
                      <p className="text-sm text-zinc-400 mb-4">
                        <Truck className="w-4 h-4 inline mr-2" />
                        {driver.vehicle_plate}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-[#1A1A1E] rounded-lg text-center">
                        <p className="text-xs text-zinc-400">Terminées</p>
                        <p className="text-xl font-bold font-mono text-green-400">{driver.completed_deliveries || 0}</p>
                      </div>
                      <div className="p-3 bg-[#1A1A1E] rounded-lg text-center">
                        <p className="text-xs text-zinc-400">En cours</p>
                        <p className="text-xl font-bold font-mono text-[#0066FF]">{driver.in_progress || 0}</p>
                      </div>
                      <div className="p-3 bg-[#1A1A1E] rounded-lg text-center">
                        <p className="text-xs text-zinc-400">Éco-score</p>
                        <p className={`text-xl font-bold font-mono ${
                          driver.eco_score >= 80 ? 'text-green-400' : 
                          driver.eco_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{driver.eco_score || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <SubscriptionPage />
          )}

          {/* Litiges Tab */}
          {activeTab === 'litiges' && (
            <div className="space-y-4" data-testid="litiges-tab">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total rapports"
                  value={damageReports.length}
                  icon={Shield}
                  color="blue"
                />
                <StatCard
                  title="Dommages détectés"
                  value={damageReports.filter(r => r.ai_analysis?.is_damaged).length}
                  icon={AlertTriangle}
                  color="red"
                  pulse={damageReports.filter(r => r.ai_analysis?.is_damaged).length > 0}
                />
                <StatCard
                  title="Colis intacts"
                  value={damageReports.filter(r => !r.ai_analysis?.is_damaged).length}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title="Confiance moy."
                  value={damageReports.length > 0 ? Math.round(damageReports.reduce((a, r) => a + (r.ai_analysis?.confidence || 0), 0) / damageReports.length) + '%' : '0%'}
                  icon={Eye}
                  color="blue"
                />
              </div>

              {damageReports.length === 0 ? (
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-12 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium">Aucun litige détecté</p>
                  <p className="text-zinc-400">Les chauffeurs peuvent signaler des dommages via le bouton Photo</p>
                </div>
              ) : (
                damageReports.map((report) => (
                  <DamageReportCard key={report.report_id} report={report} onRetrySuccess={fetchData} />
                ))
              )}
            </div>
          )}

          {/* Eco Scores Tab */}
          {activeTab === 'eco' && (
            !hasFeature('ecoScore') ? (
              <LockedFeatureOverlay
                feature="ecoScore"
                message={getRestrictionMessage('ecoScore')}
                onUpgrade={() => setActiveTab('subscription')}
              />
            ) : (
            <EcoScoresTab
              stats={stats}
              ecoSummary={ecoSummary}
              ecoDailyAvg={ecoDailyAvg}
              drivers={drivers}
              fetchData={fetchData}
            />
            )
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </main>

      {/* New Delivery Dialog */}
      <Dialog open={showNewDelivery} onOpenChange={setShowNewDelivery}>
        <DialogContent className="bg-[#121214] border border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle>Nouvelle livraison</DialogTitle>
          </DialogHeader>
          <NewDeliveryForm drivers={drivers} onSubmit={handleNewDelivery} onCancel={() => setShowNewDelivery(false)} />
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog - NOUVEAU POPUP COMPLET */}
      <Dialog open={!!showAssignDriver} onOpenChange={() => setShowAssignDriver(null)}>
        <DialogContent className="bg-[#121214] border border-[#27272A] text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Assigner une livraison</DialogTitle>
          </DialogHeader>
          <AssignDeliveryForm 
            trackingId={showAssignDriver}
            delivery={deliveries.find(d => d.tracking_id === showAssignDriver)}
            drivers={firestoreDriversList.length > 0 ? firestoreDriversList : drivers}
            onSubmit={async (data) => {
              try {
                await handleAssignDriver(showAssignDriver, data.driver_id);
                // Update delivery info if changed
                if (data.client_name || data.address) {
                  await deliveriesApi.update(showAssignDriver, {
                    recipient_name: data.client_name,
                    recipient_address: data.address
                  });
                }
                setShowAssignDriver(null);
                fetchData();
              } catch (error) {
                toast.error('Erreur lors de l\'assignation');
              }
            }}
            onCancel={() => setShowAssignDriver(null)}
          />
        </DialogContent>
      </Dialog>

      {/* New Driver Dialog */}
      <Dialog open={showNewDriver} onOpenChange={setShowNewDriver}>
        <DialogContent className="bg-[#121214] border border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle>Nouveau chauffeur</DialogTitle>
          </DialogHeader>
          <NewDriverForm onSubmit={handleCreateDriver} onCancel={() => setShowNewDriver(false)} />
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-[#121214] border-[#27272A] text-white max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">Aucune notification</p>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border ${
                    notif.read ? 'bg-[#1A1A1E] border-[#27272A]' : 'bg-[#0066FF]/10 border-[#0066FF]/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">{notif.message}</p>
                    </div>
                    {notif.type === 'delivery_complete' && (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                    {notif.type === 'new_mission' && (
                      <Package className="w-5 h-5 text-[#0066FF] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {new Date(notif.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// ==================== ECO SCORES TAB (extracted) ====================
const EcoScoresTab = ({ stats, ecoSummary, ecoDailyAvg, drivers, fetchData }) => {
  const [recalculating, setRecalculating] = React.useState(false);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await ecoScoresApi.recalculate();
      toast.success('Scores recalculés avec succès !');
      fetchData();
    } catch {
      toast.error('Erreur lors du recalcul');
    }
    setRecalculating(false);
  };

  const top3 = ecoSummary.slice(0, 3);
  const medals = ['gold', 'silver', 'bronze'];
  const medalColors = {
    gold: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
    silver: 'from-zinc-400/20 to-zinc-500/5 border-zinc-400/30',
    bronze: 'from-orange-600/20 to-orange-700/5 border-orange-600/30'
  };
  const medalIcons = ['1er', '2e', '3e'];

  return (
    <div className="space-y-6" data-testid="eco-scores-tab">
      {/* Top row: Score moyen + Recalculate */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-400" />
            Éco-conduite
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Scores calculés à partir des livraisons et rapports IA</p>
        </div>
        <Button
          onClick={handleRecalculate}
          disabled={recalculating}
          variant="outline"
          className="border-[#27272A] text-zinc-300"
          data-testid="recalculate-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalcul...' : 'Recalculer'}
        </Button>
      </div>

      {/* Podium - Top 3 */}
      {top3.length > 0 && (
        <div data-testid="eco-podium">
          <h3 className="text-lg font-semibold mb-4">Top 3 de la semaine</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((driver, i) => (
              <div
                key={driver._id}
                className={`bg-gradient-to-br ${medalColors[medals[i]]} border rounded-2xl p-5 text-center transition-transform hover:scale-[1.02]`}
                data-testid={`podium-${i + 1}`}
              >
                <div className="text-3xl mb-2">
                  {i === 0 ? <span className="inline-block w-10 h-10 leading-10 rounded-full bg-yellow-500/20 text-yellow-400 font-black text-lg">{medalIcons[i]}</span> : 
                   i === 1 ? <span className="inline-block w-10 h-10 leading-10 rounded-full bg-zinc-400/20 text-zinc-300 font-black text-lg">{medalIcons[i]}</span> :
                   <span className="inline-block w-10 h-10 leading-10 rounded-full bg-orange-500/20 text-orange-400 font-black text-lg">{medalIcons[i]}</span>}
                </div>
                <p className="font-bold text-lg text-white truncate">{driver.driver_name}</p>
                <p className={`text-3xl font-mono font-black mt-1 ${
                  driver.avg_score >= 80 ? 'text-green-400' : 
                  driver.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>{Math.round(driver.avg_score)}</p>
                <p className="text-xs text-zinc-400 mt-1">points / 100</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score moyen card + Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400 mb-2">Score moyen entreprise</p>
          <p className="text-5xl font-bold font-mono text-green-400" data-testid="avg-eco-score">{stats?.avg_eco_score || 0}</p>
          <p className="text-xs text-zinc-500 mt-2">sur 100</p>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400 mb-2">CO2 total</p>
          <p className="text-3xl font-bold font-mono text-blue-400" data-testid="total-co2">
            {Math.round(ecoSummary.reduce((a, e) => a + (e.total_co2 || 0), 0))}
          </p>
          <p className="text-xs text-zinc-500 mt-2">kg émis</p>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400 mb-2">Distance totale</p>
          <p className="text-3xl font-bold font-mono text-purple-400" data-testid="total-distance">
            {Math.round(ecoSummary.reduce((a, e) => a + (e.total_distance || 0), 0))}
          </p>
          <p className="text-xs text-zinc-500 mt-2">km parcourus</p>
        </div>
      </div>

      {/* Line Chart - 30 day evolution */}
      <EcoChart data={ecoDailyAvg} />

      {/* Driver table */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
          <h3 className="font-semibold">Résumé par chauffeur</h3>
          <Button
            variant="outline"
            className="border-[#27272A] text-xs"
            onClick={() => {
              const content = `RAPPORT ÉCO-CONDUITE - TRANSPORTER-PRO\n${'='.repeat(40)}\nDate: ${new Date().toLocaleDateString('fr-FR')}\nScore moyen: ${stats?.avg_eco_score || 0}/100\nChauffeurs: ${ecoSummary.length}\n\n${ecoSummary.map(e => `${e.driver_name}: Score ${Math.round(e.avg_score)} | ${Math.round(e.total_distance)}km | CO2: ${Math.round(e.total_co2)}kg`).join('\n')}\n\nRéduction assurance estimée: -${(stats?.avg_eco_score || 0) >= 80 ? '15' : (stats?.avg_eco_score || 0) >= 60 ? '10' : '5'}%`;
              const blob = new Blob([content], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `rapport-eco-${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
              toast.success('Rapport téléchargé');
            }}
            data-testid="eco-report-btn"
          >
            <FileText className="w-3 h-3 mr-1" />
            Exporter
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="eco-driver-table">
            <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Chauffeur</th>
                <th className="px-4 py-3 text-left">Score moyen</th>
                <th className="px-4 py-3 text-left">Distance (km)</th>
                <th className="px-4 py-3 text-left">CO2 (kg)</th>
                <th className="px-4 py-3 text-left">Carburant (L)</th>
              </tr>
            </thead>
            <tbody>
              {ecoSummary.map((eco, i) => (
                <tr key={eco._id} className="hover:bg-[#1A1A1E]/50 border-t border-[#27272A]/50">
                  <td className="px-4 py-3 text-zinc-500 font-mono text-sm">{i + 1}</td>
                  <td className="px-4 py-3 font-medium" data-testid={`driver-name-${i}`}>{eco.driver_name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${
                      eco.avg_score >= 80 ? 'text-green-400' : 
                      eco.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{Math.round(eco.avg_score)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{Math.round(eco.total_distance)}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{Math.round(eco.total_co2)}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{Math.round(eco.total_fuel)}</td>
                </tr>
              ))}
              {ecoSummary.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Aucune donnée éco-score. Cliquez "Recalculer" pour générer les scores.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== ECO CHART (Recharts) ====================
const EcoChart = ({ data }) => {
  // Inline import to avoid top-level import for lazy-loaded tab
  const [ChartComponents, setChartComponents] = React.useState(null);

  React.useEffect(() => {
    import('recharts').then(mod => {
      setChartComponents({
        ResponsiveContainer: mod.ResponsiveContainer,
        LineChart: mod.LineChart,
        Line: mod.Line,
        XAxis: mod.XAxis,
        YAxis: mod.YAxis,
        Tooltip: mod.Tooltip,
        CartesianGrid: mod.CartesianGrid,
        Area: mod.Area,
        AreaChart: mod.AreaChart
      });
    });
  }, []);

  if (!ChartComponents || !data || data.length === 0) {
    return (
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#0066FF]" />
          Évolution du score (30 jours)
        </h3>
        <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
          {!ChartComponents ? 'Chargement du graphique...' : 'Aucune donnée sur les 30 derniers jours'}
        </div>
      </div>
    );
  }

  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } = ChartComponents;

  const chartData = data.map(d => ({
    date: d.date.slice(5), // MM-DD
    score: d.avg_score,
    chauffeurs: d.drivers_count
  }));

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6" data-testid="eco-chart">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#0066FF]" />
        Évolution du score moyen (30 jours)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={{ stroke: '#27272A' }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 12 }} axisLine={{ stroke: '#27272A' }} />
            <Tooltip
              contentStyle={{ background: '#1A1A1E', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ color: '#A1A1AA' }}
              formatter={(value, name) => [Math.round(value), name === 'score' ? 'Score' : 'Chauffeurs']}
            />
            <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#scoreGradient)" dot={{ fill: '#22c55e', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};



const LockedFeatureOverlay = ({ feature, message, onUpgrade }) => (
  <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-12 text-center" data-testid={`locked-${feature}`}>
    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
      <Lock className="w-8 h-8 text-zinc-500" />
    </div>
    <h3 className="text-xl font-semibold mb-2">Fonctionnalité verrouillée</h3>
    <p className="text-zinc-400 mb-6 max-w-md mx-auto">{message}</p>
    <Button
      onClick={onUpgrade}
      className="bg-[#0066FF] hover:bg-[#0052CC] px-8"
      data-testid={`upgrade-from-${feature}`}
    >
      <Crown className="w-4 h-4 mr-2" />
      Changer de plan
    </Button>
  </div>
);

const GatedButton = ({ label, icon: Icon, feature, hasFeature, getMessage, onClick }) => {
  const locked = !hasFeature(feature);
  return (
    <button
      onClick={() => {
        if (locked) {
          toast.error(getMessage(feature));
          return;
        }
        onClick();
      }}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        locked 
          ? 'bg-[#121214] border-[#27272A] opacity-50 cursor-not-allowed' 
          : 'bg-[#121214] border-[#27272A] hover:border-[#0066FF] hover:bg-[#0066FF]/5 cursor-pointer'
      }`}
      data-testid={`gated-${feature}`}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${locked ? 'text-zinc-600' : 'text-[#0066FF]'}`} />
        {locked && <Lock className="w-3 h-3 text-zinc-500 absolute -bottom-1 -right-1" />}
      </div>
      <span className={`text-xs font-medium ${locked ? 'text-zinc-600' : 'text-zinc-300'}`}>{label}</span>
    </button>
  );
};


const StatCard = ({ title, value, icon: Icon, color, pulse }) => {
  const colorClasses = {
    blue: 'text-[#0066FF] bg-[#0066FF]/10',
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10'
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 lg:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <p className="text-2xl lg:text-3xl font-bold font-mono">{value}</p>
      <p className="text-sm text-zinc-400 mt-1">{title}</p>
    </div>
  );
};

const SEVERITY_CONFIG = {
  none: { label: 'Aucun', color: 'text-green-400 bg-green-400/10', barColor: 'bg-green-400' },
  minor: { label: 'Faible', color: 'text-yellow-400 bg-yellow-400/10', barColor: 'bg-yellow-400' },
  moderate: { label: 'Moyenne', color: 'text-orange-400 bg-orange-400/10', barColor: 'bg-orange-400' },
  severe: { label: 'Élevée', color: 'text-red-400 bg-red-400/10', barColor: 'bg-red-400' },
  unknown: { label: 'Inconnue', color: 'text-zinc-400 bg-zinc-400/10', barColor: 'bg-zinc-400' }
};

const DamageReportCard = ({ report, onRetrySuccess }) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const analysis = report.ai_analysis || {};
  const severity = SEVERITY_CONFIG[analysis.damage_severity] || SEVERITY_CONFIG.unknown;
  const confidence = analysis.confidence || 0;
  const hasError = !!(
    analysis.damage_severity === 'unknown' ||
    confidence === 0 ||
    (analysis.description && (
      analysis.description.includes('Analyse automatique impossible') ||
      analysis.description.includes('Erreur') ||
      analysis.description.includes('Error') ||
      analysis.description.includes('Failed') ||
      analysis.description.includes('INVALID_ARGUMENT') ||
      analysis.description.includes('unavailable')
    ))
  );

  const loadPhoto = async () => {
    if (photoUrl || !report.has_photo) return;
    setLoadingPhoto(true);
    try {
      const res = await damageReportsApi.getPhoto(report.report_id);
      if (res.data?.photo_base64) {
        setPhotoUrl(`data:image/jpeg;base64,${res.data.photo_base64}`);
      }
    } catch (e) {
      console.warn('Failed to load photo');
    }
    setLoadingPhoto(false);
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await damageReportsApi.retry(report.report_id);
      if (res.data?.ai_analysis) {
        toast.success('Analyse relancée avec succès');
        if (onRetrySuccess) onRetrySuccess();
      }
    } catch (e) {
      toast.error('Échec de la relance');
    }
    setRetrying(false);
  };

  // Clean error message for display
  const displayDescription = hasError
    ? 'Analyse automatique impossible - Image non reconnue ou format incompatible'
    : analysis.description;

  return (
    <div 
      className={`bg-[#121214] border rounded-xl overflow-hidden ${
        analysis.is_damaged ? 'border-red-500/30' : 'border-[#27272A]'
      }`}
      data-testid={`damage-report-${report.report_id}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-zinc-500">{report.report_id}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severity.color}`}>
                {severity.label}
              </span>
            </div>
            <p className="font-semibold mt-1">Livraison : {report.delivery_id}</p>
            {report.driver_name && <p className="text-sm text-zinc-400">Chauffeur : {report.driver_name}</p>}
          </div>
          {analysis.is_damaged ? (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
              Dommage détecté
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle className="w-4 h-4" />
              Colis intact
            </span>
          )}
        </div>

        {/* AI Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Severity */}
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <p className="text-xs text-zinc-400 mb-2">Sévérité</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${severity.color}`}>
              {severity.label}
            </span>
            {analysis.damage_type && (
              <p className="text-xs text-zinc-500 mt-2">Type : {analysis.damage_type}</p>
            )}
          </div>

          {/* Confidence */}
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <p className="text-xs text-zinc-400 mb-2">Confiance IA</p>
            <p className="text-2xl font-bold font-mono mb-2">{confidence}%</p>
            <div className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${severity.barColor}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Blockchain Proof */}
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <p className="text-xs text-zinc-400 mb-2">Preuve horodatée</p>
            <p className="font-mono text-xs text-green-400 truncate mb-1">
              {report.blockchain_proof?.hash?.substring(0, 24)}...
            </p>
            <p className="text-xs text-zinc-500">
              {report.created_at ? new Date(report.created_at).toLocaleString('fr-FR') : ''}
            </p>
          </div>
        </div>

        {/* AI Description */}
        {displayDescription && !hasError && (
          <div className="p-4 bg-[#0066FF]/5 border border-[#0066FF]/20 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#0066FF] font-medium mb-1">Analyse Gemini Vision</p>
                <p className="text-sm text-zinc-300">{displayDescription}</p>
              </div>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-400 font-medium mb-1">Analyse en erreur</p>
                  <p className="text-sm text-zinc-400">{displayDescription}</p>
                </div>
              </div>
              {report.has_photo && (
                <Button
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white flex-shrink-0"
                  data-testid={`retry-analysis-${report.report_id}`}
                >
                  {retrying ? (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Analyse...</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Relancer</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {report.has_photo && (
          <div>
            {!photoUrl ? (
              <Button 
                onClick={loadPhoto} 
                variant="outline" 
                className="border-[#27272A] text-zinc-400"
                disabled={loadingPhoto}
                data-testid={`load-photo-${report.report_id}`}
              >
                {loadingPhoto ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Chargement...</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" /> Voir la photo</>
                )}
              </Button>
            ) : (
              <div className="mt-2">
                <img 
                  src={photoUrl} 
                  alt="Photo du colis" 
                  className="max-h-64 rounded-lg border border-[#27272A] object-contain"
                  data-testid={`photo-preview-${report.report_id}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


const NewDeliveryForm = ({ drivers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    package_description: '',
    weight_kg: 1,
    driver_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Chauffeur assigné</Label>
        <select
          value={formData.driver_id}
          onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
          className="w-full h-12 bg-[#0A0A0B] border border-[#27272A] rounded-lg px-3 text-white text-sm"
          data-testid="delivery-driver-select"
        >
          <option value="">— Non assigné —</option>
          {(drivers || []).map(d => (
            <option key={d.id} value={d.id}>{d.name} {d.vehicle_plate ? `(${d.vehicle_plate})` : ''}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Nom du destinataire</Label>
        <Input
          value={formData.recipient_name}
          onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="delivery-recipient-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Adresse</Label>
        <Input
          value={formData.recipient_address}
          onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="delivery-address"
        />
      </div>
      <div className="space-y-2">
        <Label>Téléphone</Label>
        <Input
          value={formData.recipient_phone}
          onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Description colis</Label>
          <Input
            value={formData.package_description}
            onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
            required
            className="bg-[#0A0A0B] border-[#27272A]"
          />
        </div>
        <div className="space-y-2">
          <Label>Poids (kg)</Label>
          <Input
            type="number" step="0.1" min="0.1"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
            required
            className="bg-[#0A0A0B] border-[#27272A]"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-[#27272A]">
          Annuler
        </Button>
        <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-[#0052CC]" data-testid="delivery-submit-btn">
          Créer
        </Button>
      </div>
    </form>
  );
};

const NewDriverForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle_plate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nom complet</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Jean Dupont"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="jean@example.com"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="space-y-2">
        <Label>Mot de passe</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          placeholder="••••••••"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="space-y-2">
        <Label>Téléphone</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="06 12 34 56 78"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="space-y-2">
        <Label>Immatriculation véhicule</Label>
        <Input
          value={formData.vehicle_plate}
          onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
          placeholder="AB-123-CD"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-[#27272A]">
          Annuler
        </Button>
        <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-[#0052CC]">
          Créer le compte
        </Button>
      </div>
    </form>
  );
};

// Formulaire d'assignation de livraison avec dropdown chauffeurs
const AssignDeliveryForm = ({ trackingId, delivery, drivers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    client_name: delivery?.recipient_name || '',
    address: delivery?.recipient_address || '',
    driver_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.driver_id) {
      toast.error('Veuillez sélectionner un chauffeur');
      return;
    }
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="assign-delivery-form">
      {/* Tracking ID Display */}
      <div className="p-3 bg-[#1A1A1E] rounded-lg">
        <p className="text-xs text-zinc-400">Livraison</p>
        <p className="font-mono font-semibold text-[#0066FF]">{trackingId}</p>
      </div>

      {/* Nom du Client */}
      <div className="space-y-2">
        <Label htmlFor="client_name">Nom du Client</Label>
        <Input
          id="client_name"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          placeholder="Entrez le nom du client"
          className="h-12 bg-[#0A0A0B] border border-[#27272A] focus:border-[#0066FF]"
          data-testid="client-name-input"
        />
      </div>

      {/* Adresse de Livraison */}
      <div className="space-y-2">
        <Label htmlFor="address">Adresse de Livraison</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Entrez l'adresse complète"
          className="h-12 bg-[#0A0A0B] border border-[#27272A] focus:border-[#0066FF]"
          data-testid="address-input"
        />
      </div>

      {/* Liste déroulante des Chauffeurs */}
      <div className="space-y-2">
        <Label htmlFor="driver">Chauffeur</Label>
        <Select 
          value={formData.driver_id} 
          onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
        >
          <SelectTrigger 
            className="h-12 bg-[#0A0A0B] border border-[#27272A] focus:border-[#0066FF]"
            data-testid="driver-select"
          >
            <SelectValue placeholder="Sélectionnez un chauffeur" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1E] border border-[#27272A]">
            {drivers.length === 0 ? (
              <SelectItem value="none" disabled>Aucun chauffeur disponible</SelectItem>
            ) : (
              drivers.map((driver) => (
                <SelectItem 
                  key={driver.id} 
                  value={driver.id}
                  className="hover:bg-[#27272A] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{driver.name}</span>
                    {driver.vehicle_plate && (
                      <span className="text-zinc-400 text-sm">({driver.vehicle_plate})</span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1 h-12 border border-[#27272A] hover:bg-[#1A1A1E]"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.driver_id}
          className="flex-1 h-12 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50"
          data-testid="confirm-assign-btn"
        >
          {isSubmitting ? 'Assignation...' : 'Confirmer l\'Assignation'}
        </Button>
      </div>
    </form>
  );
};

export default AdminDashboard;
