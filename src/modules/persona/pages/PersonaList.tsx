// PersonasList.tsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal, { type Field } from "../../../components/UI/GenericModal";
import SearchableFormModal, {
  type SearchConfig,
  type SearchResultField,
} from "../../../components/UI/SearchableFormModal";
import { usePersonas } from "../hooks/usePersona";
import { apiCall } from "../../../api/base";

interface Rol {
  id: number;
  nombre: string;
}

interface UsuarioForm {
  email: string;
  password: string;
}

const PersonasList: React.FC = () => {
  const toast = useToast();
  const {
    data,
    loading,
    error,
    fetchAll,
    fetchPersonaByDocumento,
    createPersona,
    cambiarEstado,
  } = usePersonas();

  const personaModal = useDisclosure();
  const usuarioModal = useDisclosure();
  const editPersonaModal = useDisclosure();
  const editUsuarioModal = useDisclosure();

  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [numeroDoc, setNumeroDoc] = useState("");

  const fetchRoles = async () => {
    try {
      const res = await apiCall<{ data: Rol[] }>("/rol", {
        credentials: "include",
      });
      setRoles(res.data);
    } catch (err) {
      console.error("Error cargando roles", err);
    }
  };

  const columns: Column<any>[] = useMemo(
    () => [
      { key: "idPersona", label: "ID" },
      { key: "nombres", label: "Nombres" },
      { key: "apellidos", label: "Apellidos" },
      { key: "tipoDocumento", label: "Tipo Doc" },
      { key: "numeroIdentificacion", label: "Documento" },
      { key: "email", label: "Correo", render: (p) => p.email ?? "—" },
      { key: "rol", label: "Rol", render: (p) => typeof p.rol === "string" ? p.rol : p.rol?.nombre ?? "—" },
      {
        key: "estado",
        label: "Estado",
        render: (p) => (
          <Box
            as="span"
            px={2}
            py={1}
            borderRadius="md"
            bg={p.estado ? "green.100" : "red.100"}
            color={p.estado ? "green.800" : "red.800"}
            fontSize="sm"
            fontWeight="medium"
          >
            {p.estado ? "Activo" : "Inactivo"}
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
              colorScheme={item.estado ? "red" : "green"}
              variant="outline"
              onClick={async () => {
                try {
                  await cambiarEstado(item.idPersona); // 👈 Llama al hook
                  await fetchAll(); // 👈 Refresca la tabla
                  toast({
                    title: `Persona ${item.estado ? "inhabilitada" : "habilitada"} correctamente`,
                    status: "success",
                    duration: 2000,
                  });
                } catch (err: any) {
                  console.error("Error cambiando estado persona:", err);
                  toast({
                    title: "Error",
                    description: err?.message ?? "No se pudo cambiar el estado",
                    status: "error",
                    duration: 4000,
                  });
                }
              }}
            >
              {item.estado ? "Inhabilitar" : "Habilitar"}
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={async () => {
                await fetchRoles();
                setSelectedItem(item);
                editPersonaModal.onOpen();
              }}
            >
              Editar Persona
            </Button>
            {item.idUsuario && (
              <Button
                size="sm"
                colorScheme="purple"
                onClick={() => {
                  setSelectedItem(item);
                  editUsuarioModal.onOpen();
                }}
              >
                Editar Usuario
              </Button>
            )}
          </HStack>
        ),
      },
    ],
    [cambiarEstado, editPersonaModal, editUsuarioModal, fetchRoles]
  );

  // Campos para crear persona (sin valores iniciales)
  const createPersonaFields: Field<any>[] = useMemo(
    () => [
      { name: "nombres", label: "Nombres", type: "text", required: true },
      { name: "apellidos", label: "Apellidos", type: "text", required: true },
      {
        name: "tipoDocumento",
        label: "Tipo Documento",
        type: "text",
        required: true,
      },
      {
        name: "numeroIdentificacion",
        label: "Número Documento",
        type: "text",
        required: true,
      },
      {
        name: "telefonoMovil",
        label: "Teléfono",
        type: "text",
        required: true,
      },
      {
        name: "rol",
        label: "Rol",
        type: "select",
        options: roles.map((r) => ({ value: r.id, label: r.nombre })),
        required: true,
      },
    ],
    [roles]
  );

  // Campos para editar persona (CON valores iniciales)
  const editPersonaFields: Field<any>[] = useMemo(
    () => [
      {
        name: "nombres",
        label: "Nombres",
        type: "text",
        required: true,
      },
      {
        name: "apellidos",
        label: "Apellidos",
        type: "text",
        required: true,
      },
      {
        name: "tipoDocumento",
        label: "Tipo Documento",
        type: "text",
        required: true,
      },
      {
        name: "numeroIdentificacion",
        label: "Número Documento",
        type: "text",
        required: true,
      },
      {
        name: "telefonoMovil",
        label: "Teléfono",
        type: "text",
        required: true,
      },
      {
        name: "rol",
        label: "Rol",
        type: "select",
        options: roles.map((r) => ({ value: r.id, label: r.nombre })),
        required: true,
      },
    ],
    [roles]
  );

  // Campos para editar usuario
  const usuarioEditFields: Field<UsuarioForm>[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "usuario@ejemplo.com",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      required: false,
      placeholder: "Dejar vacío para mantener actual",
    },
  ];

  // Campos para crear usuario
  const usuarioCreateFields: Field<UsuarioForm>[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "usuario@ejemplo.com",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      required: true,
      placeholder: "Mínimo 8 caracteres",
    },
  ];

  const searchResultFields: SearchResultField<any>[] = [
    { key: "numeroIdentificacion", label: "Cédula" },
    { key: "nombres", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "email", label: "Email" },
  ];

  const searchConfig: SearchConfig<any> = {
    searchPlaceholder: "Ingresa número de cédula",
    searchButtonText: "Buscar Persona",
    onSearch: async (cedula: string) => {
      try {
        const response = await apiCall<any[]>(
          `/persona/persona-usuario?numeroIdentificacion=${cedula}`,
          { credentials: "include" }
        );
        return response && response.length > 0 ? response[0] : null;
      } catch {
        return null;
      }
    },
    resultFields: searchResultFields,
    idField: "idPersona",
    emptyMessage: "No se encontró ninguna persona con esa cédula",
  };

  const handleSavePersona = async (values: any) => {
    try {
      await createPersona({
        ...values,
        rol: { id: Number(values.rol) },
      });
      personaModal.onClose();
    } catch (err: any) {
      toast({
        title: "Error al crear persona",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleEditPersona = async (values: any) => {
    if (!selectedItem?.idPersona) return;

    try {
      // Construir el payload con TODOS los campos
      const payload = {
        nombres: values.nombres,
        apellidos: values.apellidos,
        tipoDocumento: values.tipoDocumento,
        numeroIdentificacion: values.numeroIdentificacion,
        telefonoMovil: values.telefonoMovil,
        rol: { id: Number(values.rol) },
      };

      console.log("Enviando actualización persona:", payload);

      await apiCall(`/persona/${selectedItem.idPersona}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        credentials: "include",
      });

      toast({
        title: "Persona actualizada",
        status: "success",
        duration: 2000,
      });

      await fetchAll();
      editPersonaModal.onClose();
      setSelectedItem(null);
    } catch (err: any) {
      toast({
        title: "Error al actualizar persona",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleEditUsuario = async (values: any) => {
    if (!selectedItem?.idUsuario) return;

    try {
      // Si no se ingresó contraseña, no la enviamos
      const payload: any = {
        email: values.email,
        persona: { id: selectedItem.idPersona }, // 👈 AÑADIDO
      };
      if (values.password && values.password.trim() !== "") {
        payload.password = values.password;
      }

      console.log("Enviando actualización usuario:", payload);

      await apiCall(`/usuario/${selectedItem.idUsuario}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        credentials: "include",
      });

      toast({
        title: "Usuario actualizado",
        status: "success",
        duration: 2000,
      });

      await fetchAll();
      editUsuarioModal.onClose();
      setSelectedItem(null);
    } catch (err: any) {
      toast({
        title: "Error al actualizar usuario",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleSaveUsuario = async (
    values: Partial<UsuarioForm>,
    personaId: number | null
  ) => {
    if (!personaId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una persona primero",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await apiCall("/usuario", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          persona: { id: personaId },
        }),
        credentials: "include",
      });

      toast({
        title: "Usuario creado",
        status: "success",
        duration: 2000,
      });

      await fetchAll();
      usuarioModal.onClose();
    } catch (err: any) {
      toast({
        title: "Error al crear usuario",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleCloseEditPersona = () => {
    editPersonaModal.onClose();
    setSelectedItem(null);
  };

  const handleCloseEditUsuario = () => {
    editUsuarioModal.onClose();
    setSelectedItem(null);
  };

  return (
    <Box p={4} w="100%" maxW="100%">
      <Heading size="lg" mb={4}>
        Gestión de Personas
      </Heading>

      <HStack mb={4} spacing={2}>
        <Input
          placeholder="Número de documento"
          value={numeroDoc}
          onChange={(e) => setNumeroDoc(e.target.value)}
          onKeyPress={(e) =>
            e.key === "Enter" && fetchPersonaByDocumento(numeroDoc)
          }
        />
        <Button
          colorScheme="blue"
          onClick={() => fetchPersonaByDocumento(numeroDoc)}
        >
          Buscar
        </Button>
      </HStack>

      <HStack mb={4} spacing={2} flexWrap="wrap">
        <Button
          colorScheme="green"
          onClick={async () => {
            await fetchRoles();
            setSelectedItem(null);
            personaModal.onOpen();
          }}
        >
          Crear Persona
        </Button>
        <Button colorScheme="purple" onClick={usuarioModal.onOpen}>
          Crear Usuario
        </Button>
        <Button variant="outline" onClick={fetchAll} isLoading={loading}>
          Actualizar
        </Button>
      </HStack>

      <DataTable
        data={data ?? []}
        columns={columns}
        loading={loading}
        error={error}
        keyExtractor={(p) => p?.idPersona?.toString() ?? `item-${Math.random()}`}
        emptyMessage="No hay personas registradas"
      />

      {/* Modal Crear Persona */}
      <GenericModal
        isOpen={personaModal.isOpen}
        onClose={() => {
          personaModal.onClose();
          setSelectedItem(null);
        }}
        title="Crear Persona"
        fields={createPersonaFields}
        onSave={handleSavePersona}
      />

      {/* Modal Editar Persona */}
      <GenericModal
        key={`edit-persona-${selectedItem?.idPersona ?? "new"}`}
        isOpen={editPersonaModal.isOpen}
        onClose={handleCloseEditPersona}
        title="Editar Persona"
        fields={editPersonaFields}
        initialValues={
          selectedItem
            ? {
                nombres: selectedItem.nombres,
                apellidos: selectedItem.apellidos,
                tipoDocumento: selectedItem.tipoDocumento,
                numeroIdentificacion: selectedItem.numeroIdentificacion,
                telefonoMovil: selectedItem.telefonoMovil,
                rol: roles.find((r) => r.nombre === selectedItem.rol)?.id ?? "",
              }
            : undefined
        }
        onSave={handleEditPersona}
      />

      {/* Modal Editar Usuario */}
      <GenericModal
        key={`edit-usuario-${selectedItem?.idUsuario ?? "new"}`}
        isOpen={editUsuarioModal.isOpen}
        onClose={handleCloseEditUsuario}
        title="Editar Usuario"
        fields={usuarioEditFields}
        initialValues={
          selectedItem
            ? {
                email: selectedItem.email ?? "",
                password: "",
              }
            : undefined
        }
        onSave={handleEditUsuario}
      />

      {/* Modal Crear Usuario con Búsqueda */}
      <SearchableFormModal<UsuarioForm, any>
        isOpen={usuarioModal.isOpen}
        onClose={usuarioModal.onClose}
        title="Crear Usuario"
        formFields={usuarioCreateFields}
        searchConfig={searchConfig}
        onSave={handleSaveUsuario}
      />
    </Box>
  );
};

export default PersonasList;