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
  Badge,
  Spinner,
  Text,
  Box,
  Skeleton,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { type Field, type FieldOption } from "../UI/GenericModal";

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
  renderStepHeader?: (stepIndex: number, values: Record<string, any>) => ReactNode;

  /** Renderiza contenido debajo de los campos de cada paso (p. ej., botón disponibilidad, selects de hora) */
  renderStepFooter?: (stepIndex: number, values: Record<string, any>) => ReactNode;

  /** Renderiza chips/resumen para el paso activo (se muestra en el header) */
  renderStepSummary?: (stepIndex: number, values: Record<string, any>) => ReactNode;

  /**
   * (Opcional) Se ejecuta al final del Guardar,
   * después de invocar los onSave de cada paso que haya cambiado.
   * Recibe todos los valores actuales de todos los pasos.
   */
  onSubmit?: (allValues: Record<number, Record<string, any>>) => Promise<void> | void;
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
  const [tabIndex, setTabIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<number, Record<string, any>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const onStepValuesChangeRef = useRef(onStepValuesChange);

  // Inicializa valores al abrir
  useEffect(() => {
    if (isOpen) {
      const initial = steps.reduce((acc, step, i) => {
        const values: Record<string, any> = {};
        step.fields.forEach((f) => {
          const key = String(f.name);
          values[key] = step.initialValues?.[key] ?? f.value ?? "";
        });
        acc[i] = values;
        return acc;
      }, {} as Record<number, Record<string, any>>);
      setFormValues(initial);
      setTabIndex(0);
    }
  }, [isOpen, steps]);

  // Actualizar la referencia cuando cambie la prop
  useEffect(() => {
    onStepValuesChangeRef.current = onStepValuesChange;
  }, [onStepValuesChange]);

  // Notifica cambios hacia arriba y guarda localmente
  const handleChange = (stepIndex: number, name: string, value: any) => {
    setFormValues((prev) => {
      const nextStepValues = {
        ...(prev[stepIndex] || {}),
        [name]: value,
      };
      const next = {
        ...prev,
        [stepIndex]: nextStepValues,
      };
      
      // Notificar cambio de forma segura usando la referencia
      if (onStepValuesChangeRef.current) {
        setTimeout(() => {
          onStepValuesChangeRef.current!(stepIndex, nextStepValues);
        }, 0);
      }
      
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1) Ejecutar onSave por cada paso que cambió
      for (let i = 0; i < steps.length; i++) {
        const currentValues = formValues[i];
        const initialValues = steps[i].initialValues;
        if (isDifferent(currentValues, initialValues)) {
          await steps[i].onSave(currentValues);
        }
      }

      // 2) Ejecutar onSubmit global si existe (para disparar el POST final)
      if (onSubmit) {
        await onSubmit(formValues);
      }

      toast({
        title: "Guardado exitosamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
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

  const renderFields = (stepIndex: number, fields: Field<any>[]) => {
    const values = formValues[stepIndex] || {};

    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
        {fields.map((field) => {
          const key = String(field.name);
          const options: FieldOption[] =
            typeof field.options === "function"
              ? field.options(values)
              : field.options ?? [];

          return (
            <FormControl
              key={key}
              isRequired={field.required}
              isDisabled={field.disabled}
            >
              <Stack spacing={2}>
                <FormLabel mb={0}>{field.label}</FormLabel>

                {field.type === "select" ? (
                  <Select
                    value={values[key] ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const selected = options.find(
                        (opt: FieldOption) => String(opt.value) === raw
                      );
                      handleChange(stepIndex, key, selected ? selected.value : raw);
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
                ) : field.type === "textarea" ? (
                  <Textarea
                    value={values[key] ?? ""}
                    onChange={(e) => handleChange(stepIndex, key, e.target.value)}
                    placeholder={field.placeholder}
                    isDisabled={field.disabled}
                    size="md"
                    variant="outline"
                    rows={4}
                  />
                ) : (
                  <Input
                    type={field.type as React.HTMLInputTypeAttribute}
                    value={values[key] ?? ""}
                    onChange={(e) => handleChange(stepIndex, key, e.target.value)}
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
          );
        })}
      </SimpleGrid>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              <Button variant="ghost" onClick={onClose} isDisabled={isSaving}>
                {cancelButtonText}
              </Button>
              <Button colorScheme="brand" onClick={handleSave} isLoading={isSaving} isDisabled={isLoading}>
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
