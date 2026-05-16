import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { dashboardApi, deliveriesApi, invoicesApi, driversApi, damageReportsApi, ecoScoresApi, adminDriversApi, notificationsApi } from '../services/api';
import { firestoreDrivers } from '../services/firebase';
import { generateInvoicePDF, generateAllInvoicesPDF } from '../services/pdfGenerator';
import BarcodeScanner from '../components/BarcodeScanner';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SettingsPage from './SettingsPage';
import { StatCard, GatedButton, LockedFeatureOverlay } from '../components/admin/DashboardHelpers';
import { DamageReportCard } from '../components/admin/DamageReportCard';
import { EcoScoresTab } from '../components/admin/EcoScoresTab';
import { NewDeliveryForm, NewDriverForm, AssignDeliveryForm } from '../components/admin/DashboardForms';
import { RevenueSparkline } from '../components/admin/RevenueSparkline';
import { useI18n } from '../i18n/index';
import { Button } from '../components/ui/button';
import { 
  Truck, Package, DollarSign, AlertTriangle, Leaf, Users, 
  Clock, CheckCircle, TrendingUp, LogOut, Menu, X,
  Plus, Eye, MapPin, FileText, Shield, RefreshCw, Bell,
  CreditCard, UserPlus, Trash2, Lock, Crown, Map, Settings as SettingsIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
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
  const { t } = useI18n();
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
      toast.error(`${t('toasts.error', 'Erreur')} : ${error.message}`);
    }
    setLoading(false);
  }, [t]);

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
      toast.success(t('toasts.deliveryCreated', 'Livraison créée'));
      setShowNewDelivery(false);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(e => e.msg || e).join(', ')
        : detail || error.message;
      toast.error(`${t('toasts.deliveryFailed', 'Échec création livraison')} : ${msg}`);
    }
  };

  const handleAssignDriver = async (trackingId, driverId) => {
    try {
      await deliveriesApi.assignDriver(trackingId, driverId);
      toast.success(t('toasts.assigned', 'Livraison assignée'));
      setShowAssignDriver(null);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : error.message;
      toast.error(`${t('toasts.assignFailed', "Erreur d'assignation")} : ${msg}`);
    }
  };

  const handleCreateDriver = async (driverData) => {
    try {
      await adminDriversApi.create(driverData);
      toast.success(t('toasts.driverAdded', 'Chauffeur ajouté'));
      setShowNewDriver(false);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : error.message;
      toast.error(`${t('toasts.error', 'Erreur')} : ${msg}`);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm(t('modals.deleteDriver.warning', 'Cette action est irréversible.'))) return;
    try {
      await adminDriversApi.delete(driverId);
      setDrivers(prev => prev.filter(d => d.id !== driverId));
      toast.success(t('toasts.driverDeleted', 'Chauffeur supprimé'));
      fetchData();
    } catch (error) {
      toast.error(`${t('toasts.error', 'Erreur')} : ${error.response?.data?.detail || error.message}`);
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
      toast.success(t('toasts.invoicePaid', 'Facture marquée comme payée'));
      fetchData();
    } catch (error) {
      toast.error(`${t('toasts.error', 'Erreur')} : ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDownloadDeliveryPdf = async (trackingId) => {
    try {
      await deliveriesApi.downloadReport(trackingId);
      toast.success(`${t('toasts.pdfDownloaded', 'PDF téléchargé')} : ${trackingId}`);
    } catch (error) {
      toast.error(`${t('toasts.error', 'Erreur')} : ${error.response?.data?.detail || error.message}`);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: t('sidebar.overview', "Vue d'ensemble"), icon: TrendingUp },
    { id: 'deliveries', label: t('sidebar.deliveries', 'Livraisons'), icon: Package },
    { id: 'livemap', label: t('sidebar.livemap', 'Carte Live'), icon: Map },
    ...(user?.role === 'admin' ? [{ id: 'cashflow', label: t('sidebar.cashflow', 'Cash-Flow'), icon: DollarSign }] : []),
    { id: 'drivers', label: t('sidebar.drivers', 'Chauffeurs'), icon: Users },
    { id: 'litiges', label: t('sidebar.litiges', 'Litiges'), icon: AlertTriangle },
    { id: 'eco', label: t('sidebar.eco', 'Éco-scores'), icon: Leaf },
    ...(user?.role === 'admin' ? [{ id: 'subscription', label: t('sidebar.subscription', 'Abonnement'), icon: CreditCard }] : []),
    { id: 'settings', label: t('sidebar.settings', 'Paramètres'), icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      <Toaster richColors position="top-right" />

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setShowScanner(false);
            toast.success(`${t('toasts.scanned', 'Code scanné')} : ${code}`);
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
              {t('sidebar.logout', 'Déconnexion')}
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
              {/* Language Switcher */}
              <LanguageSwitcher />
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
                  {t('actions.newDelivery', 'Nouvelle livraison')}
                </Button>
              )}
              {activeTab === 'drivers' && driverQuota.can_add && (
                <Button onClick={() => setShowNewDriver(true)} className="bg-[#0066FF] hover:bg-[#0052CC]" data-testid="new-driver-btn">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('modals.addDriver.title', 'Nouveau chauffeur')}
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
                  title={t('kpi.totalDeliveries', 'Livraisons totales')}
                  value={stats?.total_deliveries || 0}
                  icon={Package}
                  color="blue"
                />
                <StatCard
                  title={t('kpi.inTransit', 'En transit')}
                  value={stats?.in_transit || 0}
                  icon={Truck}
                  color="blue"
                />
                <StatCard
                  title={t('kpi.deliveredToday', "Livrées aujourd'hui")}
                  value={stats?.delivered_today || 0}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title={t('kpi.activeDisputes', 'Litiges actifs')}
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
                    {t('cashflow.title', 'Cash-Flow Instantané')}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1A1A1E] rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">{t('cashflow.blocked', 'Argent bloqué (camions)')}</p>
                    <p className="text-2xl font-bold font-mono text-yellow-400">
                      {(cashFlow?.money_blocked_in_trucks || 0).toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{cashFlow?.blocked_deliveries_count || 0} {t('kpi.totalDeliveries', 'livraisons').toLowerCase()}</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1E] rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">{t('cashflow.pending', 'Factures en attente')}</p>
                    <p className="text-2xl font-bold font-mono text-[#0066FF]">
                      {cashFlow?.pending_invoices_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1A1A1E] rounded-lg" data-testid="kpi-month-revenue">
                    <p className="text-sm text-zinc-400 mb-1">{t('cashflow.monthRevenue', 'CA ce mois')}</p>
                    <p className="text-2xl font-bold font-mono text-green-400">
                      {(cashFlow?.revenue_this_month || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    <RevenueSparkline data={cashFlow?.revenue_sparkline_30d || []} color="#22c55e" height={40} />
                    {cashFlow?.stripe_revenue_this_month > 0 && (
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {t('cashflow.stripeOf', 'dont Stripe')} : {cashFlow.stripe_revenue_this_month.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions with Gating */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GatedButton
                  label={t('actions.generateCmr', 'Générer e-CMR')}
                  icon={FileText}
                  feature="pdfGeneration"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => {
                    const result = generateAllInvoicesPDF(invoices);
                    if (result.count > 0) {
                      toast.success(`${result.count} ${t('toasts.invoicesGenerated', 'facture(s) PDF générée(s)')}`);
                    } else {
                      toast.info(t('toasts.noInvoices', 'Aucune facture en attente'));
                    }
                  }}
                />
                <GatedButton
                  label={t('actions.gpsMap', 'Carte GPS')}
                  icon={MapPin}
                  feature="gpsMap"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => setActiveTab('livemap')}
                />
                <GatedButton
                  label={t('actions.scanBarcode', 'Scan Code-barre')}
                  icon={Eye}
                  feature="scanBarcode"
                  hasFeature={hasFeature}
                  getMessage={getRestrictionMessage}
                  onClick={() => setShowScanner(true)}
                />
                <GatedButton
                  label={t('actions.clientPortal', 'Portail Client')}
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
                  <h3 className="font-semibold">{t('tabs.recentDeliveries', 'Dernières livraisons')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('kpi.trackingId', 'Tracking')}</th>
                        <th className="px-4 py-3 text-left">{t('kpi.recipient', 'Destinataire')}</th>
                        <th className="px-4 py-3 text-left">{t('kpi.status', 'Statut')}</th>
                        <th className="px-4 py-3 text-left">{t('kpi.driver', 'Chauffeur')}</th>
                        <th className="px-4 py-3 text-left">{t('kpi.action', 'Action')}</th>
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
                              {t(`status.${effectiveStatus}`, statusLabels[effectiveStatus])}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{d.driver_name || (d.driver_id ? drivers.find(dr => dr.id === d.driver_id)?.name : null) || '-'}</td>
                          <td className="px-4 py-3">
                            {!d.driver_id ? (
                              <button onClick={() => setShowAssignDriver(d.tracking_id)} className="text-xs text-[#0066FF] hover:underline font-medium" data-testid={`assign-btn-${d.tracking_id}`}>{t('actions.assign', 'Assigner')}</button>
                            ) : (
                              <span className="text-xs text-zinc-500">{t('status.assigned', 'Assigné')}</span>
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
                      <th className="px-4 py-3 text-left">{t('kpi.trackingId', 'Tracking')}</th>
                      <th className="px-4 py-3 text-left">{t('kpi.recipient', 'Destinataire')}</th>
                      <th className="px-4 py-3 text-left">{t('kpi.address', 'Adresse')}</th>
                      <th className="px-4 py-3 text-left">{t('kpi.status', 'Statut')}</th>
                      <th className="px-4 py-3 text-left">{t('kpi.driver', 'Chauffeur')}</th>
                      <th className="px-4 py-3 text-left">{t('kpi.action', 'Actions')}</th>
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
                            {t(`status.${effectiveStatus}`, statusLabels[effectiveStatus])}
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
                                {t('actions.assign', 'Assigner')}
                              </Button>
                            )}
                            {(d.status === 'delivered' || d.status === 'in_transit') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadDeliveryPdf(d.tracking_id)}
                                className="border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#1A1A1E]"
                                data-testid={`download-pdf-${d.tracking_id}`}
                                title={t('actions.downloadReportPdf', 'Télécharger le rapport (PDF)')}
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                PDF
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
                    {t('cashflow.bridgeTitle', 'Pont de Trésorerie')}
                  </h3>
                  <div className="text-4xl font-bold font-mono text-yellow-400 mb-2">
                    {(cashFlow?.money_blocked_in_trucks || 0).toLocaleString('fr-FR')} €
                  </div>
                  <p className="text-zinc-400">{t('cashflow.blockedDesc', 'Argent bloqué dans les camions')}</p>
                  <p className="text-sm text-zinc-500 mt-2">
                    {cashFlow?.blocked_deliveries_count || 0} {t('cashflow.blockedSubDesc', 'livraisons terminées en attente de paiement')}
                  </p>
                </div>

                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#0066FF]" />
                    {t('cashflow.facturXTitle', 'Factures Factur-X')}
                  </h3>
                  <div className="text-4xl font-bold font-mono text-[#0066FF] mb-2">
                    {cashFlow?.pending_invoices_count || 0}
                  </div>
                  <p className="text-zinc-400">{t('cashflow.pendingTitle', 'Factures en attente')}</p>
                  <Button 
                    onClick={() => {
                      if (!hasFeature('pdfGeneration')) {
                        toast.error(getRestrictionMessage('pdfGeneration'));
                        return;
                      }
                      const result = generateAllInvoicesPDF(invoices);
                      if (result.count > 0) {
                        toast.success(`${result.count} ${t('toasts.invoicesGenerated', 'facture(s) PDF générée(s)')}`);
                      } else {
                        toast.info(t('toasts.noPendingInvoices', 'Aucune facture en attente à générer'));
                      }
                    }}
                    className={`mt-3 ${hasFeature('pdfGeneration') ? 'bg-[#0066FF] hover:bg-[#0052CC]' : 'bg-zinc-700 cursor-not-allowed'}`}
                    data-testid="generate-pdf-btn"
                  >
                    {!hasFeature('pdfGeneration') && <Lock className="w-4 h-4 mr-2" />}
                    <FileText className="w-4 h-4 mr-2" />
                    {t('cashflow.generatePdfBtn', 'Générer e-CMR PDF')}
                  </Button>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#27272A]">
                  <h3 className="font-semibold">{t('cashflow.recentInvoices', 'Factures récentes')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="invoices-table">
                    <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('cashflow.invoiceNum', 'N° Facture')}</th>
                        <th className="px-4 py-3 text-left">{t('cashflow.delivery', 'Livraison')}</th>
                        <th className="px-4 py-3 text-left">{t('cashflow.amount', 'Montant')}</th>
                        <th className="px-4 py-3 text-left">{t('cashflow.status', 'Statut')}</th>
                        <th className="px-4 py-3 text-left">{t('cashflow.actions', 'Actions')}</th>
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
                              {inv.status === 'paid' ? t('cashflow.statusPaid', 'Payée') : inv.status === 'ready_to_send' ? t('cashflow.statusReady', 'Prête') : t('cashflow.statusPending', 'En attente')}
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
                                toast.success(`PDF ${inv.invoice_id} ${t('toasts.pdfDownloaded', 'téléchargé')}`);
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
                                {t('cashflow.markPaid', 'Marquer payée')}
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
                    {t('drivers.fleetMgmt', 'Gestion de Flotte')}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {driverQuota.max_drivers === -1 
                      ? t('drivers.unlimitedDrivers', `${drivers.length} chauffeurs (illimité)`).replace('{count}', drivers.length)
                      : t('drivers.driversCount', `${drivers.length} / ${driverQuota.max_drivers} chauffeurs`).replace('{current}', drivers.length).replace('{max}', driverQuota.max_drivers)}
                    <span className="ml-2 text-xs uppercase tracking-wider text-zinc-500">{t('drivers.plan', 'Plan')} {driverQuota.plan}</span>
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
                      {t('drivers.upgradePlan', 'Passer au niveau supérieur')}
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowNewDriver(true)}
                    className="bg-[#0066FF] hover:bg-[#0052CC]"
                    disabled={driverQuota.max_drivers !== -1 && drivers.length >= driverQuota.max_drivers}
                    data-testid="add-driver-btn"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('drivers.addDriver', 'Ajouter un chauffeur')}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title={t('drivers.totalDrivers', 'Total chauffeurs')}
                  value={drivers.length}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title={t('drivers.active', 'Actifs')}
                  value={drivers.filter(d => d.status === 'active').length}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title={t('drivers.onMission', 'En mission')}
                  value={drivers.filter(d => d.in_progress > 0).length}
                  icon={Truck}
                  color="yellow"
                />
                <StatCard
                  title={t('drivers.avgScore', 'Score moyen')}
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
                        <p className="text-xs text-zinc-400">{t('drivers.completed', 'Terminées')}</p>
                        <p className="text-xl font-bold font-mono text-green-400">{driver.completed_deliveries || 0}</p>
                      </div>
                      <div className="p-3 bg-[#1A1A1E] rounded-lg text-center">
                        <p className="text-xs text-zinc-400">{t('drivers.inProgress', 'En cours')}</p>
                        <p className="text-xl font-bold font-mono text-[#0066FF]">{driver.in_progress || 0}</p>
                      </div>
                      <div className="p-3 bg-[#1A1A1E] rounded-lg text-center">
                        <p className="text-xs text-zinc-400">{t('drivers.ecoScore', 'Éco-score')}</p>
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
                  title={t('litiges.totalReports', 'Total rapports')}
                  value={damageReports.length}
                  icon={Shield}
                  color="blue"
                />
                <StatCard
                  title={t('litiges.damagesDetected', 'Dommages détectés')}
                  value={damageReports.filter(r => r.ai_analysis?.is_damaged).length}
                  icon={AlertTriangle}
                  color="red"
                  pulse={damageReports.filter(r => r.ai_analysis?.is_damaged).length > 0}
                />
                <StatCard
                  title={t('litiges.packagesIntact', 'Colis intacts')}
                  value={damageReports.filter(r => !r.ai_analysis?.is_damaged).length}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title={t('litiges.avgConfidence', 'Confiance moy.')}
                  value={damageReports.length > 0 ? Math.round(damageReports.reduce((a, r) => a + (r.ai_analysis?.confidence || 0), 0) / damageReports.length) + '%' : '0%'}
                  icon={Eye}
                  color="blue"
                />
              </div>

              {damageReports.length === 0 ? (
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-12 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium">{t('litiges.noDisputes', 'Aucun litige détecté')}</p>
                  <p className="text-zinc-400">{t('litiges.driversCanReport', 'Les chauffeurs peuvent signaler des dommages via le bouton Photo')}</p>
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
          <DialogTitle>{t('modals.newDelivery.title', 'Nouvelle livraison')}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t('modals.newDelivery.subtitle', 'Créez une nouvelle livraison pour votre flotte')}
          </DialogDescription>
          </DialogHeader>
          <NewDeliveryForm drivers={drivers} onSubmit={handleNewDelivery} onCancel={() => setShowNewDelivery(false)} />
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog - NOUVEAU POPUP COMPLET */}
      <Dialog open={!!showAssignDriver} onOpenChange={() => setShowAssignDriver(null)}>
        <DialogContent className="bg-[#121214] border border-[#27272A] text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('modals.assignDriver.title', 'Assigner une livraison')}</DialogTitle>
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
                toast.error(t('toasts.assignFailed', "Erreur d'assignation"));
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
            <DialogTitle>{t('modals.addDriver.title', 'Nouveau chauffeur')}</DialogTitle>
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
              {t('modals.notifications.title', 'Notifications')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">{t('modals.notifications.empty', 'Aucune notification')}</p>
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

export default AdminDashboard;
