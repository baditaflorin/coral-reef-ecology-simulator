import {
  Activity,
  Database,
  FlaskConical,
  Github,
  HeartHandshake,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Thermometer,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ReefSoundscape } from "./features/audio/ReefSoundscape";
import {
  summarizeLogWithDuckDb,
  type DuckDbSummary,
} from "./features/data/duckdbLogQuery";
import type {
  SpeciesCatalog,
  SpeciesMeta,
} from "./features/data/speciesSchema";
import { useSpeciesCatalog } from "./features/data/useSpeciesCatalog";
import {
  advanceReef,
  applyScenario,
  createInitialReef,
  createSnapshot,
  dropSpecies,
  removeSpecies,
  scenarioPresets,
  setClimate,
  toLogRecord,
} from "./features/ecology/simulation";
import type {
  ReefLogRecord,
  ReefSnapshot,
  ReefState,
} from "./features/ecology/types";
import { ReefScene } from "./features/reef-scene/ReefScene";
import type { WebGpuStatus } from "./features/reef-scene/webgpu";
import {
  loadSettings,
  saveSettings,
  type PersistedSettings,
} from "./shared/storage";

const githubUrl =
  "https://github.com/baditaflorin/coral-reef-ecology-simulator";
const paypalUrl = "https://www.paypal.com/paypalme/florinbadita";
const buildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  builtAt: __APP_BUILT_AT__,
};

export function App() {
  const catalogQuery = useSpeciesCatalog();
  const settings = useMemo(() => loadSettings(), []);

  if (catalogQuery.isLoading) {
    return (
      <main className="loading-screen">
        <Waves aria-hidden="true" />
        <h1>Coral Reef Ecology Simulator</h1>
        <p>Loading reef species and warming up the lagoon...</p>
      </main>
    );
  }

  if (catalogQuery.error || !catalogQuery.data) {
    return (
      <main className="loading-screen">
        <h1>Could not load reef data</h1>
        <p>
          {catalogQuery.error?.message ??
            "The static species catalog was unavailable."}
        </p>
      </main>
    );
  }

  return <Simulator catalogData={catalogQuery.data} settings={settings} />;
}

function Simulator({
  catalogData,
  settings,
}: {
  catalogData: { catalog: SpeciesCatalog; meta: SpeciesMeta };
  settings: Partial<PersistedSettings>;
}) {
  const [reefState, setReefState] = useState<ReefState>(() =>
    createInitialReef(catalogData.catalog, settings.climate),
  );
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(settings.speed ?? 1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [webGpuStatus, setWebGpuStatus] = useState<WebGpuStatus>({
    available: false,
    label: "Checking WebGPU",
    detail: "Probing browser support.",
  });
  const [log, setLog] = useState<ReefLogRecord[]>([]);
  const [duckSummary, setDuckSummary] = useState<DuckDbSummary | null>(null);
  const [duckStatus, setDuckStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const soundscapeRef = useRef<ReefSoundscape | null>(null);
  const stepRef = useRef(0);

  const snapshot = useMemo<ReefSnapshot>(
    () => createSnapshot(reefState, catalogData.catalog),
    [catalogData.catalog, reefState],
  );

  useEffect(() => {
    saveSettings({ climate: reefState.climate, speed });
  }, [reefState, speed]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setReefState((current) => {
        const next = advanceReef(current, catalogData.catalog, 0.32 * speed);
        const nextSnapshot = createSnapshot(next, catalogData.catalog);
        const step = stepRef.current + 1;
        stepRef.current = step;
        setLog((records) => [
          ...records.slice(-239),
          toLogRecord(nextSnapshot, step),
        ]);
        return next;
      });
    }, 620);

    return () => window.clearInterval(interval);
  }, [catalogData.catalog, isRunning, speed]);

  useEffect(() => {
    if (soundEnabled && soundscapeRef.current) {
      soundscapeRef.current.update(snapshot);
    }
  }, [snapshot, soundEnabled]);

  useEffect(() => {
    return () => soundscapeRef.current?.dispose();
  }, []);

  const handleClimateChange = (climate: Partial<ReefState["climate"]>) => {
    setReefState((current) =>
      setClimate(current, { ...current.climate, ...climate }),
    );
  };

  const handleDropSpecies = (speciesId: string) => {
    setReefState((current) => dropSpecies(current, speciesId, 10));
  };

  const handleRemoveSpecies = (speciesId: string) => {
    setReefState((current) => removeSpecies(current, speciesId, 10));
  };

  const handleScenario = (scenarioId: string) => {
    setReefState((current) =>
      applyScenario(current, catalogData.catalog, scenarioId),
    );
    setNotice(
      "Scenario applied. The reef will settle over the next simulated days.",
    );
    window.setTimeout(() => setNotice(null), 3200);
  };

  const handleReset = () => {
    setLog([]);
    setDuckSummary(null);
    stepRef.current = 0;
    setReefState(createInitialReef(catalogData.catalog));
  };

  const handleSoundToggle = async () => {
    const soundscape = soundscapeRef.current ?? new ReefSoundscape();
    soundscapeRef.current = soundscape;

    if (soundEnabled) {
      await soundscape.stop();
      setSoundEnabled(false);
      return;
    }

    await soundscape.start(snapshot);
    setSoundEnabled(true);
  };

  const handleDuckQuery = async () => {
    setDuckStatus("loading");
    setDuckSummary(null);
    try {
      const summary = await summarizeLogWithDuckDb(log);
      setDuckSummary(summary);
      setDuckStatus("success");
    } catch (error) {
      setDuckStatus("error");
      setNotice(
        error instanceof Error ? error.message : "DuckDB-WASM query failed.",
      );
      window.setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleWebGpuStatus = useCallback((status: WebGpuStatus) => {
    setWebGpuStatus(status);
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Climate education that feels something</p>
          <h1>Coral Reef Ecology Simulator</h1>
        </div>
        <nav className="header-actions" aria-label="Project links">
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            title="Open the GitHub repository"
          >
            <Github aria-hidden="true" />
            <span>Star repo</span>
          </a>
          <a
            href={paypalUrl}
            target="_blank"
            rel="noreferrer"
            title="Support Florin Badita on PayPal"
          >
            <HeartHandshake aria-hidden="true" />
            <span>PayPal</span>
          </a>
          <span className="build-pill" title={`Built ${buildInfo.builtAt}`}>
            v{buildInfo.version} · {buildInfo.commit}
          </span>
        </nav>
      </header>

      <section className="workspace">
        <ReefScene snapshot={snapshot} onWebGpuStatus={handleWebGpuStatus} />

        <aside className="control-panel" aria-label="Simulation controls">
          <section className="tool-panel">
            <div className="panel-heading">
              <Activity aria-hidden="true" />
              <h2>Simulation</h2>
            </div>
            <div className="button-row">
              <button
                className="icon-button primary"
                type="button"
                onClick={() => setIsRunning((value) => !value)}
              >
                {isRunning ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
                <span>{isRunning ? "Pause" : "Run"}</span>
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={handleReset}
              >
                <RotateCcw aria-hidden="true" />
                <span>Reset</span>
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={handleSoundToggle}
              >
                {soundEnabled ? (
                  <VolumeX aria-hidden="true" />
                ) : (
                  <Volume2 aria-hidden="true" />
                )}
                <span>{soundEnabled ? "Mute" : "Sound"}</span>
              </button>
            </div>
            <label className="slider-field">
              <span>Simulation speed</span>
              <strong>{speed.toFixed(1)}x</strong>
              <input
                min="0.4"
                max="3"
                step="0.2"
                type="range"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
            </label>
          </section>

          <section className="tool-panel">
            <div className="panel-heading">
              <Thermometer aria-hidden="true" />
              <h2>Climate</h2>
            </div>
            <label className="slider-field">
              <span>Temperature</span>
              <strong>{reefState.climate.temperature.toFixed(1)}°C</strong>
              <input
                min="24"
                max="33"
                step="0.1"
                type="range"
                value={reefState.climate.temperature}
                onChange={(event) =>
                  handleClimateChange({
                    temperature: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="slider-field">
              <span>pH</span>
              <strong>{reefState.climate.ph.toFixed(2)}</strong>
              <input
                min="7.55"
                max="8.25"
                step="0.01"
                type="range"
                value={reefState.climate.ph}
                onChange={(event) =>
                  handleClimateChange({ ph: Number(event.target.value) })
                }
              />
            </label>
          </section>

          <section className="tool-panel">
            <div className="panel-heading">
              <Zap aria-hidden="true" />
              <h2>Scenarios</h2>
            </div>
            <div className="scenario-grid">
              {scenarioPresets.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  title={scenario.description}
                  onClick={() => handleScenario(scenario.id)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="dashboard">
        <MetricsPanel
          snapshot={snapshot}
          soundEnabled={soundEnabled}
          webGpuStatus={webGpuStatus}
        />
        <SpeciesPanel
          snapshot={snapshot}
          onDrop={handleDropSpecies}
          onRemove={handleRemoveSpecies}
        />
        <DataPanel
          log={log}
          duckStatus={duckStatus}
          duckSummary={duckSummary}
          onQuery={handleDuckQuery}
        />
      </section>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}

function MetricsPanel({
  snapshot,
  soundEnabled,
  webGpuStatus,
}: {
  snapshot: ReefSnapshot;
  soundEnabled: boolean;
  webGpuStatus: WebGpuStatus;
}) {
  return (
    <section className="tool-panel metrics-panel">
      <div className="panel-heading">
        <Waves aria-hidden="true" />
        <h2>Reef Signals</h2>
      </div>
      <MetricBar
        label="Reef health"
        value={snapshot.metrics.reefHealth}
        tone="coral"
      />
      <MetricBar
        label="Biodiversity"
        value={snapshot.metrics.biodiversity}
        tone="teal"
      />
      <MetricBar
        label="Coral cover"
        value={snapshot.metrics.coralCover}
        tone="amber"
      />
      <MetricBar
        label="Algae cover"
        value={snapshot.metrics.algaeCover}
        tone="green"
      />
      <MetricBar
        label="Fish biomass"
        value={snapshot.metrics.fishBiomass}
        tone="blue"
      />
      <div className="status-grid">
        <span>{soundEnabled ? "Soundscape live" : "Soundscape muted"}</span>
        <span title={webGpuStatus.detail}>{webGpuStatus.label}</span>
      </div>
    </section>
  );
}

function MetricBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="metric-row">
      <div>
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <div className={`meter meter-${tone}`}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SpeciesPanel({
  snapshot,
  onDrop,
  onRemove,
}: {
  snapshot: ReefSnapshot;
  onDrop: (speciesId: string) => void;
  onRemove: (speciesId: string) => void;
}) {
  return (
    <section className="tool-panel species-panel">
      <div className="panel-heading">
        <FlaskConical aria-hidden="true" />
        <h2>Drop Species</h2>
      </div>
      <div className="species-grid">
        {snapshot.populations.map((view) => (
          <article className="species-card" key={view.species.id}>
            <div
              className="species-swatch"
              style={{ background: view.species.color }}
              aria-hidden="true"
            />
            <div className="species-copy">
              <h3>{view.species.commonName}</h3>
              <p>
                {view.guild} · {Math.round(view.population)} agents
              </p>
            </div>
            <div className="species-actions">
              <button
                type="button"
                aria-label={`Add ${view.species.commonName}`}
                onClick={() => onDrop(view.species.id)}
              >
                <Plus aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${view.species.commonName}`}
                onClick={() => onRemove(view.species.id)}
              >
                <Minus aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DataPanel({
  log,
  duckStatus,
  duckSummary,
  onQuery,
}: {
  log: ReefLogRecord[];
  duckStatus: "idle" | "loading" | "success" | "error";
  duckSummary: DuckDbSummary | null;
  onQuery: () => void;
}) {
  return (
    <section className="tool-panel data-panel">
      <div className="panel-heading">
        <Database aria-hidden="true" />
        <h2>DuckDB Log</h2>
      </div>
      <p>{log.length} local samples captured from this browser session.</p>
      <button
        className="icon-button"
        type="button"
        disabled={duckStatus === "loading"}
        onClick={onQuery}
      >
        <Database aria-hidden="true" />
        <span>{duckStatus === "loading" ? "Querying" : "Analyze log"}</span>
      </button>
      {duckSummary ? (
        <dl className="duck-summary">
          <div>
            <dt>Samples</dt>
            <dd>{duckSummary.samples}</dd>
          </div>
          <div>
            <dt>Avg health</dt>
            <dd>{duckSummary.averageHealth}%</dd>
          </div>
          <div>
            <dt>Coral swing</dt>
            <dd>{duckSummary.coralSwing}%</dd>
          </div>
          <div>
            <dt>Peak algae</dt>
            <dd>{duckSummary.peakAlgae}%</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
