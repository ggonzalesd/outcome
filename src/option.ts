import { Result } from "./result.ts";
import { UnwrapError } from "./unwrap-error.ts";
export { UnwrapError } from "./unwrap-error.ts";

const NONE_UNWRAP_MESSAGE = "Option is None. Cannot unwrap a None value.";
const SOME_NULLABLE_MESSAGE = "Option.Some requires a non-nullable value. Use Option.Of for nullable input.";
type NonCallable<E> = E extends (...args: never[]) => unknown ? never : E;
type ValueOf<O> = O extends Option<infer V> ? V : never;
type TupleValues<T extends readonly Option<NonNullable<unknown>>[]> = {
  -readonly [K in keyof T]: ValueOf<T[K]>;
};
type RecordValues<T> = { [K in keyof T]: ValueOf<T[K]> };

function isPresent<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/** Describe arbitrary recursive Option nesting around a non-nullable base payload. */
export type NestedOption<T extends NonNullable<unknown>> = Option<T | NestedOption<T>>;
/** Extract the final payload type by removing nested Option layers. */
export type FlattenedOption<T extends NonNullable<unknown>> =
  T extends Option<infer U> ? FlattenedOption<U> : T;

/** A non-nullable value or absence, retaining the reference class API. */
export class Option<T extends NonNullable<unknown>> {
  private constructor(private readonly _v: T | null | undefined) {
    Object.freeze(this);
  }

  /** Compare present payloads by ===; two absent Options intentionally compare false. */
  static Equals<A extends NonNullable<unknown>, B extends NonNullable<unknown>>(
    first: Option<A>,
    second: Option<B>,
  ): boolean {
    const v1 = first._v;
    const v2 = second._v;
    if (!isPresent(v1) && !isPresent(v2)) {
      return false;
    }
    return v1 === v2;
  }

  /** Construct presence; reject nullable input even when called from untyped code. */
  static Some<T extends NonNullable<unknown>>(value: T): Option<T> {
    if (!isPresent(value)) throw new TypeError(SOME_NULLABLE_MESSAGE);
    return new Option<T>(value);
  }

  /** Construct absence with a null sentinel. */
  static None<T extends NonNullable<unknown>>(): Option<T> {
    return new Option<T>(null);
  }

  /** Treat only null and undefined as absence and retain other values, including falsy payloads. */
  static Of<T extends NonNullable<unknown>>(value: T | null | undefined): Option<T>;
  static Of<T>(value: T): Option<NonNullable<T>>;
  static Of<T>(value: T): Option<NonNullable<T>> {
    if (isPresent(value)) return new Option<NonNullable<T>>(value);
    return new Option<NonNullable<T>>(value === null ? null : undefined);
  }

  /** Build a functional projection that runs only on presence. */
  static Map<T extends NonNullable<unknown>, U extends NonNullable<unknown>>(
    fn: (value: T) => U,
  ): (option: Option<T>) => Option<U> {
    return (option: Option<T>) => option.map(fn);
  }

  /** Build a functional predicate that runs only on presence. */
  static Filter<T extends NonNullable<unknown>>(
    predicate: (value: T) => boolean,
  ): (option: Option<T>) => Option<T> {
    return (option: Option<T>) => option.filter(predicate);
  }

  /** Extract presence or raise UnwrapError through a functional call. */
  static Unwrap<T extends NonNullable<unknown>>(option: Option<T>): T {
    return option.unwrap();
  }

  /** Flatten nested Options iteratively, including an already flat Option. */
  static Collapse<T extends NonNullable<unknown>>(option: Option<NestedOption<T>>): Option<FlattenedOption<T>>;
  static Collapse<T extends NonNullable<unknown>>(option: Option<T>): Option<FlattenedOption<T>>;
  static Collapse<T extends NonNullable<unknown>>(option: Option<T>): Option<FlattenedOption<T>> {
    return option.collapse();
  }

  /** Combine all own record fields, including symbols; return None on the first absent field. */
  static Zip<T extends { [K in keyof T]-?: Option<NonNullable<unknown>> }>(
    options: T,
  ): Option<RecordValues<T>> {
    const entries: [PropertyKey, unknown][] = [];
    for (const key of Reflect.ownKeys(options)) {
      const option = options[key as keyof T].get();
      if (!isPresent(option)) {
        return Option.None();
      }
      entries.push([key, option]);
    }
    // Every own field is present before this complete mapped record is exposed.
    return Option.Some(Object.fromEntries(entries) as RecordValues<T>);
  }

  /** Combine tuple/array values in order; None short-circuits the collection. */
  static Join<const T extends readonly Option<NonNullable<unknown>>[]>(
    options: T,
  ): Option<TupleValues<T>> {
    const result: unknown[] = [];
    for (const entry of options) {
      const option = entry.get();
      if (!isPresent(option)) {
        return Option.None();
      }
      result.push(option);
    }
    // Every input contributes one present value at the same position.
    return Option.Some(result as TupleValues<T>);
  }

  /** Explicit tuple spelling; Join remains available for existing callers. */
  static Tuple<const T extends readonly Option<NonNullable<unknown>>[]>(options: T): Option<TupleValues<T>> {
    return Option.Join(options);
  }

  /** Build Result<Option<T>, E> from Option<Result<T, E>> without discarding inner errors. */
  static Switch<T extends NonNullable<unknown>, E>(op: Option<Result<T, E>>): Result<Option<T>, E> {
    return op.switch<T, E>();
  }

  /** Build a functional exhaustive branch handler, permitting different outputs or void. */
  static Match<T extends NonNullable<unknown>, U, V = U>(patterns: {
    some: (value: T) => U;
    none: () => V;
  }): (op: Option<T>) => U | V {
    return (op: Option<T>) => op.match(patterns);
  }

  /** Compare present payloads by ===; any absence intentionally compares false. */
  equals<O extends NonNullable<unknown>>(other: Option<O>): boolean {
    return Option.Equals<T, O>(this, other);
  }

  /** Extract presence or raise UnwrapError when absent. */
  unwrap(): T {
    if (!isPresent(this._v)) {
      throw new UnwrapError(NONE_UNWRAP_MESSAGE);
    }
    return this._v;
  }

  /** Retain the legacy factory-or-value form; use asResultValue for function-valued errors. */
  asResult<E>(error: () => E): Result<T, E>;
  asResult<E>(error: NonCallable<E>): Result<T, E>;
  asResult(error: unknown): Result<T, unknown> {
    if (isPresent(this._v)) return Result.Ok(this._v);
    // Public overloads admit only zero-argument factories in the callable branch.
    const value: unknown = typeof error === "function" ? (error as () => unknown)() : error;
    return Result.Fail(value);
  }

  /** Convert absence to an error value without invoking it, even when it is callable. */
  asResultValue<E>(error: E): Result<T, E> {
    return isPresent(this._v) ? Result.Ok(this._v) : Result.Fail(error);
  }

  /** Move an inner Result outward; absent Option becomes successful absence. */
  switch<T extends NonNullable<unknown>, E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
    if (!isPresent(this._v)) {
      return Result.Ok<Option<T>, E>(Option.None<T>());
    }

    return this._v.map(Option.Some);
  }

  /** Flatten all nested Options without recursive calls that can exhaust the stack. */
  collapse(): Option<FlattenedOption<T>> {
    let value: unknown = this._v;
    while (value instanceof Option) value = value.get();
    // The loop removed all nested Option layers; only the final payload or absence remains.
    return Option.Of(value as FlattenedOption<T> | null | undefined);
  }

  /** Extract presence or use the supplied fallback payload. */
  orElse(defaultValue: T): T {
    return isPresent(this._v) ? this._v : defaultValue;
  }

  /** Extract presence or lazily construct and throw an Error. */
  orElseThrow<N extends Error>(fn: () => N): T {
    if (!isPresent(this._v)) {
      throw fn();
    }
    return this._v;
  }

  /** Retain presence only when the predicate passes; skip the predicate on absence. */
  filter(predicate: (value: T) => boolean): Option<T> {
    if (isPresent(this._v) && predicate(this._v)) {
      return this;
    }
    return Option.None<T>();
  }

  /** Transform presence into a non-nullable payload; skip absence and propagate callback errors. */
  map<U extends NonNullable<unknown>>(fn: (value: T) => U): Option<U> {
    if (isPresent(this._v)) {
      return Option.Some(fn(this._v));
    }
    return Option.None<U>();
  }

  /** Execute exactly one exhaustive branch handler, allowing differing outputs or void. */
  match<U, V = U>(patterns: { some: (value: T) => U; none: () => V }): U | V {
    if (isPresent(this._v)) {
      return patterns.some(this._v);
    }
    return patterns.none();
  }

  /** Expose the payload or original nullable sentinel without unwrapping. */
  get(): T | null | undefined {
    return this._v;
  }

  /** Observe presence once and return this instance; skip absence. */
  ifSome(fn: (value: T) => void): this {
    if (isPresent(this._v)) {
      fn(this._v);
    }
    return this;
  }

  /** Observe absence once and return this instance; skip presence. */
  ifNone(fn: () => void): this {
    if (!isPresent(this._v)) {
      fn();
    }
    return this;
  }
}
