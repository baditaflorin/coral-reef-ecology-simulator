import type { Species, SpeciesCatalog } from "../data/speciesSchema";
import { clamp, round } from "../../shared/math";

import type {
  PopulationView,
  ReefClimate,
  ReefLogRecord,
  ReefMetrics,
  ReefSnapshot,
  ReefState,
} from "./types";

const defaultClimate: ReefClimate = {
  temperature: 27.6,
  ph: 8.05,
};

const reefCapacity = {
  coral: 160,
  algae: 150,
  fish: 130,
};

const zones = ["crest", "lagoon", "slope"] as const;

export const scenarioPresets = [
  {
    id: "balanced",
    name: "Balanced reef",
    climate: defaultClimate,
    description: "High coral cover, active grazers, and moderate predators.",
  },
  {
    id: "heatwave",
    name: "Marine heatwave",
    climate: { temperature: 31.2, ph: 7.96 },
    description: "Bleaching stress rises and algae gains open space.",
  },
  {
    id: "acidification",
    name: "Acidification pulse",
    climate: { temperature: 28.2, ph: 7.72 },
    description: "Calcifiers struggle while fleshy algae holds steady.",
  },
  {
    id: "overfishing",
    name: "Overfished herbivores",
    climate: { temperature: 28.4, ph: 7.98 },
    description: "Remove grazing fish and watch algae pressure build.",
  },
  {
    id: "restoration",
    name: "Restoration push",
    climate: { temperature: 27.4, ph: 8.08 },
    description: "Cooler water, stronger grazing, and coral recovery.",
  },
] as const;

export function createInitialReef(
  catalog: SpeciesCatalog,
  climate = defaultClimate,
): ReefState {
  const agents = Object.fromEntries(
    catalog.species.map((species, index) => [
      species.id,
      {
        speciesId: species.id,
        population: species.startingPopulation,
        energy: 0.72,
        stressMemory: 0,
        zone: zones[index % zones.length],
      },
    ]),
  );

  return {
    day: 0,
    climate,
    agents,
  };
}

export function setClimate(state: ReefState, climate: ReefClimate): ReefState {
  return {
    ...state,
    climate: {
      temperature: clamp(climate.temperature, 24, 33),
      ph: clamp(climate.ph, 7.55, 8.25),
    },
  };
}

export function dropSpecies(
  state: ReefState,
  speciesId: string,
  amount = 8,
): ReefState {
  const agent = state.agents[speciesId];
  if (!agent) {
    return state;
  }

  return {
    ...state,
    agents: {
      ...state.agents,
      [speciesId]: {
        ...agent,
        population: clamp(agent.population + amount, 0, 240),
        energy: clamp(agent.energy + 0.08, 0, 1),
      },
    },
  };
}

export function removeSpecies(
  state: ReefState,
  speciesId: string,
  amount = 8,
): ReefState {
  const agent = state.agents[speciesId];
  if (!agent) {
    return state;
  }

  return {
    ...state,
    agents: {
      ...state.agents,
      [speciesId]: {
        ...agent,
        population: clamp(agent.population - amount, 0, 240),
      },
    },
  };
}

export function applyScenario(
  state: ReefState,
  catalog: SpeciesCatalog,
  scenarioId: string,
): ReefState {
  const preset =
    scenarioPresets.find((scenario) => scenario.id === scenarioId) ??
    scenarioPresets[0];
  let next = setClimate(
    createInitialReef(catalog, preset.climate),
    preset.climate,
  );

  if (scenarioId === "overfishing") {
    for (const species of catalog.species.filter(
      (item) => item.guild === "herbivore" || item.guild === "grazer",
    )) {
      next = removeSpecies(next, species.id, species.startingPopulation * 0.72);
    }
  }

  if (scenarioId === "restoration") {
    for (const species of catalog.species.filter(
      (item) => item.guild === "coral" || item.guild === "herbivore",
    )) {
      next = dropSpecies(next, species.id, species.startingPopulation * 0.28);
    }
  }

  return { ...next, day: state.day };
}

export function advanceReef(
  state: ReefState,
  catalog: SpeciesCatalog,
  deltaDays: number,
): ReefState {
  const snapshot = createSnapshot(state, catalog);
  const coralOpenSpace = 1 - snapshot.metrics.coralCover / 100;
  const algaeDominance = snapshot.metrics.algaeCover / 100;
  const grazing = snapshot.metrics.grazingPressure / 100;
  const predatorPressure = snapshot.metrics.predatorPressure / 100;
  const planktivoreMass = sumGuild(state, catalog, ["planktivore"]);
  const herbivoreMass = sumGuild(state, catalog, ["herbivore", "grazer"]);
  const damselfishBoost = (state.agents["damselfish"]?.population ?? 0) / 220;

  const agents = Object.fromEntries(
    catalog.species.map((species) => {
      const agent = state.agents[species.id];
      const suitability = environmentalSuitability(species, state.climate);
      const stress = 1 - suitability;
      let growth = species.growthRate * suitability;
      let loss = species.mortalityRate + stress * 0.038;

      if (species.guild === "coral") {
        growth *=
          0.72 + coralOpenSpace * 0.55 + settlementBoost(state, catalog);
        loss += algaeDominance * 0.048;
        loss += heatBleachingPressure(species, state.climate);
        loss += acidificationPressure(species, state.climate) * 0.8;
      }

      if (species.guild === "algae") {
        growth *=
          0.9 + coralOpenSpace * 0.9 + damselfishBoost * 0.22 + stress * 0.16;
        loss += grazing * (species.id === "macroalgae" ? 0.052 : 0.064);
        loss += (snapshot.metrics.coralCover / 100) * 0.012;
        if (species.id === "coralline-algae") {
          loss += acidificationPressure(species, state.climate) * 1.1;
        }
      }

      if (species.guild === "herbivore" || species.guild === "grazer") {
        const food = clamp(algaeDominance * 1.25 + 0.18, 0.12, 1.18);
        growth *= food;
        loss += predatorPressure * 0.024 + stress * 0.018;
      }

      if (species.guild === "planktivore") {
        growth *=
          0.62 +
          snapshot.metrics.coralCover / 140 +
          snapshot.metrics.biodiversity / 280;
        loss += predatorPressure * 0.017 + algaeDominance * 0.012;
      }

      if (species.guild === "predator") {
        const prey = clamp((herbivoreMass + planktivoreMass) / 125, 0.08, 1.2);
        growth *= prey;
        loss += prey < 0.22 ? 0.018 : 0;
      }

      const capacityPenalty = capacityPressure(
        species,
        agent.population,
        snapshot.metrics,
      );
      const nextPopulation = clamp(
        agent.population +
          agent.population * (growth - loss - capacityPenalty) * deltaDays,
        0,
        240,
      );
      const nextStress = clamp(agent.stressMemory * 0.84 + stress * 0.16, 0, 1);

      return [
        species.id,
        {
          ...agent,
          population: nextPopulation,
          energy: clamp(agent.energy + (growth - loss) * 0.4, 0, 1),
          stressMemory: nextStress,
        },
      ];
    }),
  );

  return {
    ...state,
    day: state.day + deltaDays,
    agents,
  };
}

export function createSnapshot(
  state: ReefState,
  catalog: SpeciesCatalog,
): ReefSnapshot {
  const populations: PopulationView[] = catalog.species.map((species) => {
    const agent = state.agents[species.id];
    const suitability = environmentalSuitability(species, state.climate);
    return {
      species,
      population: agent?.population ?? 0,
      suitability,
      stress: agent?.stressMemory ?? 1 - suitability,
      guild: species.guild,
    };
  });

  return {
    day: state.day,
    climate: state.climate,
    metrics: deriveMetrics(state, catalog),
    populations,
  };
}

export function deriveMetrics(
  state: ReefState,
  catalog: SpeciesCatalog,
): ReefMetrics {
  const total = catalog.species.reduce(
    (sum, species) => sum + (state.agents[species.id]?.population ?? 0),
    0,
  );
  const shannon = catalog.species.reduce((sum, species) => {
    const population = state.agents[species.id]?.population ?? 0;
    if (population <= 0 || total <= 0) {
      return sum;
    }
    const share = population / total;
    return sum - share * Math.log(share);
  }, 0);
  const biodiversity = clamp(
    (shannon / Math.log(catalog.species.length)) * 100,
    0,
    100,
  );
  const coralCover = clamp(
    (sumGuild(state, catalog, ["coral"]) / reefCapacity.coral) * 100,
    0,
    100,
  );
  const algaeCover = clamp(
    (sumGuild(state, catalog, ["algae"]) / reefCapacity.algae) * 100,
    0,
    100,
  );
  const fishBiomass = clamp(
    (sumGuild(state, catalog, ["herbivore", "predator", "planktivore"]) /
      reefCapacity.fish) *
      100,
    0,
    100,
  );
  const grazingPressure = clamp(
    (sumGuild(state, catalog, ["herbivore"]) * 0.82 +
      sumGuild(state, catalog, ["grazer"]) * 1.18) /
      1.15,
    0,
    100,
  );
  const predatorPressure = clamp(
    sumGuild(state, catalog, ["predator"]) * 3.2,
    0,
    100,
  );
  const climateStress = weightedClimateStress(state, catalog);
  const soundComplexity = clamp(
    biodiversity * 0.48 +
      fishBiomass * 0.32 +
      coralCover * 0.2 -
      climateStress * 0.18,
    0,
    100,
  );
  const reefHealth = clamp(
    coralCover * 0.36 +
      biodiversity * 0.24 +
      fishBiomass * 0.16 +
      grazingPressure * 0.13 -
      algaeCover * 0.16 -
      climateStress * 0.22 +
      24,
    0,
    100,
  );

  return {
    biodiversity: round(biodiversity),
    coralCover: round(coralCover),
    algaeCover: round(algaeCover),
    fishBiomass: round(fishBiomass),
    grazingPressure: round(grazingPressure),
    predatorPressure: round(predatorPressure),
    climateStress: round(climateStress),
    reefHealth: round(reefHealth),
    soundComplexity: round(soundComplexity),
  };
}

export function toLogRecord(
  snapshot: ReefSnapshot,
  step: number,
): ReefLogRecord {
  return {
    step,
    day: round(snapshot.day, 2),
    temperature: round(snapshot.climate.temperature, 2),
    ph: round(snapshot.climate.ph, 3),
    biodiversity: snapshot.metrics.biodiversity,
    coralCover: snapshot.metrics.coralCover,
    algaeCover: snapshot.metrics.algaeCover,
    fishBiomass: snapshot.metrics.fishBiomass,
    climateStress: snapshot.metrics.climateStress,
    reefHealth: snapshot.metrics.reefHealth,
  };
}

export function environmentalSuitability(
  species: Species,
  climate: ReefClimate,
): number {
  const temperatureDistance =
    Math.abs(climate.temperature - species.thermalOptimum) /
    species.thermalTolerance;
  const phDistance =
    Math.abs(climate.ph - species.phOptimum) / species.phTolerance;
  const temperatureScore = Math.exp(-temperatureDistance * temperatureDistance);
  const phScore = Math.exp(-phDistance * phDistance);
  return clamp(temperatureScore * 0.62 + phScore * 0.38, 0, 1);
}

function weightedClimateStress(
  state: ReefState,
  catalog: SpeciesCatalog,
): number {
  const total = catalog.species.reduce(
    (sum, species) => sum + (state.agents[species.id]?.population ?? 0),
    0,
  );
  if (total <= 0) {
    return 100;
  }
  const stress = catalog.species.reduce((sum, species) => {
    const population = state.agents[species.id]?.population ?? 0;
    return (
      sum + (1 - environmentalSuitability(species, state.climate)) * population
    );
  }, 0);
  return clamp((stress / total) * 100, 0, 100);
}

function sumGuild(
  state: ReefState,
  catalog: SpeciesCatalog,
  guilds: Species["guild"][],
): number {
  return catalog.species
    .filter((species) => guilds.includes(species.guild))
    .reduce(
      (sum, species) => sum + (state.agents[species.id]?.population ?? 0),
      0,
    );
}

function settlementBoost(state: ReefState, catalog: SpeciesCatalog): number {
  const coralline = catalog.species.find(
    (species) => species.id === "coralline-algae",
  );
  if (!coralline) {
    return 0;
  }
  return clamp((state.agents[coralline.id]?.population ?? 0) / 220, 0, 0.16);
}

function heatBleachingPressure(species: Species, climate: ReefClimate): number {
  if (species.guild !== "coral") {
    return 0;
  }
  const excessHeat = Math.max(
    0,
    climate.temperature -
      (species.thermalOptimum + species.thermalTolerance * 0.52),
  );
  return excessHeat * 0.024;
}

function acidificationPressure(species: Species, climate: ReefClimate): number {
  const lowPh = Math.max(
    0,
    species.phOptimum - climate.ph - species.phTolerance * 0.36,
  );
  return lowPh * 0.18;
}

function capacityPressure(
  species: Species,
  population: number,
  metrics: ReefMetrics,
): number {
  if (species.guild === "coral") {
    return Math.max(0, metrics.coralCover - 82) * 0.00045 + population / 9000;
  }
  if (species.guild === "algae") {
    return Math.max(0, metrics.algaeCover - 78) * 0.0005 + population / 9500;
  }
  return Math.max(0, metrics.fishBiomass - 86) * 0.00042 + population / 12000;
}
