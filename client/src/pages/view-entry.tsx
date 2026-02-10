import { useEntry, useDeleteEntry } from "@/hooks/use-entries";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Calendar, MapPin, Clock, Trash2, Music, ExternalLink, Feather, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader } from "@/components/ui/section-header";

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string;
  youtubeUrl?: string;
  previewUrl: string | null;
  playlistName: string | null;
}

interface EmojiReaction {
  id: number;
  userId: string;
  entryId: number;
  recommendationType: string;
  recommendationId: string;
  emoji: string;
}

const REACTION_EMOJIS = ["❤️", "🔥", "😍", "😢", "😴", "👎"];

interface DbSong {
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
  spotifyTracks?: SpotifyTrack[];
  dbSongs?: DbSong[];
  songs?: DbSong[];
}

export default function ViewEntry() {
  const [match, params] = useRoute("/entry/:id");
  const id = parseInt(params?.id || "0");
  const { data: entry, isLoading, error } = useEntry(id);
  const deleteMutation = useDeleteEntry();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: reactions, refetch: refetchReactions } = useQuery({
    queryKey: ["/api/entries", id, "reactions"],
    queryFn: async () => {
      const res = await fetch(`/api/entries/${id}/reactions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reactions");
      return res.json() as Promise<EmojiReaction[]>;
    },
    enabled: !!entry && !isLoading,
  });

  const handleEmojiReaction = async (recommendationId: string, recommendationType: string, emoji: string) => {
    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ entryId: id, recommendationType, recommendationId, emoji }),
      });
      refetchReactions();
    } catch {
      toast({ title: "Error", description: "Could not save reaction.", variant: "destructive" });
    }
  };

  const getUserReaction = (recommendationId: string) => {
    return reactions?.find(r => r.recommendationId === recommendationId)?.emoji || null;
  };

  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ["/api/entries", id, "recommendations"],
    queryFn: async () => {
      const res = await fetch(`/api/entries/${id}/recommendations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json() as Promise<RecommendationsResponse>;
    },
    enabled: !!entry && !isLoading,
    staleTime: 0,
    retry: 1,
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

  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const spotifyTracks = recommendations?.spotifyTracks || [];
  const dbSongs = recommendations?.dbSongs || recommendations?.songs || [];
  const hasAnyRecs = spotifyTracks.length > 0 || dbSongs.length > 0;

  const getShareText = () => {
    const preview = entry ? entry.content.slice(0, 200) + (entry.content.length > 200 ? "..." : "") : "";
    return `${preview}\n\n— PBallon Diary`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      toast({ title: "Copied!", description: "Diary text copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Could not copy text.", variant: "destructive" });
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleShareFacebook = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, "_blank");
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PBallon Diary - ${entry ? format(new Date(entry.date), "MMMM d, yyyy") : ""}`,
          text: getShareText(),
        });
      } catch {}
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

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
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium flex-wrap">
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
              {entry.styleReference && (
                <span className="flex items-center gap-1.5">
                  <Feather className="w-4 h-4" />
                  {entry.styleReference} style
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="relative">
              <button
                onClick={handleShareNative}
                className="p-3 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-secondary rounded-xl border border-border shadow-xl p-2 min-w-[180px] z-50">
                  <button onClick={handleCopyText} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 text-sm font-medium transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                  <button onClick={handleShareTwitter} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 text-sm font-medium transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </button>
                  <button onClick={handleShareFacebook} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 text-sm font-medium transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete Entry"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
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
                {photo.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {photo.location}</span>}
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
            <span className="ml-3 text-muted-foreground font-serif italic">Analyzing mood & finding songs...</span>
          </div>
        ) : hasAnyRecs ? (
          <div className="space-y-6">
            {spotifyTracks.length > 0 && (
              <div className="space-y-4">
                {spotifyTracks.map((track) => (
                  <div key={track.id} className="paper-card p-5">
                    <div className="flex items-center gap-4">
                      {track.albumArt && (
                        <img 
                          src={track.albumArt} 
                          alt={track.title}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-md"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground text-base">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">{track.artist}</p>
                        {track.playlistName && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground">
                            {track.playlistName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={track.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-full bg-[#1DB954] text-white shadow-lg hover:bg-[#1ed760] hover:shadow-xl transition-all duration-300"
                          title="Open in Spotify"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        </a>
                        {track.youtubeUrl && (
                          <a
                            href={track.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-full bg-[#FF0000] text-white shadow-lg hover:bg-[#cc0000] hover:shadow-xl transition-all duration-300"
                            title="Search on YouTube"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30">
                      <span className="text-xs text-muted-foreground mr-1">React:</span>
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiReaction(track.id, "spotify", emoji)}
                          className={`text-lg px-1.5 py-0.5 rounded-lg transition-all hover:scale-125 ${
                            getUserReaction(track.id) === emoji
                              ? "bg-primary/15 scale-110"
                              : "hover:bg-secondary/50"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dbSongs.length > 0 && (
              <div className="space-y-4">
                {spotifyTracks.length > 0 && (
                  <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                    More recommendations
                  </p>
                )}
                {dbSongs.map((song) => (
                  <div key={song.id} className="paper-card p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground">{song.title}</h3>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {song.mood}
                        </span>
                      </div>
                      <a
                        href={song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-2.5 rounded-full bg-[#FF0000] text-white shadow-lg hover:bg-[#cc0000] hover:shadow-xl transition-all duration-300"
                        title="Play on YouTube"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30">
                      <span className="text-xs text-muted-foreground mr-1">React:</span>
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiReaction(String(song.id), "db", emoji)}
                          className={`text-lg px-1.5 py-0.5 rounded-lg transition-all hover:scale-125 ${
                            getUserReaction(String(song.id)) === emoji
                              ? "bg-primary/15 scale-110"
                              : "hover:bg-secondary/50"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
