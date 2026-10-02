import { describe, expect, expectTypeOf, it, jest as vi } from 'bun:test';
import { Option, UnwrapError } from "../../src/option.ts";
import { Result } from "../../src/result.ts";
import { expectThrown } from "../helpers/expect-thrown.ts";

const presentEqualityCases = [[42, 42, true], [42, 43, false]] as const;

describe('Option', () => {
  describe('Some', () => {
    it('creates an Option with a value', () => {
      expect(Option.Some(42).unwrap()).toBe(42);
    });
  });

  describe('None', () => {
    it('creates an empty Option', () => {
      expect(() => Option.None<number>().unwrap()).toThrow(UnwrapError);
    });
  });

  describe('Of', () => {
    it('creates Some from a non-null value', () => {
      expect(Option.Of(42).unwrap()).toBe(42);
    });

    it.each([null, undefined])('creates None from %p', (value) => {
      expect(() => Option.Of<number>(value).unwrap()).toThrow(UnwrapError);
    });
  });

  describe('Equals', () => {
    it.each(presentEqualityCases)('compares %p with %p', (first, second, expected) => {
      expect(Option.Equals(Option.Some(first), Option.Some(second))).toBe(expected);
    });

    it('returns false when both are None', () => {
      expect(Option.Equals(Option.None<number>(), Option.None<number>())).toBe(false);
    });

    it('returns false when only one is None', () => {
      expect(Option.Equals(Option.Some(42), Option.None<number>())).toBe(false);
      expect(Option.Equals(Option.None<number>(), Option.Some(42))).toBe(false);
    });
  });

  describe('equals', () => {
    it.each(presentEqualityCases)('compares %p with %p', (first, second, expected) => {
      expect(Option.Some(first).equals(Option.Some(second))).toBe(expected);
    });
  });

  describe('unwrap', () => {
    it('returns the value for Some', () => {
      expect(Option.Some(42).unwrap()).toBe(42);
    });

    it('throws UnwrapError for None', () => {
      expect(() => Option.None<number>().unwrap()).toThrow(UnwrapError);
      expect(() => Option.None<number>().unwrap()).toThrow('Option is None');
    });
  });

  describe('asResult', () => {
    it('converts Some to Ok', () => {
      const result = Option.Some(42).asResult(() => 'err');
      expect(result.unwrap()).toBe(42);
    });

    it('converts None to Fail using a function error', () => {
      const result = Option.None<number>().asResult(() => new Error('err'));
      expect(() => result.unwrap()).toThrow('err');
    });

    it('converts None to Fail using a static error', () => {
      const err = new Error('static');
      const result = Option.None<number>().asResult(err);
      expect(() => result.unwrap()).toThrow(err);
    });
  });

  describe('orElse', () => {
    it('returns the value for Some', () => {
      expect(Option.Some(42).orElse(0)).toBe(42);
    });

    it('returns the default for None', () => {
      expect(Option.None<number>().orElse(0)).toBe(0);
    });
  });

  describe('orElseThrow', () => {
    it('returns the value for Some', () => {
      expect(Option.Some(42).orElseThrow(() => new Error('oops'))).toBe(42);
    });

    it('throws the produced error for None', () => {
      const error = new Error('oops');
      expectThrown(() => Option.None<number>().orElseThrow(() => error), error);
    });
  });

  describe('filter', () => {
    it('keeps Some when the predicate returns true', () => {
      expect(
        Option.Some(42)
          .filter((v) => v > 0)
          .unwrap(),
      ).toBe(42);
    });

    it('replaces Some with None when the predicate returns false', () => {
      expect(() =>
        Option.Some(42)
          .filter((v) => v < 0)
          .unwrap(),
      ).toThrow(UnwrapError);
    });

    it('returns None for None regardless of the predicate', () => {
      const predicate = vi.fn(() => true);
      expect(() => Option.None<number>().filter(predicate).unwrap()).toThrow(UnwrapError);
      expect(predicate).not.toHaveBeenCalled();
    });
  });

  describe('map', () => {
    it('transforms Some', () => {
      expect(
        Option.Some(42)
          .map((v) => v * 2)
          .unwrap(),
      ).toBe(84);
    });

    it('returns None for None without calling fn', () => {
      const fn = vi.fn((v: number) => v * 2);
      expect(() => Option.None<number>().map(fn).unwrap()).toThrow(UnwrapError);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('match', () => {
    it('calls some handler for Some', () => {
      const result = Option.Some(42).match({
        some: (v) => `got ${v}`,
        none: () => 'none',
      });
      expect(result).toBe('got 42');
    });

    it('calls none handler for None', () => {
      const result = Option.None<number>().match({
        some: (v) => `got ${v}`,
        none: () => 'none',
      });
      expect(result).toBe('none');
    });
  });

  describe('get', () => {
    it('returns the value for Some', () => {
      expect(Option.Some(42).get()).toBe(42);
    });

    it('returns null for None', () => {
      expect(Option.None<number>().get()).toBeNull();
    });
  });

  describe('ifSome', () => {
    it('calls the callback with the value for Some', () => {
      const fn = vi.fn();
      Option.Some(42).ifSome(fn);
      expect(fn).toHaveBeenCalledWith(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not call the callback for None', () => {
      const fn = vi.fn();
      Option.None<number>().ifSome(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it('returns this for chaining', () => {
      const opt = Option.Some(42);
      expect(opt.ifSome(() => {})).toBe(opt);
    });
  });

  describe('ifNone', () => {
    it('calls the callback for None', () => {
      const fn = vi.fn();
      Option.None<number>().ifNone(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not call the callback for Some', () => {
      const fn = vi.fn();
      Option.Some(42).ifNone(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it('returns this for chaining', () => {
      const opt = Option.Some(42);
      expect(opt.ifNone(() => {})).toBe(opt);
    });
  });

  describe('Switch', () => {
    it('unwraps Ok to Ok(Some(value))', () => {
      const inner = Option.Some(Result.Ok(42));
      const out = Option.Switch(inner);
      expect(out.unwrap().get()).toBe(42);
    });

    it('returns Fail(error) when inner is Ok(Fail(error))', () => {
      const error = new Error('inner-fail');
      const inner = Option.Some(Result.Fail<Error, number>(error));
      const out = Option.Switch(inner);
      expectThrown(() => out.unwrap(), error);
    });

    it('returns Ok(None) when the Option itself is None', () => {
      const out = Option.Switch(Option.None<Result<number, Error>>());
      expect(out.unwrap().get()).toBeNull();
    });

    it('does not unwrap the inner result beyond mapping', () => {
      const inner = Option.Some(Result.Ok('kept-as-is'));
      const out = Option.Switch(inner);
      expect(out.unwrap().unwrap()).toBe('kept-as-is');
    });
  });

  describe('switch', () => {
    it('unwraps Ok to Ok(Some(value))', () => {
      const inner = Option.Some(Result.Ok(42));
      expect(inner.switch().unwrap().get()).toBe(42);
    });

    it('returns Fail(error) when inner is Ok(Fail(error))', () => {
      const error = new Error('inner-fail');
      const inner = Option.Some(Result.Fail<Error, number>(error));
      expectThrown(() => inner.switch().unwrap(), error);
    });

    it('returns Ok(None) when the Option is None', () => {
      const inner = Option.None<Result<number, Error>>();
      expect(inner.switch().unwrap().get()).toBeNull();
    });

    it('composes with Result#map on the outer Result', () => {
      const inner = Option.Some(Result.Ok(42));
      const out = inner.switch().map((opt) => opt.map((v) => v * 2).orElse(0));
      expect(out.unwrap()).toBe(84);
    });

    it('composes with Result#ifFailure to observe inner failures', () => {
      const inner = Option.Some(Result.Fail<Error, number>(new Error('inner-fail')));
      const fn = vi.fn();
      inner.switch().ifFailure(fn);
      expect(fn).toHaveBeenCalledWith(new Error('inner-fail'));
    });
  });

  describe('asResult', () => {
    it('passes through the value type unchanged on success', () => {
      const result = Option.Some(42).asResult(() => 'err');
      expectTypeOf(result.unwrap()).toEqualTypeOf<number>();
    });

    it('uses the produced error type on failure with a function', () => {
      const result = Option.None<number>().asResult(() => 'err');
      expectTypeOf(result.plain().error).toEqualTypeOf<string | undefined>();
    });

    it('uses the static error type on failure with a value', () => {
      const err = new Error('static');
      const result = Option.None<number>().asResult(err);
      expectTypeOf(result.plain().error).toEqualTypeOf<Error | undefined>();
    });

    it('does not invoke the error function on success', () => {
      const fn = vi.fn(() => new Error('never'));
      Option.Some(42).asResult(fn);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('type-level', () => {
    it('narrows unwrap to NonNullable', () => {
      const opt = Option.Some(42);
      expectTypeOf(opt.unwrap()).toEqualTypeOf<number>();
    });

    it('get returns NonNullable | null | undefined', () => {
      const opt = Option.Some(42);
      expectTypeOf(opt.get()).toEqualTypeOf<number | null | undefined>();
    });
  });

  describe('Equals (additional cases)', () => {
    it('compares by reference for objects', () => {
      const obj = { a: 1 };
      expect(Option.Equals(Option.Some(obj), Option.Some(obj))).toBe(true);
      expect(Option.Equals(Option.Some({ a: 1 }), Option.Some({ a: 1 }))).toBe(false);
    });

    it('handles falsy primitive values', () => {
      expect(Option.Equals(Option.Some(0), Option.Some(0))).toBe(true);
      expect(Option.Equals(Option.Some(''), Option.Some(''))).toBe(true);
      expect(Option.Equals(Option.Some(false), Option.Some(false))).toBe(true);
    });
  });

  describe('equals (instance, additional cases)', () => {
    it('returns false when one side is None', () => {
      expect(Option.Some(42).equals(Option.None<number>())).toBe(false);
      expect(Option.None<number>().equals(Option.Some(42))).toBe(false);
    });
  });

  describe('Some (additional cases)', () => {
    it('holds reference identity for objects', () => {
      const obj = { a: 1 };
      const opt = Option.Some(obj);
      expect(opt.unwrap()).toBe(obj);
    });

    it('supports arrays and complex types', () => {
      const opt = Option.Some([1, 2, 3]);
      expect(opt.unwrap()).toEqual([1, 2, 3]);
    });
  });

  describe('None (additional cases)', () => {
    it('get returns null', () => {
      expect(Option.None<string>().get()).toBeNull();
    });

    it('orElse returns the default', () => {
      expect(Option.None<string>().orElse('fallback')).toBe('fallback');
    });

    it('filter is a no-op', () => {
      const opt = Option.None<number>().filter(() => true);
      expect(opt.get()).toBeNull();
    });
  });

  describe('unwrap (additional cases)', () => {
    it('returns the original value without transformation', () => {
      const obj = { a: 1, b: { c: 2 } };
      expect(Option.Some(obj).unwrap()).toBe(obj);
    });

    it('throws UnwrapError with a stable message', () => {
      const message = Option.None<number>().unwrap.bind(Option.None<number>());
      expect(message).toThrow(UnwrapError);
      expect(message).toThrow('Option is None. Cannot unwrap a None value.');
    });
  });

  describe('map (composition)', () => {
    it('chains multiple maps preserving order', () => {
      const result = Option.Some(1)
        .map((v) => v + 1)
        .map((v) => v * 10);
      expect(result.unwrap()).toBe(20);
    });

    it('chains with filter before map', () => {
      const result = Option.Some(5)
        .filter((v) => v > 0)
        .map((v) => v * 2);
      expect(result.unwrap()).toBe(10);
    });

    it('does not call subsequent fns after a None', () => {
      const fn = vi.fn((v: number) => v);
      Option.None<number>()
        .map((v) => v * 2)
        .map(fn);
      expect(fn).not.toHaveBeenCalled();
    });

    it('narrows the value type', () => {
      const result = Option.Some<number | string>(42).map((v) => `n=${v}`);
      expectTypeOf(result.unwrap()).toEqualTypeOf<string>();
    });
  });

  describe('filter (composition)', () => {
    it('chains multiple filters with AND semantics', () => {
      const result = Option.Some(10)
        .filter((v) => v > 0)
        .filter((v) => v % 2 === 0);
      expect(result.unwrap()).toBe(10);
    });

    it('returns None when any filter rejects', () => {
      const result = Option.Some(10)
        .filter((v) => v > 0)
        .filter((v) => v < 5);
      expect(result.get()).toBeNull();
    });
  });

  describe('match (additional cases)', () => {
    it('returns complex types from branches', () => {
      type Shape = { kind: 'some'; value: number } | { kind: 'none' };
      const patterns: { some: (v: number) => Shape; none: () => Shape } = {
        some: (v) => ({ kind: 'some', value: v }),
        none: () => ({ kind: 'none' }),
      };
      const some: Shape = Option.Some(42).match(patterns);
      const none: Shape = Option.None<number>().match(patterns);
      expect(some).toEqual({ kind: 'some', value: 42 });
      expect(none).toEqual({ kind: 'none' });
    });

    it('invokes exactly one branch', () => {
      const some = vi.fn(() => 's');
      const none = vi.fn(() => 'n');
      Option.Some(42).match({ some, none });
      expect(some).toHaveBeenCalledTimes(1);
      expect(none).not.toHaveBeenCalled();
      Option.None<number>().match({ some, none });
      expect(none).toHaveBeenCalledTimes(1);
      expect(some).toHaveBeenCalledTimes(1);
    });
  });

  describe('ifSome / ifNone (composition)', () => {
    it('chains both, with only the active branch firing', () => {
      const onSome = vi.fn();
      const onNone = vi.fn();
      Option.Some(42).ifSome(onSome).ifNone(onNone);
      expect(onSome).toHaveBeenCalledWith(42);
      expect(onNone).not.toHaveBeenCalled();

      Option.None<number>().ifSome(onSome).ifNone(onNone);
      expect(onNone).toHaveBeenCalledTimes(1);
      expect(onSome).toHaveBeenCalledTimes(1);
    });
  });

  describe('asResult (composition)', () => {
    it('composes with Result#map on success', () => {
      const out = Option.Some(42)
        .asResult(() => 'err')
        .map((v) => v * 2);
      expect(out.unwrap()).toBe(84);
    });

    it('composes with Result#mapError on failure', () => {
      const out = Option.None<number>()
        .asResult(() => 'err')
        .mapError((e) => new Error(`${e}-wrapped`));
      expect(() => out.unwrap()).toThrow('err-wrapped');
    });
  });

  describe('switch (additional cases)', () => {
    it('propagates Fail with non-Error reasons', () => {
      const inner = Option.Some(Result.Fail<number, never>(42));
      const out = inner.switch();
      expectThrown(() => out.unwrap(), 42);
    });

    it('composes with Result#orElse after extraction', () => {
      const inner = Option.Some(Result.Ok(42));
      const out = inner
        .switch()
        .map((opt) => opt.orElse(0))
        .orElse(() => -1);
      expect(out).toBe(42);
    });
  });
});
