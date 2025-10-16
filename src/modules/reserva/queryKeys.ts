export const reservaKeys = {
  list: (documento?: string) => ["reservas", documento ?? "all"] as const,
  tipos: ["reservas", "tipos"] as const,
  equipos: ["reservas", "equipos"] as const,
  instalaciones: ["reservas", "instalaciones"] as const,
  categoriasEquipo: ["reservas", "categorias-equipo"] as const,
  categoriasInstalacion: ["reservas", "categorias-instalacion"] as const,
  horasInstalacion: (fecha: string, id: number, detalle?: number) =>
    ["reservas", "horas-instalacion", fecha, id, detalle ?? ""] as const,
  horasEquipo: (fecha: string, id: number, detalle?: number) =>
    ["reservas", "horas-equipo", fecha, id, detalle ?? ""] as const,
};
