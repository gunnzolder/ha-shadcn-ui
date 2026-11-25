import { cn } from "@/lib/utils";

export type Tone = "success" | "destructive" | "warning" | "muted";

const tone: Record<Tone, string> = {
  success: "bg-success",
  destructive: "bg-destructive",
  warning: "bg-warning",
  muted: "bg-muted-foreground/40",
};

export function StatusDot({ value, pulse }: { value: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2.5">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", tone[value])} />}
      <span className={cn("relative inline-flex size-2.5 rounded-full", tone[value])} />
    </span>
  );
}
