import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

test("a separate Bun project consumes only the packed package and all public exports", () => {
  const temporary = mkdtempSync(join(tmpdir(), "outcome-consumer-"));
  try {
    run([process.execPath, "pm", "pack", "--ignore-scripts", "--destination", temporary], root);
    const archive = readdirSync(temporary).find((name) => name.endsWith(".tgz"));
    if (!archive) throw new Error("Package archive was not produced.");
    run(["tar", "-xzf", join(temporary, archive), "-C", temporary], temporary);

    const consumer = join(temporary, "consumer");
    mkdirSync(join(consumer, "node_modules"), { recursive: true });
    symlinkSync(join(temporary, "package"), join(consumer, "node_modules", "outcome"), "dir");
    writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "consumer", type: "module", private: true }));
    writeFileSync(join(consumer, "consumer.ts"), `
      import { Option, Result, UnwrapError } from "outcome";
      import { Result as SubpathResult } from "outcome/result";
      import { Option as SubpathOption } from "outcome/option";
      const success = Result.Ok(Option.Some(21)).whenNone(() => "missing").map((value) => value * 2).unwrap();
      const missing = Option.Of(undefined).asResult("missing").orElse((error) => error);
      const rejected = (await Result.Try(() => Promise.reject("rejected"))).plain();
      if (rejected.success || rejected.error !== "rejected") throw new Error("Async contract failed");
      if (SubpathResult !== Result || SubpathOption !== Option) throw new Error("Export identity failed");
      let unwrapError = false;
      try { Option.None().unwrap(); } catch (error) { unwrapError = error instanceof UnwrapError; }
      if (!(Result.Ok(1) instanceof Result) || !(Option.Some(1) instanceof Option)) throw new Error("Class contract failed");
      if (Result.Tuple([Result.Ok(1), Result.Ok("two")]).unwrap()[1] !== "two") throw new Error("Tuple contract failed");
      if (Option.Zip({ count: Option.Some(1) }).unwrap().count !== 1) throw new Error("Zip contract failed");
      console.log(JSON.stringify({ success, missing, unwrapError }));
    `);
    const output = run([process.execPath, "--no-install", "consumer.ts"], consumer);
    const observed: unknown = JSON.parse(output);
    expect(observed).toEqual({ success: 42, missing: "missing", unwrapError: true });

    const publishedFiles = readdirSync(join(temporary, "package"));
    expect(publishedFiles).toContain("src");
    expect(publishedFiles).not.toContain("tests");
    expect(publishedFiles).not.toContain("node_modules");
    expect(publishedFiles).not.toContain("scripts");
  } finally {
    // This directory was created by this test; no project files are removed.
    rmSync(temporary, { recursive: true, force: true });
  }
});
