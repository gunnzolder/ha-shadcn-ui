import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useConnectionStatus, useHass } from "@hsu/ha-data/react";
import type { HomeConfig } from "@/config";
import { GridCard } from "./GridCard";
import { MediaCard } from "./MediaCard";
import { OutageCard } from "./OutageCard";
import { SwitchesCard } from "./SwitchesCard";
import { WeatherCard } from "./WeatherCard";

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function HomeView({ config }: { config: HomeConfig }) {
  const hass = useHass();
  const status = useConnectionStatus();
  const now = useNow();
  const locale = hass?.language ?? "uk";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">
            {now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="hidden text-3xl font-semibold tracking-tight md:block">Дім</h1>
        </div>
        <div className="text-3xl font-light tabular-nums text-muted-foreground md:text-4xl">
          {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
        </div>
      </header>

      {status !== "connected" && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <WifiOff className="size-4" /> Зв'язок з Home Assistant: {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
        <div className="flex flex-col gap-4">
          <SwitchesCard groups={config.switchGroups} />
          <WeatherCard entityId={config.weather} />
          <MediaCard entityId={config.media} />
        </div>
        <GridCard entities={config.grid} />
        <OutageCard entityId={config.outage} />
      </div>
    </div>
  );
}
