import { expect, mock, test } from "bun:test";
import { Result } from "../../src/result.ts";
import { Option } from "../../src/option.ts";
import { expectThrown } from "../helpers/expect-thrown.ts";

test("Try captures asynchronous rejection", async () => {
  const rejected = Promise.reject("async-failure");
  void rejected.catch(() => {});
  const actual = await Result.Try(() => rejected);
  expect(actual.plain()).toEqual({ success: false, error: "async-failure" });
});
test("plain view cannot mutate Result state", () => {
  const result = Result.Ok(1);
  expect(Reflect.set(result.plain(), "success", false)).toBe(false);
  expect(result.unwrap()).toBe(1);
});
test("Result.Zip ignores inherited entries", () => {
  const entries = { own: Result.Ok(1) };
  Reflect.setPrototypeOf(entries, { inherited: Result.Fail("not-an-entry") });
  expect(Result.Zip(entries).plain()).toEqual({ success: true, value: { own: 1 } });
});
test("Zip retains own non-enumerable and symbol entries", () => {
  const key = Symbol("field");
  const entries = { hidden: Result.Ok(1), [key]: Result.Ok(2) };
  Object.defineProperty(entries, "hidden", { enumerable: false });
  expect(Result.Zip(entries).unwrap()).toEqual({ hidden: 1, [key]: 2 });
});
test("Option.Zip ignores inherited absent entries", () => {
  const entries = { own: Option.Some(1) };
  Reflect.setPrototypeOf(entries, { inherited: Option.None() });
  expect(Option.Zip(entries).get()).toEqual({ own: 1 });
});

test.each([null, undefined])("absence keeps its input sentinel and transformations produce None (%p)", (value) => {
  const option = Option.Of<number>(value);
  const map = mock((present: number) => present + 1);
  const filter = mock(() => true);
  expect(option.get()).toBe(value);
  expect(option.map(map).get()).toBeNull();
  expect(option.filter(filter).get()).toBeNull();
  expect(map).not.toHaveBeenCalled();
  expect(filter).not.toHaveBeenCalled();
});

test("whenNone keeps callable error payloads without invoking them", () => {
  const error = mock(() => "error payload");
  const factory = mock(() => error);
  const result = Result.Ok(Option.None<number>()).whenNone(factory);
  expectThrown(() => result.unwrap(), error);
  expect(factory).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
});

test("whenNone propagates exceptions from the missing-value factory", () => {
  const error = new Error("factory failure");
  expectThrown(() => Result.Ok(Option.None<number>()).whenNone(() => { throw error; }), error);
});
