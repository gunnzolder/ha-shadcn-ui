import { CalendarArrowUp, CalendarClock, CalendarDays } from "lucide-react";
import { deriveOutage, type OutageDay, type OutageStatus } from "@hsu/ha-data";
import { useHass } from "@hsu/ha-data/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot, type Tone } from "./StatusDot";

const STATUS: Record<OutageStatus, { label: string; tone: Tone }> = {
  power: { label: "Світло є", tone: "success" },
  outage: { label: "Відключення", tone: "destructive" },
  unavailable: { label: "Недоступно", tone: "muted" },
  error: { label: "Помилка", tone: "warning" },
};

function Day({ day, icon: Icon }: { day: OutageDay; icon: typeof CalendarDays }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {day.heading}
      </div>
      {day.intervals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {day.intervals.map((i) => (
            <Badge key={i} variant="secondary" className="font-normal tabular-nums">
              {i}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function OutageCard({ entityId }: { entityId: string }) {
  const hass = useHass();
  if (!hass) return <Skeleton className="h-64 rounded-2xl" />;
  const v = deriveOutage(hass.states, entityId);
  const s = STATUS[v.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          За графіком
        </CardTitle>
        <CardDescription>
          {[v.region, v.queue && `Черга ${v.queue}`].filter(Boolean).join(" · ")}
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className="gap-1.5">
            <StatusDot value={s.tone} pulse={v.status === "outage"} />
            {s.label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {v.nextEvent && <div className="text-xl font-semibold tracking-tight">{v.nextEvent}</div>}
        <Separator />
        {v.today && <Day day={v.today} icon={CalendarDays} />}
        {v.tomorrow && <Day day={v.tomorrow} icon={CalendarArrowUp} />}
        {v.synchronized && <div className="text-xs text-muted-foreground">{v.synchronized}</div>}
      </CardContent>
    </Card>
  );
}
