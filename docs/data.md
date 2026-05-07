# Data

The v1 static data contract lives at:

- `/data/v1/species.json`
- `/data/v1/species.meta.json`

Schema version: `reef-species.v1`

Species records include:

- `id`
- `commonName`
- `scientificName`
- `guild`
- `trophicLevel`
- `thermalOptimum`
- `thermalTolerance`
- `phOptimum`
- `phTolerance`
- `growthRate`
- `mortalityRate`
- `soundSignature`
- `notes`

Breaking changes create a new path, such as `/data/v2/`.

Because this is Mode A, data is committed and served by GitHub Pages. `make data` validates the static files and updates metadata if needed.
