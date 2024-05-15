/**
 * Wraps a value in an array if it is not already an array.
 * @param value - The value to wrap.
 * @returns The wrapped value as an array.
 */
export function wrapInArray<T>(value: T[] | T): T[] {
  if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}
