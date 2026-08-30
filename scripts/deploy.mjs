import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
let project;
try { project = JSON.parse(readFileSync(new URL("../.vercel/project.json", import.meta.url), "utf8")); }
catch { throw new Error("Link this project to the separate nexus-tools Vercel project first."); }
if (project.projectName !== "nexus-tools") throw new Error("Refusing to deploy to a project other than nexus-tools.");
const result = spawnSync("npx", ["vercel", "deploy", "--prod", "--yes"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
if (result.status !== 0) process.exit(result.status ?? 1);
