import type { ReefClimate } from "../features/ecology/types";

const storageKey = "coral-reef-ecology-simulator.settings.v1";

export interface PersistedSettings {
  climate: ReefClimate;
  speed: number;
}

export function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Partial<PersistedSettings>;
  } catch {
    return {};
  }
}

export function saveSettings(settings: PersistedSettings): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // localStorage is optional; the simulator remains usable without persistence.
  }
}
