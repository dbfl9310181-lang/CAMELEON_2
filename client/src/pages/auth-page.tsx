import { useAuth } from "@/hooks/use-auth";
import { Loader2, PenLine } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Panel - Branding */}
      <div className="w-full md:w-1/2 bg-secondary/30 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 mb-8">
            <PenLine className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Remember every moment,<br/>
            <span className="text-primary italic font-serif">without writing.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-serif leading-relaxed max-w-md">
            Your personal auto-diary assistant. Let AI transform your photos into beautiful journal entries.
          </p>
        </div>
        
        <div className="relative z-10 mt-12 md:mt-0 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Tabscape. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to continue your journaling journey</p>
          </div>

          <a 
            href="/api/login" 
            className="
              w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl
              bg-primary hover:bg-primary/90 text-primary-foreground font-semibold
              shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
              transition-all duration-300 group
            "
          >
            <span>Continue with Replit</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </a>
          
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
