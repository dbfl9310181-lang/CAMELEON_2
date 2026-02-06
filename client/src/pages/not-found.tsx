import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center paper-card p-12 max-w-lg w-full">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-4 text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 font-serif">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
