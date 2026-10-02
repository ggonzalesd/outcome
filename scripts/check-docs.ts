import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const ignored = new Set([".git", ".agents", ".aws", ".codex", "node_modules", "coverage"]);

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name) || entry.isSymbolicLink()) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return extname(entry.name) === ".md" || extname(entry.name) === ".mdc" ? [path] : [];
  });
}

const failures: string[] = [];
const files = markdownFiles(root);
let checked = 0;
for (const file of files) {
  const content = readFileSync(file, "utf8");
  // Only inline Markdown file targets are checked; remote URLs and anchors are outside this check.
  for (const match of content.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (!target || target.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
    const pathname = target.split("#")[0];
    if (!pathname) continue;
    const absolute = resolve(dirname(file), decodeURIComponent(pathname));
    const local = relative(root, absolute);
    checked++;
    if (local.startsWith("..") || !existsSync(absolute)) {
      failures.push(`${relative(root, file)}: missing or external repository target ${target}`);
    }
  }
}

if (failures.length > 0) throw new Error(failures.join("\n"));
console.log(`Documentation: ${checked} local file links checked across ${files.length} files.`);
