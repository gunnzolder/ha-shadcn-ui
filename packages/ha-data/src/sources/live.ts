import {
  callService as wsCallService,
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  type Connection,
} from "home-assistant-js-websocket";
import { Emitter } from "../emitter";
import type { ConnectionStatus, HassEntities, HassLike, HassSource } from "../types";

export interface LiveSourceOptions {
  url: string;
  token: string;
  darkMode?: boolean;
  language?: string;
}

/**
 * Talks to a real Home Assistant over the WebSocket API with a long-lived token.
 * DEV ONLY: the token lives in .env.local and ends up in the browser bundle of the dev server.
 * In production the panel receives `hass` from HA itself (see sources/panel.ts) — no token at all.
 */
export function createLiveSource(opts: LiveSourceOptions): HassSource {
  const emitter = new Emitter();
  let status: ConnectionStatus = "connecting";
  let conn: Connection | undefined;
  let hass: HassLike | undefined;
  let unsub: (() => void) | undefined;

  const build = (states: HassEntities) => {
    hass = {
      states,
      language: opts.language ?? "uk",
      themes: { darkMode: opts.darkMode ?? false },
      callService: (domain, service, data, target) => {
        if (!conn) return Promise.reject(new Error("Not connected"));
        return wsCallService(conn, domain, service, data, target);
      },
      callWS: <T = unknown>(msg: Record<string, unknown>) => {
        if (!conn) return Promise.reject(new Error("Not connected"));
        return conn.sendMessagePromise<T>(msg as Parameters<Connection["sendMessagePromise"]>[0]);
      },
    };
    emitter.emit();
  };

  (async () => {
    try {
      const auth = createLongLivedTokenAuth(opts.url, opts.token);
      conn = await createConnection({ auth });
      status = "connected";
      conn.addEventListener("disconnected", () => {
        status = "disconnected";
        emitter.emit();
      });
      conn.addEventListener("ready", () => {
        status = "connected";
        emitter.emit();
      });
      unsub = subscribeEntities(conn, (ents) => build(ents as unknown as HassEntities));
    } catch (err) {
      console.error("[hsu] live connection failed", err);
      status = "error";
      emitter.emit();
    }
  })();

  return {
    kind: "live",
    getHass: () => hass,
    getStatus: () => status,
    subscribe: emitter.subscribe,
    dispose() {
      unsub?.();
      conn?.close();
    },
  };
}
