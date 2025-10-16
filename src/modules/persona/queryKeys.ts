export const personaKeys = {
  all: ["personas"] as const,
  search: (documento: string) => ["personas", "search", documento] as const,
  roles: ["personas", "roles"] as const,
};
