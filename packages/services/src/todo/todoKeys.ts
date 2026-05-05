export const todoKeys = {
  all: ["todos"] as const,
  list: (): readonly ["todos", "list"] => ["todos", "list"] as const,
  detail: (uuid: string): readonly ["todos", "detail", string] => ["todos", "detail", uuid] as const,
};
