/** Raised when an absent Option is unwrapped; Result failures throw their own error. */
export class UnwrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnwrapError";
  }
}
