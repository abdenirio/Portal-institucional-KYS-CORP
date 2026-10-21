// Builds the whole project into the Vercel Build Output API (v3) layout:
//   .vercel/output/static            -> kyscorp-portal (Vite build)
//   .vercel/output/functions/api.func -> Express API bundled as one function
import { build as esbuild } from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(root, ".vercel/output");
const fn = path.join(out, "functions/api.func");

await rm(out, { recursive: true, force: true });
await mkdir(fn, { recursive: true });

await esbuild({
  entryPoints: [path.join(here, "src/vercel.ts")],
  outfile: path.join(fn, "index.mjs"),
  platform: "node",
  target: "node22",
  bundle: true,
  format: "esm",
  sourcemap: "linked",
  external: ["pg-native"],
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
import __p from 'node:path';
import __u from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __u.fileURLToPath(import.meta.url);
globalThis.__dirname = __p.dirname(globalThis.__filename);`,
  },
});

await writeFile(
  path.join(fn, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      maxDuration: 30,
    },
    null,
    2,
  ),
);
await writeFile(path.join(fn, "package.json"), '{"type":"module"}');

await cp(
  path.join(root, "artifacts/kyscorp-portal/dist/public"),
  path.join(out, "static"),
  { recursive: true },
);

await writeFile(
  path.join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/api(?:/.*)?$", dest: "/api" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);
console.log("Vercel output ready at", out);
