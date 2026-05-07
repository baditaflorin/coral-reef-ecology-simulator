import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};

function gitValue(command: string, fallback: string): string {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

const generatedPagesPathspecs = [
  "':(exclude)docs/assets/**'",
  "':(exclude)docs/index.html'",
  "':(exclude)docs/404.html'",
  "':(exclude)docs/sw.js'",
  "':(exclude)docs/manifest.webmanifest'",
  "':(exclude)docs/data/**'",
].join(" ");
const sourceCommit = gitValue(
  `git log -1 --format=%h -- . ${generatedPagesPathspecs}`,
  "dev",
);
const sourceCommitDate =
  sourceCommit === "dev"
    ? "dev"
    : gitValue(`git show -s --format=%cI ${sourceCommit}`, "dev");

export default defineConfig({
  base: "/coral-reef-ecology-simulator/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_COMMIT__: JSON.stringify(sourceCommit),
    __APP_BUILT_AT__: JSON.stringify(sourceCommitDate),
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          query: ["@tanstack/react-query", "zod"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
});
