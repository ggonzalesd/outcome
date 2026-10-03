import { describe, expect, expectTypeOf, it, jest as vi } from "bun:test";
import { Option } from "../../src/option.ts";
import { Result } from "../../src/result.ts";
import { expectThrown } from "../helpers/expect-thrown.ts";

describe("Result", () => {
  describe("Ok", () => {
    it("creates a success result", () => {
      const result = Result.Ok(42);
      expect(result.unwrap()).toBe(42);
    });
  });

  describe("Fail", () => {
    it("creates a failure result", () => {
      const error = new Error("oops");
      const result = Result.Fail(error);
      expectThrown(() => result.unwrap(), error);
    });
  });

  describe("Plain", () => {
    it("returns the plain object from a success", () => {
      const result = Result.Ok(42);
      expect(Result.Plain(result)).toEqual({ success: true, value: 42 });
    });

    it("returns the plain object from a failure", () => {
      const error = new Error("oops");
      const result = Result.Fail(error);
      expect(Result.Plain(result)).toEqual({ success: false, error });
    });
  });

  describe("Unwrap", () => {
    it("returns the value from a success", () => {
      const result = Result.Ok(42);
      expect(Result.Unwrap(result)).toBe(42);
    });

    it("throws the error from a failure", () => {
      const error = new Error("oops");
      const result = Result.Fail(error);
      expectThrown(() => Result.Unwrap(result), error);
    });
  });

  describe("Promise", () => {
    it("wraps a resolved promise into Ok", async () => {
      const result = await Result.Promise(Promise.resolve(42));
      expect(result.unwrap()).toBe(42);
    });

    it("wraps a rejected promise into Fail", async () => {
      const error = new Error("boom");
      const result = await Result.Promise(Promise.reject(error));
      expectThrown(() => result.unwrap(), error);
    });
  });

  describe("Try", () => {
    it("wraps a successful function into Ok", async () => {
      const result = await Result.Try(() => 42);
      expect(result.unwrap()).toBe(42);
    });

    it("wraps a throwing function into Fail", async () => {
      const error = new Error("boom");
      const result = await Result.Try(() => {
        throw error;
      });
      expectThrown(() => result.unwrap(), error);
    });
  });

  describe("unwrap", () => {
    it("returns the value for a success", () => {
      expect(Result.Ok(42).unwrap()).toBe(42);
    });

    it("throws the error for a failure", () => {
      const error = new Error("oops");
      expectThrown(() => Result.Fail(error).unwrap(), error);
    });
  });

  describe("plain", () => {
    it("returns the plain object for a success", () => {
      expect(Result.Ok(42).plain()).toEqual({ success: true, value: 42 });
    });

    it("returns the plain object for a failure", () => {
      const error = new Error("oops");
      expect(Result.Fail(error).plain()).toEqual({ success: false, error });
    });
  });

  describe("optional", () => {
    it("maps a success to Some when fn returns a value", () => {
      const result = Result.Ok(42);
      const option = result.optional((v) => v * 2);
      expect(option.unwrap()).toBe(84);
    });

    it("maps a success to None when fn returns null", () => {
      const result = Result.Ok(42);
      const option = result.optional(() => null);
      expect(() => option.unwrap()).toThrow();
    });

    it("maps a success to None when fn returns undefined", () => {
      const result = Result.Ok(42);
      const option = result.optional(() => undefined);
      expect(() => option.unwrap()).toThrow();
    });

    it("returns None for a failure", () => {
      const result = Result.Fail(new Error("oops"));
      const option = result.optional((v: number) => v * 2);
      expect(() => option.unwrap()).toThrow();
    });
  });

  describe("map", () => {
    it("transforms the value on success", () => {
      expect(
        Result.Ok(42)
          .map((v) => v * 2)
          .unwrap(),
      ).toBe(84);
    });

    it("preserves the error on failure", () => {
      const error = new Error("oops");
      const result = Result.Fail<Error, number>(error);
      expectThrown(() => result.map((v) => v * 2).unwrap(), error);
    });
  });

  describe("mapError", () => {
    it("transforms the error on failure", () => {
      const result = Result.Fail("oops").mapError(
        (e) => new Error(`wrapped: ${e}`),
      );
      expect(() => result.unwrap()).toThrow("wrapped: oops");
    });

    it("preserves the value on success", () => {
      expect(
        Result.Ok(42)
          .mapError(() => "new error")
          .unwrap(),
      ).toBe(42);
    });
  });

  describe("ifSuccess", () => {
    it("calls the callback with the value on success", () => {
      const fn = vi.fn();
      Result.Ok(42).ifSuccess(fn);
      expect(fn).toHaveBeenCalledWith(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does not call the callback on failure", () => {
      const fn = vi.fn();
      Result.Fail(new Error("oops")).ifSuccess(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("returns this for chaining", () => {
      const result = Result.Ok(42);
      expect(result.ifSuccess(() => {})).toBe(result);
    });
  });

  describe("ifFailure", () => {
    it("calls the callback with the error on failure", () => {
      const error = new Error("oops");
      const fn = vi.fn();
      Result.Fail(error).ifFailure(fn);
      expect(fn).toHaveBeenCalledWith(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does not call the callback on success", () => {
      const fn = vi.fn();
      Result.Ok(42).ifFailure(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("returns this for chaining", () => {
      const result = Result.Ok(42);
      expect(result.ifFailure(() => {})).toBe(result);
    });
  });

  describe("orElse", () => {
    it("returns the value on success", () => {
      expect(Result.Ok(42).orElse(() => 0)).toBe(42);
    });

    it("returns the fallback on failure", () => {
      const result: Result<number, Error> = Result.Fail(new Error("oops"));
      expect(result.orElse(() => 0)).toBe(0);
    });
  });

  describe("orElseThrow", () => {
    it("returns the value on success", () => {
      expect(Result.Ok(42).orElseThrow(() => new Error("wrap"))).toBe(42);
    });

    it("throws the wrapped error on failure", () => {
      const wrapped = new Error("wrapped");
      expect(() => Result.Fail("oops").orElseThrow(() => wrapped)).toThrow(
        wrapped,
      );
    });
  });

  describe("WhenNone", () => {
    it("returns Ok with the inner value when Option is Some", () => {
      const inner = Result.Ok<Option<number>, Error>(Option.Some(42));
      const out = Result.WhenNone<number, Error, Error>(
        () => new Error("missing"),
      )(inner);
      expect(out.unwrap()).toBe(42);
    });

    it("returns Fail with the produced error when Option is None", () => {
      const inner = Result.Ok<Option<number>, Error>(Option.None<number>());
      const produced = new Error("produced");
      const out = Result.WhenNone<number, Error, Error>(() => produced)(inner);
      expect(() => out.unwrap()).toThrow(produced);
    });

    it("returns Fail with the original error when the outer Result is a failure", () => {
      const original = new Error("outer");
      const inner: Result<Option<number>, Error> = Result.Fail(original);
      const out = Result.WhenNone<number, Error, Error>(
        () => new Error("should not run"),
      )(inner);
      expect(() => out.unwrap()).toThrow(original);
    });

    it("unions the error type with the produced error type", () => {
      const inner = Result.Ok<Option<number>, Error>(Option.None<number>());
      const out = Result.WhenNone<number, Error, string>(() => "string-error")(
        inner,
      );
      expectTypeOf(out.plain().error).toEqualTypeOf<
        string | Error | undefined
      >();
    });
  });

  describe("whenNone", () => {
    it("returns Ok with the inner value when Option is Some", () => {
      const inner = Result.Ok(Option.Some(42));
      expect(inner.whenNone(() => "missing").unwrap()).toBe(42);
    });

    it("returns Fail with the produced error when Option is None", () => {
      const inner = Result.Ok<Option<number>, Error>(Option.None<number>());
      const produced = new Error("produced");
      expect(() => inner.whenNone(() => produced).unwrap()).toThrow(produced);
    });

    it("returns Fail with the original error when the outer Result is a failure", () => {
      const original = new Error("outer");
      const inner: Result<Option<number>, Error> = Result.Fail(original);
      expect(() => inner.whenNone(() => "should-not-run").unwrap()).toThrow(
        original,
      );
    });

    it("does not call fn when Option is Some", () => {
      const fn = vi.fn(() => new Error("never"));
      const inner = Result.Ok(Option.Some(42));
      inner.whenNone(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("does not call fn when the outer Result is a failure", () => {
      const fn = vi.fn(() => new Error("never"));
      const inner: Result<Option<number>, Error> = Result.Fail(
        new Error("outer"),
      );
      inner.whenNone(fn);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("Optional", () => {
    it("returns a function that maps success values through fn", () => {
      const fn = Result.Optional<number, string>((v) => `n=${v}`);
      const out = fn(Result.Ok(42));
      expect(out.unwrap()).toBe("n=42");
    });

    it("returns None when fn returns null on a success", () => {
      const fn = Result.Optional<number, string>(() => null);
      const out = fn(Result.Ok(42));
      expect(() => out.unwrap()).toThrow();
    });

    it("returns None when fn returns undefined on a success", () => {
      const fn = Result.Optional<number, string>(() => undefined);
      const out = fn(Result.Ok(42));
      expect(() => out.unwrap()).toThrow();
    });

    it("returns None when applied to a failure", () => {
      const fn = vi.fn((v: number): string => String(v));
      const out = Result.Optional<number, string>(fn)(
        Result.Fail(new Error("oops")),
      );
      expect(() => out.unwrap()).toThrow();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("Map", () => {
    it("returns a function that maps success values", () => {
      const fn = Result.Map<number, string>((v) => `n=${v}`);
      const out = fn(Result.Ok(42));
      expect(out.unwrap()).toBe("n=42");
    });

    it("preserves the error on failure", () => {
      const error = new Error("oops");
      const fn = Result.Map<number, string>(() => "never");
      const out = fn(Result.Fail<Error, number>(error));
      expectThrown(() => out.unwrap(), error);
    });
  });

  describe("MapError", () => {
    it("returns a function that maps failure errors", () => {
      const fn = Result.MapError<string, Error>(
        (e) => new Error(`wrapped: ${e}`),
      );
      const out = fn(Result.Fail("oops"));
      expect(() => out.unwrap()).toThrow("wrapped: oops");
    });

    it("preserves the value on success", () => {
      const fn = Result.MapError<number, Error, number>(
        () => new Error("never"),
      );
      const out = fn(Result.Ok<number, number>(42));
      expect(out.unwrap()).toBe(42);
    });
  });

  describe("type-level", () => {
    it("narrows unwrap to the success type", () => {
      const result = Result.Ok(42);
      expectTypeOf(result.unwrap()).toEqualTypeOf<number>();
    });

    it("matches a discriminated success-or-failure shape on plain()", () => {
      const ok = Result.Ok(42);
      const fail = Result.Fail(new Error("oops"));
      expectTypeOf(ok.plain()).toMatchTypeOf<{
        readonly success: boolean;
        readonly value?: unknown;
        readonly error?: unknown;
      }>();
      expectTypeOf(fail.plain()).toMatchTypeOf<{
        readonly success: boolean;
        readonly value?: unknown;
        readonly error?: unknown;
      }>();
    });
  });

  describe("Fail (non-Error errors)", () => {
    it("accepts a string error", () => {
      const result = Result.Fail("plain-string");
      expect(() => result.unwrap()).toThrow("plain-string");
    });

    it("accepts a number error", () => {
      const result = Result.Fail<number, never>(404);
      expectThrown(() => result.unwrap(), 404);
    });

    it("accepts an object error", () => {
      const error = { code: "E_FAIL", message: "structured" };
      const result = Result.Fail(error);
      expectThrown(() => result.unwrap(), error);
    });

    it("accepts a null error", () => {
      const result = Result.Fail<null, never>(null);
      expect(() => result.unwrap()).toThrow();
    });

    it("defaults the success type to never", () => {
      expectTypeOf(Result.Fail("e")).toEqualTypeOf<Result<never, string>>();
    });
  });

  describe("unwrap (non-Error throwables)", () => {
    it("throws a string error verbatim", () => {
      expect(() => Result.Fail<string, number>("boom").unwrap()).toThrow(
        "boom",
      );
    });

    it("throws a numeric error verbatim", () => {
      expectThrown(() => Result.Fail<number, never>(500).unwrap(), 500);
    });

    it("throws an object error verbatim", () => {
      const error = { kind: "DomainError" };
      expectThrown(() => Result.Fail(error).unwrap(), error);
    });
  });

  describe("Promise (additional branches)", () => {
    it("wraps a rejected non-Error reason into Fail", async () => {
      const reason = "string-rejection";
      const result = await Result.Promise<string>(Promise.reject(reason));
      expectThrown(() => result.unwrap(), reason);
    });

    it("does not invoke the original promise handlers twice", async () => {
      const thenSpy = vi.fn();
      const promise = Promise.resolve(42);
      promise.then(thenSpy);
      await Result.Promise(promise);
      await Promise.resolve();
      expect(thenSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Try (additional branches)", () => {
    it("captures a thrown string", async () => {
      const result = await Result.Try<string>(() => {
        throw "thrown-string";
      });
      expect(() => result.unwrap()).toThrow("thrown-string");
    });

    it("captures a thrown object", async () => {
      const error = { code: 1 };
      const result = await Result.Try(() => {
        throw error;
      });
      expectThrown(() => result.unwrap(), error);
    });

    it("returns the exact value returned by fn", async () => {
      const obj = { a: 1 };
      const result = await Result.Try(() => obj);
      expect(result.unwrap()).toBe(obj);
    });
  });

  describe("map (composition)", () => {
    it("chains multiple maps preserving order", () => {
      const result = Result.Ok(1)
        .map((v) => v + 1)
        .map((v) => v * 10)
        .map((v) => `value=${v}`);
      expect(result.unwrap()).toBe("value=20");
    });

    it("short-circuits on failure", () => {
      const fn = vi.fn((v: number) => v * 2);
      const error = new Error("boom");
      Result.Fail<Error, number>(error).map(fn).map(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it("narrows the value type", () => {
      const result = Result.Ok<number | string, never>(42).map((v) => `n=${v}`);
      expectTypeOf(result.unwrap()).toEqualTypeOf<string>();
    });
  });

  describe("mapError (composition)", () => {
    it("chains multiple mapErrors preserving order", () => {
      const result = Result.Fail("a")
        .mapError((e) => `${e}-b`)
        .mapError((e) => `(${e})`);
      expect(() => result.unwrap()).toThrow("(a-b)");
    });

    it("short-circuits on success", () => {
      const fn = vi.fn(() => "never");
      Result.Ok(42).mapError(fn).mapError(fn);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("optional (composition)", () => {
    it("chains with Option.map after a success", () => {
      const option = Result.Ok(42)
        .optional((v) => v * 2)
        .map((v) => v + 1);
      expect(option.unwrap()).toBe(85);
    });

    it("chains with Option.orElse after a null-returning fn", () => {
      const option = Result.Ok(42)
        .optional(() => null)
        .orElse(0);
      expect(option).toBe(0);
    });
  });

  describe("ifSuccess / ifFailure chaining", () => {
    it("invokes both on success and failure respectively", () => {
      const onOk = vi.fn();
      const onFail = vi.fn();
      Result.Ok(1).ifSuccess(onOk).ifFailure(onFail);
      expect(onOk).toHaveBeenCalledWith(1);
      expect(onFail).not.toHaveBeenCalled();
      Result.Fail(new Error("e")).ifSuccess(onOk).ifFailure(onFail);
      expect(onFail).toHaveBeenCalledWith(expect.any(Error));
    });

    it("returns the same instance through the chain", () => {
      const ok = Result.Ok(1);
      const fail = Result.Fail(new Error("e"));
      expect(ok.ifSuccess(() => {}).ifFailure(() => {})).toBe(ok);
      expect(fail.ifSuccess(() => {}).ifFailure(() => {})).toBe(fail);
    });
  });

  describe("orElse (side-effect form)", () => {
    it("invokes fn only on failure", () => {
      const fn = vi.fn((_e: Error) => 0);
      const fail: Result<number, Error> = Result.Fail(new Error("e"));
      Result.Ok<number, Error>(42).orElse(fn);
      fail.orElse(fn);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("orElseThrow (typed error)", () => {
    it("throws a custom Error subclass on failure", () => {
      class CustomError extends Error {}
      expect(() =>
        Result.Fail<string, never>("boom").orElseThrow<CustomError>(
          () => new CustomError("wrapped"),
        ),
      ).toThrow(CustomError);
    });
  });

  describe("WhenNone composition", () => {
    it("composes with map on the resulting Result", () => {
      const inner = Result.Ok<Option<number>, Error>(Option.Some(2));
      const out = Result.WhenNone<number, Error, Error>(
        () => new Error("missing"),
      )(inner).map((v) => v * 5);
      expect(out.unwrap()).toBe(10);
    });

    it("composes with mapError when producing a Fail", () => {
      const inner = Result.Ok<Option<number>, Error>(Option.None<number>());
      const out = Result.WhenNone<number, Error, string>(() => "string-error")(
        inner,
      ).mapError((e) => new Error(`wrapped: ${String(e)}`));
      expect(() => out.unwrap()).toThrow("wrapped: string-error");
    });
  });
});
