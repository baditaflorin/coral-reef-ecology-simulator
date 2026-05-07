import { z } from "zod";

export const guildSchema = z.enum([
  "coral",
  "algae",
  "herbivore",
  "predator",
  "planktivore",
  "grazer",
]);

export const speciesSchema = z.object({
  id: z.string(),
  commonName: z.string(),
  scientificName: z.string(),
  guild: guildSchema,
  trophicLevel: z.number(),
  thermalOptimum: z.number(),
  thermalTolerance: z.number(),
  phOptimum: z.number(),
  phTolerance: z.number(),
  growthRate: z.number(),
  mortalityRate: z.number(),
  startingPopulation: z.number(),
  color: z.string(),
  soundSignature: z.enum(["crackle", "graze", "pulse", "drone", "shimmer"]),
  notes: z.string(),
});

export const speciesCatalogSchema = z.object({
  schemaVersion: z.literal("reef-species.v1"),
  species: z.array(speciesSchema),
});

export const speciesMetaSchema = z.object({
  schemaVersion: z.literal("reef-species.v1"),
  generatedAt: z.string(),
  sourceCommit: z.string(),
  inputChecksum: z.string(),
});

export type Guild = z.infer<typeof guildSchema>;
export type Species = z.infer<typeof speciesSchema>;
export type SpeciesCatalog = z.infer<typeof speciesCatalogSchema>;
export type SpeciesMeta = z.infer<typeof speciesMetaSchema>;
