// src/components/UI/GenericModal.tsx
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
  SimpleGrid,
  Stack,
  FormHelperText,
  FormErrorMessage,
  Text,
  Flex,
  HStack,
  Box,
} from "@chakra-ui/react";
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
  // 👇 Agrega "textarea"
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
  // 👇 CAMBIO CLAVE: aceptar función para opciones dinámicas (retrocompatible)
  options?: FieldOption[] | ((values: Partial<T>) => FieldOption[]);
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  optionsEndpoint?: string;
  normalize?: boolean;
  normalization?: NormalizationSettings;
  validate?: (
    value: T[keyof T],
    values: Partial<T>,
  ) => string | null | undefined;
  format?: (value: string, values: Partial<T>) => string;
  helperText?: string;
}

interface GenericModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Partial<T>) => Promise<void | boolean>;
  title: string;
  fields: Field<T>[];
  initialValues?: Partial<T>;
  saveButtonText?: string;
  cancelButtonText?: string;
  children?: React.ReactNode;
  onValuesChange?: (values: Partial<T>) => void;
}

const GenericModal = <T extends Record<string, any>>({
  isOpen,
  onClose,
  onSave,
  title,
  fields,
  initialValues,
  saveButtonText = "Guardar",
  cancelButtonText = "Cancelar",
  onValuesChange,
}: GenericModalProps<T>) => {
  const toast = useToast();
  const [values, setValues] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { normalize } = useNormalizedInput();

  const fieldMap = useMemo(() => {
    const map = new Map<keyof T, Field<T>>();
    fields.forEach((field) => {
      map.set(field.name, field);
    });
    return map;
  }, [fields]);

  const defaultValues = useMemo(() => {
    const init: Partial<T> = {};
    fields.forEach((f) => {
      const fallback = f.type === "multiselect" ? [] : "";
      init[f.name] = (initialValues?.[f.name] ??
        f.value ??
        fallback) as T[keyof T];
    });
    return init;
  }, [fields, initialValues]);

  useEffect(() => {
    if (isOpen) {
      setValues(defaultValues);
      setErrors({});
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
          void _removed;
          return rest;
        }
        return prevErrors;
      }
      return { ...prevErrors, [key]: error };
    });
  }, []);

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => {
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

        onValuesChange?.(nextValues);
        return nextValues;
      });
    },
    [
      fieldMap,
      normalize,
      onValuesChange,
      shouldNormalizeField,
      updateFieldError,
      validateField,
    ],
  );

  const normalizeValues = useCallback(
    (currentValues: Partial<T>, mode: "change" | "submit") => {
      const next: Partial<T> = { ...currentValues };
      fields.forEach((field) => {
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
    [fields, normalize, shouldNormalizeField],
  );

  const normalizedValuesForSubmit = useMemo(
    () => normalizeValues(values, "submit"),
    [normalizeValues, values],
  );

  const hasEmptyRequired = useMemo(
    () =>
      fields.some(
        (field) =>
          field.required &&
          isValueEmpty(normalizedValuesForSubmit[field.name]),
      ),
    [fields, isValueEmpty, normalizedValuesForSubmit],
  );

  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0,
    [errors],
  );

  const isFormValid = !hasEmptyRequired && !hasErrors;

  const validateAll = useCallback(
    (currentValues: Partial<T>) => {
      let formIsValid = true;
      const collectedErrors: Record<string, string> = {};

      fields.forEach((field) => {
        const error = validateField(field, currentValues);
        if (error) {
          formIsValid = false;
          collectedErrors[String(field.name)] = error;
        }
      });

      setErrors(collectedErrors);
      return formIsValid;
    },
    [fields, validateField],
  );

  const handleSave = async () => {
    const normalized = normalizeValues(values, "submit");
    if (!validateAll(normalized)) {
      setValues(normalized);
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setValues(normalized);
    setIsSaving(true);
    try {
      const result = await onSave(normalized);
      if (result === false) {
        return;
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error?.message || "Ocurrió un error inesperado",
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
      setValues({});
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={!isSaving}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <SimpleGrid minChildWidth="240px" spacing={4}>
            {fields.map((field, index) => {
              // 👇 RESOLVER opciones: función o array
              const resolvedOptions =
                typeof field.options === "function"
                  ? field.options(values)
                  : (field.options ?? []);

              const helperText = field.helperText ?? field.placeholder;
              const fieldKey = String(field.name);
              const errorMessage = errors[fieldKey];

              const currentValue = values[field.name];
              const displayValue =
                typeof currentValue === "string"
                  ? currentValue
                  : currentValue ?? (field.type === "multiselect" ? [] : "");

              return (
                <FormControl
                  key={`${String(field.name)}-${index}`}
                  isRequired={field.required}
                  isDisabled={field.disabled}
                  isInvalid={Boolean(errorMessage)}
                >
                  <Stack spacing={2}>
                    <FormLabel mb={0}>{field.label}</FormLabel>

                    {field.type === "select" ? (
                      <Select
                        value={
                          (displayValue as string | number | undefined) ?? ""
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          const selected = resolvedOptions.find(
                            (opt) => String(opt.value) === rawValue,
                          );
                          handleChange(
                            field.name,
                            selected ? selected.value : rawValue,
                          );
                        }}
                        placeholder={field.placeholder || "Seleccionar"}
                        isDisabled={field.disabled}
                        size="md"
                        variant="outline"
                      >
                        {resolvedOptions.map((opt, optIndex) => (
                          <option
                            key={`${String(field.name)}-${String(opt.value)}-${optIndex}`}
                            value={opt.value}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    ) : field.type === "multiselect" ? (
                      <MultiSelect
                        // Comentario: reemplazo del <Select multiple> para cumplir requisitos de accesibilidad.
                        value={
                          Array.isArray(values[field.name])
                            ? (values[field.name] as Array<string | number>)
                            : []
                        }
                        options={resolvedOptions}
                        placeholder={field.placeholder}
                        onChange={(selected) =>
                          handleChange(field.name, selected)
                        }
                      />
                    ) : field.type === "textarea" ? (
                      <Textarea
                        value={values[field.name] ?? ""}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
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
                        value={(displayValue as string) ?? ""}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
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
        </ModalBody>

        <ModalFooter>
          <Flex w="100%" align="center" justify="space-between" gap={4}>
            {isSaving ? (
              <Text fontSize="sm" color="neutral.500">
                Guardando cambios...
              </Text>
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

export default GenericModal;
