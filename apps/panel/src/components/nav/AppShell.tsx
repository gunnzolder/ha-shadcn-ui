import { useState, type ReactNode } from "react";
import {
  Bell,
  Home,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import {
  countAvailableUpdates,
  mobileTabItems,
  visibleNavSections,
  type MockSource,
  type NavItem,
} from "@hsu/ha-data";
import { useHass, useHassSource } from "@hsu/ha-data/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MenuEditorDialog } from "./MenuEditorDialog";
import { isEmbeddedInHA, navigateHA, openHANotifications, setHAThemeMode } from "./ha-bridge";
import { NavIcon } from "./nav-icons";
import { useNavPrefs } from "./use-nav-prefs";

interface AppShellProps {
  activePath?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ activePath = "/home-ui", toolbar, children }: AppShellProps) {
  const hass = useHass();
  const source = useHassSource();
  const { prefs, updatePrefs, resetPrefs, syncedWithHA } = useNavPrefs();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [devNotice, setDevNotice] = useState<string | null>(null);

  const isAdmin = hass?.user?.is_admin ?? true;
  const dark = hass?.themes?.darkMode ?? false;
  const userName = hass?.user?.name ?? "Користувач";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "A";
  const updatesCount = countAvailableUpdates(hass?.states);
  const collapsed = prefs.collapsed === true;

  const sections = visibleNavSections(prefs, isAdmin);
  const bottomTabs = mobileTabItems(prefs, isAdmin, 3);

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    if (path === activePath) return;
    const navigated = navigateHA(path);
    if (!navigated && !isEmbeddedInHA()) {
      setDevNotice(`Перехід у HA: ${path}`);
      window.setTimeout(() => setDevNotice(null), 2200);
    }
  };

  const handleToggleTheme = () => {
    const next = !dark;
    if (source.kind === "mock") {
      (source as MockSource).setDarkMode(next);
      return;
    }
    setHAThemeMode(next);
  };

  const handleOpenNotifications = () => {
    setMobileMenuOpen(false);
    if (!openHANotifications() && !isEmbeddedInHA()) {
      setDevNotice("Сповіщення доступні всередині Home Assistant");
      window.setTimeout(() => setDevNotice(null), 2200);
    }
  };

  const handleToggleCollapse = () => {
    updatePrefs((prev) => ({ ...prev, collapsed: !prev.collapsed }));
  };

  const renderNavButton = (item: NavItem, isCollapsedRail: boolean) => {
    const active = item.path === activePath;
    const badgeCount = item.id === "config" ? updatesCount : 0;

    const btn = (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavigate(item.path)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isCollapsedRail && "justify-center px-0",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "font-normal text-sidebar-foreground hover:bg-sidebar-accent/65",
        )}
      >
        <NavIcon
          icon={item.icon}
          className={cn(
            "size-[18px] shrink-0 transition-colors",
            active
              ? "text-sidebar-accent-foreground"
              : "text-muted-foreground group-hover:text-sidebar-foreground",
          )}
        />
        {!isCollapsedRail && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
        {!isCollapsedRail && badgeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
            {badgeCount}
          </span>
        )}
      </button>
    );

    if (!isCollapsedRail) return btn;

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger render={btn} />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const renderFooterActions = (isCollapsedRail: boolean) => {
    const actions = [
      {
        id: "notifications",
        label: "Сповіщення",
        icon: Bell,
        onClick: handleOpenNotifications,
      },
      {
        id: "theme",
        label: dark ? "Світла тема" : "Темна тема",
        icon: dark ? Sun : Moon,
        onClick: handleToggleTheme,
      },
      {
        id: "customize",
        label: "Налаштувати меню",
        icon: SlidersHorizontal,
        onClick: () => {
          setMobileMenuOpen(false);
          setEditorOpen(true);
        },
      },
    ];

    return (
      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const btn = (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent/65 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isCollapsedRail && "justify-center px-0",
              )}
            >
              <Icon className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-foreground" />
              {!isCollapsedRail && <span className="min-w-0 flex-1 truncate text-left">{action.label}</span>}
            </button>
          );
          if (!isCollapsedRail) return btn;
          return (
            <Tooltip key={action.id}>
              <TooltipTrigger render={btn} />
              <TooltipContent side="right">{action.label}</TooltipContent>
            </Tooltip>
          );
        })}

        {(() => {
          const profileBtn = (
            <button
              type="button"
              onClick={() => handleNavigate("/profile")}
              className={cn(
                "mt-1 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent/65 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isCollapsedRail && "justify-center px-0",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {userInitial}
              </span>
              {!isCollapsedRail && <span className="min-w-0 flex-1 truncate text-left font-medium">{userName}</span>}
            </button>
          );
          if (!isCollapsedRail) return profileBtn;
          return (
            <Tooltip>
              <TooltipTrigger render={profileBtn} />
              <TooltipContent side="right">{userName}</TooltipContent>
            </Tooltip>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Desktop collapsible shadcn Sidebar */}
      <aside
        aria-label="Головна навігація"
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2.5 px-1">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Home className="size-4" />
              </span>
              <span className="truncate text-[15px] font-semibold tracking-tight">Дім</span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
                  onClick={handleToggleCollapse}
                />
              }
            >
              {collapsed ? <PanelLeftOpen className="size-4 text-muted-foreground" /> : <PanelLeftClose className="size-4 text-muted-foreground" />}
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Розгорнути меню" : "Згорнути меню"}</TooltipContent>
          </Tooltip>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {sections.map((sec) => (
            <div key={sec.id} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2.5 pb-1 pt-1 text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
                  {sec.label}
                </div>
              )}
              {sec.items.map((item) => renderNavButton(item, collapsed))}
            </div>
          ))}
        </nav>

        {renderFooterActions(collapsed)}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {toolbar}

        {/* Mobile sticky top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-lg md:hidden">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Дім</span>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Сповіщення" onClick={handleOpenNotifications}>
              <Bell className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={dark ? "Світла тема" : "Темна тема"}
              onClick={handleToggleTheme}
            >
              {dark ? <Sun className="size-4 text-muted-foreground" /> : <Moon className="size-4 text-muted-foreground" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Відкрити меню"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </header>

        {devNotice && (
          <div className="fixed right-4 bottom-20 z-50 rounded-2xl border border-border bg-popover px-3.5 py-2 text-xs text-popover-foreground shadow-lg md:bottom-4">
            {devNotice}
          </div>
        )}

        {/* Content (extra bottom space on mobile for the bottom nav bar) */}
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Швидка навігація"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-1.5">
          {bottomTabs.map((item) => {
            const active = item.path === activePath;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.path)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground active:bg-accent/50",
                )}
              >
                <NavIcon icon={item.icon} className="size-5" />
                <span className="max-w-full truncate px-1">{item.shortLabel ?? item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium text-muted-foreground transition-colors active:bg-accent/50"
          >
            <Menu className="size-5" />
            <span>Меню</span>
          </button>
        </div>
      </nav>

      {/* Mobile full navigation drawer (shadcn Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] gap-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-[300px]">
          <SheetHeader className="flex-row items-center gap-2.5 border-b border-sidebar-border px-4 py-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="size-4" />
            </span>
            <SheetTitle className="text-[15px] font-semibold">Дім</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 space-y-4 overflow-y-auto p-2.5">
            {sections.map((sec) => (
              <div key={sec.id} className="space-y-0.5">
                <div className="px-2.5 pb-1 pt-1 text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
                  {sec.label}
                </div>
                {sec.items.map((item) => renderNavButton(item, false))}
              </div>
            ))}
          </nav>

          {renderFooterActions(false)}
        </SheetContent>
      </Sheet>

      {/* In-app Menu Manager dialog */}
      <MenuEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        prefs={prefs}
        onUpdate={updatePrefs}
        onReset={resetPrefs}
        syncedWithHA={syncedWithHA}
      />
    </div>
  );
}
