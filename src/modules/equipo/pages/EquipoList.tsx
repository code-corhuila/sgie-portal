// src/modules/equipo/pages/EquipoList.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  useDisclosure,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal, {
  type Field,
  type FieldOption,
} from "../../../components/UI/GenericModal";
import { useEquipos } from "../hooks/userEquipo";
import { apiCall } from "../../../api/base";

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
  const columns: Column<any>[] = useMemo(
    () => [
      { key: "codigoEquipo", label: "Código" },
      { key: "nombreEquipo", label: "Tipo de Equipo" },
      { key: "nombreInstalacion", label: "Instalación" },
      { key: "nombreCampus", label: "Campus" },
      {
        key: "estadoEquipo",
        label: "Estado",
        render: (e) =>
          e.estadoEquipo ? (
            <Box color="green.500" fontWeight="bold">
              Activo
            </Box>
          ) : (
            <Box color="red.500" fontWeight="bold">
              Inactivo
            </Box>
          ),
      },
      {
        key: "actions",
        label: "Acciones",
        render: (item) => (
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme={item.estadoEquipo ? "red" : "green"}
              variant="outline"
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
            >
              {item.estadoEquipo ? "Inhabilitar" : "Habilitar"}
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={async () => {
                await Promise.all([loadTipos(), loadInstalaciones()]);
                setSelectedItem(item);
                modalEditEquipo.onOpen();
              }}
            >
              Editar
            </Button>
          </HStack>
        ),
      },
    ],
    [cambiarEstado, fetchAll]
  );

  // ===============================
  // 📥 Cargar opciones para selects
  // ===============================
  const loadCategorias = async () => {
    try {
      const res = await apiCall("/categoria-equipo", { credentials: "include" });
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setCategorias(items.map((c: any) => ({ value: c.id, label: c.nombre })));
    } catch (err) {
      toast({ title: "Error cargando categorías", status: "error", duration: 3000 });
    }
  };

  const loadTipos = async () => {
    try {
      const res = await apiCall("/tipo-equipo", { credentials: "include" });
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setTipos(items.map((t: any) => ({ value: t.id, label: t.nombre })));
    } catch (err) {
      toast({ title: "Error cargando tipos", status: "error", duration: 3000 });
    }
  };

  const loadInstalaciones = async () => {
    try {
      const res = await apiCall("/instalacion", { credentials: "include" });
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setInstalaciones(items.map((i: any) => ({ value: i.id, label: i.nombre })));
    } catch (err) {
      toast({ title: "Error cargando instalaciones", status: "error", duration: 3000 });
    }
  };

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
    <Box p={4}>
      <Heading size="lg" mb={4}>Gestión de Equipos</Heading>

      <HStack mb={4}>
        <Input
          placeholder="Buscar por código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchByCodigo(codigo)}
        />
        <Button colorScheme="blue" onClick={() => fetchByCodigo(codigo)}>Buscar</Button>
        <Button variant="outline" onClick={fetchAll}>Actualizar</Button>
      </HStack>

      <HStack mb={5} spacing={3}>
        <Button colorScheme="teal" onClick={modalCategoria.onOpen}>Crear Categoría Equipo</Button>
        <Button colorScheme="blue" onClick={handleOpenTipo}>Crear Tipo Equipo</Button>
        <Button colorScheme="green" onClick={handleOpenEquipo}>Crear Equipo</Button>
      </HStack>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(e) => e.codigoEquipo}
          emptyMessage="No hay equipos registrados"
        />
      )}

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
    </Box>
  );
};

export default EquipoList;