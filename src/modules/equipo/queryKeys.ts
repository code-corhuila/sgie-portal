export const equipoKeys = {
  all: ['equipos'] as const,
  search: (codigo: string) => ['equipos', 'search', codigo] as const,
  categories: ['equipos', 'categorias'] as const,
  types: ['equipos', 'tipos'] as const,
  instalaciones: ['equipos', 'instalaciones'] as const,
};
