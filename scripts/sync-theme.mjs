// Vendor the canonical theme for independent Tools deployments. No runtime network dependency.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const source = new URL("../../Nexus-Project/Nexus/", import.meta.url);
const target = new URL("../", import.meta.url);
const files = [
  ["src/styles/nexusTheme.css", "src/nexusTheme.css"],
  ...["manrope-latin.woff2", "noto-sans-thai.woff2"].map(name => [
    `public/projects/assets/${name}`, `public/projects/assets/${name}`,
  ]),
];

for (const [from, to] of files) {
  const canonical = await readFile(new URL(from, source));
  const destination = new URL(to, target);
  if (process.argv.includes("--check")) {
    const local = await readFile(destination);
    if (!canonical.equals(local)) throw new Error(`Theme drift: ${to}. Run node scripts/sync-theme.mjs.`);
  } else {
    await mkdir(new URL("./", destination), { recursive: true });
    await writeFile(destination, canonical);
  }
}
