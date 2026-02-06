import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import Home from "@/pages/home";
import ModeSelection from "@/pages/mode-selection";
import CreateEntry from "@/pages/create-entry";
import CreatePortfolio from "@/pages/create-portfolio";
import ViewEntry from "@/pages/view-entry";
import Inspiration from "@/pages/inspiration";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        {() => <ProtectedRoute component={ModeSelection} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/create">
        {() => <ProtectedRoute component={ModeSelection} />}
      </Route>
      <Route path="/create/diary">
        {() => <ProtectedRoute component={CreateEntry} />}
      </Route>
      <Route path="/create/portfolio">
        {() => <ProtectedRoute component={CreatePortfolio} />}
      </Route>
      <Route path="/entry/:id">
        {() => <ProtectedRoute component={ViewEntry} />}
      </Route>
      <Route path="/inspiration">
        {() => <ProtectedRoute component={Inspiration} />}
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
