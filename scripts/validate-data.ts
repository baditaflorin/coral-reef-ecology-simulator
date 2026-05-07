import { readFileSync } from "node:fs";
import { z } from "zod";

const speciesSchema = z.object({
  schemaVersion: z.literal("reef-species.v1"),
  species: z
    .array(
      z.object({
        id: z.string().min(2),
        commonName: z.string().min(2),
        scientificName: z.string().min(2),
        guild: z.enum(["coral", "algae", "herbivore", "predator", "planktivore", "grazer"]),
        trophicLevel: z.number().min(1).max(5),
        thermalOptimum: z.number(),
        thermalTolerance: z.number().positive(),
        phOptimum: z.number(),
        phTolerance: z.number().positive(),
        growthRate: z.number(),
        mortalityRate: z.number().nonnegative(),
        startingPopulation: z.number().nonnegative(),
        color: z.string().regex(/^#[0-9a-f]{6}$/i),
        soundSignature: z.enum(["crackle", "graze", "pulse", "drone", "shimmer"]),
        notes: z.string().min(8),
      }),
    )
    .min(8),
});

const metaSchema = z.object({
  schemaVersion: z.literal("reef-species.v1"),
  generatedAt: z.string(),
  sourceCommit: z.string(),
  inputChecksum: z.string(),
});

const species = speciesSchema.parse(JSON.parse(readFileSync("public/data/v1/species.json", "utf8")));
metaSchema.parse(JSON.parse(readFileSync("public/data/v1/species.meta.json", "utf8")));

const ids = new Set<string>();
for (const record of species.species) {
  if (ids.has(record.id)) {
    throw new Error(`Duplicate species id: ${record.id}`);
  }
  ids.add(record.id);
}

