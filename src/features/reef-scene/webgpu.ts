export interface WebGpuStatus {
  available: boolean;
  label: string;
  detail: string;
}

export async function probeWebGpu(): Promise<WebGpuStatus> {
  if (!("gpu" in navigator) || !navigator.gpu) {
    return {
      available: false,
      label: "WebGPU fallback",
      detail: "This browser is rendering with Three.js WebGL fallback.",
    };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) {
      return {
        available: false,
        label: "WebGPU fallback",
        detail: "No WebGPU adapter was available, so the app is using WebGL.",
      };
    }
    const device = await adapter.requestDevice();
    device.destroy();
    return {
      available: true,
      label: "WebGPU ready",
      detail:
        "WebGPU is available for acceleration paths; Three.js owns the reef render.",
    };
  } catch {
    return {
      available: false,
      label: "WebGPU fallback",
      detail:
        "WebGPU initialization failed, but the simulator continues in WebGL.",
    };
  }
}
