import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { ConnectionStatus, HassEntity, HassLike, HassSource, ServiceTarget } from "./types";

const SourceContext = createContext<HassSource | null>(null);

export function HassProvider({ source, children }: { source: HassSource; children: ReactNode }) {
  return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>;
}

export function useHassSource(): HassSource {
  const s = useContext(SourceContext);
  if (!s) throw new Error("useHassSource must be used inside <HassProvider>");
  return s;
}

export function useHass(): HassLike | undefined {
  const source = useHassSource();
  return useSyncExternalStore(source.subscribe, source.getHass, source.getHass);
}

export function useConnectionStatus(): ConnectionStatus {
  const source = useHassSource();
  return useSyncExternalStore(source.subscribe, source.getStatus, source.getStatus);
}

/** Re-renders only when this entity object changes (HA keeps identity for unchanged entities). */
export function useEntity(entityId: string): HassEntity | undefined {
  const source = useHassSource();
  const get = useCallback(() => source.getHass()?.states[entityId], [source, entityId]);
  return useSyncExternalStore(source.subscribe, get, get);
}

export function useCallService() {
  const source = useHassSource();
  return useCallback(
    (domain: string, service: string, data?: Record<string, unknown>, target?: ServiceTarget) => {
      const hass = source.getHass();
      if (!hass) return Promise.reject(new Error("hass not ready"));
      return hass.callService(domain, service, data, target);
    },
    [source],
  );
}
