import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Trophy, 
  Radio, 
  Palette, 
  ImageIcon, 
  Video, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Loader2,
  Activity,
  FolderDown,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DemoModeToggle } from "@/components/dashboard/DemoModeToggle";
import logoIcon from "@/assets/logo-icon.jpeg";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Awards Manager", href: "/dashboard/awards", icon: Trophy },
  { name: "Templates", href: "/dashboard/templates", icon: Palette },
  { name: "Branding", href: "/dashboard/branding", icon: ImageIcon },
  { name: "Livestream", href: "/dashboard/livestream", icon: Radio },
  { name: "Stream Health", href: "/dashboard/stream-health", icon: Activity },
  { name: "Clip Generation", href: "/dashboard/clip-generation", icon: Video },
  { name: "All Clips", href: "/dashboard/all-clips", icon: FolderDown },
  { name: "Recipients & Delivery", href: "/dashboard/leads", icon: Users },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const workflowItems = [
  { name: "Awards", href: "/dashboard/awards", icon: Trophy },
  { name: "Templates", href: "/dashboard/templates", icon: Palette },
  { name: "Branding", href: "/dashboard/branding", icon: ImageIcon },
  { name: "Livestream", href: "/dashboard/livestream", icon: Radio },
  { name: "Clip Generation", href: "/dashboard/clip-generation", icon: Video },
  { name: "All Clips", href: "/dashboard/all-clips", icon: FolderDown },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    try { localStorage.setItem("sidebar-collapsed", String(collapsed)); } catch {}
  }, [collapsed]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col border-r border-border/60 transition-[width,transform] duration-200",
          "bg-sidebar",
          collapsed ? "w-16" : "w-[220px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ willChange: "width" }}
      >
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-3 px-3 py-4 border-b border-border/40 group"
        >
          <img
            src={logoIcon}
            alt="Awardscut"
            className="h-9 w-9 rounded-lg flex-shrink-0 transition-all duration-300 group-hover:brightness-125 group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
          />
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-foreground tracking-tight">Awardscut</span>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                  isActive 
                    ? "bg-primary/10 text-foreground border-l-2 border-primary -ml-px" 
                    : "text-muted-foreground hover:bg-card hover:text-foreground border-l-2 border-transparent -ml-px"
                )}
              >
                <item.icon className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-150",
                  !isActive && "group-hover:translate-x-0.5"
                )} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-border/40 space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 text-[13px]",
              collapsed && "justify-center px-0"
            )}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <LogOut className="h-[18px] w-[18px]" />
            )}
            {!collapsed && <span className="ml-3">{isLoggingOut ? "Logging out…" : "Log Out"}</span>}
          </Button>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-card"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-x-hidden flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ceremony workflow</p>
            </div>
            <DemoModeToggle />
          </div>
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
            {workflowItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <div key={item.href} className="flex items-center shrink-0">
                  <Link
                    to={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/50 bg-card text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.name}
                  </Link>
                  {index < workflowItems.length - 1 && <ArrowRight className="mx-1 h-3.5 w-3.5 text-muted-foreground/70" />}
                </div>
              );
            })}
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8 animate-fade-in" style={{ animationDuration: "180ms" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
