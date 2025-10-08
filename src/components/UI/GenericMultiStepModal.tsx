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
} from "@chakra-ui/react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { type Field, type FieldOption } from "../UI/GenericModal";

function isDifferent(a: any, b: any) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export interface StepDefinition<T = any> {
  title?: string;
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

  /** Notifica cambios de valores por paso (cada change) */
  onStepValuesChange?: (stepIndex: number, values: Record<string, any>) => void;

  /** Renderiza contenido arriba de los campos de cada paso (p. ej., búsqueda de persona) */
  renderStepHeader?: (stepIndex: number, values: Record<string, any>) => ReactNode;

  /** Renderiza contenido debajo de los campos de cada paso (p. ej., botón disponibilidad, selects de hora) */
  renderStepFooter?: (stepIndex: number, values: Record<string, any>) => ReactNode;

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
  onStepValuesChange,
  renderStepHeader,
  renderStepFooter,
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
  }, [isOpen]);

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

    return fields.map((field) => {
      const key = String(field.name);
      const options: FieldOption[] =
        typeof field.options === "function"
          ? field.options(values)
          : field.options ?? [];

      return (
        <FormControl
          key={key}
          mb={3}
          isRequired={field.required}
          isDisabled={field.disabled}
        >
          <FormLabel>{field.label}</FormLabel>

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
            >
              {options
                .filter(opt => opt.label && opt.label.trim() !== '') // Filtrar opciones sin label
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
            />
          ) : (
            <Input
              // Soporta text, number, email, password, date, time, etc.
              type={field.type as React.HTMLInputTypeAttribute}
              value={values[key] ?? ""}
              onChange={(e) => handleChange(stepIndex, key, e.target.value)}
              placeholder={field.placeholder}
              isDisabled={field.disabled}
            />
          )}
        </FormControl>
      );
    });
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
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <Tabs index={tabIndex} onChange={setTabIndex} isFitted variant="enclosed" isLazy>
            <TabList>
              {steps.map((step, idx) => (
                <Tab key={idx}>{step.title ?? `Paso ${idx + 1}`}</Tab>
              ))}
            </TabList>
            <TabPanels>
              {steps.map((step, idx) => {
                const stepValues = formValues[idx] || {};
                return (
                  <TabPanel key={idx}>
                    {/* Header por paso (p. ej., búsqueda de persona) */}
                    {renderStepHeader?.(idx, stepValues)}

                    {/* Campos configurados del paso */}
                    {renderFields(idx, step.fields)}

                    {/* Footer por paso (e.g., botón disponibilidad + selects de horas) */}
                    {renderStepFooter?.(idx, stepValues)}
                  </TabPanel>
                );
              })}
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSave} isLoading={isSaving}>
            {saveButtonText}
          </Button>
          <Button onClick={onClose} ml={3} isDisabled={isSaving}>
            {cancelButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GenericMultiStepModal;