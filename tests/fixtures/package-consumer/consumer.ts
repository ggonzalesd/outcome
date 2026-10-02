import { Option, Result, UnwrapError } from "outcome";
import { Result as SubpathResult } from "outcome/result";
import { Option as SubpathOption, UnwrapError as SubpathUnwrapError } from "outcome/option";

const success = Result.Ok(Option.Some(21))
  .whenNone(() => "missing")
  .map((value) => value * 2)
  .unwrap();
const missing = Option.Of(undefined).asResult("missing").orElse((error) => error);
const rejected = (await Result.Try(() => Promise.reject("rejected"))).plain();
if (rejected.success || rejected.error !== "rejected") throw new Error("Async contract failed");
if (SubpathResult !== Result || SubpathOption !== Option || SubpathUnwrapError !== UnwrapError) {
  throw new Error("Export identity failed");
}

let unwrapError = false;
try {
  Option.None().unwrap();
} catch (error) {
  unwrapError = error instanceof UnwrapError;
}
if (!(Result.Ok(1) instanceof Result) || !(Option.Some(1) instanceof Option)) {
  throw new Error("Class contract failed");
}
if (Result.Tuple([Result.Ok(1), Result.Ok("two")]).unwrap()[1] !== "two") {
  throw new Error("Tuple contract failed");
}
if (Option.Zip({ count: Option.Some(1) }).unwrap().count !== 1) {
  throw new Error("Zip contract failed");
}

export const observed = { success, missing, unwrapError };
