import { Power, Tv } from "lucide-react";
import { friendlyName, isMissing } from "@hsu/ha-data";
import { useCallService, useEntity } from "@hsu/ha-data/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<string, string> = {
  off: "вимкнено",
  on: "увімкнено",
  idle: "очікує",
  playing: "грає",
  paused: "пауза",
  standby: "standby",
  unavailable: "недоступно",
};

export function MediaCard({ entityId }: { entityId: string }) {
  const e = useEntity(entityId);
  const callService = useCallService();
  const unavailable = isMissing(e);
  const active = !unavailable && e!.state !== "off" && e!.state !== "standby";
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground",
            active && "bg-primary text-primary-foreground",
          )}
        >
          <Tv className="size-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-base font-medium">{friendlyName(e)}</div>
          <div className="text-sm text-muted-foreground">
            {STATE_LABEL[e?.state ?? "unavailable"] ?? e?.state}
            {typeof e?.attributes.media_title === "string" && ` · ${e.attributes.media_title}`}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={unavailable}
          aria-label="Увімкнути / вимкнути"
          onClick={() => callService("media_player", "toggle", {}, { entity_id: entityId })}
        >
          <Power />
        </Button>
      </CardContent>
    </Card>
  );
}
