import { useEntry, useDeleteEntry } from "@/hooks/use-entries";
import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Calendar, MapPin, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader } from "@/components/ui/section-header";

export default function ViewEntry() {
  const [match, params] = useRoute("/entry/:id");
  const id = parseInt(params?.id || "0");
  const { data: entry, isLoading, error } = useEntry(id);
  const deleteMutation = useDeleteEntry();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deleted", description: "Entry removed successfully." });
      setLocation("/");
    } catch (err) {
      toast({ title: "Error", description: "Could not delete entry.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-display font-bold mb-2">Entry not found</h2>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Journal
      </Link>

      <article className="paper-card p-8 md:p-12 mb-8 relative overflow-hidden">
        {/* Paper texture overlay could go here */}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-8 border-b border-border/50">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              {format(new Date(entry.date), "MMMM d, yyyy")}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(entry.date), "EEEE")}
              </span>
              {entry.photos?.[0]?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {entry.photos[0].location}
                </span>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors self-start md:self-auto"
            title="Delete Entry"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="prose prose-lg prose-stone max-w-none font-serif leading-loose text-foreground/90">
           {/* Simple whitespace handling for now - ideal would be markdown renderer */}
           {entry.content.split('\n').map((paragraph, i) => (
             <p key={i} className="mb-6">{paragraph}</p>
           ))}
        </div>
      </article>

      <SectionHeader title="Moments" className="mt-16 mb-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entry.photos.map((photo, i) => (
          <div key={photo.id} className="paper-card p-4 group">
            <div className="aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-muted relative">
              {/* <!-- person looking at sunset --> */}
              <img 
                src={photo.url || `https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&auto=format&fit=crop&q=80`} 
                alt={photo.description}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider uppercase text-primary">Moment {i + 1}</span>
              {photo.takenAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {photo.takenAt}
                </span>
              )}
            </div>
            
            <p className="font-serif text-sm text-foreground/80 italic">
              "{photo.description}"
            </p>
            
            {(photo.location || photo.weather) && (
              <div className="mt-3 pt-3 border-t border-border/50 flex gap-3 text-xs text-muted-foreground">
                {photo.location && <span>📍 {photo.location}</span>}
                {photo.weather && <span>⛅ {photo.weather}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
