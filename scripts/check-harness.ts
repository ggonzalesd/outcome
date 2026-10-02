import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pointers = [
  "CLAUDE.md",
  "GEMINI.md",
  ".cursor/rules/agents.mdc",
  ".github/copilot-instructions.md",
];
const failures: string[] = [];

for (const path of ["AGENTS.md", "docs/harness.md", ...pointers]) {
  if (!existsSync(join(root, path))) failures.push(`Missing harness entry: ${path}`);
}
for (const path of pointers) {
  const absolute = join(root, path);
  if (existsSync(absolute) && !readFileSync(absolute, "utf8").includes("AGENTS.md")) {
    failures.push(`Harness entry must point to AGENTS.md: ${path}`);
  }
}

const cursorPath = join(root, ".cursor/rules/agents.mdc");
if (existsSync(cursorPath) && !readFileSync(cursorPath, "utf8").includes("alwaysApply: true")) {
  failures.push("Cursor manual pointer must be always-on.");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === "string");
}

const opencodePath = join(root, "opencode.json");
if (!existsSync(opencodePath)) {
  failures.push("Missing OpenCode harness configuration.");
} else {
  const config: unknown = JSON.parse(readFileSync(opencodePath, "utf8"));
  if (typeof config !== "object" || config === null || !("instructions" in config) || !isStringArray(config.instructions)) {
    failures.push("OpenCode must declare an instructions array.");
  } else {
    for (const path of ["AGENTS.md", "docs/harness.md", "docs/conventions/typescript.md"]) {
      if (!config.instructions.includes(path)) failures.push(`OpenCode must load ${path}.`);
    }
  }
}

if (failures.length > 0) throw new Error(failures.join("\n"));
console.log("Harnesses: Codex, Claude, Gemini, Cursor, Copilot, and OpenCode pointers checked.");
