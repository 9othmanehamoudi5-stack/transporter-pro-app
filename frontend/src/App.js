import React from "react";
import "@/App.css";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";

// AppRouter switches between HashRouter for file:// and BrowserRouter for web
const AppRouter = ({ children }) => {
  const isFile = typeof window !== "undefined" && window.location.protocol === "file:";
  return isFile ? <HashRouter>{children}</HashRouter> : <BrowserRouter>{children}</BrowserRouter>;
};
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import { ClientPortal, TrackingSearch } from "./pages/ClientPortal";
import LandingPage from "./pages/LandingPage";
const InteractiveHub = React.lazy(() => import("./components/interactive/InteractiveHub"));
import NexumHero from "./pages/NexumHero";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import { CGUPage, CGVPage, ConfidentialitePage, ContactPage, MentionsLegalesPage } from "./pages/LegalPages";
import OnboardingForm from "./pages/OnboardingForm";
import TransporterBot from "./components/TransporterBot";
import CookieBanner from "./components/CookieBanner";
import SubscriptionGate from "./components/SubscriptionGate";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
  const { user, loading, loginDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auto fallback to demo user on Netlify / offline preview
  if (!user) {
    if (loginDemo) {
      loginDemo('admin');
      return <AdminDashboard />;
    }
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      if (!user.onboarding_complete && !user.is_demo) {
        return <OnboardingForm />;
      }
      if (user.subscription_status !== "active" && user.subscription_status !== "trialing" && !user.is_demo) {
        return <SubscriptionGate user={user} />;
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
          <AppRouter>
            <CookieBanner />
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

              {/* Forgot / Reset password — public */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
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
              <Route path="/nexum" element={<NexumHero />} />
              <Route path="/hero" element={<NexumHero />} />
              <Route path="/3d" element={<Navigate to="/dashboard?view=interactive" replace />} />
              <Route path="/diorama" element={<Navigate to="/dashboard?view=interactive" replace />} />

              {/* Legal pages */}
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/cgu" element={<CGUPage />} />
              <Route path="/cgv" element={<CGVPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppRouter>
        </div>
      </SubscriptionProvider>
      </AuthGate>
      </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
