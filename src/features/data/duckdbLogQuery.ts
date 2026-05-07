import type { ReefLogRecord } from "../ecology/types";

export interface DuckDbSummary {
  samples: number;
  averageHealth: number;
  coralSwing: number;
  peakAlgae: number;
  averageStress: number;
}

export async function summarizeLogWithDuckDb(
  log: ReefLogRecord[],
): Promise<DuckDbSummary> {
  if (log.length < 2) {
    throw new Error(
      "Run the simulation for a few steps before querying the log.",
    );
  }

  const duckdb = await import("@duckdb/duckdb-wasm");
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  if (!bundle.mainWorker) {
    throw new Error("DuckDB-WASM did not provide a worker bundle.");
  }

  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  const connection = await db.connect();
  try {
    await db.registerFileText("reef_log.json", JSON.stringify(log));
    const result = await connection.query(`
      SELECT
        count(*)::INTEGER AS samples,
        round(avg(reefHealth), 1)::DOUBLE AS averageHealth,
        round(max(coralCover) - min(coralCover), 1)::DOUBLE AS coralSwing,
        round(max(algaeCover), 1)::DOUBLE AS peakAlgae,
        round(avg(climateStress), 1)::DOUBLE AS averageStress
      FROM read_json_auto('reef_log.json')
    `);
    const [row] = result
      .toArray()
      .map((item) => item.toJSON() as Record<string, unknown>);
    return {
      samples: Number(row.samples ?? 0),
      averageHealth: Number(row.averageHealth ?? 0),
      coralSwing: Number(row.coralSwing ?? 0),
      peakAlgae: Number(row.peakAlgae ?? 0),
      averageStress: Number(row.averageStress ?? 0),
    };
  } finally {
    await connection.close();
    await db.terminate();
    worker.terminate();
  }
}
