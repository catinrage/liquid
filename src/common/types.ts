export type Split<S extends string, D extends string> = string extends S
  ? string[]
  : S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : S extends `${infer T}`
  ? [T]
  : never;

export type SplitBySpace<S extends string> = Split<S, ' '>[number];
