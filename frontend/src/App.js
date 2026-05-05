import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import { ClientPortal, TrackingSearch } from "./pages/ClientPortal";
import LandingPage from "./pages/LandingPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import { CGUPage, ConfidentialitePage, ContactPage } from "./pages/LegalPages";
import OnboardingForm from "./pages/OnboardingForm";
import TransporterBot from "./components/TransporterBot";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./i18n/index";
import { Toaster } from "./components/ui/sonner";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "admin") return <Navigate to="/dashboard" replace />;
    if (user.role === "driver") return <Navigate to="/driver" replace />;
    if (user.role === "client") return <Navigate to="/client-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Dashboard Router - redirects to appropriate dashboard based on role
const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      if (!user.onboarding_complete) {
        return <OnboardingForm />;
      }
      // STRICT subscription gate: admin can't access dashboard without active Stripe subscription
      // subscription_status must be 'active' or 'trialing' (set by Stripe webhook after successful checkout)
      if (user.subscription_status !== "active" && user.subscription_status !== "trialing") {
        return (
          <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#121214] border border-[#27272A] rounded-2xl p-8 text-center" data-testid="subscription-required-gate">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0h-2m9-7a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Paiement requis</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Vous devez finaliser votre souscription Stripe avant d'accéder au tableau de bord.
                L'essai de 30 jours est activé immédiatement après enregistrement de votre carte (débit 0€).
              </p>
              <a
                href={`https://buy.stripe.com/test_eVq9AUfAI9bq11R4Su7IY04?prefilled_email=${encodeURIComponent(user.email || "")}`}
                className="block w-full h-12 leading-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl transition-colors"
                data-testid="subscription-gate-stripe-btn"
              >
                Activer mon essai →
              </a>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
                data-testid="subscription-gate-logout"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        );
      }
      return <AdminDashboard />;
    case "driver":
      return <Navigate to="/driver" replace />;
    case "client":
      return <Navigate to="/client-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Client Dashboard - for logged in clients
const ClientDashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Bienvenue, {user?.name}</h1>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-[#1A1A1E] hover:bg-[#27272A] rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
          <p className="text-zinc-400 mb-4">
            Utilisez le portail de suivi pour suivre vos colis.
          </p>
          <a 
            href="/track" 
            className="inline-flex items-center px-6 py-3 bg-[#0066FF] hover:bg-[#0052CC] rounded-lg font-semibold transition-colors"
          >
            Suivre un colis
          </a>
        </div>
      </div>
    </div>
  );
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Full-screen loading spinner while auth state is being determined
const AuthGate = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-3 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Chargement...</p>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <I18nProvider>
      <AuthGate>
        <SubscriptionProvider>
        <div className="App min-h-screen bg-[#0A0A0B]">
          <Toaster richColors position="top-right" />
          <TransporterBot />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              
              {/* Client tracking portal - public */}
              <Route path="/track" element={<TrackingSearch />} />
              <Route path="/track/:trackingId" element={<ClientPortal />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<DashboardRouter />} />
              
              <Route path="/driver" element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/client-dashboard" element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              
              {/* Default redirect */}
              <Route path="/" element={<LandingPage />} />

              {/* Legal pages */}
              <Route path="/cgu" element={<CGUPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </SubscriptionProvider>
      </AuthGate>
      </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
