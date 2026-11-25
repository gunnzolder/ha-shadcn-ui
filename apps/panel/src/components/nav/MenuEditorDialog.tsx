import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  NAV_ICONS,
  NAV_SECTIONS,
  addCustomNavItem,
  moveNavItem,
  removeCustomNavItem,
  toggleNavItem,
  type NavIconId,
  type NavPrefs,
  type NavSectionId,
} from "@hsu/ha-data";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { NavIcon } from "./nav-icons";

interface MenuEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: NavPrefs;
  onUpdate: (updater: (prev: NavPrefs) => NavPrefs) => void;
  onReset: () => void;
  syncedWithHA: boolean;
}

export function MenuEditorDialog({
  open,
  onOpenChange,
  prefs,
  onUpdate,
  onReset,
  syncedWithHA,
}: MenuEditorDialogProps) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");
  const [section, setSection] = useState<NavSectionId>("main");
  const [icon, setIcon] = useState<NavIconId>("link");

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !path.trim()) return;
    onUpdate((prev) => addCustomNavItem(prev, { label, path, section, icon }));
    setLabel("");
    setPath("");
    setIcon("link");
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Налаштувати меню</DialogTitle>
          <DialogDescription>
            Вмикайте, сортуйте або додавайте розділи HA. Перші 3 пункти «Головного» показуються в нижній панелі на
            телефоні.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {NAV_SECTIONS.map((sec) => {
            const items = prefs.items.filter((i) => i.section === sec.id);
            return (
              <div key={sec.id} className="space-y-2">
                <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{sec.label}</div>
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-2"
                    >
                      <NavIcon
                        icon={item.icon}
                        className={cn(
                          "size-4 shrink-0",
                          item.hidden ? "text-muted-foreground/50" : "text-muted-foreground",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("truncate text-sm font-medium", item.hidden && "text-muted-foreground")}>
                            {item.label}
                          </span>
                          {item.pinned && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              закріплено
                            </Badge>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{item.path}</div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Підняти ${item.label}`}
                          disabled={idx === 0}
                          onClick={() => onUpdate((prev) => moveNavItem(prev, item.id, "up"))}
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Опустити ${item.label}`}
                          disabled={idx === items.length - 1}
                          onClick={() => onUpdate((prev) => moveNavItem(prev, item.id, "down"))}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        {item.custom && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Видалити ${item.label}`}
                            onClick={() => onUpdate((prev) => removeCustomNavItem(prev, item.id))}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <Switch
                        checked={!item.hidden}
                        disabled={item.pinned}
                        aria-label={`Показувати ${item.label}`}
                        onCheckedChange={() => onUpdate((prev) => toggleNavItem(prev, item.id))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {adding ? (
            <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-border bg-muted/40 p-3.5">
              <div className="text-xs font-medium text-foreground">Новий пункт меню</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Назва (напр. Автоматизації)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
                <Input
                  placeholder="Шлях (/config/automation/dashboard)"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={section}
                  onValueChange={(v) => {
                    if (v === "main" || v === "analytics" || v === "system") setSection(v);
                  }}
                >
                  <SelectTrigger size="sm" className="w-40">
                    <SelectValue>{(v: string) => NAV_SECTIONS.find((s) => s.id === v)?.label ?? v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {NAV_SECTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-1">
                {NAV_ICONS.map((ic) => (
                  <Button
                    key={ic}
                    type="button"
                    size="icon-sm"
                    variant={icon === ic ? "default" : "ghost"}
                    aria-label={ic}
                    onClick={() => setIcon(ic)}
                  >
                    <NavIcon icon={ic} className="size-4" />
                  </Button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                  Скасувати
                </Button>
                <Button type="submit" size="sm">
                  Додати
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Додати свій пункт
            </Button>
          )}
        </div>

        <DialogFooter className="items-center justify-between gap-2 border-t border-border pt-3 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            Скинути
          </Button>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {syncedWithHA ? "Синхронізується з профілем HA" : "Збережено локально"}
            </span>
            <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
              Готово
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
