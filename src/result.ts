import { Option } from "./option.ts";

type SuccessResult<T> = {
  readonly success: true;
  readonly value: T;
  readonly error?: undefined;
};
const SuccessResult = <T>(value: T): SuccessResult<T> => ({
  success: true,
  value,
});

type FailureResult<E = unknown> = {
  readonly success: false;
  readonly error: E;
  readonly value?: undefined;
};
const FailureResult = <E = unknown>(error: E): FailureResult<E> => ({
  success: false,
  error,
});

/**
 * What `Result.plain()` returns: the same value as a discriminated union, so a caller can narrow it
 * with `if (plain.success)`.
 *
 * The view is frozen; payloads and error values retain their identity and mutability.
 */
export type ResultPlain<T, E = unknown> = SuccessResult<T> | FailureResult<E>;

type ValueOf<R> = R extends Result<infer V, infer _E> ? V : never;
type ErrorOf<R> = R extends Result<infer _V, infer E> ? E : never;
type TupleValues<T extends readonly Result<unknown, unknown>[]> = {
  -readonly [K in keyof T]: ValueOf<T[K]>;
};
type RecordValues<T> = { [K in keyof T]: ValueOf<T[K]> };

/** A success or failure with instance methods and functional static counterparts. */
export class Result<T, E = unknown> {
  private constructor(private readonly _v: ResultPlain<T, E>) {
    Object.freeze(_v);
    Object.freeze(this);
  }

  /** Construct success; an inferred error channel starts as never. */
  static Ok<T>(value: T): Result<T, never>;
  static Ok<T, E>(value: T): Result<T, E>;
  static Ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(SuccessResult<T>(value));
  }

  /** Construct failure and retain its error value without wrapping it. */
  static Fail<E>(error: E): Result<never, E>;
  static Fail<E, T>(error: E): Result<T, E>;
  static Fail<E, T = never>(error: E): Result<T, E> {
    return new Result<T, E>(FailureResult<E>(error));
  }

  /** Read the frozen discriminated view through a functional call. */
  static Plain<T, E = unknown>(result: Result<T, E>): ResultPlain<T, E> {
    return result.plain();
  }

  /** Extract success or throw the original failure through a functional call. */
  static Unwrap<T, E = unknown>(result: Result<T, E>): T {
    return result.unwrap();
  }

  /** Capture promise rejection as unknown, or explicitly map it to a typed error. */
  static Promise<T>(promise: PromiseLike<T>): Promise<Result<Awaited<T>, unknown>>;
  static Promise<T, E>(promise: PromiseLike<T>, mapError: (reason: unknown) => E): Promise<Result<Awaited<T>, E>>;
  static async Promise<T>(promise: PromiseLike<T>, mapError?: (reason: unknown) => unknown): Promise<Result<Awaited<T>, unknown>> {
    return Result.Try(() => promise, mapError ?? ((reason: unknown) => reason));
  }

  /** Preserve the asynchronous contract while capturing both throws and rejected return values. */
  static Try<T>(fn: () => T): Promise<Result<Awaited<T>, unknown>>;
  static Try<T, E>(fn: () => T, mapError: (reason: unknown) => E): Promise<Result<Awaited<T>, E>>;
  static async Try<T>(fn: () => T, mapError?: (reason: unknown) => unknown): Promise<Result<Awaited<T>, unknown>> {
    try {
      return Result.Ok(await fn());
    } catch (error: unknown) {
      return Result.Fail(mapError ? mapError(error) : error);
    }
  }

  /** Build a lazy Option-required conversion without losing the outer error type. */
  static WhenNone<X>(fn: () => X): <T extends NonNullable<unknown>, E>(result: Result<Option<T>, E>) => Result<T, X | E>;
  static WhenNone<T extends NonNullable<unknown>, E, X>(fn: () => X): (result: Result<Option<T>, E>) => Result<T, X | E>;
  static WhenNone<X>(fn: () => X) {
    return <T extends NonNullable<unknown>, E>(result: Result<Option<T>, E>): Result<T, X | E> => result.whenNone(fn);
  }

  /** Build a presence rejection that preserves existing failures and succeeds with void on absence. */
  static FailSome<T extends NonNullable<unknown>, X>(fn: (value: T) => X): <E>(result: Result<Option<T>, E>) => Result<void, X | E>;
  static FailSome<T extends NonNullable<unknown>, E, X>(fn: (value: T) => X): (result: Result<Option<T>, E>) => Result<void, X | E>;
  static FailSome<T extends NonNullable<unknown>, X>(fn: (value: T) => X) {
    return <E>(result: Result<Option<T>, E>): Result<void, X | E> => result.failSome(fn);
  }

  /** Build the reference success/failure inversion with a void success type. */
  static FailSuccess<T, X>(fn: (value: T) => X): <E>(result: Result<T, E>) => Result<void, X | E>;
  static FailSuccess<T, E, X>(fn: (value: T) => X): (result: Result<T, E>) => Result<void, X | E>;
  static FailSuccess<T, X>(fn: (value: T) => X) {
    return <E>(result: Result<T, E>): Result<void, X | E> => result.failSuccess(fn);
  }

  /** Build a success-to-Option projection; failures become absence. */
  static Optional<T extends NonNullable<unknown>, U extends NonNullable<unknown>>(
    fn: (value: T) => U | null | undefined,
  ): <E>(result: Result<T, E>) => Option<U> {
    return <E>(result: Result<T, E>) => result.optional(fn);
  }

  /** Build a success projection while inferring the incoming error type when applied. */
  static Map<T, V>(fn: (value: T) => V): <E>(result: Result<T, E>) => Result<V, E>;
  static Map<T, V, E>(fn: (value: T) => V): (result: Result<T, E>) => Result<V, E>;
  static Map<T, V>(fn: (value: T) => V) {
    return <E>(result: Result<T, E>): Result<V, E> => result.map(fn);
  }

  /** Build an error projection while inferring the incoming value type when applied. */
  static MapError<E, N>(fn: (error: E) => N): <T>(result: Result<T, E>) => Result<T, N>;
  static MapError<E, N, T>(fn: (error: E) => N): (result: Result<T, E>) => Result<T, N>;
  static MapError<E, N>(fn: (error: E) => N) {
    return <T>(result: Result<T, E>): Result<T, N> => result.mapError(fn);
  }

  /** Combine tuple/array values in order; return the first failure without restricting its type. */
  static Join<const T extends readonly Result<unknown, unknown>[]>(
    results: T,
  ): Result<TupleValues<T>, ErrorOf<T[number]>> {
    const values: unknown[] = [];
    for (const result of results) {
      const plain = result.plain();
      if (!plain.success) {
        // Each encountered error comes from a member of the input tuple.
        return Result.Fail(plain.error as ErrorOf<T[number]>);
      }
      values.push(plain.value);
    }
    // Every input contributes exactly one value at the same position before success is returned.
    return Result.Ok(values as TupleValues<T>);
  }

  /** Explicit tuple spelling; Join remains available for existing callers. */
  static Tuple<const T extends readonly Result<unknown, unknown>[]>(results: T): Result<TupleValues<T>, ErrorOf<T[number]>> {
    return Result.Join(results);
  }

  /** Combine every own record field, including symbols; inherited fields are not entries. */
  static Zip<T extends { [K in keyof T]-?: Result<unknown, unknown> }>(
    results: T,
  ): Result<RecordValues<T>, ErrorOf<T[keyof T]>> {
    const entries: [PropertyKey, unknown][] = [];
    for (const key of Reflect.ownKeys(results)) {
      const result = results[key as keyof T].plain();
      if (!result.success) return Result.Fail(result.error as ErrorOf<T[keyof T]>);
      entries.push([key, result.value]);
    }
    // All own input fields have been visited. fromEntries safely handles symbol and __proto__ keys.
    return Result.Ok(Object.fromEntries(entries) as RecordValues<T>);
  }

  /** Extract success or throw the original error value verbatim. */
  unwrap(): T {
    if (this._v.success) {
      return this._v.value;
    }
    throw this._v.error;
  }

  /** Expose a frozen discriminated view without copying or freezing its payload. */
  plain(): ResultPlain<T, E> {
    return this._v;
  }

  /** Require presence inside successful Option; compute a missing error only on absence. */
  whenNone<T extends NonNullable<unknown>, E, X>(
    this: Result<Option<T>, E>,
    fn: () => X,
  ): Result<T, X | E> {
    if (!this._v.success) return Result.Fail<E, T>(this._v.error);

    const option = this._v.value.get();
    if (option === null || option === undefined) return Result.Fail<X, T>(fn());

    return Result.Ok<T, X>(option);
  }

  /** Fail on presence, succeed without a value on absence, and preserve an existing failure. */
  failSome<T extends NonNullable<unknown>, E, X>(
    this: Result<Option<T>, E>,
    fn: (value: T) => X,
  ): Result<void, X | E> {
    if (!this._v.success) return Result.Fail<E, void>(this._v.error);

    const option = this._v.value.get();
    if (option !== null && option !== undefined) return Result.Fail<X, void>(fn(option));

    return Result.Ok<void, X>(undefined);
  }

  /** Preserve the reference inversion: success becomes failure; an existing failure becomes Ok(void). */
  failSuccess<X>(fn: (value: T) => X): Result<void, X | E> {
    if (this._v.success) return Result.Fail<X, void>(fn(this._v.value));
    return Result.Ok<void, X>(undefined);
  }

  /** Project successful nullable output into Option; discard an existing failure as absence. */
  optional<U extends NonNullable<unknown>>(fn: (value: T) => U | null | undefined): Option<U> {
    if (this._v.success) {
      const result = fn(this._v.value);
      return Option.Of(result);
    }
    return Option.None<U>();
  }

  /** Transform only success; callback exceptions propagate and the error channel is retained. */
  map<V>(fn: (value: T) => V): Result<V, E> {
    if (this._v.success) {
      return Result.Ok(fn(this._v.value));
    }
    return Result.Fail(this._v.error);
  }

  /** Transform only failure; callback exceptions propagate and the value channel is retained. */
  mapError<N>(fn: (error: E) => N): Result<T, N> {
    if (!this._v.success) {
      return Result.Fail(fn(this._v.error));
    }
    return Result.Ok(this._v.value);
  }

  /** Observe success once and return this instance; skip failure. */
  ifSuccess(fn: (value: T) => void): this {
    if (this._v.success) {
      fn(this._v.value);
    }
    return this;
  }

  /** Observe failure once and return this instance; skip success. */
  ifFailure(fn: (error: E) => void): this {
    if (!this._v.success) {
      fn(this._v.error);
    }
    return this;
  }

  /** Extract success or compute a fallback value from failure, without another Result wrapper. */
  orElse(fn: (error: E) => T): T {
    if (!this._v.success) {
      return fn(this._v.error);
    }
    return this._v.value;
  }

  /** Extract success or lazily map failure to a thrown Error. */
  orElseThrow<N extends Error>(fn: (error: E) => N): T {
    if (!this._v.success) {
      throw fn(this._v.error);
    }
    return this._v.value;
  }
}
