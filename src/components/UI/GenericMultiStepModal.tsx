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
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { type Field } from "../UI/GenericModal"; // Asegúrate que este tipo esté correctamente definido

function isDifferent(a: any, b: any) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

interface StepDefinition<T = any> {
  title?: string;
  fields: Field<T>[];
  initialValues: Partial<T>;
  onSave: (values: Partial<T>) => Promise<void>;
}

interface GenericMultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: StepDefinition<any>[];
  modalTitle?: string;
  saveButtonText?: string;
  cancelButtonText?: string;
}

const GenericMultiStepModal = ({
  isOpen,
  onClose,
  steps,
  modalTitle = "Editar",
  saveButtonText = "Guardar",
  cancelButtonText = "Cancelar",
}: GenericMultiStepModalProps) => {
  const toast = useToast();
  const [tabIndex, setTabIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<number, Record<string, any>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial = steps.reduce((acc, step, i) => {
        const values: Record<string, any> = {};
        step.fields.forEach(f => {
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

  const handleChange = (stepIndex: number, name: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [stepIndex]: {
        ...prev[stepIndex],
        [name]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (let i = 0; i < steps.length; i++) {
        const currentValues = formValues[i];
        const initialValues = steps[i].initialValues;

        if (isDifferent(currentValues, initialValues)) {
          await steps[i].onSave(currentValues);
        }
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
        description: error.message || "Ocurrió un error",
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

    return fields.map(field => {
      const key = String(field.name);
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
                const selected = field.options?.find(opt => String(opt.value) === e.target.value);
                handleChange(stepIndex, key, selected ? selected.value : e.target.value);
              }}
              placeholder={field.placeholder || "Seleccionar"}
              isDisabled={field.disabled}
            >
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              type={field.type}
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <Tabs index={tabIndex} onChange={setTabIndex} isFitted variant="enclosed">
            <TabList>
              {steps.map((step, idx) => (
                <Tab key={idx}>{step.title ?? `Paso ${idx + 1}`}</Tab>
              ))}
            </TabList>
            <TabPanels>
              {steps.map((step, idx) => (
                <TabPanel key={idx}>{renderFields(idx, step.fields)}</TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isSaving}
          >
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
