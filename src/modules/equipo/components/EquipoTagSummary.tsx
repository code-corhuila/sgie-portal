import {
  Badge,
  Tag,
  TagCloseButton,
  TagLabel,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

interface EquipoTagSummaryProps {
  codigo?: string;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  tipoFilter: string;
  instalacionFilter: string;
  categoriaFilter: string;
  totalVisible: number;
  totalEquipos: number;
  onClearCodigo: () => void;
  onClearStatus: () => void;
  onClearTipo: () => void;
  onClearInstalacion: () => void;
  onClearCategoria: () => void;
}

export function EquipoTagSummary({
  codigo,
  statusFilter,
  tipoFilter,
  instalacionFilter,
  categoriaFilter,
  totalVisible,
  totalEquipos,
  onClearCodigo,
  onClearStatus,
  onClearTipo,
  onClearInstalacion,
  onClearCategoria,
}: EquipoTagSummaryProps) {
  return (
    <Wrap spacing={3} pt={2}>
      {codigo && (
        <WrapItem>
          <Tag borderRadius="full" variant="solid" colorScheme="brand">
            <TagLabel>Buscar: {codigo}</TagLabel>
            <TagCloseButton onClick={onClearCodigo} />
          </Tag>
        </WrapItem>
      )}
      {statusFilter !== "ALL" && (
        <WrapItem>
          <Tag borderRadius="full" variant="solid" colorScheme="teal">
            <TagLabel>
              Estado: {statusFilter === "ACTIVE" ? "Activos" : "Inactivos"}
            </TagLabel>
            <TagCloseButton onClick={onClearStatus} />
          </Tag>
        </WrapItem>
      )}
      {tipoFilter !== "Todos" && (
        <WrapItem>
          <Tag borderRadius="full" variant="solid" colorScheme="teal">
            <TagLabel>Tipo: {tipoFilter}</TagLabel>
            <TagCloseButton onClick={onClearTipo} />
          </Tag>
        </WrapItem>
      )}
      {instalacionFilter !== "Todos" && (
        <WrapItem>
          <Tag borderRadius="full" variant="solid" colorScheme="teal">
            <TagLabel>Instalación: {instalacionFilter}</TagLabel>
            <TagCloseButton onClick={onClearInstalacion} />
          </Tag>
        </WrapItem>
      )}
      {categoriaFilter !== "Todos" && (
        <WrapItem>
          <Tag borderRadius="full" variant="solid" colorScheme="teal">
            <TagLabel>Categoría: {categoriaFilter}</TagLabel>
            <TagCloseButton onClick={onClearCategoria} />
          </Tag>
        </WrapItem>
      )}
      <WrapItem>
        <Badge variant="neutral">
          Mostrando {totalVisible} de {totalEquipos} coincidencias
        </Badge>
      </WrapItem>
    </Wrap>
  );
}
