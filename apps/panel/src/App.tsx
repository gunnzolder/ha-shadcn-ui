import { useEffect, type ReactNode } from "react";
import type { HassSource } from "@hsu/ha-data";
import { HassProvider, useHass } from "@hsu/ha-data/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HomeView } from "@/components/home/HomeView";
import { homeConfig } from "@/config";

/** Follows HA's dark mode (hass.themes.darkMode) — in HA, in mock and in live mode alike. */
function ThemeSync({ root }: { root: HTMLElement }) {
  const dark = useHass()?.themes?.darkMode ?? false;
  useEffect(() => {
    root.classList.toggle("dark", dark);
  }, [root, dark]);
  return null;
}

export function App({ source, root, toolbar }: { source: HassSource; root: HTMLElement; toolbar?: ReactNode }) {
  return (
    <HassProvider source={source}>
      <TooltipProvider>
        <ThemeSync root={root} />
        <div className="min-h-dvh bg-background text-foreground">
          {toolbar}
          <HomeView config={homeConfig} />
        </div>
      </TooltipProvider>
    </HassProvider>
  );
}
