import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  Bot,
  Car,
  History,
  Home,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Map,
  Music,
  Settings,
  Shield,
  Store,
  Sun,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";
import type { NavIconId } from "@hsu/ha-data";

export const NAV_ICON_MAP: Record<NavIconId, LucideIcon> = {
  home: Home,
  sun: Sun,
  zap: Zap,
  car: Car,
  "battery-charging": BatteryCharging,
  "bar-chart": BarChart3,
  history: History,
  activity: Activity,
  settings: Settings,
  store: Store,
  "layout-dashboard": LayoutDashboard,
  map: Map,
  music: Music,
  bot: Bot,
  lightbulb: Lightbulb,
  thermometer: Thermometer,
  shield: Shield,
  wrench: Wrench,
  link: Link2,
};

export function NavIcon({ icon, className = "size-[18px] shrink-0" }: { icon: NavIconId; className?: string }) {
  const Icon = NAV_ICON_MAP[icon] ?? Link2;
  return <Icon className={className} />;
}
