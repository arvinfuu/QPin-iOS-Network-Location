import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetMemoryStore, createSettingsStore, SETTINGS_KEY } from "../src/settings/store.js";
import {
  handleSettingsRequest,
  SETTINGS_HEADERS,
  SETTINGS_PROTOCOL_VERSION,
  SETTINGS_SERVICE,
  settingsPreflightResponse,
  type SettingsRequest,
} from "../src/settings/handlers.js";
import { validateSettingsInput } from "../src/settings/validate.js";
import { resolveTarget } from "../src/settings/resolve.js";

const ORIGIN = "https://picker.example";
const ALLOWED = [ORIGIN];

function request(
  action: string,
  options: { method?: string; lon?: string; lat?: string; acc?: string; origin?: string } = {}
): SettingsRequest {
  return {
    url: `https://gs-loc.apple.com/qpin-nl/settings?action=${encodeURIComponent(action)}`,
    method: options.method || (action === "query" ? "GET" : "POST"),
    headers: {
      Origin: options.origin || ORIGIN,
      [SETTINGS_HEADERS.protocol]: String(SETTINGS_PROTOCOL_VERSION),
      ...(options.lon == null ? {} : { [SETTINGS_HEADERS.longitude]: options.lon }),
      ...(options.lat == null ? {} : { [SETTINGS_HEADERS.latitude]: options.lat }),
      ...(options.acc == null ? {} : { [SETTINGS_HEADERS.accuracy]: options.acc }),
    },
  };
}

describe("settings validation", () => {
  it("accepts zero and negative coordinates", () => {
    expect(validateSettingsInput({ longitude: 0, latitude: 0, accuracy: 25 }).ok).toBe(true);
    expect(validateSettingsInput({ longitude: -74.006, latitude: -33.9, accuracy: 10 }).ok).toBe(true);
  });

  it("rejects ranges and non-strict numeric strings", () => {
    expect(validateSettingsInput({ longitude: 181, latitude: 0 }).ok).toBe(false);
    expect(validateSettingsInput({ longitude: 0, latitude: 91 }).ok).toBe(false);
    expect(validateSettingsInput({ longitude: 0, latitude: 0, accuracy: 0 }).ok).toBe(false);
    expect(validateSettingsInput({ longitude: "1abc", latitude: "2" }).ok).toBe(false);
    expect(validateSettingsInput({ longitude: "1", latitude: "2", accuracy: "25px" }).ok).toBe(false);
  });
});

describe("settings protocol", () => {
  beforeEach(() => __resetMemoryStore());
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).$persistentStore;
  });

  it("save, query, clear without coordinates in the URL", () => {
    const store = createSettingsStore("Node.js");
    const saveRequest = request("save", { lon: "-74.006", lat: "40.7128", acc: "30" });
    expect(saveRequest.url).not.toContain("lon=");
    const save = handleSettingsRequest(saveRequest, store, ALLOWED);
    expect(save).toMatchObject({
      service: SETTINGS_SERVICE,
      protocolVersion: SETTINGS_PROTOCOL_VERSION,
      success: true,
      longitude: -74.006,
      mode: "active",
    });

    const query = handleSettingsRequest(request("query"), store, ALLOWED);
    expect(query).toMatchObject({ success: true, latitude: 40.7128 });

    const clear = handleSettingsRequest(request("clear"), store, ALLOWED);
    expect(clear).toMatchObject({ success: true, mode: "passthrough" });
    expect(handleSettingsRequest(request("query"), store, ALLOWED)).toMatchObject({
      success: false,
      mode: "passthrough",
    });
  });

  it("accepts zero coordinate headers", () => {
    const result = handleSettingsRequest(
      request("save", { lon: "0", lat: "0", acc: "25" }),
      createSettingsStore("Node.js"),
      ALLOWED
    );
    expect(result).toMatchObject({ success: true, longitude: 0, latitude: 0 });
  });

  it("rejects unknown actions, wrong methods, origins, and missing protocol", () => {
    const store = createSettingsStore("Node.js");
    expect(handleSettingsRequest(request("erase"), store, ALLOWED).success).toBe(false);
    expect(handleSettingsRequest(request("save", { method: "GET", lon: "1", lat: "2" }), store, ALLOWED).success).toBe(false);
    expect(handleSettingsRequest(request("query", { origin: "https://evil.example" }), store, ALLOWED).success).toBe(false);
    const noProtocol = request("query");
    delete noProtocol.headers?.[SETTINGS_HEADERS.protocol];
    expect(handleSettingsRequest(noProtocol, store, ALLOWED).success).toBe(false);
  });

  it("allows only safe preflight headers from an approved origin", () => {
    const base: SettingsRequest = {
      url: "https://gs-loc.apple.com/qpin-nl/settings?action=save",
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Headers": Object.values(SETTINGS_HEADERS).join(","),
      },
    };
    expect(settingsPreflightResponse(base, ALLOWED).status).toBe(204);
    expect(
      settingsPreflightResponse(
        { ...base, headers: { ...base.headers, Origin: "https://evil.example" } },
        ALLOWED
      ).status
    ).toBe(403);
  });

  it("does not report clear success when persistent storage refuses the write", () => {
    (globalThis as Record<string, unknown>).$persistentStore = {
      read: () => JSON.stringify({ longitude: 1, latitude: 2, accuracy: 25 }),
      write: () => false,
    };
    expect(createSettingsStore("Loon").clear()).toBe(false);
  });

  it("resolve prefers store over args; clear means passthrough", () => {
    const store = createSettingsStore("Node.js");
    store.set({ longitude: 10, latitude: 20, accuracy: 25, updatedAt: new Date().toISOString() });
    expect(resolveTarget({ store, argument: "longitude=1&latitude=2&accuracy=25" })).toEqual({
      longitude: 10,
      latitude: 20,
      accuracy: 25,
    });
    store.clear();
    expect(resolveTarget({ store, argument: "longitude=&latitude=&accuracy=25" })).toBeNull();
    expect(SETTINGS_KEY).toBe("qpin_network_location");
  });
});
