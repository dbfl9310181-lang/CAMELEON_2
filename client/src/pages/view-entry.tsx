import { useEntry, useDeleteEntry } from "@/hooks/use-entries";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Calendar, MapPin, Clock, Trash2, Music, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader } from "@/components/ui/section-header";

interface SongRecommendation {
  id: number;
  title: string;
  artist: string;
  youtubeUrl: string;
  mood: string;
  genre: string | null;
  tags: string | null;
}

interface RecommendationsResponse {
  mood: string;
  songs: SongRecommendation[];
}

export default function ViewEntry() {
  const [match, params] = useRoute("/entry/:id");
  const id = parseInt(params?.id || "0");
  const { data: entry, isLoading, error } = useEntry(id);
  const deleteMutation = useDeleteEntry();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ["/api/entries", id, "recommendations"],
    queryFn: async () => {
      const res = await fetch(`/api/entries/${id}/recommendations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json() as Promise<RecommendationsResponse>;
    },
    enabled: !!entry && !isLoading,
  });

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

      <div className="mt-16">
        <div className="flex items-center gap-3 mb-8">
          <Music className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-display font-bold text-foreground">Songs for this mood</h2>
          {recommendations?.mood && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {recommendations.mood}
            </span>
          )}
        </div>

        {recsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground font-serif italic">Analyzing mood...</span>
          </div>
        ) : recommendations?.songs && recommendations.songs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.songs.map((song) => (
              <div key={song.id} className="paper-card p-5 flex items-center justify-between gap-4 group hover:border-primary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {song.mood}
                  </span>
                </div>
                <a
                  href={song.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl transition-all duration-300"
                  title="Play on YouTube"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="paper-card p-8 text-center">
            <Music className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-serif italic">No song recommendations available for this mood yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
