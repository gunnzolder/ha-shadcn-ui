import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_USER_DATA_KEY, defaultNavPrefs, mergeNavPrefs, type NavPrefs } from "@hsu/ha-data";
import { useHass } from "@hsu/ha-data/react";

const LOCAL_STORAGE_KEY = "hsu_nav_prefs_v1";

function readLocalCache(): NavPrefs {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultNavPrefs();
    return mergeNavPrefs(JSON.parse(raw));
  } catch {
    return defaultNavPrefs();
  }
}

function writeLocalCache(prefs: NavPrefs): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota / private-mode restrictions.
  }
}

/**
 * Loads and persists navigation preferences across devices via HA `frontend/set_user_data`
 * (`key: "hsu_nav"`), with synchronous `localStorage` caching for instant paint and dev/mock fallback.
 */
export function useNavPrefs() {
  const hass = useHass();
  const [prefs, setPrefs] = useState<NavPrefs>(() => readLocalCache());
  const loadedFromWS = useRef(false);
  const callWS = hass?.callWS;

  useEffect(() => {
    if (!callWS || loadedFromWS.current) return;
    loadedFromWS.current = true;
    let cancelled = false;
    callWS<{ value?: unknown }>({ type: "frontend/get_user_data", key: NAV_USER_DATA_KEY })
      .then((res) => {
        if (cancelled || !res?.value) return;
        const merged = mergeNavPrefs(res.value);
        setPrefs(merged);
        writeLocalCache(merged);
      })
      .catch(() => {
        // Keep local cache if WS storage isn't available.
      });
    return () => {
      cancelled = true;
    };
  }, [callWS]);

  const updatePrefs = useCallback(
    (updater: (prev: NavPrefs) => NavPrefs) => {
      setPrefs((prev) => {
        const next = updater(prev);
        writeLocalCache(next);
        if (callWS) {
          void callWS({
            type: "frontend/set_user_data",
            key: NAV_USER_DATA_KEY,
            value: next,
          }).catch(() => {});
        }
        return next;
      });
    },
    [callWS],
  );

  const resetPrefs = useCallback(() => {
    updatePrefs((prev) => ({ ...defaultNavPrefs(), collapsed: prev.collapsed }));
  }, [updatePrefs]);

  return { prefs, updatePrefs, resetPrefs, syncedWithHA: Boolean(callWS) };
}
