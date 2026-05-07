import { describe, expect, it } from "vitest";

import catalogJson from "../../../public/data/v1/species.json";
import { speciesCatalogSchema } from "../data/speciesSchema";

import {
  advanceReef,
  createInitialReef,
  createSnapshot,
  dropSpecies,
  removeSpecies,
  setClimate,
} from "./simulation";

const catalog = speciesCatalogSchema.parse(catalogJson);

function runDays(initial = createInitialReef(catalog), days = 40) {
  let state = initial;
  for (let index = 0; index < days; index += 1) {
    state = advanceReef(state, catalog, 1);
  }
  return state;
}

describe("reef simulation", () => {
  it("starts with a biodiverse reef", () => {
    const snapshot = createSnapshot(createInitialReef(catalog), catalog);

    expect(snapshot.metrics.biodiversity).toBeGreaterThan(85);
    expect(snapshot.metrics.coralCover).toBeGreaterThan(50);
    expect(snapshot.populations).toHaveLength(catalog.species.length);
  });

  it("raises climate stress during a heat and low-pH pulse", () => {
    const baseline = createSnapshot(
      runDays(createInitialReef(catalog), 35),
      catalog,
    );
    const stressedState = setClimate(createInitialReef(catalog), {
      temperature: 31.4,
      ph: 7.7,
    });
    const stressed = createSnapshot(runDays(stressedState, 35), catalog);

    expect(stressed.metrics.climateStress).toBeGreaterThan(
      baseline.metrics.climateStress + 25,
    );
    expect(stressed.metrics.reefHealth).toBeLessThan(
      baseline.metrics.reefHealth,
    );
  });

  it("lets herbivore loss trigger an algae cascade", () => {
    let overfished = createInitialReef(catalog);
    for (const species of catalog.species.filter(
      (item) => item.guild === "herbivore" || item.guild === "grazer",
    )) {
      overfished = removeSpecies(
        overfished,
        species.id,
        species.startingPopulation * 0.85,
      );
    }

    const balanced = createSnapshot(
      runDays(createInitialReef(catalog), 20),
      catalog,
    );
    const cascade = createSnapshot(runDays(overfished, 20), catalog);

    expect(cascade.metrics.algaeCover).toBeGreaterThan(
      balanced.metrics.algaeCover,
    );
    expect(cascade.metrics.grazingPressure).toBeLessThan(
      balanced.metrics.grazingPressure,
    );
  });

  it("adds species agents through dropSpecies", () => {
    const state = createInitialReef(catalog);
    const next = dropSpecies(state, "parrotfish", 12);

    expect(next.agents.parrotfish.population).toBe(
      state.agents.parrotfish.population + 12,
    );
  });
});
