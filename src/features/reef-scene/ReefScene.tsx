import { useEffect, useRef, useState } from "react";
import type * as ThreeNamespace from "three";
import type {
  Color,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import type { ReefSnapshot } from "../ecology/types";
import { hashToUnit } from "../../shared/math";

import { probeWebGpu, type WebGpuStatus } from "./webgpu";

type Three = typeof ThreeNamespace;
type Runtime = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  reefGroup: Group;
  fishGroup: Group;
  animationFrame: number;
  lastSignature: string;
  resizeObserver: ResizeObserver;
};

interface ReefSceneProps {
  snapshot: ReefSnapshot;
  onWebGpuStatus: (status: WebGpuStatus) => void;
}

export function ReefScene({ snapshot, onWebGpuStatus }: ReefSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const snapshotRef = useRef(snapshot);
  const [sceneError, setSceneError] = useState<string | null>(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    let disposed = false;

    async function initialize() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const [THREE, webGpuStatus] = await Promise.all([
        import("three"),
        probeWebGpu(),
      ]);
      onWebGpuStatus(webGpuStatus);

      if (disposed) {
        return;
      }

      try {
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x062f33, 1);

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x06383c, 0.08);

        const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
        camera.position.set(0, 3.4, 7.4);
        camera.lookAt(0, 0.4, 0);

        scene.add(new THREE.HemisphereLight(0xb8fff6, 0x183033, 2.4));
        const keyLight = new THREE.DirectionalLight(0xffd9a6, 1.9);
        keyLight.position.set(3, 6, 2);
        scene.add(keyLight);

        const reefGroup = new THREE.Group();
        const fishGroup = new THREE.Group();
        scene.add(createSeafloor(THREE), reefGroup, fishGroup);

        const resizeObserver = new ResizeObserver(() =>
          resizeRenderer(renderer, camera, canvas),
        );
        resizeObserver.observe(canvas);
        resizeRenderer(renderer, camera, canvas);

        const runtime: Runtime = {
          renderer,
          scene,
          camera,
          reefGroup,
          fishGroup,
          animationFrame: 0,
          lastSignature: "",
          resizeObserver,
        };
        runtimeRef.current = runtime;

        const animate = () => {
          const activeSnapshot = snapshotRef.current;
          const signature = visualSignature(activeSnapshot);
          if (runtime.lastSignature !== signature) {
            redrawReef(THREE, runtime, activeSnapshot);
            runtime.lastSignature = signature;
          }

          const time = performance.now() * 0.001;
          runtime.reefGroup.rotation.y = Math.sin(time * 0.12) * 0.045;
          runtime.fishGroup.children.forEach((child, index) => {
            child.position.x += Math.sin(time * 1.4 + index) * 0.0018;
            child.rotation.y = Math.sin(time * 0.9 + index * 0.33) * 0.45;
          });
          renderer.render(scene, camera);
          runtime.animationFrame = window.requestAnimationFrame(animate);
        };

        animate();
      } catch {
        setSceneError("The 3D reef could not initialize in this browser.");
      }
    }

    void initialize();

    return () => {
      disposed = true;
      const runtime = runtimeRef.current;
      if (!runtime) {
        return;
      }
      window.cancelAnimationFrame(runtime.animationFrame);
      runtime.resizeObserver.disconnect();
      disposeGroup(runtime.reefGroup);
      disposeGroup(runtime.fishGroup);
      runtime.renderer.dispose();
      runtimeRef.current = null;
    };
  }, [onWebGpuStatus]);

  return (
    <div className="reef-scene" aria-label="Animated 3D reef simulation">
      {sceneError ? <div className="scene-error">{sceneError}</div> : null}
      <canvas ref={canvasRef} />
      <div className="scene-readout" aria-live="polite">
        <span>Day {Math.floor(snapshot.day)}</span>
        <span>{snapshot.metrics.reefHealth}% health</span>
        <span>{snapshot.metrics.climateStress}% stress</span>
      </div>
    </div>
  );
}

function redrawReef(
  THREE: Three,
  runtime: Runtime,
  snapshot: ReefSnapshot,
): void {
  disposeGroup(runtime.reefGroup);
  disposeGroup(runtime.fishGroup);

  const stressTint = snapshot.metrics.climateStress / 100;
  runtime.scene.fog = new THREE.FogExp2(
    stressTint > 0.55 ? 0x324241 : 0x06383c,
    0.072 + stressTint * 0.045,
  );

  for (const view of snapshot.populations) {
    const count = Math.ceil(
      Math.min(28, view.population / (view.guild === "coral" ? 4.8 : 5.5)),
    );
    for (let index = 0; index < count; index += 1) {
      const seed = `${view.species.id}-${index}`;
      const position = reefPosition(seed);
      const color = new THREE.Color(view.species.color).lerp(
        new THREE.Color(0xc9d3c6),
        view.stress * 0.35,
      );

      if (view.guild === "coral") {
        const coral = createCoral(
          THREE,
          view.species.id,
          color,
          view.suitability,
          seed,
        );
        coral.position.set(position.x, 0.05, position.z);
        runtime.reefGroup.add(coral);
      } else if (view.guild === "algae") {
        const algae = createAlgae(THREE, color, view.population, seed);
        algae.position.set(position.x, 0.03, position.z);
        runtime.reefGroup.add(algae);
      } else {
        const fish = createFish(
          THREE,
          color,
          view.guild === "predator" ? 1.8 : 1,
          seed,
        );
        fish.position.set(
          position.x,
          0.5 + hashToUnit(`${seed}-height`) * 1.2,
          position.z,
        );
        fish.rotation.y = hashToUnit(`${seed}-turn`) * Math.PI * 2;
        runtime.fishGroup.add(fish);
      }
    }
  }
}

function createSeafloor(THREE: Three): Group {
  const group = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.9, 96),
    new THREE.MeshStandardMaterial({
      color: 0xc3a66f,
      roughness: 0.86,
      metalness: 0.02,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  group.add(floor);

  for (let index = 0; index < 26; index += 1) {
    const seed = `rubble-${index}`;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.05 + hashToUnit(seed) * 0.08, 0),
      new THREE.MeshStandardMaterial({ color: 0x8d7d65, roughness: 0.9 }),
    );
    const position = reefPosition(seed);
    stone.position.set(position.x, 0.02, position.z);
    stone.scale.y = 0.45;
    group.add(stone);
  }
  return group;
}

function createCoral(
  THREE: Three,
  speciesId: string,
  color: Color,
  suitability: number,
  seed: string,
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.03,
  });
  const group = new THREE.Group();
  const height = 0.28 + suitability * 0.52 + hashToUnit(`${seed}-h`) * 0.18;

  if (speciesId === "massive-coral") {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 + height * 0.18, 16, 8),
      material,
    );
    dome.scale.y = 0.58;
    dome.position.y = height * 0.24;
    group.add(dome);
    return group;
  }

  if (speciesId === "table-coral") {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.055, height * 0.65, 8),
      material,
    );
    stem.position.y = height * 0.32;
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.16, 0.04, 20),
      material,
    );
    table.position.y = height * 0.68;
    group.add(stem, table);
    return group;
  }

  const branches = 3 + Math.floor(hashToUnit(`${seed}-branches`) * 4);
  for (let branch = 0; branch < branches; branch += 1) {
    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, height, 7),
      material,
    );
    mesh.position.y = height * 0.5;
    mesh.rotation.z = (branch - branches / 2) * 0.2;
    mesh.rotation.y = (branch / branches) * Math.PI * 2;
    group.add(mesh);
  }
  return group;
}

function createAlgae(
  THREE: Three,
  color: Color,
  population: number,
  seed: string,
) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const group = new THREE.Group();
  const blades = 2 + Math.floor(hashToUnit(`${seed}-blades`) * 4);
  const height =
    0.12 + Math.min(0.52, population / 240) + hashToUnit(seed) * 0.12;

  for (let blade = 0; blade < blades; blade += 1) {
    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.022, height, 5),
      material,
    );
    mesh.position.x = (hashToUnit(`${seed}-x-${blade}`) - 0.5) * 0.12;
    mesh.position.z = (hashToUnit(`${seed}-z-${blade}`) - 0.5) * 0.12;
    mesh.position.y = height * 0.5;
    mesh.rotation.z = (hashToUnit(`${seed}-tilt-${blade}`) - 0.5) * 0.55;
    group.add(mesh);
  }
  return group;
}

function createFish(
  THREE: Three,
  color: Color,
  sizeMultiplier: number,
  seed: string,
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.46,
    metalness: 0.08,
  });
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      0.045 * sizeMultiplier,
      0.16 * sizeMultiplier,
      4,
      8,
    ),
    material,
  );
  body.rotation.z = Math.PI / 2;
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.05 * sizeMultiplier, 0.08 * sizeMultiplier, 3),
    material,
  );
  tail.position.x = -0.13 * sizeMultiplier;
  tail.rotation.z = -Math.PI / 2;
  group.scale.setScalar(0.82 + hashToUnit(seed) * 0.42);
  group.add(body, tail);
  return group;
}

function reefPosition(seed: string): { x: number; z: number } {
  const angle = hashToUnit(`${seed}-angle`) * Math.PI * 2;
  const radius = Math.sqrt(hashToUnit(`${seed}-radius`)) * 4.2;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius * 0.68,
  };
}

function visualSignature(snapshot: ReefSnapshot): string {
  const populations = snapshot.populations.map(
    (view) =>
      `${view.species.id}:${Math.round(view.population)}:${Math.round(view.stress * 10)}`,
  );
  return `${Math.round(snapshot.metrics.climateStress)}|${populations.join("|")}`;
}

function resizeRenderer(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  canvas: HTMLCanvasElement,
): void {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(280, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function disposeGroup(group: Group): void {
  for (const child of [...group.children]) {
    child.traverse((node) => {
      const mesh = node as Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material?.dispose();
      }
    });
    group.remove(child);
  }
}
