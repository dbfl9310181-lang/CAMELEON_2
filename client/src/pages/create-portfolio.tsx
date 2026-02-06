import { useState, useMemo, useRef } from "react";
import { useCreateEntry } from "@/hooks/use-entries";
import { SectionHeader } from "@/components/ui/section-header";
import { useLocation } from "wouter";
import { Loader2, Sparkles, ArrowLeft, Lightbulb, Zap, Target, GraduationCap, Briefcase, Compass, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";

const WORK_QUOTES = [
  // English quotes
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  // Korean quotes
  { text: "노력은 배신하지 않는다.", author: "한국 속담" },
  { text: "천 리 길도 한 걸음부터.", author: "한국 속담" },
  { text: "실패는 성공의 어머니다.", author: "한국 속담" },
  { text: "오늘 심은 씨앗이 내일의 열매가 된다.", author: "이병철" },
  { text: "작은 일에도 최선을 다하면 정성스럽게 된다.", author: "정주영" },
  { text: "될 때까지 하면 된다.", author: "정주영" },
  // Japanese
  { text: "七転び八起き - 일곱 번 넘어져도 여덟 번 일어나라.", author: "일본 속담" },
  // French
  { text: "Le travail éloigne de nous trois grands maux: l'ennui, le vice et le besoin.", author: "Voltaire" },
  // Chinese
  { text: "業精於勤，荒於嬉 - 일은 근면함으로 완성되고, 놀음으로 망한다.", author: "韓愈 (Han Yu)" },
  // Spanish
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
];

type PortfolioEntry = {
  hypothesis: string;
  action: string;
  result: string;
  lesson: string;
  currentRole: string;
  targetRole: string;
};

export default function CreatePortfolio() {
  const [entry, setEntry] = useState<PortfolioEntry>({
    hypothesis: "",
    action: "",
    result: "",
    lesson: "",
    currentRole: "",
    targetRole: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const createMutation = useCreateEntry();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const randomQuote = useMemo(() => {
    return WORK_QUOTES[Math.floor(Math.random() * WORK_QUOTES.length)];
  }, []);

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        setPhotoUrl(result.objectPath);
        toast({ title: "Photo uploaded!", description: "Your photo has been uploaded successfully." });
      } else {
        toast({ title: "Upload failed", description: "Could not upload photo.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not upload photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const updateField = (field: keyof PortfolioEntry, value: string) => {
    setEntry({ ...entry, [field]: value });
  };

  const handleSubmit = async () => {
    const hasContent = entry.hypothesis.trim() || entry.action.trim() || entry.result.trim() || entry.lesson.trim() || entry.currentRole.trim() || entry.targetRole.trim();
    if (!hasContent) {
      toast({ title: "Validation Error", description: "Please fill in at least one field.", variant: "destructive" });
      return;
    }

    try {
      const description = [
        entry.hypothesis && `Hypothesis: ${entry.hypothesis}`,
        entry.action && `Action: ${entry.action}`,
        entry.result && `Result: ${entry.result}`,
        entry.lesson && `Lesson: ${entry.lesson}`,
        entry.currentRole && `Current Role: ${entry.currentRole}`,
        entry.targetRole && `Target Role: ${entry.targetRole}`,
      ].filter(Boolean).join("\n\n");

      await createMutation.mutateAsync({
        photos: [{
          description,
          url: photoUrl || ""
        }],
        entryType: "portfolio"
      });
      toast({ title: "Success!", description: "Your portfolio entry has been generated." });
      setLocation("/");
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  const fields = [
    { key: "hypothesis" as const, label: "Hypothesis", icon: Lightbulb, placeholder: "What were you testing or trying to solve?" },
    { key: "action" as const, label: "Action", icon: Zap, placeholder: "What did you do?" },
    { key: "result" as const, label: "Result", icon: Target, placeholder: "What happened? (qualitative or quantitative)" },
    { key: "lesson" as const, label: "Lesson", icon: GraduationCap, placeholder: "What did you learn, or what would you do differently?" },
    { key: "currentRole" as const, label: "Current Role", icon: Briefcase, placeholder: "Your current role or profession (e.g., Product Manager, Software Engineer)" },
    { key: "targetRole" as const, label: "Target Role", icon: Compass, placeholder: "Your desired role or career path (e.g., VP of Product, Engineering Lead)" },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <Link href="/create" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <SectionHeader 
        title="Portfolio Entry" 
        description="Document your work. All fields are optional—fill what matters."
      />

      <div className="space-y-6">
        {/* Photo Upload */}
        <div className="paper-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Photo</h3>
            <span className="text-xs text-muted-foreground ml-auto">Optional</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />
          {photoUrl ? (
            <div className="relative">
              <img 
                src={photoUrl} 
                alt="Uploaded" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => setPhotoUrl("")}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center py-8 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {isUploading ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10" />
                    <span className="text-sm">Click to upload photo</span>
                  </>
                )}
              </div>
            </button>
          )}
        </div>

        {/* HARL Fields */}
        {fields.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key} className="paper-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">{label}</h3>
              <span className="text-xs text-muted-foreground ml-auto">Optional</span>
            </div>
            <textarea
              placeholder={placeholder}
              value={entry[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px] resize-none font-serif text-sm"
              data-testid={`input-${key}`}
            />
          </div>
        ))}

        {/* Submit Button */}
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
          data-testid="button-generate-portfolio"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>Generate Portfolio Entry</span>
            </>
          )}
        </button>

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
