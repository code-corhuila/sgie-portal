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
  Textarea,
  useToast,
  HStack,
  InputGroup,
  InputLeftElement,
  Box,
  Text,
  Badge,
  SimpleGrid,
  Stack,
  FormHelperText,
  Divider,
  Flex,
  Skeleton,
  Icon,
  SlideFade,
  Spinner,
} from "@chakra-ui/react";
import { FiInfo, FiSearch } from "react-icons/fi";

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface Field<T = any> {
  name: keyof T;
  label: string;
  type: "text" | "select" | "multiselect" | "number" | "email" | "password" | "date" | "textarea";
  value?: T[keyof T];
  options?: FieldOption[] | ((values: Partial<T>) => FieldOption[]);
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
          <Stack spacing={6}>
            {/* Sección de Búsqueda */}
            {searchConfig && (
              <Stack
                spacing={4}
                p={4}
                borderWidth="1px"
                borderColor="neutral.100"
                borderRadius="2xl"
                bg="white"
                boxShadow="sm"
              >
                <Flex
                  direction={{ base: "column", md: "row" }}
                  align={{ base: "stretch", md: "center" }}
                  gap={4}
                >
                  <InputGroup maxW="100%">
                    <InputLeftElement pointerEvents="none" color="neutral.400">
                      <FiSearch />
                    </InputLeftElement>
                    <Input
                      placeholder={searchConfig.searchPlaceholder || "Buscar..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      size="md"
                      variant="outline"
                    />
                  </InputGroup>
                  <Button
                    onClick={handleSearch}
                    isLoading={isSearching}
                    minW={{ base: "100%", md: "140px" }}
                    colorScheme="brand"
                  >
                    {searchConfig.searchButtonText || "Buscar"}
                  </Button>
                </Flex>

                <Divider />

                {isSearching && (
                  <Stack spacing={3}>
                    <Skeleton height="56px" borderRadius="xl" />
                    <Skeleton height="56px" borderRadius="xl" />
                  </Stack>
                )}

                {!isSearching && searchResult && (
                  <SlideFade in offsetY={12}>
                    <Stack
                      spacing={3}
                      borderWidth="1px"
                      borderColor="brand.100"
                      borderRadius="xl"
                      bg="brand.50"
                      p={4}
                    >
                      <HStack justify="space-between" align="center">
                        <HStack spacing={3}>
                          <Icon as={FiInfo} color="brand.700" />
                          <Text fontWeight="semibold" color="brand.700">
                            Registro encontrado
                          </Text>
                        </HStack>
                        <Badge variant="success">ID: {capturedId}</Badge>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {searchConfig.resultFields.map((field) => (
                          <Stack
                            key={String(field.key)}
                            spacing={0}
                            borderRadius="lg"
                            bg="whiteAlpha.700"
                            p={2}
                          >
                            <Text fontSize="xs" textTransform="uppercase" color="neutral.500" fontWeight="semibold">
                              {field.label}
                            </Text>
                            <Text fontSize="sm" color="neutral.800">
                              {field.render
                                ? field.render(searchResult[field.key], searchResult)
                                : String(searchResult[field.key] || "")}
                            </Text>
                          </Stack>
                        ))}
                      </SimpleGrid>
                    </Stack>
                  </SlideFade>
                )}

                {!isSearching && searchQuery && !searchResult && (
                  <Text color="neutral.500" fontSize="sm">
                    {searchConfig.emptyMessage || "No se encontraron resultados"}
                  </Text>
                )}
              </Stack>
            )}

            {/* Sección de Formulario */}
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {formFields.map((field) => (
                  <FormControl
                    key={String(field.name)}
                    isRequired={field.required}
                    isDisabled={field.disabled}
                  >
                    <Stack spacing={2}>
                      <FormLabel fontSize="sm" mb={0}>
                        {field.label}
                      </FormLabel>

                      {field.type === "select" || field.type === "multiselect" ? (
                        (() => {
                          const optionList = typeof field.options === "function"
                            ? field.options(formValues)
                            : field.options ?? [];
                          const isMulti = field.type === "multiselect";
                          const currentValue = formValues[field.name];
                          return (
                        <Select
                          multiple={isMulti}
                          value={
                            isMulti
                              ? Array.isArray(currentValue)
                                ? currentValue.map(String)
                                : []
                              : (currentValue as string | number | undefined) ?? ""
                          }
                          onChange={(e) => {
                            if (isMulti) {
                              const selectedValues = Array.from(e.target.selectedOptions).map((option) => {
                                const matched = optionList.find((opt) => String(opt.value) === option.value);
                                return matched ? matched.value : option.value;
                              });
                              handleFormChange(field.name, selectedValues);
                              return;
                            }
                            const rawValue = e.target.value;
                            const selectedOption = optionList?.find(
                              (opt) => String(opt.value) === rawValue
                            );
                            handleFormChange(
                              field.name,
                              selectedOption ? selectedOption.value : rawValue
                            );
                          }}
                          placeholder={field.placeholder || "Seleccionar"}
                          isDisabled={field.disabled}
                          size="md"
                          variant="outline"
                        >
                          {optionList?.map((opt) => (
                            <option key={`${String(opt.value)}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                          );
                        })()
                      ) : field.type === "textarea" ? (
                        <Textarea
                          value={formValues[field.name] ?? ""}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          isDisabled={field.disabled}
                          size="md"
                          variant="outline"
                          rows={4}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          value={formValues[field.name] ?? ""}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          isDisabled={field.disabled}
                          size="md"
                          variant="outline"
                        />
                      )}

                      {field.placeholder && (
                        <FormHelperText color="neutral.500" mt={0}>
                          {field.placeholder}
                        </FormHelperText>
                      )}
                    </Stack>
                  </FormControl>
                ))}
              </SimpleGrid>

              {searchConfig && (
                <HStack spacing={2} color="neutral.500" fontSize="sm">
                  <Icon as={FiInfo} />
                  <Text>
                    Debes seleccionar un registro válido para habilitar el guardado.
                  </Text>
                </HStack>
              )}
            </Stack>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Flex w="100%" align="center" justify="space-between" gap={4}>
            {isSaving ? (
              <HStack spacing={2} color="neutral.500">
                <Spinner size="sm" />
                <Text fontSize="sm">Guardando información...</Text>
              </HStack>
            ) : (
              <Box />
            )}
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleClose} isDisabled={isSaving}>
                {cancelButtonText}
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleSave}
                isLoading={isSaving}
                isDisabled={!isFormValid}
              >
                {saveButtonText}
              </Button>
            </HStack>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SearchableFormModal;
