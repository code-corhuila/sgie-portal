// components/UI/GenericMultiStepModal.tsx
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Flex,
  HStack,
  Stack,
  SimpleGrid,
  FormHelperText,
  FormErrorMessage,
  Badge,
  Spinner,
  Text,
  Box,
  Skeleton,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { type Field, type FieldOption } from "../UI/GenericModal";
import { MultiSelect } from "./MultiSelect";
import { useNormalizedInput } from "../../hooks/useNormalizedInput";

function isDifferent(a: any, b: any) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export interface StepDefinition<T = any> {
  title?: string;
  icon?: ReactNode;
  fields: Field<T>[];
  initialValues: Partial<T>;
  onSave: (values: Partial<T>) => Promise<void>;
}

export interface GenericMultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: StepDefinition<any>[];
  modalTitle?: string;
  saveButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  loadingMessage?: string;

  /** Notifica cambios de valores por paso (cada change) */
  onStepValuesChange?: (stepIndex: number, values: Record<string, any>) => void;

  /** Renderiza contenido arriba de los campos de cada paso (p. ej., búsqueda de persona) */
  renderStepHeader?: (
    stepIndex: number,
    values: Record<string, any>,
  ) => ReactNode;

  /** Renderiza contenido debajo de los campos de cada paso (p. ej., botón disponibilidad, selects de hora) */
  renderStepFooter?: (
    stepIndex: number,
    values: Record<string, any>,
  ) => ReactNode;

  /** Renderiza chips/resumen para el paso activo (se muestra en el header) */
  renderStepSummary?: (
    stepIndex: number,
    values: Record<string, any>,
  ) => ReactNode;

  /**
   * (Opcional) Se ejecuta al final del Guardar,
   * después de invocar los onSave de cada paso que haya cambiado.
   * Recibe todos los valores actuales de todos los pasos.
   */
  onSubmit?: (
    allValues: Record<number, Record<string, any>>,
  ) => Promise<void> | void;
}

const GenericMultiStepModal = ({
  isOpen,
  onClose,
  steps,
  modalTitle = "Editar",
  saveButtonText = "Guardar",
  cancelButtonText = "Cancelar",
  isLoading = false,
  loadingMessage = "Cargando información...",
  onStepValuesChange,
  renderStepHeader,
  renderStepFooter,
  renderStepSummary,
  onSubmit,
}: GenericMultiStepModalProps) => {
  const toast = useToast();
  const { normalize } = useNormalizedInput();
  const [tabIndex, setTabIndex] = useState(0);
  const [formValues, setFormValues] = useState<
    Record<number, Record<string, any>>
  >({});
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const onStepValuesChangeRef = useRef(onStepValuesChange);
  const wasOpenRef = useRef(false);

  // Inicializa valores al abrir
  useEffect(() => {
    const isOpening = isOpen && !wasOpenRef.current;
    if (isOpening) {
      const initial = steps.reduce(
        (acc, step, i) => {
          const values: Record<string, any> = {};
          step.fields.forEach((f) => {
            const key = String(f.name);
            values[key] = step.initialValues?.[key] ?? f.value ?? "";
          });
          acc[i] = values;
          return acc;
        },
        {} as Record<number, Record<string, any>>,
      );
      setFormValues(initial);
      setErrors({});
      setTabIndex(0);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, steps]);

  // Actualizar la referencia cuando cambie la prop
  useEffect(() => {
    onStepValuesChangeRef.current = onStepValuesChange;
  }, [onStepValuesChange]);

  const shouldNormalizeField = useCallback(
    (field: Field<any>) => field.normalize ?? field.type === "text",
    [],
  );

  const isValueEmpty = useCallback((value: any) => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }, []);

  const validateField = useCallback(
    (field: Field<any>, stepValues: Record<string, any>) => {
      const key = String(field.name);
      const rawValue = stepValues[key];
      let valueForValidation = rawValue;

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
        const validationResult = field.validate(valueForValidation, {
          ...stepValues,
          [key]: valueForValidation,
        });
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

  const updateFieldError = useCallback(
    (stepIndex: number, fieldKey: string, error: string | null) => {
      setErrors((prevErrors) => {
        const stepErrors = prevErrors[stepIndex] ?? {};
        if (!error) {
          if (!stepErrors[fieldKey]) {
            return prevErrors;
          }
          const { [fieldKey]: _removed, ...restStepErrors } = stepErrors;
          void _removed;
          if (Object.keys(restStepErrors).length === 0) {
            const { [stepIndex]: _omit, ...rest } = prevErrors;
            void _omit;
            return rest;
          }
          return { ...prevErrors, [stepIndex]: restStepErrors };
        }
        return {
          ...prevErrors,
          [stepIndex]: { ...stepErrors, [fieldKey]: error },
        };
      });
    },
    [],
  );

  const normalizeStepValues = useCallback(
    (
      fields: Field<any>[],
      values: Record<string, any>,
      mode: "change" | "submit",
    ) => {
      const nextValues: Record<string, any> = { ...values };
      fields.forEach((field) => {
        const key = String(field.name);
        const currentValue = nextValues[key];
        if (typeof currentValue !== "string") {
          return;
        }

        if (shouldNormalizeField(field)) {
          nextValues[key] = normalize(
            currentValue,
            mode,
            field.normalization,
          );
        } else if (mode === "submit") {
          nextValues[key] = currentValue.trim();
        }
      });
      return nextValues;
    },
    [normalize, shouldNormalizeField],
  );

  const validateAllSteps = useCallback(
    (values: Record<number, Record<string, any>>) => {
      let formIsValid = true;
      const collectedErrors: Record<number, Record<string, string>> = {};

      steps.forEach((step, index) => {
        const stepValues = values[index] || {};
        const stepErrors: Record<string, string> = {};

        step.fields.forEach((field) => {
          const error = validateField(field, stepValues);
          if (error) {
            formIsValid = false;
            stepErrors[String(field.name)] = error;
          }
        });

        if (Object.keys(stepErrors).length > 0) {
          collectedErrors[index] = stepErrors;
        }
      });

      setErrors(collectedErrors);
      return formIsValid;
    },
    [steps, validateField],
  );

  // Notifica cambios hacia arriba y guarda localmente
  const handleChange = (
    stepIndex: number,
    field: Field<any>,
    value: any,
  ) => {
    setFormValues((prev) => {
      const previousStepValues = prev[stepIndex] || {};
      const key = String(field.name);

      let nextValue = value;
      if (typeof value === "string" && field.format) {
        nextValue = field.format(value, previousStepValues);
      }
      if (typeof nextValue === "string" && shouldNormalizeField(field)) {
        nextValue = normalize(nextValue, "change", field.normalization);
      }

      const nextStepValues = {
        ...previousStepValues,
        [key]: nextValue,
      };

      const next = {
        ...prev,
        [stepIndex]: nextStepValues,
      };

      const error = validateField(field, nextStepValues);
      updateFieldError(stepIndex, key, error);

      if (onStepValuesChangeRef.current) {
        setTimeout(() => {
          onStepValuesChangeRef.current?.(stepIndex, nextStepValues);
        }, 0);
      }

      return next;
    });
  };

  const handleSave = async () => {
    const normalizedAllValues = steps.reduce(
      (acc, step, index) => {
        const currentStepValues = formValues[index] || {};
        acc[index] = normalizeStepValues(
          step.fields,
          currentStepValues,
          "submit",
        );
        return acc;
      },
      {} as Record<number, Record<string, any>>,
    );

    if (!validateAllSteps(normalizedAllValues)) {
      setFormValues(normalizedAllValues);
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setFormValues(normalizedAllValues);
    setIsSaving(true);
    try {
      // 1) Ejecutar onSave por cada paso que cambió
      for (let i = 0; i < steps.length; i++) {
        const currentValues = normalizedAllValues[i];
        const initialValues = steps[i].initialValues;
        if (isDifferent(currentValues, initialValues)) {
          await steps[i].onSave(currentValues);
        }
      }

      // 2) Ejecutar onSubmit global si existe (para disparar el POST final)
      if (onSubmit) {
        await onSubmit(normalizedAllValues);
      }

      toast({
        title: "Guardado exitosamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setErrors({});
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error?.message || "Ocurrió un error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    if (!isSaving) {
      setErrors({});
      onClose();
    }
  };

  const renderFields = (stepIndex: number, fields: Field<any>[]) => {
    const values = formValues[stepIndex] || {};
    const stepErrors = errors[stepIndex] || {};

    return (
      <SimpleGrid minChildWidth="240px" spacing={4} w="100%">
        {fields.map((field) => {
          const key = String(field.name);
          const options: FieldOption[] =
            typeof field.options === "function"
              ? field.options(values)
              : (field.options ?? []);
          const helperText = field.helperText ?? field.placeholder;
          const errorMessage = stepErrors[key];
          const currentValue = values[key];

          return (
            <FormControl
              key={key}
              isRequired={field.required}
              isDisabled={field.disabled}
              isInvalid={Boolean(errorMessage)}
            >
              <Stack spacing={2}>
                <FormLabel mb={0}>{field.label}</FormLabel>

                {field.type === "select" ? (
                  <Select
                    value={
                      (currentValue as string | number | undefined) ?? ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      const selected = options.find(
                        (opt: FieldOption) => String(opt.value) === raw,
                      );
                      handleChange(
                        stepIndex,
                        field,
                        selected ? selected.value : raw,
                      );
                    }}
                    placeholder={field.placeholder || "Seleccionar"}
                    isDisabled={field.disabled}
                    size="md"
                    variant="outline"
                  >
                    {options
                      .filter((opt) => opt.label && opt.label.trim() !== "")
                      .map((opt: FieldOption) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                  </Select>
                ) : field.type === "multiselect" ? (
                  <MultiSelect
                    value={
                      Array.isArray(currentValue)
                        ? (currentValue as Array<string | number>)
                        : []
                    }
                    options={options}
                    placeholder={field.placeholder}
                    onChange={(selected) =>
                      handleChange(stepIndex, field, selected)
                    }
                  />
                ) : field.type === "textarea" ? (
                  <Textarea
                    value={
                      typeof currentValue === "string" ? currentValue : ""
                    }
                    onChange={(e) =>
                      handleChange(stepIndex, field, e.target.value)
                    }
                    placeholder={field.placeholder}
                    isDisabled={field.disabled}
                    size="md"
                    variant="outline"
                    rows={4}
                  />
                ) : (
                  <Input
                    type={field.type as React.HTMLInputTypeAttribute}
                    value={
                      typeof currentValue === "number"
                        ? currentValue
                        : (currentValue as string) ?? ""
                    }
                    onChange={(e) =>
                      handleChange(stepIndex, field, e.target.value)
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
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      size="xl"
      closeOnOverlayClick={!isSaving} // No cerrar por overlay si está guardando
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" justify="space-between" gap={4}>
            <Text fontSize="lg" fontWeight="semibold">
              {modalTitle}
            </Text>
            {tabIndex > 0 && renderStepSummary && (
              <HStack spacing={2} flexWrap="wrap" justify="flex-end">
                {renderStepSummary(tabIndex, formValues[tabIndex] || {})}
              </HStack>
            )}
          </Flex>
        </ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <Tabs
            index={tabIndex}
            onChange={setTabIndex}
            variant="enclosed-colored"
            isLazy
          >
            <TabList mb={6} gap={3} flexWrap="wrap">
              {steps.map((step, idx) => (
                <Tab key={idx}>
                  <HStack spacing={2}>
                    {step.icon && (
                      <Box
                        color={tabIndex === idx ? "brand.600" : "neutral.400"}
                        display="flex"
                        alignItems="center"
                      >
                        {step.icon}
                      </Box>
                    )}
                    <Text fontWeight="semibold" fontSize="sm">
                      {step.title ?? `Paso ${idx + 1}`}
                    </Text>
                    <Badge
                      variant={tabIndex === idx ? "success" : "neutral"}
                      fontSize="xs"
                    >
                      {idx + 1}
                    </Badge>
                  </HStack>
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {steps.map((step, idx) => {
                const stepValues = formValues[idx] || {};
                return (
                  <TabPanel key={idx} px={0}>
                    <Stack spacing={6}>
                      {/* Header por paso (p. ej., búsqueda de persona) */}
                      {renderStepHeader?.(idx, stepValues)}

                      {/* Campos configurados del paso */}
                      {isLoading ? (
                        <Stack spacing={4}>
                          <Skeleton height="70px" borderRadius="xl" />
                          <Skeleton height="70px" borderRadius="xl" />
                          <Skeleton height="70px" borderRadius="xl" />
                        </Stack>
                      ) : (
                        renderFields(idx, step.fields)
                      )}

                      {/* Footer por paso (e.g., botón disponibilidad + selects de horas) */}
                      {renderStepFooter?.(idx, stepValues)}
                    </Stack>
                  </TabPanel>
                );
              })}
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Flex w="100%" align="center" justify="space-between" gap={4}>
            {isSaving ? (
              <HStack spacing={2}>
                <Spinner size="sm" color="brand.600" />
                <Text fontSize="sm" color="neutral.500">
                  Guardando cambios...
                </Text>
              </HStack>
            ) : isLoading ? (
              <Text fontSize="sm" color="neutral.500">
                {loadingMessage}
              </Text>
            ) : (
              <Box />
            )}

            <HStack spacing={3}>
              <Button
                variant="ghost"
                onClick={handleModalClose}
                isDisabled={isSaving}
              >
                {cancelButtonText}
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleSave}
                isLoading={isSaving}
                isDisabled={isLoading}
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

export default GenericMultiStepModal;
