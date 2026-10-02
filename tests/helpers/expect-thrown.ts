import { expect } from "bun:test";

/** Assert that a callback throws the exact supplied value, including non-Error values. */
export function expectThrown(fn: () => unknown, expected: unknown): void {
  let threw = false;
  let actual: unknown;
  try {
    fn();
  } catch (error: unknown) {
    threw = true;
    actual = error;
  }
  expect(threw).toBe(true);
  expect(actual).toBe(expected);
}
