import { rmSync } from "node:fs";

const generatedPaths = [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/manifest.webmanifest",
  "docs/sw.js",
  "docs/registerSW.js",
];

for (const path of generatedPaths) {
  rmSync(path, { force: true, recursive: true });
}

