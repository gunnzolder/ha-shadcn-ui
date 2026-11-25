import { useState } from "react";
import { Lamp, Lightbulb, Satellite, type LucideIcon } from "lucide-react";
import { friendlyName, isMissing, relativeTime } from "@hsu/ha-data";
import { useCallService, useEntity } from "@hsu/ha-data/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { HomeConfig, SwitchItem } from "@/config";

const ICONS: Record<NonNullable<SwitchItem["icon"]>, LucideIcon> = {
  satellite: Satellite,
  lightbulb: Lightbulb,
  lamp: Lamp,
};

function SwitchRow({ item }: { item: SwitchItem }) {
  const entity = useEntity(item.entity);
  const callService = useCallService();
  const [pending, setPending] = useState(false);
  const Icon = ICONS[item.icon ?? "lightbulb"];
  const on = entity?.state === "on";
  const unavailable = isMissing(entity);

  const toggle = async (checked: boolean) => {
    setPending(true);
    try {
      await callService(item.entity.split(".")[0]!, checked ? "turn_on" : "turn_off", {}, { entity_id: item.entity });
    } finally {
      setPending(false);
    }
  };

  return (
    <Item size="sm" className="px-0">
      <ItemMedia
        variant="icon"
        className={cn(
          "size-9 rounded-xl bg-muted text-muted-foreground transition-colors",
          on && "bg-energy/15 text-energy",
        )}
      >
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{item.name ?? friendlyName(entity)}</ItemTitle>
        <ItemDescription>
          {unavailable ? "недоступно" : `${on ? "увімкнено" : "вимкнено"} · ${relativeTime(entity?.last_changed)}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          checked={on}
          disabled={unavailable || pending}
          onCheckedChange={toggle}
          aria-label={item.name ?? item.entity}
        />
      </ItemActions>
    </Item>
  );
}

export function SwitchesCard({ groups }: { groups: HomeConfig["switchGroups"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Керування</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {groups.map((g, i) => (
          <div key={i} className="flex flex-col gap-1">
            {g.title && <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.title}</div>}
            <ItemGroup>
              {g.items.map((item) => (
                <SwitchRow key={item.entity} item={item} />
              ))}
            </ItemGroup>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
