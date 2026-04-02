import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, deliveriesApi, invoicesApi, driversApi, damageReportsApi, ecoScoresApi, adminDriversApi, notificationsApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Truck, Package, DollarSign, AlertTriangle, Leaf, Users, 
  Clock, CheckCircle, XCircle, TrendingUp, LogOut, Menu, X,
  Plus, Eye, MapPin, FileText, Shield, RefreshCw, Bell,
  CreditCard, UserPlus, Trash2
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [ecoSummary, setEcoSummary] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNewDelivery, setShowNewDelivery] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(null);
  const [showNewDriver, setShowNewDriver] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, cashRes, delRes, invRes, drvRes, dmgRes, ecoRes, notifRes, unreadRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCashFlow(),
        deliveriesApi.getAll(),
        invoicesApi.getAll(),
        adminDriversApi.getAll(),
        damageReportsApi.getAll(),
        ecoScoresApi.getSummary(),
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount()
      ]);
      setStats(statsRes.data);
      setCashFlow(cashRes.data);
      setDeliveries(delRes.data);
      setInvoices(invRes.data);
      setDrivers(drvRes.data);
      setDamageReports(dmgRes.data);
      setEcoSummary(ecoRes.data);
      setNotifications(notifRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
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
      toast.error('Erreur lors de la création');
    }
  };

  const handleAssignDriver = async (trackingId, driverId) => {
    try {
      await deliveriesApi.assignDriver(trackingId, driverId);
      toast.success('Chauffeur assigné');
      setShowAssignDriver(null);
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleCreateDriver = async (driverData) => {
    try {
      await adminDriversApi.create(driverData);
      toast.success('Chauffeur créé avec succès');
      setShowNewDriver(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce chauffeur ?')) return;
    try {
      await adminDriversApi.delete(driverId);
      toast.success('Chauffeur désactivé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
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
      toast.error('Erreur');
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'deliveries', label: 'Livraisons', icon: Package },
    { id: 'cashflow', label: 'Cash-Flow', icon: DollarSign },
    { id: 'drivers', label: 'Chauffeurs', icon: Users },
    { id: 'litiges', label: 'Litiges', icon: AlertTriangle },
    { id: 'eco', label: 'Éco-scores', icon: Leaf },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      <Toaster richColors position="top-right" />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#121214] border-r border-[#27272A] transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 p-4 border-b border-[#27272A]">
          <div className="w-10 h-10 bg-[#0066FF] rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg">Transporter-Pro</span>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              data-testid={`nav-${item.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-[#0066FF] text-white' 
                  : 'text-zinc-400 hover:bg-[#1A1A1E] hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.id === 'litiges' && damageReports.filter(r => r.ai_analysis?.is_damaged).length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#27272A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1E] flex items-center justify-center">
              <span className="text-sm font-medium">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full border-[#27272A] text-zinc-400 hover:text-white"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0A0A0B]/80 backdrop-blur-lg border-b border-[#27272A] px-4 lg:px-6 py-4">
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
              {activeTab === 'drivers' && (
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]">
                      {deliveries.slice(0, 5).map((d) => (
                        <tr key={d.tracking_id} className="hover:bg-[#1A1A1E]/50">
                          <td className="px-4 py-3 font-mono text-sm">{d.tracking_id}</td>
                          <td className="px-4 py-3">{d.recipient_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[d.status]}`}>
                              {statusLabels[d.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{d.driver_id || '-'}</td>
                        </tr>
                      ))}
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
                  <tbody className="divide-y divide-[#27272A]">
                    {deliveries.map((d) => (
                      <tr key={d.tracking_id} className="hover:bg-[#1A1A1E]/50">
                        <td className="px-4 py-3 font-mono text-sm">{d.tracking_id}</td>
                        <td className="px-4 py-3">{d.recipient_name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">{d.recipient_address}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[d.status]}`}>
                            {statusLabels[d.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{d.driver_id || '-'}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cash Flow Tab */}
          {activeTab === 'cashflow' && (
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
                    <tbody className="divide-y divide-[#27272A]">
                      {invoices.map((inv) => (
                        <tr key={inv.invoice_id} className="hover:bg-[#1A1A1E]/50">
                          <td className="px-4 py-3 font-mono text-sm">{inv.invoice_id}</td>
                          <td className="px-4 py-3 font-mono text-sm">{inv.delivery_id}</td>
                          <td className="px-4 py-3 font-mono">{inv.amount?.toLocaleString('fr-FR')} €</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              inv.status === 'paid' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'
                            }`}>
                              {inv.status === 'paid' ? 'Payée' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {inv.status !== 'paid' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkPaid(inv.invoice_id)}
                                className="bg-green-600 hover:bg-green-700"
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
          )}

          {/* Drivers Tab */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">
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
                        className="text-zinc-400 hover:text-red-400"
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
            <div className="space-y-4">
              {damageReports.length === 0 ? (
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-12 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium">Aucun litige détecté</p>
                  <p className="text-zinc-400">Tous les colis sont en bon état</p>
                </div>
              ) : (
                damageReports.map((report) => (
                  <div 
                    key={report.report_id} 
                    className={`bg-[#121214] border rounded-xl p-6 ${
                      report.ai_analysis?.is_damaged ? 'border-red-500/50' : 'border-[#27272A]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-mono text-sm text-zinc-400">{report.report_id}</p>
                        <p className="font-semibold mt-1">Livraison: {report.delivery_id}</p>
                      </div>
                      {report.ai_analysis?.is_damaged && (
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-500/10 text-red-400">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          Dommage détecté
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#1A1A1E] rounded-lg">
                        <p className="text-xs text-zinc-400 mb-1">Sévérité</p>
                        <p className="font-semibold capitalize">{report.ai_analysis?.damage_severity || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-[#1A1A1E] rounded-lg">
                        <p className="text-xs text-zinc-400 mb-1">Confiance IA</p>
                        <p className="font-mono font-semibold">{report.ai_analysis?.confidence || 0}%</p>
                      </div>
                      <div className="p-4 bg-[#1A1A1E] rounded-lg">
                        <p className="text-xs text-zinc-400 mb-1">Blockchain</p>
                        <p className="font-mono text-xs text-green-400 truncate">
                          {report.blockchain_proof?.hash?.substring(0, 16)}...
                        </p>
                      </div>
                    </div>
                    {report.ai_analysis?.description && (
                      <p className="mt-4 text-sm text-zinc-400">{report.ai_analysis.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Eco Scores Tab */}
          {activeTab === 'eco' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-400" />
                    Score Éco-conduite Moyen
                  </h3>
                  <div className="text-5xl font-bold font-mono text-green-400">
                    {stats?.avg_eco_score || 0}
                  </div>
                  <p className="text-zinc-400 mt-2">Sur 100 points</p>
                </div>
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Impact Environnemental</h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    Rapport mensuel disponible pour négocier vos primes d'assurance
                  </p>
                  <Button className="bg-[#0066FF] hover:bg-[#0052CC]">
                    <FileText className="w-4 h-4 mr-2" />
                    Générer rapport PDF
                  </Button>
                </div>
              </div>

              <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#27272A]">
                  <h3 className="font-semibold">Résumé par chauffeur</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Chauffeur</th>
                        <th className="px-4 py-3 text-left">Score moyen</th>
                        <th className="px-4 py-3 text-left">Distance (km)</th>
                        <th className="px-4 py-3 text-left">CO2 (kg)</th>
                        <th className="px-4 py-3 text-left">Carburant (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]">
                      {ecoSummary.map((eco) => (
                        <tr key={eco._id} className="hover:bg-[#1A1A1E]/50">
                          <td className="px-4 py-3">{eco._id}</td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-semibold ${
                              eco.avg_score >= 80 ? 'text-green-400' : 
                              eco.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{Math.round(eco.avg_score)}</span>
                          </td>
                          <td className="px-4 py-3 font-mono">{Math.round(eco.total_distance)}</td>
                          <td className="px-4 py-3 font-mono">{Math.round(eco.total_co2)}</td>
                          <td className="px-4 py-3 font-mono">{Math.round(eco.total_fuel)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* New Delivery Dialog */}
      <Dialog open={showNewDelivery} onOpenChange={setShowNewDelivery}>
        <DialogContent className="bg-[#121214] border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle>Nouvelle livraison</DialogTitle>
          </DialogHeader>
          <NewDeliveryForm onSubmit={handleNewDelivery} onCancel={() => setShowNewDelivery(false)} />
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={!!showAssignDriver} onOpenChange={() => setShowAssignDriver(null)}>
        <DialogContent className="bg-[#121214] border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle>Assigner un chauffeur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {drivers.filter(d => d.status === 'active').map((driver) => (
              <button
                key={driver.id}
                onClick={() => handleAssignDriver(showAssignDriver, driver.id)}
                className="w-full flex items-center gap-4 p-4 bg-[#1A1A1E] hover:bg-[#27272A] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A0A0B] flex items-center justify-center">
                  <span className="font-medium">{driver.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-zinc-400">{driver.vehicle_plate || driver.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">{driver.in_progress || 0} en cours</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Driver Dialog */}
      <Dialog open={showNewDriver} onOpenChange={setShowNewDriver}>
        <DialogContent className="bg-[#121214] border-[#27272A] text-white">
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

const NewDeliveryForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    package_description: '',
    weight_kg: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nom du destinataire</Label>
        <Input
          value={formData.recipient_name}
          onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="space-y-2">
        <Label>Adresse</Label>
        <Input
          value={formData.recipient_address}
          onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
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
      <div className="space-y-2">
        <Label>Description du colis</Label>
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
          type="number"
          step="0.1"
          min="0.1"
          value={formData.weight_kg}
          onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-[#27272A]">
          Annuler
        </Button>
        <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-[#0052CC]">
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

export default AdminDashboard;
