import { useState } from "react";
import { FlaskConical, Moon, Sun } from "lucide-react";
import { scenarios, type HassSource, type MockSource } from "@hsu/ha-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Dev-only bar (never in the production bundle): source, mock scenario, dark mode. */
export function DevToolbar({ source }: { source: HassSource }) {
  const mock = source.kind === "mock" ? (source as MockSource) : undefined;
  const [scenario, setScenario] = useState(mock?.getScenarioId() ?? "normal");
  const [dark, setDark] = useState(source.getHass()?.themes?.darkMode ?? false);

  const updateUrl = (key: string, value: string | null) => {
    const u = new URL(location.href);
    if (value === null) u.searchParams.delete(key);
    else u.searchParams.set(key, value);
    history.replaceState(null, "", u);
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/80 px-4 py-2 text-sm backdrop-blur">
      <FlaskConical className="size-4 text-muted-foreground" />
      <Badge variant={source.kind === "live" ? "destructive" : "secondary"}>
        {source.kind === "live" ? "LIVE HA" : "mock"}
      </Badge>
      {mock && (
        <Select
          value={scenario}
          onValueChange={(v) => {
            if (!v) return;
            setScenario(v);
            mock.setScenario(v);
            updateUrl("scenario", v === "normal" ? null : v);
          }}
        >
          <SelectTrigger size="sm" className="w-64">
            <SelectValue>{(v: string) => scenarios.find((s) => s.id === v)?.label ?? v}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Темна тема"
        disabled={!mock}
        onClick={() => {
          const next = !dark;
          setDark(next);
          mock?.setDarkMode(next);
          updateUrl("dark", next ? "1" : null);
        }}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>
      <span className="ml-auto text-xs text-muted-foreground">
        {source.kind === "mock" ? "?source=live для реального HA" : "?source=mock для моків"}
      </span>
    </div>
  );
}
