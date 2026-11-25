import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, Moon, Sun, Wind, type LucideIcon } from "lucide-react";
import { isMissing } from "@hsu/ha-data";
import { useEntity } from "@hsu/ha-data/react";
import { Card, CardContent } from "@/components/ui/card";

const CONDITIONS: Record<string, [string, LucideIcon]> = {
  "clear-night": ["Ясно", Moon],
  cloudy: ["Хмарно", Cloud],
  fog: ["Туман", CloudFog],
  hail: ["Град", CloudSnow],
  lightning: ["Гроза", CloudLightning],
  "lightning-rainy": ["Гроза з дощем", CloudLightning],
  partlycloudy: ["Мінлива хмарність", CloudSun],
  pouring: ["Злива", CloudRain],
  rainy: ["Дощ", CloudRain],
  snowy: ["Сніг", CloudSnow],
  "snowy-rainy": ["Мокрий сніг", CloudSnow],
  sunny: ["Сонячно", Sun],
  windy: ["Вітряно", Wind],
};

export function WeatherCard({ entityId }: { entityId: string }) {
  const e = useEntity(entityId);
  const [label, Icon] = CONDITIONS[e?.state ?? ""] ?? [e?.state ?? "—", Cloud];
  const a = e?.attributes ?? {};
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-info/10 text-info">
          <Icon className="size-7" />
        </div>
        <div className="flex-1">
          <div className="text-base font-medium">{isMissing(e) ? "Погода недоступна" : label}</div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Droplets className="size-3.5" />
              {String(a.humidity ?? "—")}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="size-3.5" />
              {String(a.wind_speed ?? "—")} {String(a.wind_speed_unit ?? "")}
            </span>
          </div>
        </div>
        <div className="text-3xl font-semibold tabular-nums">
          {typeof a.temperature === "number" ? a.temperature.toFixed(1) : "—"}
          <span className="text-lg font-normal text-muted-foreground">{String(a.temperature_unit ?? "°C")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
