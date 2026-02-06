import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, PenTool, LogOut, User, Sparkles, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "new", icon: PenTool },
    { href: "/history", label: "record", icon: BookOpen },
    { href: "/inspiration", label: "trend", icon: Sparkles },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full bg-secondary/50 border-b border-border backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-primary/20">
              <img src={logoImage} alt="CAMELEON" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">CAMELEON</h1>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-secondary/95 backdrop-blur-md border-b border-border shadow-lg">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                      isActive
                        ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              {user && (
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={user.firstName || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{user.firstName || "User"}</span>
                    <button
                      onClick={() => {
                        logout();
                        handleNavClick();
                      }}
                      className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:h-screen sticky top-0 z-40 bg-secondary/50 border-r border-border backdrop-blur-sm flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <img src={logoImage} alt="CAMELEON" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">CAMELEON</h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                  isActive
                    ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.firstName || "User"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.firstName || "User"}</p>
                <button
                  onClick={() => logout()}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
