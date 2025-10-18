// SearchableFormModal.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
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
  FormErrorMessage,
  Divider,
  Flex,
  Skeleton,
  Icon,
  SlideFade,
  Spinner,
} from "@chakra-ui/react";
import { FiInfo, FiSearch } from "react-icons/fi";
import { MultiSelect } from "./MultiSelect";
import {
  useNormalizedInput,
  type NormalizationSettings,
} from "../../hooks/useNormalizedInput";

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface Field<T = any> {
  name: keyof T;
  label: string;
  type:
    | "text"
    | "select"
    | "multiselect"
    | "number"
    | "email"
    | "password"
    | "date"
    | "textarea";
  value?: T[keyof T];
  options?: FieldOption[] | ((values: Partial<T>) => FieldOption[]);
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  normalize?: boolean;
  normalization?: NormalizationSettings;
  validate?: (
    value: T[keyof T],
    values: Partial<T>,
  ) => string | null | undefined;
  format?: (value: string, values: Partial<T>) => string;
  helperText?: string;
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

const SearchableFormModal = <
  T extends Record<string, any>,
  S extends Record<string, any>,
>({
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
  const { normalize } = useNormalizedInput();
  const [formValues, setFormValues] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Estados para búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<S | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [capturedId, setCapturedId] = useState<number | null>(null);

  const fieldMap = useMemo(() => {
    const map = new Map<keyof T, Field<T>>();
    formFields.forEach((field) => {
      map.set(field.name, field);
    });
    return map;
  }, [formFields]);

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
      setErrors({});
      setSearchQuery("");
      setSearchResult(null);
      setCapturedId(null);
    }
  }, [isOpen, defaultValues]);

  const shouldNormalizeField = useCallback(
    (field: Field<T>) => field.normalize ?? field.type === "text",
    [],
  );

  const isValueEmpty = useCallback((value: any) => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }, []);

  const validateField = useCallback(
    (field: Field<T>, currentValues: Partial<T>) => {
      const rawValue = currentValues[field.name];
      let valueForValidation: unknown = rawValue;

      if (typeof rawValue === "string") {
        if (shouldNormalizeField(field)) {
          valueForValidation = normalize(
            rawValue,
            "submit",
            field.normalization,
          );
        } else {
          valueForValidation = rawValue.trim();
        }
      }

      if (field.required && isValueEmpty(valueForValidation)) {
        return "Este campo es obligatorio";
      }

  if (field.validate) {
        const validationResult = field.validate(
          valueForValidation as T[keyof T],
          {
            ...currentValues,
            [field.name]: valueForValidation as T[keyof T],
          },
        );
        if (
          typeof validationResult === "string" &&
          validationResult.trim().length > 0
        ) {
          return validationResult;
        }
      }

      return null;
    },
    [isValueEmpty, normalize, shouldNormalizeField],
  );

  const updateFieldError = useCallback((fieldName: keyof T, error: string | null) => {
    const key = String(fieldName);
    setErrors((prevErrors) => {
      if (!error) {
        if (prevErrors[key]) {
          const { [key]: _removed, ...rest } = prevErrors;
          return rest;
        }
        return prevErrors;
      }
      return { ...prevErrors, [key]: error };
    });
  }, []);

  const handleFormChange = useCallback(
    (name: keyof T, value: any) => {
      setFormValues((prev) => {
        const field = fieldMap.get(name);
        const nextValues = { ...prev };

        let nextValue = value;
        if (field) {
          if (typeof value === "string" && field.format) {
            nextValue = field.format(value, prev);
          }
          if (
            typeof nextValue === "string" &&
            shouldNormalizeField(field)
          ) {
            nextValue = normalize(
              nextValue,
              "change",
              field.normalization,
            );
          }
        }

        nextValues[name] = nextValue;

        if (field) {
          const error = validateField(field, nextValues);
          updateFieldError(name, error);
        }

        return nextValues;
      });
    },
    [fieldMap, normalize, shouldNormalizeField, updateFieldError, validateField],
  );

  const normalizeValues = useCallback(
    (currentValues: Partial<T>, mode: "change" | "submit") => {
      const next: Partial<T> = { ...currentValues };
      formFields.forEach((field) => {
        const currentValue = next[field.name];
        if (typeof currentValue !== "string") {
          return;
        }

        if (shouldNormalizeField(field)) {
          next[field.name] = normalize(
            currentValue,
            mode,
            field.normalization,
          ) as T[keyof T];
        } else if (mode === "submit") {
          next[field.name] = currentValue.trim() as T[keyof T];
        }
      });
      return next;
    },
    [formFields, normalize, shouldNormalizeField],
  );

  const normalizedFormValues = useMemo(
    () => normalizeValues(formValues, "submit"),
    [formValues, normalizeValues],
  );

  const hasEmptyRequired = useMemo(
    () =>
      formFields.some(
        (field) =>
          field.required &&
          isValueEmpty(normalizedFormValues[field.name]),
      ),
    [formFields, isValueEmpty, normalizedFormValues],
  );

  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0,
    [errors],
  );

  const formFieldsValid = !hasEmptyRequired && !hasErrors;

  const isFormValid = useMemo(
    () => (!searchConfig || !!capturedId) && formFieldsValid,
    [capturedId, formFieldsValid, searchConfig],
  );

  const validateAll = useCallback(
    (currentValues: Partial<T>) => {
      let formIsValid = true;
      const collectedErrors: Record<string, string> = {};

      formFields.forEach((field) => {
        const error = validateField(field, currentValues);
        if (error) {
          formIsValid = false;
          collectedErrors[String(field.name)] = error;
        }
      });

      setErrors(collectedErrors);
      return formIsValid;
    },
    [formFields, validateField],
  );

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

  const handleSave = async () => {
    if (searchConfig && !capturedId) {
      toast({
        title: "Campos requeridos",
        description: "Debes buscar y seleccionar un registro primero",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const normalized = normalizeValues(formValues, "submit");

    if (!validateAll(normalized)) {
      setFormValues(normalized);
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setFormValues(normalized);
    setIsSaving(true);
    try {
      await onSave(normalized, capturedId);
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
      setErrors({});
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
                      placeholder={
                        searchConfig.searchPlaceholder || "Buscar..."
                      }
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
                            <Text
                              fontSize="xs"
                              textTransform="uppercase"
                              color="neutral.500"
                              fontWeight="semibold"
                            >
                              {field.label}
                            </Text>
                            <Text fontSize="sm" color="neutral.800">
                              {field.render
                                ? field.render(
                                    searchResult[field.key],
                                    searchResult,
                                  )
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
                    {searchConfig.emptyMessage ||
                      "No se encontraron resultados"}
                  </Text>
                )}
              </Stack>
            )}

            {/* Sección de Formulario */}
            <Stack spacing={4}>
              <SimpleGrid minChildWidth="240px" spacing={4}>
                {formFields.map((field) => {
                  const fieldKey = String(field.name);
                  const helperText = field.helperText ?? field.placeholder;
                  const errorMessage = errors[fieldKey];
                  const currentValue = formValues[field.name];

                  return (
                    <FormControl
                      key={fieldKey}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={Boolean(errorMessage)}
                    >
                      <Stack spacing={2}>
                        <FormLabel fontSize="sm" mb={0}>
                          {field.label}
                        </FormLabel>

                        {field.type === "select" ||
                        field.type === "multiselect" ? (
                          (() => {
                            const optionList =
                              typeof field.options === "function"
                                ? field.options(formValues)
                                : (field.options ?? []);
                            const isMulti = field.type === "multiselect";
                            return isMulti ? (
                              <MultiSelect
                                value={
                                  Array.isArray(currentValue)
                                    ? (currentValue as Array<string | number>)
                                    : []
                                }
                                options={optionList}
                                placeholder={field.placeholder}
                                onChange={(selected) =>
                                  handleFormChange(field.name, selected)
                                }
                              />
                            ) : (
                              <Select
                                value={
                                  (currentValue as string | number | undefined) ??
                                  ""
                                }
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  const selectedOption = optionList?.find(
                                    (opt) => String(opt.value) === rawValue,
                                  );
                                  handleFormChange(
                                    field.name,
                                    selectedOption
                                      ? selectedOption.value
                                      : rawValue,
                                  );
                                }}
                                placeholder={field.placeholder || "Seleccionar"}
                                isDisabled={field.disabled}
                                size="md"
                                variant="outline"
                              >
                                {optionList?.map((opt) => (
                                  <option
                                    key={`${String(opt.value)}`}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </Select>
                            );
                          })()
                        ) : field.type === "textarea" ? (
                          <Textarea
                            value={
                              typeof currentValue === "string"
                                ? currentValue
                                : ""
                            }
                            onChange={(e) =>
                              handleFormChange(field.name, e.target.value)
                            }
                            placeholder={field.placeholder}
                            isDisabled={field.disabled}
                            size="md"
                            variant="outline"
                            rows={4}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={
                              typeof currentValue === "number"
                                ? currentValue
                                : (currentValue as string) ?? ""
                            }
                            onChange={(e) =>
                              handleFormChange(field.name, e.target.value)
                            }
                            placeholder={field.placeholder}
                            isDisabled={field.disabled}
                            size="md"
                            variant="outline"
                          />
                        )}

                        {errorMessage && (
                          <FormErrorMessage>{errorMessage}</FormErrorMessage>
                        )}

                        {helperText && (
                          <FormHelperText color="neutral.500" mt={0}>
                            {helperText}
                          </FormHelperText>
                        )}
                      </Stack>
                    </FormControl>
                  );
                })}
              </SimpleGrid>

              {searchConfig && (
                <HStack spacing={2} color="neutral.500" fontSize="sm">
                  <Icon as={FiInfo} />
                  <Text>
                    Debes seleccionar un registro válido para habilitar el
                    guardado.
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
              <Button
                variant="ghost"
                onClick={handleClose}
                isDisabled={isSaving}
              >
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
