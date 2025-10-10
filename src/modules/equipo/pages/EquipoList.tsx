// src/modules/equipo/pages/EquipoList.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
  Spacer,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal, {
  type Field,
  type FieldOption,
} from "../../../components/UI/GenericModal";
import { useEquipos } from "../hooks/userEquipo";
import { apiCall } from "../../../api/base";
import {
  FiCpu,
  FiFilter,
  FiLayers,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiToggleLeft,
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from "react-icons/fi";

const EquipoList: React.FC = () => {
  const toast = useToast();
  const {
    data,
    loading,
    fetchAll,
    fetchByCodigo,
    createEquipo,
    createCategoriaEquipo,
    createTipoEquipo,
    cambiarEstado,
  } = useEquipos();

  const [codigo, setCodigo] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [tipoFilter, setTipoFilter] = useState<string>("Todos");
  const [instalacionFilter, setInstalacionFilter] = useState<string>("Todos");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("Todos");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const totalEquipos = data?.length ?? 0;
  const activos = data?.filter((e) => e.estadoEquipo).length ?? 0;
  const enMantenimiento = data?.filter((e) => !e.estadoInstalacion || !e.estadoCampus).length ?? 0;

  const tiposDisponibles = useMemo(
    () => Array.from(new Set((data ?? []).map((e) => e.nombreEquipo).filter(Boolean))),
    [data]
  );
  const instalacionesDisponibles = useMemo(
    () => Array.from(new Set((data ?? []).map((e) => e.nombreInstalacion).filter(Boolean))),
    [data]
  );
  const categoriasDisponibles = useMemo(
    () => Array.from(new Set((data ?? []).map((e) => e.nombreCategoriaEquipo).filter(Boolean))),
    [data]
  );

  const filteredData = useMemo(() => {
    let result = data ?? [];

    if (statusFilter === "ACTIVE") {
      result = result.filter((item) => item.estadoEquipo);
    } else if (statusFilter === "INACTIVE") {
      result = result.filter((item) => !item.estadoEquipo);
    }

    if (tipoFilter !== "Todos") {
      result = result.filter((item) => item.nombreEquipo === tipoFilter);
    }

    if (instalacionFilter !== "Todos") {
      result = result.filter((item) => item.nombreInstalacion === instalacionFilter);
    }

    if (categoriaFilter !== "Todos") {
      result = result.filter((item) => item.nombreCategoriaEquipo === categoriaFilter);
    }

    return result;
  }, [categoriaFilter, data, instalacionFilter, statusFilter, tipoFilter]);

  const totalFiltered = filteredData.length;
  const totalPages = totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / size);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, tipoFilter, instalacionFilter, categoriaFilter, size, data?.length]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    if (totalFiltered === 0) return [];
    const start = page * size;
    return filteredData.slice(start, start + size);
  }, [filteredData, page, size, totalFiltered]);

  const goto = useCallback((target: number) => {
    if (totalFiltered === 0) {
      setPage(0);
      return;
    }
    const next = Math.min(Math.max(target, 0), totalPages - 1);
    setPage(next);
  }, [totalFiltered, totalPages]);

  // Modales
  const modalCategoria = useDisclosure();
  const modalTipo = useDisclosure();
  const modalEquipo = useDisclosure();
  const modalEditEquipo = useDisclosure();

  // Estados de selects
  const [categorias, setCategorias] = useState<FieldOption[]>([]);
  const [tipos, setTipos] = useState<FieldOption[]>([]);
  const [instalaciones, setInstalaciones] = useState<FieldOption[]>([]);

  // ===============================
  // 📋 Columnas con botones de acción
  // ===============================
  // ===============================
  // 📥 Cargar opciones para selects
  // ===============================
  const loadCategorias = useCallback(async () => {
    try {
      const res = await apiCall("/categoria-equipo", { credentials: "include" });
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setCategorias(items.map((c: any) => ({ value: c.id, label: c.nombre })));
    } catch (error: any) {
      console.error("Error cargando categorías", error);
      toast({ title: "Error cargando categorías", description: error?.message, status: "error", duration: 3000 });
    }
  }, [toast]);

  const loadTipos = useCallback(async () => {
    try {
      const res = await apiCall("/tipo-equipo", { credentials: "include" });
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setTipos(items.map((t: any) => ({ value: t.id, label: t.nombre })));
    } catch (error: any) {
      console.error("Error cargando tipos de equipo", error);
      toast({ title: "Error cargando tipos", description: error?.message, status: "error", duration: 3000 });
    }
  }, [toast]);

  const loadInstalaciones = useCallback(async () => {
    try {
      const res = await apiCall("/instalacion", { credentials: "include" });
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setInstalaciones(items.map((i: any) => ({ value: i.id, label: i.nombre }))); 
    } catch (error: any) {
      console.error("Error cargando instalaciones", error);
      toast({ title: "Error cargando instalaciones", description: error?.message, status: "error", duration: 3000 });
    }
  }, [toast]);

  const columns: Column<any>[] = useMemo(
    () => [
      { key: "codigoEquipo", label: "Código" },
      { key: "nombreEquipo", label: "Tipo de Equipo" },
      {
        key: "nombreInstalacion",
        label: "Instalación",
        render: (item) => (
          <Badge variant="info" borderRadius="full">
            {item.nombreInstalacion}
          </Badge>
        ),
      },
      {
        key: "nombreCampus",
        label: "Campus",
        render: (item) => (
          <Badge variant="neutral" borderRadius="full">
            {item.nombreCampus}
          </Badge>
        ),
      },
      {
        key: "nombreCategoriaEquipo",
        label: "Categoría",
        render: (item) => (
          <Badge variant="neutral" borderRadius="full">
            {item.nombreCategoriaEquipo ?? "—"}
          </Badge>
        ),
      },
      {
        key: "estadoEquipo",
        label: "Estado",
        render: (item) => (
          <Badge variant={item.estadoEquipo ? "success" : "neutral"}>
            {item.estadoEquipo ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        render: (item) => (
          <HStack spacing={2}>
            <Tooltip label={item.estadoEquipo ? "Inhabilitar equipo" : "Habilitar equipo"}>
              <IconButton
                aria-label="Cambiar estado"
                size="sm"
                variant="ghost"
                colorScheme={item.estadoEquipo ? "red" : "green"}
                icon={<FiToggleLeft />}
                onClick={async () => {
                  try {
                    await cambiarEstado(item.idEquipo, !item.estadoEquipo);
                    await fetchAll();
                    toast({
                      title: `Equipo ${item.estadoEquipo ? "inhabilitado" : "habilitado"} correctamente`,
                      status: "success",
                      duration: 2000,
                    });
                  } catch (err: any) {
                    toast({
                      title: "Error al cambiar estado",
                      description: err.message || "Error desconocido",
                      status: "error",
                      duration: 4000,
                    });
                  }
                }}
              />
            </Tooltip>
            <Tooltip label="Editar equipo">
              <IconButton
                aria-label="Editar equipo"
                size="sm"
                variant="ghost"
                icon={<FiCpu />}
                onClick={async () => {
                  await Promise.all([loadTipos(), loadInstalaciones()]);
                  setSelectedItem(item);
                  modalEditEquipo.onOpen();
                }}
              />
            </Tooltip>
          </HStack>
        ),
      },
    ],
    [cambiarEstado, fetchAll, loadInstalaciones, loadTipos, modalEditEquipo, toast]
  );

  // ===============================
  // 🧱 Campos formularios
  // ===============================

  const fieldsCategoria: Field[] = [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "descripcion", label: "Descripción", type: "text" },
  ];

  const fieldsTipo: Field[] = [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "descripcion", label: "Descripción", type: "text" },
    { name: "categoriaEquipo", label: "Categoría", type: "select", options: categorias, required: true },
  ];

  // ⚙️ Crear equipo (sin nombre ni descripción)
  const fieldsEquipo: Field[] = [
    { name: "codigo", label: "Código", type: "text", required: true },
    { name: "tipoEquipo", label: "Tipo de Equipo", type: "select", options: tipos, required: true },
    { name: "instalacion", label: "Instalación", type: "select", options: instalaciones, required: true },
  ];

  // ⚙️ Editar equipo (sin nombre ni descripción)
  const fieldsEditEquipo: Field[] = [
    { name: "codigo", label: "Código", type: "text", required: true },
    { name: "tipoEquipo", label: "Tipo de Equipo", type: "select", options: tipos, required: true },
    { name: "instalacion", label: "Instalación", type: "select", options: instalaciones, required: true },
  ];

  // ===============================
  // 📅 Abrir modales
  // ===============================
  const handleOpenTipo = async () => {
    await loadCategorias();
    modalTipo.onOpen();
  };

  const handleOpenEquipo = async () => {
    await Promise.all([loadTipos(), loadInstalaciones()]);
    modalEquipo.onOpen();
  };

  // ===============================
  // 🧩 Render principal
  // ===============================
  return (
    <Stack spacing={8}>
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={4}
      >
        <Stack spacing={1}>
          <Heading size="lg" color="neutral.900">
            Gestión de equipos
          </Heading>
          <Text fontSize="sm" color="neutral.500">
            Controla el parque tecnológico con filtros rápidos y acciones de mantenimiento.
          </Text>
        </Stack>
        <ButtonGroup size="sm" flexWrap="wrap" gap={2}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
        onClick={() => {
          setCodigo("");
          setStatusFilter("ALL");
          setTipoFilter("Todos");
          setInstalacionFilter("Todos");
          setCategoriaFilter("Todos");
          setPage(0);
          void fetchAll();
        }}
        isLoading={loading}
      >
        Actualizar
      </Button>
          <Button leftIcon={<Icon as={FiLayers} />} onClick={modalCategoria.onOpen}>
            Categoría
          </Button>
          <Button leftIcon={<Icon as={FiFilter} />} onClick={handleOpenTipo} variant="outline">
            Tipo
          </Button>
          <Button
            colorScheme="brand"
            leftIcon={<Icon as={FiPlusCircle} />}
            onClick={handleOpenEquipo}
          >
            Nuevo equipo
          </Button>
        </ButtonGroup>
      </Flex>
      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          align={{ base: "stretch", md: "flex-end" }}
        >
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="neutral.400" />
            </InputLeftElement>
          <Input
            placeholder="Código de equipo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchByCodigo(codigo)}
            />
          </InputGroup>
          <ButtonGroup size="sm">
          <Button
            colorScheme="brand"
            leftIcon={<Icon as={FiSearch} />}
            onClick={() => {
              setPage(0);
              fetchByCodigo(codigo);
            }}
            isLoading={loading}
          >
            Buscar
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCodigo("");
              setPage(0);
              void fetchAll();
            }}
          >
            Limpiar
          </Button>
        </ButtonGroup>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Estado
            </Text>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Tipo de equipo
            </Text>
            <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Instalación
            </Text>
            <Select value={instalacionFilter} onChange={(e) => setInstalacionFilter(e.target.value)}>
              <option value="Todos">Todas</option>
              {instalacionesDisponibles.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Categoría
            </Text>
            <Select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}>
              <option value="Todos">Todas</option>
              {categoriasDisponibles.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </Select>
          </Stack>
        </SimpleGrid>

        <Wrap spacing={3} pt={2}>
          {codigo && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme="brand">
                <TagLabel>Buscar: {codigo}</TagLabel>
                <TagCloseButton onClick={() => setCodigo("")} />
              </Tag>
            </WrapItem>
          )}
          {statusFilter !== "ALL" && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  Estado: {statusFilter === "ACTIVE" ? "Activos" : "Inactivos"}
                </TagLabel>
                <TagCloseButton onClick={() => setStatusFilter("ALL")} />
              </Tag>
            </WrapItem>
          )}
          {tipoFilter !== "Todos" && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>Tipo: {tipoFilter}</TagLabel>
                <TagCloseButton onClick={() => setTipoFilter("Todos")} />
              </Tag>
            </WrapItem>
          )}
          {instalacionFilter !== "Todos" && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>Instalación: {instalacionFilter}</TagLabel>
                <TagCloseButton onClick={() => setInstalacionFilter("Todos")} />
              </Tag>
            </WrapItem>
          )}
          {categoriaFilter !== "Todos" && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>Categoría: {categoriaFilter}</TagLabel>
                <TagCloseButton onClick={() => setCategoriaFilter("Todos")} />
              </Tag>
            </WrapItem>
          )}
          <WrapItem>
            <Badge variant="neutral">
              Mostrando {paginatedData.length} de {filteredData.length} coincidencias
            </Badge>
          </WrapItem>
          <WrapItem>
            <Badge variant="neutral">Total: {totalEquipos}</Badge>
          </WrapItem>
          <WrapItem>
            <Badge variant="neutral">Activos: {activos}</Badge>
          </WrapItem>
          <WrapItem>
            <Badge variant="neutral">En mantenimiento: {enMantenimiento}</Badge>
          </WrapItem>
        </Wrap>
      </Stack>

      <DataTable
        data={paginatedData}
        columns={columns}
        keyExtractor={(e) => e.codigoEquipo}
        emptyMessage="No hay equipos registrados"
        loading={loading}
      />

      <Flex
        mt={4}
        align="center"
        justify="space-between"
        gap={4}
        display={totalFiltered === 0 ? 'none' : 'flex'}
      >
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            Filas por página
          </Text>
          <Select
            size="sm"
            w="80px"
            value={size}
            onChange={(e) => {
              const nextSize = Number(e.target.value);
              setSize(nextSize);
              setPage(0);
            }}
            isDisabled={loading}
          >
            {[10, 20, 50, 100].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </HStack>

        <Spacer />

        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            {totalFiltered === 0
              ? '0–0'
              : `${page * size + 1}–${Math.min((page + 1) * size, totalFiltered)}`} de {totalFiltered}
          </Text>
          <IconButton
            aria-label="Primera página"
            size="sm"
            variant="ghost"
            onClick={() => goto(0)}
            isDisabled={page === 0 || loading || totalFiltered === 0}
            icon={<FiChevronsLeft />}
          />
          <IconButton
            aria-label="Anterior"
            size="sm"
            variant="ghost"
            onClick={() => goto(page - 1)}
            isDisabled={page === 0 || loading || totalFiltered === 0}
            icon={<FiChevronLeft />}
          />
          <Button size="sm" variant="outline" isDisabled>
            {totalFiltered === 0 ? 0 : page + 1} / {totalFiltered === 0 ? 0 : totalPages}
          </Button>
          <IconButton
            aria-label="Siguiente"
            size="sm"
            variant="ghost"
            onClick={() => goto(page + 1)}
            isDisabled={page >= totalPages - 1 || loading || totalFiltered === 0}
            icon={<FiChevronRight />}
          />
          <IconButton
            aria-label="Última página"
            size="sm"
            variant="ghost"
            onClick={() => goto(totalPages - 1)}
            isDisabled={page >= totalPages - 1 || loading || totalFiltered === 0}
            icon={<FiChevronsRight />}
          />
        </HStack>
      </Flex>

      {/* Modal Crear Categoría */}
      <GenericModal
        isOpen={modalCategoria.isOpen}
        onClose={modalCategoria.onClose}
        title="Crear Categoría de Equipo"
        fields={fieldsCategoria}
        onSave={async (values) => {
          await createCategoriaEquipo(values);
          await loadCategorias();
          modalCategoria.onClose();
        }}
      />

      {/* Modal Crear Tipo */}
      <GenericModal
        isOpen={modalTipo.isOpen}
        onClose={modalTipo.onClose}
        title="Crear Tipo de Equipo"
        fields={fieldsTipo}
        onSave={async (values) => {
          await createTipoEquipo({
            nombre: values.nombre,
            descripcion: values.descripcion,
            categoriaEquipo: { id: Number(values.categoriaEquipo) },
          });
          await loadTipos();
          modalTipo.onClose();
        }}
      />

      {/* Modal Crear Equipo */}
      <GenericModal
        isOpen={modalEquipo.isOpen}
        onClose={modalEquipo.onClose}
        title="Crear Equipo"
        fields={fieldsEquipo}
        onSave={async (values) => {
          await createEquipo({
            codigo: values.codigo,
            tipoEquipo: { id: Number(values.tipoEquipo) },
            instalacion: { id: Number(values.instalacion) },
          });
          modalEquipo.onClose();
        }}
      />

      {/* Modal Editar Equipo */}
      <GenericModal
        key={`edit-equipo-${selectedItem?.idEquipo ?? "new"}`}
        isOpen={modalEditEquipo.isOpen}
        onClose={() => {
          modalEditEquipo.onClose();
          setSelectedItem(null);
        }}
        title="Editar Equipo"
        fields={fieldsEditEquipo}
        initialValues={{
          codigo: selectedItem?.codigoEquipo ?? "",
          tipoEquipo: tipos.find((t) => t.label === selectedItem?.nombreEquipo)?.value ?? "",
          instalacion: instalaciones.find((i) => i.label === selectedItem?.nombreInstalacion)?.value ?? "",
        }}
        onSave={async (values) => {
          try {
            await apiCall(`/equipo/${selectedItem.idEquipo}`, {
              method: "PUT",
              body: JSON.stringify({
                codigo: values.codigo,
                tipoEquipo: { id: Number(values.tipoEquipo) },
                instalacion: { id: Number(values.instalacion) },
              }),
              credentials: "include",
            });
            toast({ title: "Equipo actualizado", status: "success", duration: 2000 });
            await fetchAll();
            modalEditEquipo.onClose();
            setSelectedItem(null);
          } catch (err: any) {
            toast({
              title: "Error al actualizar equipo",
              description: err.message,
              status: "error",
              duration: 4000,
            });
          }
        }}
      />
    </Stack>
  );
};

export default EquipoList;
