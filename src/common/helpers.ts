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

/**
 * Creates a Liquid error instance.
 * @param stage - The stage at which the error occurred ('Lexer', 'Parser', or 'Runtime').
 * @param message - The error message.
 * @param location - The optional location object containing line and column numbers.
 * @returns An Error object representing the Liquid error.
 */
export function LiquidErrorInstance(
  stage: 'Lexer' | 'Parser' | 'Runtime',
  message: string,
  location?: number,
): Error {
  let content = `\x1b[41m[${stage} Error]\x1b[0m : \x1b[37m${message}\x1b[0m`;
  if (location) {
    content += ` at \x1b[33m: ${location}`;
  }
  return new Error(content);
}
