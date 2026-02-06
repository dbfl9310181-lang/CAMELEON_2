import { Link } from "wouter";
import { BookOpen, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export default function ModeSelection() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          No pressure to record
        </h1>
        <p className="text-muted-foreground font-serif text-lg">
          Drop a photo. That's it.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <Link href="/create/portfolio">
            <div 
              className="paper-card p-8 text-center cursor-pointer group h-full"
              data-testid="button-portfolio-mode"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Portfolio
              </h2>
              <p className="text-muted-foreground font-serif leading-relaxed">
                Capture your work. Document what you tested, did, learned, and discovered.
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Link href="/create/diary">
            <div 
              className="paper-card p-8 text-center cursor-pointer group h-full"
              data-testid="button-diary-mode"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Diary
              </h2>
              <p className="text-muted-foreground font-serif leading-relaxed">
                Reflect on your day. Let AI transform your photos into beautiful journal entries.
              </p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
