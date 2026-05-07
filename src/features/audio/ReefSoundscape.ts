import type { ReefSnapshot } from "../ecology/types";
import { clamp, lerp } from "../../shared/math";

type SoundNodeSet = {
  master: GainNode;
  reefHum: OscillatorNode;
  reefHumGain: GainNode;
  fishPulse: OscillatorNode;
  fishPulseGain: GainNode;
  algaeDrone: OscillatorNode;
  algaeDroneGain: GainNode;
  stressDrone: OscillatorNode;
  stressGain: GainNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
  noiseFilter: BiquadFilterNode;
};

export class ReefSoundscape {
  private context: AudioContext | null = null;
  private nodes: SoundNodeSet | null = null;

  async start(snapshot: ReefSnapshot): Promise<void> {
    if (this.context && this.nodes) {
      await this.context.resume();
      this.update(snapshot);
      return;
    }

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = 0.08;
    master.connect(context.destination);

    const reefHum = createOscillator(context, "sine", 88);
    const reefHumGain = createGain(context, 0.18, master);
    reefHum.connect(reefHumGain);

    const fishPulse = createOscillator(context, "triangle", 220);
    const fishPulseGain = createGain(context, 0.04, master);
    fishPulse.connect(fishPulseGain);

    const algaeDrone = createOscillator(context, "sawtooth", 54);
    const algaeDroneGain = createGain(context, 0.02, master);
    algaeDrone.connect(algaeDroneGain);

    const stressDrone = createOscillator(context, "sine", 42);
    const stressGain = createGain(context, 0.01, master);
    stressDrone.connect(stressGain);

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 950;
    noiseFilter.Q.value = 0.72;
    const noiseGain = createGain(context, 0.03, master);
    noiseFilter.connect(noiseGain);
    const noiseSource = createNoiseSource(context);
    noiseSource.connect(noiseFilter);

    [reefHum, fishPulse, algaeDrone, stressDrone, noiseSource].forEach((node) =>
      node.start(),
    );

    this.context = context;
    this.nodes = {
      master,
      reefHum,
      reefHumGain,
      fishPulse,
      fishPulseGain,
      algaeDrone,
      algaeDroneGain,
      stressDrone,
      stressGain,
      noiseSource,
      noiseGain,
      noiseFilter,
    };

    this.update(snapshot);
  }

  update(snapshot: ReefSnapshot): void {
    if (!this.context || !this.nodes) {
      return;
    }

    const now = this.context.currentTime;
    const metrics = snapshot.metrics;
    const health = metrics.reefHealth / 100;
    const stress = metrics.climateStress / 100;
    const fish = metrics.fishBiomass / 100;
    const algae = metrics.algaeCover / 100;
    const complexity = metrics.soundComplexity / 100;

    this.nodes.master.gain.linearRampToValueAtTime(
      lerp(0.035, 0.12, complexity),
      now + 0.7,
    );
    this.nodes.reefHum.frequency.linearRampToValueAtTime(
      lerp(70, 122, health),
      now + 0.8,
    );
    this.nodes.reefHumGain.gain.linearRampToValueAtTime(
      lerp(0.05, 0.18, metrics.coralCover / 100),
      now + 0.8,
    );
    this.nodes.fishPulse.frequency.linearRampToValueAtTime(
      lerp(145, 360, fish),
      now + 0.5,
    );
    this.nodes.fishPulseGain.gain.linearRampToValueAtTime(
      lerp(0.015, 0.12, fish) * (1 - stress * 0.42),
      now + 0.5,
    );
    this.nodes.algaeDrone.frequency.linearRampToValueAtTime(
      lerp(42, 72, algae),
      now + 0.8,
    );
    this.nodes.algaeDroneGain.gain.linearRampToValueAtTime(
      lerp(0.01, 0.12, algae),
      now + 0.8,
    );
    this.nodes.stressDrone.frequency.linearRampToValueAtTime(
      lerp(35, 62, stress),
      now + 0.8,
    );
    this.nodes.stressGain.gain.linearRampToValueAtTime(
      lerp(0.005, 0.14, stress),
      now + 0.8,
    );
    this.nodes.noiseFilter.frequency.linearRampToValueAtTime(
      lerp(520, 1450, complexity),
      now + 0.5,
    );
    this.nodes.noiseGain.gain.linearRampToValueAtTime(
      clamp(0.018 + complexity * 0.09 - stress * 0.055, 0.005, 0.12),
      now + 0.5,
    );
  }

  async stop(): Promise<void> {
    if (!this.context) {
      return;
    }

    await this.context.suspend();
  }

  dispose(): void {
    if (!this.context || !this.nodes) {
      return;
    }
    this.nodes.noiseSource.stop();
    this.nodes.reefHum.stop();
    this.nodes.fishPulse.stop();
    this.nodes.algaeDrone.stop();
    this.nodes.stressDrone.stop();
    void this.context.close();
    this.context = null;
    this.nodes = null;
  }
}

function createOscillator(
  context: AudioContext,
  type: OscillatorType,
  frequency: number,
): OscillatorNode {
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  return oscillator;
}

function createGain(
  context: AudioContext,
  value: number,
  destination: AudioNode,
): GainNode {
  const gain = context.createGain();
  gain.gain.value = value;
  gain.connect(destination);
  return gain;
}

function createNoiseSource(context: AudioContext): AudioBufferSourceNode {
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 2,
    context.sampleRate,
  );
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * 0.35;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
