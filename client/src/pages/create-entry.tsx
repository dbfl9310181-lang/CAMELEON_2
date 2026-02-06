import { useState, useMemo, useRef } from "react";
import { useCreateEntry } from "@/hooks/use-entries";
import { SectionHeader } from "@/components/ui/section-header";
import { useLocation, Link } from "wouter";
import { Plus, X, Loader2, Image as ImageIcon, Sparkles, ArrowLeft, Upload, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";

const DIARY_QUOTES = [
  // English quotes
  { text: "The life of every man is a diary in which he means to write one story, and writes another.", author: "J.M. Barrie" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "We write to taste life twice, in the moment and in retrospect.", author: "Anaïs Nin" },
  { text: "Keep a diary, and someday it'll keep you.", author: "Mae West" },
  { text: "In the journal I do not just express myself more openly than I could to any person; I create myself.", author: "Susan Sontag" },
  { text: "The act of writing is the act of discovering what you believe.", author: "David Hare" },
  // Korean quotes
  { text: "오늘 하루를 기록하지 않으면 내일은 어제를 잊는다.", author: "한국 속담" },
  { text: "글을 쓴다는 것은 자기 자신을 발견하는 여행이다.", author: "김훈" },
  { text: "일기는 가장 정직한 거울이다.", author: "이외수" },
  { text: "기록하지 않으면 기억하지 못한다.", author: "정약용" },
  { text: "삶은 기록될 때 비로소 의미를 갖는다.", author: "신영복" },
  { text: "오늘을 기록하는 것은 내일의 나에게 보내는 편지다.", author: "혜민스님" },
  // Japanese
  { text: "一日一日を大切に生きる。それが日記の本質です。", author: "夏目漱石 (Natsume Sōseki)" },
  // French
  { text: "Écrire, c'est une façon de parler sans être interrompu.", author: "Jules Renard" },
  // German
  { text: "Ein Tagebuch ist wie ein Spiegel der Seele.", author: "Anne Frank" },
  // Chinese
  { text: "記錄生活，是為了更好地理解生活。", author: "林語堂 (Lin Yutang)" },
];

type Moment = {
  id: string;
  description: string;
  takenAt: string;
  location: string;
  weather: string;
  photoUrl: string;
  isUploading: boolean;
};

export default function CreateEntry() {
  const [moments, setMoments] = useState<Moment[]>([
    { id: "1", description: "", takenAt: "", location: "", weather: "", photoUrl: "", isUploading: false }
  ]);
  const [styleReference, setStyleReference] = useState("");
  const createMutation = useCreateEntry();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile } = useUpload();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const randomQuote = useMemo(() => {
    return DIARY_QUOTES[Math.floor(Math.random() * DIARY_QUOTES.length)];
  }, []);

  const addMoment = () => {
    setMoments([
      ...moments,
      { id: Math.random().toString(36).substr(2, 9), description: "", takenAt: "", location: "", weather: "", photoUrl: "", isUploading: false }
    ]);
  };

  const handlePhotoUpload = async (momentId: string, file: File) => {
    setMoments(prev => prev.map(m => m.id === momentId ? { ...m, isUploading: true } : m));
    
    try {
      const result = await uploadFile(file);
      if (result) {
        setMoments(prev => prev.map(m => 
          m.id === momentId ? { ...m, photoUrl: result.objectPath, isUploading: false } : m
        ));
        toast({ title: "Photo uploaded!", description: "Your photo has been uploaded successfully." });
      } else {
        setMoments(prev => prev.map(m => m.id === momentId ? { ...m, isUploading: false } : m));
        toast({ title: "Upload failed", description: "Could not upload photo.", variant: "destructive" });
      }
    } catch (error) {
      setMoments(prev => prev.map(m => m.id === momentId ? { ...m, isUploading: false } : m));
      toast({ title: "Upload failed", description: "Could not upload photo.", variant: "destructive" });
    }
  };

  const removeMoment = (id: string) => {
    if (moments.length === 1) return;
    setMoments(moments.filter(m => m.id !== id));
  };

  const updateMoment = (id: string, field: keyof Moment, value: string) => {
    setMoments(moments.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async () => {
    // Validate inputs
    const validMoments = moments.filter(m => m.description.trim().length > 0);
    if (validMoments.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one description.", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        photos: validMoments.map(m => ({
          description: m.description,
          takenAt: m.takenAt || undefined,
          location: m.location || undefined,
          weather: m.weather || undefined,
          url: m.photoUrl || ""
        })),
        styleReference: styleReference.trim() || undefined,
        entryType: "diary" as const
      });
      toast({ title: "Success!", description: "Your diary entry has been generated." });
      setLocation("/");
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <Link href="/create" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <SectionHeader 
        title="Diary Entry" 
        description="Describe your moments. AI will weave them into a beautiful narrative."
      />

      <div className="space-y-8">
        <AnimatePresence>
          {moments.map((moment, index) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              className="paper-card p-6 relative group"
            >
              {moments.length > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <button 
                    onClick={() => removeMoment(moment.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Photo Upload (Required) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">Photo (Required)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[moment.id] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(moment.id, file);
                  }}
                />
                {moment.photoUrl ? (
                  <div className="relative">
                    <img 
                      src={moment.photoUrl} 
                      alt="Uploaded" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setMoments(prev => prev.map(m => m.id === moment.id ? { ...m, photoUrl: "" } : m));
                      }}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[moment.id]?.click()}
                    disabled={moment.isUploading}
                    className="w-full flex items-center justify-center py-6 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer border-2 border-dashed border-border"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {moment.isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Click to upload photo</span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Description (Required) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">Description (Required)</label>
                <textarea
                  placeholder="What happened? How did you feel?"
                  value={moment.description}
                  onChange={(e) => updateMoment(moment.id, "description", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px] resize-none font-serif"
                />
              </div>

              {/* Optional Fields */}
              <div className="pt-4 border-t border-dashed border-border">
                <p className="text-xs text-muted-foreground mb-3">Optional details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Time Taken</label>
                    <input
                      type="time"
                      value={moment.takenAt}
                      onChange={(e) => updateMoment(moment.id, "takenAt", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Central Park"
                      value={moment.location}
                      onChange={(e) => updateMoment(moment.id, "location", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Weather</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunny and breezy"
                      value={moment.weather}
                      onChange={(e) => updateMoment(moment.id, "weather", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-1">
                      Writing Style
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-center bg-foreground text-background border-none">
                          <p className="text-xs">Write your preferred tone or style here. Celebrity voices work too!</p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hemingway, Marcus Aurelius..."
                      value={styleReference}
                      onChange={(e) => setStyleReference(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      data-testid="input-style-reference"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <button
            onClick={addMoment}
            className="flex-1 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 text-muted-foreground hover:text-primary font-medium transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Add Another Moment
          </button>

          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="
              flex-1 py-4 rounded-xl font-bold text-lg
              bg-gradient-to-r from-primary to-primary/80
              text-primary-foreground shadow-lg shadow-primary/25
              hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
              disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
              transition-all duration-200 ease-out
              flex items-center justify-center gap-3
            "
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Weaving Story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Diary Entry</span>
              </>
            )}
          </button>
        </div>

        {/* Random Quote */}
        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground font-serif italic max-w-md mx-auto">
            "{randomQuote.text}"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            — {randomQuote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
