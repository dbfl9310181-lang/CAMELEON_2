import { useEntries, useDeleteEntry } from "@/hooks/use-entries";
import { SectionHeader } from "@/components/ui/section-header";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Calendar, MapPin, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: entries, isLoading, error } = useEntries();
  const deleteMutation = useDeleteEntry();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Prevent navigation
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Entry deleted", description: "Your journal entry has been removed." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-serif italic">Loading your memories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-destructive">
        <p>Failed to load entries. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Your Journal" 
        description="Remember every moment without writing."
        action={
          <Link href="/create" className="
            flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
            bg-primary text-primary-foreground shadow-lg shadow-primary/25
            hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 hover:bg-primary/90
            transition-all duration-300
          ">
            <Plus className="w-5 h-5" />
            <span>New Entry</span>
          </Link>
        }
      />

      {entries && entries.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-dashed border-border">
          <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-semibold mb-2">No entries yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 font-serif">
            Your journal is waiting for your first story. Capture today's moments and let AI weave them into a narrative.
          </p>
          <Link href="/create" className="text-primary hover:underline font-medium">
            Create your first entry &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <AnimatePresence>
            {entries?.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <Link href={`/entry/${entry.id}`} className="block h-full group">
                  <article className="
                    h-full flex flex-col paper-card p-6 relative overflow-hidden
                    group-hover:border-primary/40
                  ">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => handleDelete(e, entry.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-destructive hover:bg-destructive hover:text-white transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 font-medium">
                      <span className="flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(entry.date), "MMMM d, yyyy")}
                      </span>
                      {entry.photos && entry.photos.length > 0 && (
                        <span className="flex items-center gap-1.5 px-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {entry.photos[0].location || "Unknown Location"}
                        </span>
                      )}
                    </div>

                    <p className="font-serif text-foreground/80 leading-relaxed line-clamp-4 flex-1">
                      {entry.content}
                    </p>

                    <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                      <div className="flex -space-x-2 overflow-hidden">
                        {entry.photos?.slice(0, 3).map((photo, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-secondary bg-muted overflow-hidden">
                            {/* In a real app, these would be the actual photos */}
                            <img src={photo.url || `https://placehold.co/100x100?text=${i+1}`} alt="Moment" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {entry.photos && entry.photos.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-secondary bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                            +{entry.photos.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                        Read entry &rarr;
                      </span>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
