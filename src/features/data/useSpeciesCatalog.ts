import { useQuery } from "@tanstack/react-query";

import {
  speciesCatalogSchema,
  speciesMetaSchema,
  type SpeciesCatalog,
  type SpeciesMeta,
} from "./speciesSchema";

const dataBaseUrl = `${import.meta.env.BASE_URL}data/v1`;

async function fetchJson<T>(
  url: string,
  parse: (input: unknown) => T,
): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}: ${response.status}`);
  }
  return parse(await response.json());
}

export function useSpeciesCatalog() {
  return useQuery({
    queryKey: ["species-catalog", "reef-species.v1"],
    queryFn: async (): Promise<{
      catalog: SpeciesCatalog;
      meta: SpeciesMeta;
    }> => {
      const [catalog, meta] = await Promise.all([
        fetchJson(`${dataBaseUrl}/species.json`, (input) =>
          speciesCatalogSchema.parse(input),
        ),
        fetchJson(`${dataBaseUrl}/species.meta.json`, (input) =>
          speciesMetaSchema.parse(input),
        ),
      ]);
      return { catalog, meta };
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}
