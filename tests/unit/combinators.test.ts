import { describe, expect, mock, test } from "bun:test";
import { Option, Result } from "../../src/index.ts";

describe("Result collections", () => {
  test("Join and Tuple retain heterogeneous values in order", () => {
    const values = [Result.Ok(1), Result.Ok("two"), Result.Ok(false)] as const;
    expect(Result.Join(values).unwrap()).toEqual([1, "two", false]);
    expect(Result.Tuple(values).unwrap()).toEqual([1, "two", false]);
  });

  test("empty tuples and records succeed with empty payloads", () => {
    expect(Result.Join([]).unwrap()).toEqual([]);
    expect(Result.Zip({}).unwrap()).toEqual({});
  });

  test("Join short-circuits at the first arbitrary error", () => {
    const error = { code: "missing" };
    const later = new Proxy(Result.Ok(3), {
      get(target, key, receiver) {
        if (key === "plain")
          throw new Error("Later entries must not be visited");
        return Reflect.get(target, key, receiver);
      },
    });
    expect(
      Result.Join([Result.Ok(1), Result.Fail(error), later]).plain(),
    ).toEqual({ success: false, error });
    expect(
      Result.Join([Result.Fail("first"), Result.Fail("second")]).plain(),
    ).toEqual({ success: false, error: "first" });
  });

  test("Zip retains values and does not overwrite __proto__ on its output", () => {
    const value = { label: "payload" };
    const entries = { ["__proto__"]: Result.Ok(value), count: Result.Ok(2) };
    const output = Result.Zip(entries).unwrap();
    expect(Object.hasOwn(output, "__proto__")).toBe(true);
    expect(output["__proto__"]).toBe(value);
    expect(output.count).toBe(2);
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
  });

  test("Zip propagates the first failure without inspecting later entries", () => {
    const later = new Proxy(Result.Ok(1), {
      get(target, key, receiver) {
        if (key === "plain")
          throw new Error("Later entries must not be visited");
        return Reflect.get(target, key, receiver);
      },
    });
    expect(Result.Zip({ first: Result.Fail("first"), later }).plain()).toEqual({
      success: false,
      error: "first",
    });
  });
});

describe("Option collections and collapse", () => {
  test("Join and Tuple retain heterogeneous values in order", () => {
    const values = [
      Option.Some(1),
      Option.Some("two"),
      Option.Some(false),
    ] as const;
    expect(Option.Join(values).unwrap()).toEqual([1, "two", false]);
    expect(Option.Tuple(values).unwrap()).toEqual([1, "two", false]);
  });

  test("empty tuples and records are present", () => {
    expect(Option.Join([]).unwrap()).toEqual([]);
    expect(Option.Zip({}).unwrap()).toEqual({});
  });

  test("Join and Zip short-circuit at absence", () => {
    const later = new Proxy(Option.Some(1), {
      get(target, key, receiver) {
        if (key === "get") throw new Error("Later entries must not be visited");
        return Reflect.get(target, key, receiver);
      },
    });
    expect(Option.Join([Option.None<number>(), later]).get()).toBeNull();
    expect(
      Option.Zip({ first: Option.None<number>(), later }).get(),
    ).toBeNull();
  });

  test("Zip retains symbol and non-enumerable fields", () => {
    const key = Symbol("field");
    const entries = { hidden: Option.Some(1), [key]: Option.Some(2) };
    Object.defineProperty(entries, "hidden", { enumerable: false });
    expect(Option.Zip(entries).unwrap()).toEqual({ hidden: 1, [key]: 2 });
  });

  test("Zip safely retains an own __proto__ field", () => {
    const value = { label: "payload" };
    const output = Option.Zip({ ["__proto__"]: Option.Some(value) }).unwrap();
    expect(Object.hasOwn(output, "__proto__")).toBe(true);
    expect(output["__proto__"]).toBe(value);
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
  });

  test("Collapse supports flat, nested, and absent Options", () => {
    expect(Option.Collapse(Option.Some(1)).unwrap()).toBe(1);
    expect(
      Option.Collapse(Option.Some(Option.Some(Option.Some(1)))).unwrap(),
    ).toBe(1);
    expect(Option.Some(Option.None<number>()).collapse().get()).toBeNull();
    expect(Option.None<number>().collapse().get()).toBeNull();
  });

  test("collapse handles deep nesting without a recursive stack", () => {
    let nested: Option<NonNullable<unknown>> = Option.Some(1);
    for (let depth = 0; depth < 12000; depth++) nested = Option.Some(nested);
    expect(nested.collapse().unwrap()).toBe(1);
    expect(Option.Collapse(nested).unwrap()).toBe(1);
  });
});

describe("reference functional API", () => {
  test("Map, MapError, and Optional work as promise handlers", async () => {
    const success = await Promise.resolve(Result.Ok(2))
      .then(Result.Map((value: number) => value * 3))
      .then(Result.MapError((error: string) => new Error(error)))
      .then(Result.Optional((value: number) => value + 1));
    expect(success.unwrap()).toBe(7);
    const failure = await Promise.resolve(Result.Fail("missing")).then(
      Result.MapError((error: string) => ({ code: error })),
    );
    expect(failure.plain()).toEqual({
      success: false,
      error: { code: "missing" },
    });
  });

  test("Option Map, Filter, Match, and Unwrap remain functional counterparts", () => {
    const mapped = Option.Map((value: number) => value * 2)(Option.Some(2));
    const filtered = Option.Filter((value: number) => value > 0)(mapped);
    expect(Option.Unwrap(filtered)).toBe(4);
    const match = Option.Match({
      some: (value: number) => String(value),
      none: () => "absent",
    });
    expect(match(filtered)).toBe("4");
    expect(match(Option.None<number>())).toBe("absent");
    expect(
      Option.Filter((value: number) => value > 10)(mapped).get(),
    ).toBeNull();
  });

  test("WhenNone retains value/error types and laziness", () => {
    const missing = mock(() => "missing");
    const unwrapOption = Result.WhenNone(missing);
    expect(unwrapOption(Result.Ok(Option.Some(2))).unwrap()).toBe(2);
    expect(unwrapOption(Result.Ok(Option.None<number>())).plain()).toEqual({
      success: false,
      error: "missing",
    });
    expect(
      unwrapOption(Result.Fail<string, Option<number>>("outer")).plain(),
    ).toEqual({ success: false, error: "outer" });
    expect(missing).toHaveBeenCalledTimes(1);
  });

  test("FailSome retains the original failure, fails presence, and succeeds with void on absence", () => {
    const error = mock((value: number) => `exists:${value}`);
    const failPresent = Result.FailSome(error);
    expect(failPresent(Result.Ok(Option.Some(2))).plain()).toEqual({
      success: false,
      error: "exists:2",
    });
    expect(failPresent(Result.Ok(Option.None<number>())).plain()).toEqual({
      success: true,
      value: undefined,
    });
    expect(
      failPresent(Result.Fail<string, Option<number>>("outer")).plain(),
    ).toEqual({ success: false, error: "outer" });
    expect(error).toHaveBeenCalledTimes(1);
  });

  test("FailSuccess preserves the reference inversion with a truthful void success", () => {
    const error = mock((value: number) => `inverted:${value}`);
    const invert = Result.FailSuccess(error);
    expect(invert(Result.Ok(2)).plain()).toEqual({
      success: false,
      error: "inverted:2",
    });
    expect(invert(Result.Fail<string, number>("original")).plain()).toEqual({
      success: true,
      value: undefined,
    });
    expect(error).toHaveBeenCalledTimes(1);
  });
});

describe("exception and invariant corrections", () => {
  test("Try keeps its asynchronous signature and awaits fulfilled return values", async () => {
    const captured = Result.Try(() => 2);
    expect(captured).toBeInstanceOf(Promise);
    expect((await captured).unwrap()).toBe(2);
    expect((await Result.Try(() => Promise.resolve(3))).unwrap()).toBe(3);
    const thenable = {
      then(resolve: (value: number) => void) {
        resolve(4);
      },
    };
    expect((await Result.Try(() => thenable)).unwrap()).toBe(4);
  });

  test("Try maps unknown failures and skips its mapper on success", async () => {
    const mapError = mock((cause: unknown) => ({ cause }));
    expect((await Result.Try(() => 1, mapError)).unwrap()).toBe(1);
    expect(
      (
        await Result.Try(() => {
          throw "bad";
        }, mapError)
      ).plain(),
    ).toEqual({ success: false, error: { cause: "bad" } });
    expect(mapError).toHaveBeenCalledTimes(1);
  });

  test("Promise maps rejected values and skips its mapper on success", async () => {
    const mapError = mock((cause: unknown) => ({ cause }));
    expect((await Result.Promise(Promise.resolve(1), mapError)).unwrap()).toBe(
      1,
    );
    expect(
      (await Result.Promise(Promise.reject("bad"), mapError)).plain(),
    ).toEqual({ success: false, error: { cause: "bad" } });
    expect(mapError).toHaveBeenCalledTimes(1);
  });

  test("exceptions from error mappers propagate", async () => {
    const error = new Error("mapper error");
    const mapper = () => {
      throw error;
    };
    await expect(
      Result.Try(() => {
        throw "original";
      }, mapper),
    ).rejects.toBe(error);
    await expect(
      Result.Promise(Promise.reject("original"), mapper),
    ).rejects.toBe(error);
  });

  test("asResultValue preserves callable errors without invoking them", () => {
    const error = mock(() => "error value");
    expect(Option.Some(1).asResultValue(error).unwrap()).toBe(1);
    const absent = Option.None<number>().asResultValue(error).plain();
    expect(absent.success).toBe(false);
    if (!absent.success) expect(absent.error).toBe(error);
    expect(error).not.toHaveBeenCalled();
  });

  test("Option.Match supports void and different branch return types", () => {
    const some = mock((_value: number): void => {});
    const none = mock((): void => {});
    const match = Option.Match({ some, none });
    expect(match(Option.Some(1))).toBeUndefined();
    expect(match(Option.None<number>())).toBeUndefined();
    expect(some).toHaveBeenCalledTimes(1);
    expect(none).toHaveBeenCalledTimes(1);
    expect(Option.Some(1).match({ some: () => 2, none: () => "none" })).toBe(2);
  });

  test.each([null, undefined])(
    "Some rejects untyped nullable input (%p)",
    (value) => {
      expect(() => Reflect.apply(Option.Some, undefined, [value])).toThrow(
        TypeError,
      );
    },
  );

  test("Of retains nullable sentinels and falsy present values", () => {
    expect(Option.Of(null).get()).toBeNull();
    expect(Option.Of(undefined).get()).toBeUndefined();
    expect(Option.Of(0).unwrap()).toBe(0);
    expect(Option.Of(false).unwrap()).toBe(false);
    expect(Option.Of("").unwrap()).toBe("");
  });

  test("wrappers are frozen without freezing their payload", () => {
    const payload = { count: 1 };
    const result = Result.Ok(payload);
    const option = Option.Some(payload);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.plain())).toBe(true);
    expect(Object.isFrozen(option)).toBe(true);
    expect(Object.isFrozen(payload)).toBe(false);
    payload.count = 2;
    expect(result.unwrap()).toBe(payload);
    expect(option.unwrap()).toBe(payload);
  });
});
