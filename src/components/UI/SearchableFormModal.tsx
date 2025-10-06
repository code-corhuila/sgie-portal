// SearchableFormModal.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  VStack,
  HStack,
  Box,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  Badge,
} from "@chakra-ui/react";

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface Field<T = any> {
  name: keyof T;
  label: string;
  type: "text" | "select" | "number" | "email" | "password" | "date";
  value?: T[keyof T];
  options?: FieldOption[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface SearchResultField<S = any> {
  key: keyof S;
  label: string;
  render?: (value: any, item: S) => React.ReactNode;
}

export interface SearchConfig<S = any> {
  searchPlaceholder?: string;
  searchButtonText?: string;
  onSearch: (query: string) => Promise<S | null>;
  resultFields: SearchResultField<S>[];
  idField: keyof S; // Campo que contiene el ID a capturar
  emptyMessage?: string;
}

interface SearchableFormModalProps<T = any, S = any> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Partial<T>, searchedId: number | null) => Promise<void>;
  title: string;
  formFields: Field<T>[];
  searchConfig?: SearchConfig<S>;
  initialValues?: Partial<T>;
  saveButtonText?: string;
  cancelButtonText?: string;
}

const SearchableFormModal = <T extends Record<string, any>, S extends Record<string, any>>({
  isOpen,
  onClose,
  onSave,
  title,
  formFields,
  searchConfig,
  initialValues,
  saveButtonText = "Guardar",
  cancelButtonText = "Cancelar",
}: SearchableFormModalProps<T, S>) => {
  const toast = useToast();
  const [formValues, setFormValues] = useState<Partial<T>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<S | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [capturedId, setCapturedId] = useState<number | null>(null);

  const defaultValues = useMemo(() => {
    const init: Partial<T> = {};
    formFields.forEach((f) => {
      init[f.name] = (initialValues?.[f.name] ?? f.value ?? "") as T[keyof T];
    });
    return init;
  }, [formFields, initialValues]);

  useEffect(() => {
    if (isOpen) {
      setFormValues(defaultValues);
      setSearchQuery("");
      setSearchResult(null);
      setCapturedId(null);
    }
  }, [isOpen, defaultValues]);

  const handleFormChange = (name: keyof T, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!searchConfig || !searchQuery.trim()) {
      toast({
        title: "Ingresa un término de búsqueda",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setCapturedId(null);
    
    try {
      const result = await searchConfig.onSearch(searchQuery);
      
      if (result) {
        setSearchResult(result);
        // Capturar el ID del campo especificado
        const id = result[searchConfig.idField] as number;
        setCapturedId(id);
        
        toast({
          title: "Registro encontrado",
          status: "success",
          duration: 2000,
        });
      } else {
        toast({
          title: "No se encontraron resultados",
          status: "info",
          duration: 2000,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error en la búsqueda",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const isFormValid = useMemo(() => {
    // Validar que se haya buscado y encontrado un registro (si hay searchConfig)
    if (searchConfig && !capturedId) {
      return false;
    }
    
    // Validar campos requeridos del formulario
    return formFields.every((field) => {
      if (field.required) {
        const value = formValues[field.name];
        return value !== undefined && value !== null && value !== "";
      }
      return true;
    });
  }, [formFields, formValues, searchConfig, capturedId]);

  const handleSave = async () => {
    if (!isFormValid) {
      toast({
        title: "Campos requeridos",
        description: searchConfig && !capturedId 
          ? "Debes buscar y seleccionar un registro primero"
          : "Por favor completa todos los campos obligatorios",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formValues, capturedId);
      toast({
        title: "Guardado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "Ocurrió un error inesperado",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setFormValues({});
      setSearchQuery("");
      setSearchResult(null);
      setCapturedId(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      closeOnOverlayClick={!isSaving}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Sección de Búsqueda */}
            {searchConfig && (
              <Box>
                <HStack mb={2}>
                  <Input
                    placeholder={searchConfig.searchPlaceholder || "Buscar..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    flex={1}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleSearch}
                    isLoading={isSearching}
                    minW="100px"
                  >
                    {searchConfig.searchButtonText || "Buscar"}
                  </Button>
                </HStack>

                {/* Resultado de Búsqueda - Mini Tabla */}
                {searchResult && (
                  <Box 
                    borderWidth={1} 
                    borderRadius="md" 
                    p={3} 
                    bg="gray.50"
                    mt={2}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" fontSize="sm">Registro Encontrado</Text>
                      <Badge colorScheme="green">ID: {capturedId}</Badge>
                    </HStack>
                    
                    <Table size="sm" variant="simple">
                      <Tbody>
                        {searchConfig.resultFields.map((field) => (
                          <Tr key={String(field.key)}>
                            <Td fontWeight="medium" width="40%">{field.label}</Td>
                            <Td>
                              {field.render 
                                ? field.render(searchResult[field.key], searchResult)
                                : String(searchResult[field.key] || "")}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}

                {searchQuery && !searchResult && !isSearching && (
                  <Text color="gray.500" fontSize="sm" mt={2}>
                    {searchConfig.emptyMessage || "No se encontraron resultados"}
                  </Text>
                )}
              </Box>
            )}

            {/* Sección de Formulario */}
            <Box pt={searchConfig ? 2 : 0}>
              {formFields.map((field) => (
                <FormControl
                  mb={3}
                  key={String(field.name)}
                  isRequired={field.required}
                  isDisabled={field.disabled}
                >
                  <FormLabel fontSize="sm">{field.label}</FormLabel>

                  {field.type === "select" ? (
                    <Select
                      value={formValues[field.name] ?? ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const selectedOption = field.options?.find(
                          (opt) => String(opt.value) === rawValue
                        );
                        handleFormChange(
                          field.name,
                          selectedOption ? selectedOption.value : rawValue
                        );
                      }}
                      placeholder={field.placeholder || "Seleccionar"}
                      isDisabled={field.disabled}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      value={formValues[field.name] ?? ""}
                      onChange={(e) => handleFormChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      isDisabled={field.disabled}
                    />
                  )}
                </FormControl>
              ))}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={!isFormValid}
          >
            {saveButtonText}
          </Button>
          <Button onClick={handleClose} isDisabled={isSaving}>
            {cancelButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SearchableFormModal;