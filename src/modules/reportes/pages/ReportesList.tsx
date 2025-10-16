import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { buildApiUrl } from "../../../api/base";
import { REPORTES, REPORTE_FORMATOS } from "../constants";
import type { ReporteFormato } from "../types";

const ReportesList: React.FC = () => {
  const toast = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] =
    useState<ReporteFormato["value"]>("xlsx");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const reportSelectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    reportSelectRef.current?.focus();
  }, []);

  const selectedReport = useMemo(
    () => REPORTES.find((item) => item.id === selectedReportId),
    [selectedReportId],
  );

  useEffect(() => {
    if (!selectedReport?.permiteNumeroIdentificacion) {
      setNumeroIdentificacion("");
    }
  }, [selectedReport]);

  const handleDownload = useCallback(async () => {
    if (!selectedReport) {
      toast({
        title: "Selecciona un reporte",
        description: "Debes elegir el tipo de reporte antes de descargar.",
        status: "warning",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const endpointWithFormat = `${selectedReport.endpoint}/${selectedFormat}`;
      const url = new URL(buildApiUrl(endpointWithFormat));
      url.searchParams.set("modo", "stream");

      const trimmedNumero = numeroIdentificacion.trim();
      if (selectedReport.permiteNumeroIdentificacion && trimmedNumero) {
        url.searchParams.set("numeroIdentificacion", trimmedNumero);
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText?.trim() || "No se pudo descargar el reporte.",
        );
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = `${selectedReport.id}.${selectedFormat}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(objectUrl);

      toast({
        title: "Reporte descargado",
        status: "success",
      });
    } catch (error: unknown) {
      const description =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al intentar descargar el reporte.";

      toast({
        title: "Error al descargar",
        description,
        status: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [numeroIdentificacion, selectedFormat, selectedReport, toast]);

  return (
    <Stack spacing={6}>
      <Stack spacing={1}>
        <Heading size="lg" color="neutral.900">
          Reportes
        </Heading>
        <Text color="neutral.600">
          Descarga los reportes administrativos en el formato que necesites.
        </Text>
      </Stack>

      <Box
        borderWidth="1px"
        borderColor="neutral.100"
        borderRadius="xl"
        boxShadow="sm"
        bg="white"
        p={{ base: 4, md: 6 }}
      >
        <Stack spacing={5}>
          <FormControl>
            <FormLabel fontWeight="semibold" color="neutral.700">
              Tipo de reporte
            </FormLabel>
            <Select
              ref={reportSelectRef}
              placeholder="Selecciona un reporte"
              value={selectedReportId}
              onChange={(event) => setSelectedReportId(event.target.value)}
              aria-label="Selecciona el tipo de reporte para descargar"
            >
              {REPORTES.map((reporte) => (
                <option key={reporte.id} value={reporte.id}>
                  {reporte.label}
                </option>
              ))}
            </Select>
            {!selectedReport && (
              <FormHelperText color="neutral.500">
                Selecciona un reporte para habilitar la descarga.
              </FormHelperText>
            )}
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="semibold" color="neutral.700">
              Formato
            </FormLabel>
            <Select
              value={selectedFormat}
              onChange={(event) =>
                setSelectedFormat(event.target.value as ReporteFormato["value"])
              }
              aria-label="Selecciona el formato del archivo a descargar"
            >
              {REPORTE_FORMATOS.map((formato) => (
                <option key={formato.value} value={formato.value}>
                  {formato.label}
                </option>
              ))}
            </Select>
          </FormControl>

          {selectedReport?.permiteNumeroIdentificacion && (
            <FormControl>
              <FormLabel fontWeight="semibold" color="neutral.700">
                Número de identificación (opcional)
              </FormLabel>
              <Input
                value={numeroIdentificacion}
                onChange={(event) => setNumeroIdentificacion(event.target.value)}
                placeholder="Ingresa el número de identificación"
                aria-label="Número de identificación para filtrar reportes de reservas"
              />
            </FormControl>
          )}

          <Stack spacing={3}>
            <Text fontSize="sm" color="neutral.600">
              El archivo se descargará en el formato seleccionado.
            </Text>
            <Button
              colorScheme="brand"
              onClick={handleDownload}
              isDisabled={!selectedReport || isDownloading}
              isLoading={isDownloading}
              loadingText="Descargando"
              w={{ base: "full", sm: "auto" }}
            >
              Descargar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};

export default ReportesList;
