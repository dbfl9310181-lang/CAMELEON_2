import { useState, useMemo, useRef } from "react";
import { useCreateEntry } from "@/hooks/use-entries";
import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "@/components/ui/section-header";
import { useLocation, Link } from "wouter";
import { Plus, X, Loader2, Sparkles, ArrowLeft, ArrowRight, Camera, HelpCircle, Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";

type StyleSuggestion = {
  name: string;
  reason: string;
};

const DEFAULT_QUOTES = [
  { text: "We write to taste life twice, in the moment and in retrospect.", author: "Anaïs Nin", comment: "Recording today means you get to relive it whenever you want." },
  { text: "기록하지 않으면 기억하지 못한다.", author: "정약용", comment: "사소한 순간도 기록하면 보물이 돼요." },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth", comment: "Your feelings are the best ink." },
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
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [moments, setMoments] = useState<Moment[]>([
    { id: "1", description: "", takenAt: "", location: "", weather: "", photoUrl: "", isUploading: false }
  ]);
  const [styleReference, setStyleReference] = useState("");
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([]);
  const [isSuggestingStyles, setIsSuggestingStyles] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const createMutation = useCreateEntry();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile } = useUpload();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const { data: dbQuotes } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<{ text: string; author: string; comment: string | null }[]>;
    },
  });

  const randomQuote = useMemo(() => {
    const pool = dbQuotes && dbQuotes.length > 0 ? dbQuotes : DEFAULT_QUOTES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [dbQuotes]);

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

  const handleSuggestStyles = async () => {
    const descriptions = moments.map(m => m.description.trim()).filter(Boolean);
    if (descriptions.length === 0) {
      toast({ title: "Description needed", description: "Please write at least one description first.", variant: "destructive" });
      return;
    }
    setIsSuggestingStyles(true);
    setShowSuggestions(true);
    try {
      const res = await fetch("/api/suggest-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptions }),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setStyleSuggestions(data.suggestions || []);
    } catch {
      toast({ title: "Error", description: "Could not get style suggestions. Please try again.", variant: "destructive" });
      setShowSuggestions(false);
    } finally {
      setIsSuggestingStyles(false);
    }
  };

  const canProceedToStep2 = () => {
    const validMoments = moments.filter(m => m.description.trim().length > 0);
    return validMoments.length > 0;
  };

  const handleNextStep = () => {
    if (!canProceedToStep2()) {
      toast({ title: "Description needed", description: "Please add at least one description before continuing.", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    const validMoments = moments.filter(m => m.description.trim().length > 0);
    if (validMoments.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one description.", variant: "destructive" });
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        photos: validMoments.map(m => ({
          description: m.description,
          takenAt: m.takenAt || undefined,
          location: m.location || undefined,
          weather: m.weather || undefined,
          url: m.photoUrl || ""
        })),
        styleReference: styleReference.trim() || undefined
      });
      toast({ title: "Success!", description: "Your diary entry has been generated." });
      setLocation(`/entry/${result.id}`);
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="paper-card p-8 mb-10 max-w-lg w-full text-center"
        >
          <p className="text-base font-serif italic text-foreground/80 leading-relaxed mb-3">
            "{randomQuote.text}"
          </p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            — {randomQuote.author}
          </p>
          <div className="border-t border-border/40 pt-4">
            <p className="text-sm text-primary/80 leading-relaxed">
              {randomQuote.comment}
            </p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setStarted(true)}
          className="w-40 h-40 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all duration-300 flex flex-col items-center justify-center gap-3 group cursor-pointer shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20"
        >
          <Plus className="w-12 h-12 text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
          <span className="text-sm font-medium text-primary/60 group-hover:text-primary transition-colors">New Entry</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <button 
        onClick={() => {
          if (step === 2) {
            setStep(1);
          } else {
            setStarted(false);
            setStep(1);
          }
        }} 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 2 ? "Back to moments" : "Back"}
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className={`flex items-center gap-2 ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>1</span>
          <span className="text-sm font-medium hidden sm:inline">Moments</span>
        </div>
        <div className="flex-1 h-px bg-border max-w-[60px]" />
        <div className={`flex items-center gap-2 ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
          <span className="text-sm font-medium hidden sm:inline">Details</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <SectionHeader 
              title="Capture Your Moments" 
              description="Add photos and describe what happened."
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

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Photo</label>
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
                          className="w-full flex items-center justify-center py-8 bg-secondary/20 rounded-xl hover:bg-secondary/40 transition-all duration-300 cursor-pointer border-2 border-dashed border-border hover:border-primary/40"
                        >
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            {moment.isUploading ? (
                              <>
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <span className="text-sm">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                  <Camera className="w-8 h-8 text-primary/60" />
                                </div>
                                <span className="text-sm font-medium">Tap to add photo</span>
                              </>
                            )}
                          </div>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                      <textarea
                        placeholder="What happened? How did you feel?"
                        value={moment.description}
                        onChange={(e) => updateMoment(moment.id, "description", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px] resize-none font-serif"
                      />
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
                  onClick={handleNextStep}
                  className="
                    flex-1 py-4 rounded-xl font-bold text-lg
                    bg-gradient-to-r from-primary to-primary/80
                    text-primary-foreground shadow-lg shadow-primary/25
                    hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                    transition-all duration-200 ease-out
                    flex items-center justify-center gap-3
                  "
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <SectionHeader 
              title="Optional Details" 
              description="Add extra context to enrich your diary entry. You can skip this and generate right away."
            />

            <div className="space-y-6">
              {moments.filter(m => m.description.trim().length > 0).map((moment, index) => (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="paper-card p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {moment.photoUrl && (
                      <img 
                        src={moment.photoUrl} 
                        alt="Moment" 
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {moments.filter(m => m.description.trim().length > 0).length > 1 && (
                        <span className="text-xs font-medium text-primary/60 mb-1 block">Moment {index + 1}</span>
                      )}
                      <p className="text-sm text-foreground/70 line-clamp-2 font-serif italic">
                        "{moment.description.trim().substring(0, 100)}{moment.description.trim().length > 100 ? "..." : ""}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Time</label>
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
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="paper-card p-6"
              >
                <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                  Writing Style
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-center bg-foreground text-background border-none">
                      <p className="text-xs">Enter a famous person's name (e.g. Hemingway, BTS RM) and your diary will be written in their unique tone and style!</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Hemingway, Marcus Aurelius..."
                    value={styleReference}
                    onChange={(e) => setStyleReference(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    data-testid="input-style-reference"
                  />
                  <button
                    type="button"
                    onClick={handleSuggestStyles}
                    disabled={isSuggestingStyles}
                    className="px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all flex items-center gap-1.5 text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    {isSuggestingStyles ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">AI Suggest</span>
                  </button>
                </div>
              </motion.div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="paper-card p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        Suggested Writing Styles
                      </h3>
                      <button 
                        onClick={() => setShowSuggestions(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {isSuggestingStyles ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Analyzing your descriptions...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {styleSuggestions.map((s, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  setStyleReference(s.name);
                                  setShowSuggestions(false);
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                  styleReference === s.name
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-secondary/50 text-foreground hover:bg-primary/10 hover:border-primary/40 border-border"
                                }`}
                              >
                                {s.name}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[260px] text-center bg-foreground text-background border-none">
                              <p className="text-xs">{s.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="
                    w-full py-4 rounded-xl font-bold text-lg
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
