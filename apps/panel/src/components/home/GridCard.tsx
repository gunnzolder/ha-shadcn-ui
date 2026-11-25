import { BatteryFull, BatteryLow, BatteryWarning, UtilityPole } from "lucide-react";
import { deriveGrid, relativeTime, type GridEntities, type GridStatus } from "@hsu/ha-data";
import { useHass } from "@hsu/ha-data/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StatusDot, type Tone } from "./StatusDot";

const STATUS: Record<GridStatus, { label: string; tone: Tone }> = {
  on: { label: "Мережа є", tone: "success" },
  off: { label: "Мережі немає", tone: "destructive" },
  error: { label: "Помилка", tone: "warning" },
  unavailable: { label: "Недоступно", tone: "muted" },
};

const V_MAX = 250;

/** Colors the shadcn Progress indicator via its data-slot (keeps ui/progress.tsx untouched for CLI updates). */
const meter = (tone: "success" | "warning" | "destructive" | "muted") =>
  cn(
    "[&_[data-slot=progress-track]]:h-1.5",
    tone === "success" && "[&_[data-slot=progress-indicator]]:bg-success",
    tone === "warning" && "[&_[data-slot=progress-indicator]]:bg-warning",
    tone === "destructive" && "[&_[data-slot=progress-indicator]]:bg-destructive",
    tone === "muted" && "[&_[data-slot=progress-indicator]]:bg-muted-foreground/40",
  );

const phaseTone = (v: number | null) => (v === null ? "muted" : v < 50 ? "muted" : v < 207 || v > 253 ? "warning" : "success");

export function GridCard({ entities }: { entities: GridEntities }) {
  const hass = useHass();
  if (!hass) return <Skeleton className="h-64 rounded-2xl" />;
  const v = deriveGrid(hass.states, entities);
  const s = STATUS[v.status];
  const BatteryIcon = v.battery.level === "low" ? BatteryLow : v.battery.level === "unavailable" ? BatteryWarning : BatteryFull;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtilityPole className="size-4 text-muted-foreground" />
          Мережа
        </CardTitle>
        <CardDescription>{v.reason ?? (v.since ? `змінилось ${relativeTime(v.since)}` : "")}</CardDescription>
        <CardAction>
          <Badge variant="outline" className="gap-1.5">
            <StatusDot value={s.tone} pulse={v.status === "off" || v.status === "error"} />
            {s.label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3">
          {v.phases.map((p) => (
            <div key={p.label} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
              <div className="text-xs font-medium text-muted-foreground">{p.label}</div>
              <div className="text-xl font-semibold tabular-nums">
                {p.volts === null ? "—" : Math.round(p.volts)}
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">V</span>
              </div>
              <Progress className={meter(phaseTone(p.volts))} value={p.volts === null ? 0 : Math.min(100, (p.volts / V_MAX) * 100)} />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center gap-3">
          <BatteryIcon
            className={cn(
              "size-5",
              v.battery.level === "low" ? "text-destructive" : v.battery.level === "ok" ? "text-success" : "text-muted-foreground",
            )}
          />
          <div className="flex-1">
            <Progress
              className={meter(v.battery.level === "low" ? "destructive" : v.battery.level === "ok" ? "success" : "muted")}
              value={v.battery.percent ?? 0}
            />
          </div>
          <div className="w-14 text-right text-sm font-medium tabular-nums">
            {v.battery.percent === null ? "—" : `${v.battery.percent}%`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
