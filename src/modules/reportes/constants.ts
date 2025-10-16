import type { ReporteConfig, ReporteFormato } from "./types";

export const REPORTES: ReporteConfig[] = [
  {
    id: "reserva",
    label: "Reserva",
    endpoint: "/reserva/reporte",
    permiteNumeroIdentificacion: true,
  },
  {
    id: "instalaciones",
    label: "Instalaciones",
    endpoint: "/instalacion/reporte",
  },
  {
    id: "campus",
    label: "Campus",
    endpoint: "/campus/reporte",
  },
  {
    id: "equipos",
    label: "Equipos",
    endpoint: "/equipo/reporte",
  },
];

export const REPORTE_FORMATOS: ReporteFormato[] = [
  { value: "xlsx", label: "XLSX" },
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
];
