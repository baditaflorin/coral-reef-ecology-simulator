import { copyFileSync, existsSync } from "node:fs";

if (!existsSync("docs/index.html")) {
  throw new Error("Expected docs/index.html after Vite build.");
}

copyFileSync("docs/index.html", "docs/404.html");
