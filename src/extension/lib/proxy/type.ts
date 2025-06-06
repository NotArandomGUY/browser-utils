export type ToObjectType<T> = (
  T extends object ? T :
  T extends bigint ? BigInt :
  T extends number ? Number : // NOSONAR
  T extends string ? String : // NOSONAR
  T extends symbol ? Symbol :
  never
)

export type ToInvoke<T> = (
  T extends (...args: any) => any ? (...args: Parameters<T>) => ReturnType<T> :
  (...args: unknown[]) => unknown
)