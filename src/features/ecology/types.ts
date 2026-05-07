import type { Guild, Species } from "../data/speciesSchema";

export interface ReefClimate {
  temperature: number;
  ph: number;
}

export interface SpeciesAgent {
  speciesId: string;
  population: number;
  energy: number;
  stressMemory: number;
  zone: "crest" | "lagoon" | "slope";
}

export interface ReefState {
  day: number;
  climate: ReefClimate;
  agents: Record<string, SpeciesAgent>;
}

export interface ReefMetrics {
  biodiversity: number;
  coralCover: number;
  algaeCover: number;
  fishBiomass: number;
  grazingPressure: number;
  predatorPressure: number;
  climateStress: number;
  reefHealth: number;
  soundComplexity: number;
}

export interface PopulationView {
  species: Species;
  population: number;
  suitability: number;
  stress: number;
  guild: Guild;
}

export interface ReefSnapshot {
  day: number;
  climate: ReefClimate;
  metrics: ReefMetrics;
  populations: PopulationView[];
}

export interface ReefLogRecord {
  step: number;
  day: number;
  temperature: number;
  ph: number;
  biodiversity: number;
  coralCover: number;
  algaeCover: number;
  fishBiomass: number;
  climateStress: number;
  reefHealth: number;
}
