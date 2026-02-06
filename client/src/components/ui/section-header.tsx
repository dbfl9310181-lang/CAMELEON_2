import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, className, action }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12", className)}>
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-lg text-muted-foreground font-serif max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
