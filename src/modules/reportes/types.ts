export interface ReporteConfig {
  id: string;
  label: string;
  endpoint: string;
  permiteNumeroIdentificacion?: boolean;
}

export interface ReporteFormato {
  value: "xlsx" | "csv" | "pdf";
  label: string;
}
