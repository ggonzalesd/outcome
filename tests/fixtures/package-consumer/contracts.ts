import { Option, Result } from "outcome";
import type { FlattenedOption, ResultPlain } from "outcome";
import { Result as SubpathResult } from "outcome/result";
import { Option as SubpathOption } from "outcome/option";

type Equal<Left, Right> =
  (<T>() => T extends Left ? 1 : 2) extends (<T>() => T extends Right ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

const first: Result<number, "first"> = Result.Ok(1);
const second: Result<string, "second"> = Result.Ok("two");
const tuple = SubpathResult.Tuple([first, second]);
const record = Result.Zip({ first, second });
const optionalTuple = SubpathOption.Tuple([Option.Some(1), Option.Some("two")]);
const nullable = SubpathOption.Of("value" as string | null | undefined);
const nested: Result<Option<number>, "outer"> = Result.Ok(Option.Some(1));
const required = Result.WhenNone(() => "missing" as const)(nested);
const captured = SubpathResult.Try(() => Promise.resolve(1));
const plain: ResultPlain<number, "first"> = first.plain();

export type ConsumerContracts = [
  Assert<Equal<typeof SubpathResult, typeof Result>>,
  Assert<Equal<typeof SubpathOption, typeof Option>>,
  Assert<Equal<typeof tuple, Result<[number, string], "first" | "second">>>,
  Assert<Equal<typeof record, Result<{ first: number; second: string }, "first" | "second">>>,
  Assert<Equal<typeof optionalTuple, Option<[number, string]>>>,
  Assert<Equal<typeof nullable, Option<string>>>,
  Assert<Equal<typeof required, Result<number, "outer" | "missing">>>,
  Assert<Equal<typeof captured, Promise<Result<number, unknown>>>>,
  Assert<Equal<FlattenedOption<Option<Option<number>>>, number>>,
];

// Checked by the consumer compiler, never executed by the runtime test.
export function rejectedUsage(): void {
  // @ts-expect-error Some rejects nullable payloads through the installed subpath.
  SubpathOption.Some(undefined);
  // @ts-expect-error Captured error types require an explicit mapper.
  SubpathResult.Try<number, Error>(() => 1);
  // @ts-expect-error Tuple accepts Result containers, not plain payloads.
  Result.Tuple([1]);
  // @ts-expect-error The public discriminated view is immutable.
  plain.success = false;
}
