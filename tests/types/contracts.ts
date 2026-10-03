import { expectTypeOf } from "bun:test";
import { Option, Result } from "../../src/index.ts";
import type { ResultPlain } from "../../src/index.ts";

// Checked by tsc, not executed by the runtime runner.
export function checkContracts(
  result: Result<number, "input">,
  option: Option<number>,
  mixedOption: Option<number> | Option<string>,
): void {
  expectTypeOf(Result.Ok(1)).toEqualTypeOf<Result<number, never>>();
  expectTypeOf(Result.Fail("failure" as const)).toEqualTypeOf<
    Result<never, "failure">
  >();
  expectTypeOf(result.map(String)).toEqualTypeOf<Result<string, "input">>();
  expectTypeOf(Result.Map<number, string>(String)(result)).toEqualTypeOf<
    Result<string, "input">
  >();
  expectTypeOf(
    Result.MapError((error: "input") => ({ error }))(result),
  ).toEqualTypeOf<Result<number, { error: "input" }>>();

  const nested: Result<Option<number>, "outer"> = Result.Ok(Option.Some(1));
  expectTypeOf(nested.whenNone(() => "missing" as const)).toEqualTypeOf<
    Result<number, "outer" | "missing">
  >();
  expectTypeOf(Result.WhenNone(() => "missing" as const)(nested)).toEqualTypeOf<
    Result<number, "outer" | "missing">
  >();
  expectTypeOf(nested.failSome(() => "exists" as const)).toEqualTypeOf<
    Result<void, "outer" | "exists">
  >();
  expectTypeOf(Result.FailSome((value: number) => value)(nested)).toEqualTypeOf<
    Result<void, "outer" | number>
  >();
  expectTypeOf(result.failSuccess(() => "inverted" as const)).toEqualTypeOf<
    Result<void, "input" | "inverted">
  >();
  expectTypeOf(
    Result.FailSuccess((value: number) => value)(result),
  ).toEqualTypeOf<Result<void, "input" | number>>();

  const first: Result<number, "first"> = Result.Ok(1);
  const second: Result<string, "second"> = Result.Ok("two");
  expectTypeOf(Result.Join([first, second])).toEqualTypeOf<
    Result<[number, string], "first" | "second">
  >();
  expectTypeOf(Result.Tuple([first, second] as const)).toEqualTypeOf<
    Result<[number, string], "first" | "second">
  >();
  expectTypeOf(Result.Join([first, first])).toEqualTypeOf<
    Result<[number, number], "first">
  >();
  const array: Result<number, "first">[] = [first];
  expectTypeOf(Result.Join(array)).toEqualTypeOf<Result<number[], "first">>();
  expectTypeOf(Result.Zip({ first, second })).toEqualTypeOf<
    Result<{ first: number; second: string }, "first" | "second">
  >();
  expectTypeOf(Result.Zip({ value: Result.Ok(1) })).toEqualTypeOf<
    Result<{ value: number }, never>
  >();
  expectTypeOf(Result.Join([])).toEqualTypeOf<Result<[], never>>();

  const key = Symbol("field");
  const symbolic = Result.Zip({ [key]: first });
  expectTypeOf(symbolic.unwrap()[key]).toEqualTypeOf<number>();
  expectTypeOf(
    Option.Tuple([Option.Some(1), Option.Some("two")]),
  ).toEqualTypeOf<Option<[number, string]>>();
  expectTypeOf(
    Option.Join([Option.Some(1), Option.Some("two")] as const),
  ).toEqualTypeOf<Option<[number, string]>>();
  const optionalArray: Option<number>[] = [Option.Some(1)];
  expectTypeOf(Option.Join(optionalArray)).toEqualTypeOf<Option<number[]>>();
  expectTypeOf(Option.Join([])).toEqualTypeOf<Option<[]>>();
  expectTypeOf(Option.Tuple([mixedOption])).toEqualTypeOf<
    Option<[number | string]>
  >();
  expectTypeOf(
    Option.Zip({ first: Option.Some(1), [key]: Option.Some("two") }),
  ).toEqualTypeOf<Option<{ first: number; [key]: string }>>();
  expectTypeOf(Option.Zip({ first: Option.Some(1) } as const)).toEqualTypeOf<
    Option<{ readonly first: number }>
  >();
  expectTypeOf(
    Option.Collapse(Option.Some(Option.Some(Option.Some(1)))),
  ).toEqualTypeOf<Option<number>>();
  expectTypeOf(Option.Some(Option.Some(1)).collapse()).toEqualTypeOf<
    Option<number>
  >();
  expectTypeOf(Option.Collapse(Option.Some(1))).toEqualTypeOf<Option<number>>();
  expectTypeOf(Option.Of<string>(undefined)).toEqualTypeOf<Option<string>>();
  expectTypeOf(Option.Of("value" as string | null | undefined)).toEqualTypeOf<
    Option<string>
  >();
  expectTypeOf(option.get()).toEqualTypeOf<number | null | undefined>();
  expectTypeOf(
    option.match({ some: () => {}, none: () => {} }),
  ).toEqualTypeOf<void>();
  expectTypeOf(
    option.match({ some: () => 1, none: () => "none" }),
  ).toEqualTypeOf<number | string>();
  expectTypeOf(
    Option.Match<number, void>({ some: () => {}, none: () => {} })(option),
  ).toEqualTypeOf<void>();
  expectTypeOf(option.asResult(() => "missing" as const)).toEqualTypeOf<
    Result<number, "missing">
  >();
  const errorValue = () => "missing";
  const callableError = option.asResultValue(errorValue);
  expectTypeOf(callableError.plain().error).toEqualTypeOf<
    typeof errorValue | undefined
  >();
  expectTypeOf(callableError.unwrap()).toEqualTypeOf<number>();

  const unknownFailure = Result.Try(() => Promise.resolve(1));
  expectTypeOf(unknownFailure).toEqualTypeOf<
    Promise<Result<number, unknown>>
  >();
  expectTypeOf(
    Result.Try(
      () => 1,
      () => "caught" as const,
    ),
  ).toEqualTypeOf<Promise<Result<number, "caught">>>();
  expectTypeOf(Result.Promise(Promise.resolve(1))).toEqualTypeOf<
    Promise<Result<number, unknown>>
  >();
  expectTypeOf(
    Result.Promise(Promise.resolve(1), () => "caught" as const),
  ).toEqualTypeOf<Promise<Result<number, "caught">>>();

  const plain: ResultPlain<number, "input"> = result.plain();
  if (plain.success) expectTypeOf(plain.value).toEqualTypeOf<number>();
  else expectTypeOf(plain.error).toEqualTypeOf<"input">();

  // @ts-expect-error Result.Plain exposes a read-only discriminant.
  plain.success = true;
  // @ts-expect-error Some requires a non-nullable payload; nullable input belongs in Of.
  Option.Some(undefined);
  // @ts-expect-error Some requires a non-nullable payload.
  Option.Some(null);
  // @ts-expect-error whenNone applies only to Result<Option<T>, E>.
  result.whenNone(() => "missing");
  // @ts-expect-error switch applies only to Option<Result<T, E>>.
  option.switch();
  // @ts-expect-error Typed promise errors require an explicit mapper.
  Result.Promise<number, Error>(Promise.resolve(1));
  // @ts-expect-error Typed captured exceptions require an explicit mapper.
  Result.Try<number, Error>(() => 1);
  // @ts-expect-error A callable error value must use asResultValue, not the factory overload.
  option.asResult<() => string>(() => "error");
  // @ts-expect-error Optional record fields cannot guarantee a complete Zip result.
  Result.Zip({} as { value?: Result<number, string> });
  // @ts-expect-error Plain values are not Result entries.
  Result.Tuple([1]);
  // @ts-expect-error Plain values are not Option entries.
  Option.Tuple([1]);
}
