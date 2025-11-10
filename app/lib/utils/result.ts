// app/lib/utils/result.ts
/**
 * Result pattern for handling success/failure without throwing exceptions
 * Inspired by Rust's Result<T, E> and functional programming patterns
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly ok: true = true;

  constructor(public readonly value: T) {}

  isOk(): this is Success<T> {
    return true;
  }

  isErr(): this is Failure<never> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

export class Failure<E> {
  readonly ok: false = false;

  constructor(public readonly error: E) {}

  isOk(): this is Success<never> {
    return false;
  }

  isErr(): this is Failure<E> {
    return true;
  }

  map<U>(_fn: (value: never) => U): Result<never, E> {
    return this;
  }

  flatMap<U>(_fn: (value: never) => Result<U, E>): Result<never, E> {
    return this;
  }
}

/**
 * Helper functions for creating Results
 */
export const ok = <T>(value: T): Success<T> => new Success(value);
export const err = <E>(error: E): Failure<E> => new Failure(error);

/**
 * Wrap async function to return Result instead of throwing
 */
export async function asyncTry<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Wrap sync function to return Result instead of throwing
 */
export function syncTry<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const value = fn();
    return ok(value);
  } catch (error) {
    return err(error as E);
  }
}

