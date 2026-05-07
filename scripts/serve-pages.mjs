import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const docsRoot = "docs";
const basePath = "/coral-reef-ecology-simulator/";
const port = Number(process.env.PORT ?? process.argv[2] ?? 4174);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".md", "text/markdown; charset=utf-8"],
]);

createServer((request, response) => {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "127.0.0.1"}`,
  );
  if (url.pathname === "/") {
    response.writeHead(302, { Location: basePath });
    response.end();
    return;
  }

  if (!url.pathname.startsWith(basePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const relative = url.pathname.slice(basePath.length) || "index.html";
  const safeRelative = normalize(relative).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(docsRoot, safeRelative);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    filePath = join(docsRoot, "404.html");
  }

  response.setHeader("Cache-Control", "no-store");
  response.setHeader(
    "Content-Type",
    contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  );
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(
    `Serving ${docsRoot} at http://127.0.0.1:${port}${basePath}\n`,
  );
});
