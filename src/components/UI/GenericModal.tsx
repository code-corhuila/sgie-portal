// src/components/UI/GenericModal.tsx
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
  SimpleGrid,
  Stack,
  FormHelperText,
  Text,
  Flex,
  HStack,
  Box,
} from "@chakra-ui/react";
import { MultiSelect } from "./MultiSelect";

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
}

interface GenericModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Partial<T>) => Promise<void>;
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
  const [isSaving, setIsSaving] = useState(false);

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
    }
  }, [isOpen, defaultValues]);
  /*
  const handleChange = (name: keyof T, value: any) =>
    setValues((prev) => ({ ...prev, [name]: value}
      
    ));
*/
  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      onValuesChange?.(next);
      return next;
    });
  };

  const isFormValid = useMemo(
    () =>
      fields.every((f) => {
        if (!f.required) return true;
        const currentValue = values[f.name];
        if (f.type === "multiselect") {
          if (Array.isArray(currentValue)) {
            return currentValue.length > 0;
          }
          return false;
        }
        return (currentValue ?? "") !== "";
      }),
    [fields, values],
  );

  const handleSave = async () => {
    if (!isFormValid) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setIsSaving(true);
    try {
      await onSave(values);
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

              const helperText = field.placeholder;

              return (
                <FormControl
                  key={`${String(field.name)}-${index}`}
                  isRequired={field.required}
                  isDisabled={field.disabled}
                >
                  <Stack spacing={2}>
                    <FormLabel mb={0}>{field.label}</FormLabel>

                    {field.type === "select" ? (
                      <Select
                        value={values[field.name] ?? ""}
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
                        value={values[field.name] ?? ""}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        placeholder={field.placeholder}
                        isDisabled={field.disabled}
                        size="md"
                        variant="outline"
                      />
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
