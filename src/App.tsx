import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CeremonyProvider } from "@/contexts/CeremonyContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eagerly loaded routes (landing + auth — needed fast)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

// Lazy loaded dashboard routes
const Payment = lazy(() => import("./pages/Payment"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const AwardsManager = lazy(() => import("./pages/dashboard/AwardsManager"));
const LivestreamManager = lazy(() => import("./pages/dashboard/LivestreamManager"));
const StreamHealth = lazy(() => import("./pages/dashboard/StreamHealth"));
const TemplatesManager = lazy(() => import("./pages/dashboard/TemplatesManager"));
const BrandingManager = lazy(() => import("./pages/dashboard/BrandingManager"));
const VideoEditor = lazy(() => import("./pages/dashboard/VideoEditor"));
const LeadsCRM = lazy(() => import("./pages/dashboard/LeadsCRM"));
const ClipGeneration = lazy(() => import("./pages/dashboard/ClipGeneration"));
const AllClips = lazy(() => import("./pages/dashboard/AllClips"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const WinnerPortal = lazy(() => import("./pages/WinnerPortal"));
const EventSetup = lazy(() => import("./pages/events/EventSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoModeProvider>
        <CeremonyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset" element={<LazyRoute><ResetPassword /></LazyRoute>} />
              <Route path="/pricing" element={<LazyRoute><Pricing /></LazyRoute>} />
              <Route path="/payment" element={<LazyRoute><Payment /></LazyRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><LazyRoute><Dashboard /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/billing" element={<ProtectedRoute><LazyRoute><Billing /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/awards" element={<ProtectedRoute><LazyRoute><AwardsManager /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/livestream" element={<ProtectedRoute><LazyRoute><LivestreamManager /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/stream-health" element={<ProtectedRoute><LazyRoute><StreamHealth /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><LazyRoute><TemplatesManager /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/branding" element={<ProtectedRoute><LazyRoute><BrandingManager /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/editor" element={<ProtectedRoute><LazyRoute><VideoEditor /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/leads" element={<ProtectedRoute><LazyRoute><LeadsCRM /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/clip-generation" element={<ProtectedRoute><LazyRoute><ClipGeneration /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/all-clips" element={<ProtectedRoute><LazyRoute><AllClips /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><LazyRoute><Analytics /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><LazyRoute><Settings /></LazyRoute></ProtectedRoute>} />
              <Route path="/winner" element={<LazyRoute><WinnerPortal /></LazyRoute>} />
              <Route path="/events/:id/setup" element={<LazyRoute><EventSetup /></LazyRoute>} />
              <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
            </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
        </CeremonyProvider>
        </DemoModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
