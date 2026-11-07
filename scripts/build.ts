import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "dist");
const temporary = mkdtempSync(join(tmpdir(), "outcome-declarations-"));

function run(args: string[]): void {
  const result = Bun.spawnSync([process.execPath, ...args], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0)
    throw new Error(`Build command failed: ${args.join(" ")}`);
}

try {
  const metadata: unknown = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  );
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("name" in metadata) ||
    typeof metadata.name !== "string" ||
    !("version" in metadata) ||
    typeof metadata.version !== "string" ||
    !("license" in metadata) ||
    typeof metadata.license !== "string" ||
    !("repository" in metadata)
  )
    throw new Error("Package metadata is incomplete.");

  mkdirSync(dist, { recursive: true });
  run([
    "build",
    "src/index.ts",
    "--target=browser",
    "--format=esm",
    "--outfile=dist/index.mjs",
    "--minify-whitespace",
    "--minify-syntax",
    "--keep-names",
  ]);
  run([
    "run",
    "--bun",
    "tsc",
    "--project",
    "tsconfig.lib.json",
    "--noEmit",
    "false",
    "--declaration",
    "--emitDeclarationOnly",
    "--rootDir",
    "src",
    "--outDir",
    temporary,
  ]);

  for (const name of ["index", "result", "option", "unwrap-error"]) {
    const declaration = readFileSync(join(temporary, `${name}.d.ts`), "utf8");
    writeFileSync(
      join(dist, `${name}.d.ts`),
      declaration.replace(/(from\s+["']\.\/[^"']+)\.ts(["'])/g, "$1.js$2"),
    );
  }
  writeFileSync(
    join(dist, "result.js"),
    'export { Result } from "./index.mjs";\n',
  );
  writeFileSync(
    join(dist, "option.js"),
    'export { Option, UnwrapError } from "./index.mjs";\n',
  );
  cpSync(join(root, "LICENSE"), join(dist, "LICENSE"));
  const readme = readFileSync(join(root, "README.md"), "utf8");
  writeFileSync(
    join(dist, "README.md"),
    readme.replace(
      /\]\((docs\/[^)]+|AGENTS\.md)\)/g,
      `](https://github.com/ggonzalesd/outcome/blob/v${metadata.version}/$1)`,
    ),
  );
  writeFileSync(
    join(dist, "package.json"),
    `${JSON.stringify(
      {
        name: metadata.name,
        version: metadata.version,
        private: true,
        type: "module",
        sideEffects: false,
        license: metadata.license,
        repository: metadata.repository,
        exports: {
          ".": { types: "./index.d.ts", default: "./index.mjs" },
          "./result": { types: "./result.d.ts", default: "./result.js" },
          "./option": { types: "./option.d.ts", default: "./option.js" },
        },
        files: [
          "index.mjs",
          "index.d.ts",
          "result.d.ts",
          "option.d.ts",
          "unwrap-error.d.ts",
          "result.js",
          "option.js",
          "README.md",
          "LICENSE",
        ],
      },
      null,
      2,
    )}\n`,
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
