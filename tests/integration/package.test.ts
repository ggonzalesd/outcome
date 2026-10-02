import { expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

function run(command: string[], cwd: string): string {
  const result = Bun.spawnSync(command, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    throw new Error(`Command failed: ${command.join(" ")}\n${result.stderr.toString()}\n${result.stdout.toString()}`);
  }
  return result.stdout.toString();
}

test("a separate Bun project installs the tarball and checks runtime and type contracts", () => {
  const temporary = mkdtempSync(join(tmpdir(), "outcome-consumer-"));
  try {
    run([process.execPath, "pm", "pack", "--ignore-scripts", "--destination", temporary], root);
    const archive = readdirSync(temporary).find((name) => name.endsWith(".tgz"));
    if (!archive) throw new Error("Package archive was not produced.");
    const consumer = join(temporary, "consumer");
    cpSync(join(root, "tests", "fixtures", "package-consumer"), consumer, { recursive: true });
    writeFileSync(join(consumer, "package.json"), JSON.stringify({
      name: "outcome-consumer",
      type: "module",
      private: true,
      dependencies: { outcome: `file:${join(temporary, archive)}` },
    }));
    // Exercise shared storage in a disposable cache, without changing the maintainer's cache.
    writeFileSync(join(consumer, "bunfig.toml"), '[install]\nlinker = "isolated"\nglobalStore = true\n');
    run([
      process.execPath, "install", "--offline", "--ignore-scripts",
      "--cache-dir", join(temporary, "cache"),
    ], consumer);
    expect(existsSync(join(consumer, "bun.lock"))).toBe(true);

    // Reuse the pinned development compiler; it resolves imports from the consumer's package.
    run([
      process.execPath, join(root, "node_modules", "typescript", "bin", "tsc"),
      "--noEmit", "-p", join(consumer, "tsconfig.json"),
    ], consumer);
    const output = run([
      process.execPath, "--no-install", "--eval",
      'const { observed } = await import("./consumer.ts"); console.log(JSON.stringify(observed));',
    ], consumer);
    const observed: unknown = JSON.parse(output);
    expect(observed).toEqual({ success: 42, missing: "missing", unwrapError: true });

    const installedPackage = join(consumer, "node_modules", "outcome");
    const installedFiles = readdirSync(installedPackage).sort();
    expect(installedFiles).toEqual(["LICENSE", "README.md", "package.json", "src"]);
    expect(readFileSync(join(installedPackage, "LICENSE"), "utf8"))
      .toBe(readFileSync(join(root, "LICENSE"), "utf8"));
    const metadata: unknown = JSON.parse(readFileSync(join(installedPackage, "package.json"), "utf8"));
    expect(metadata).toMatchObject({
      license: "MIT",
      repository: { type: "git", url: "git+https://github.com/ggonzalesd/outcome.git" },
    });
    expect(existsSync(join(consumer, "node_modules", "typescript"))).toBe(false);
    expect(existsSync(join(consumer, "node_modules", "@types"))).toBe(false);
  } finally {
    // This directory was created by this test; no project files are removed.
    rmSync(temporary, { recursive: true, force: true });
  }
});
