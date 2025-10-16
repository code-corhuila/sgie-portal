import { Checkbox, CheckboxGroup, Input, Stack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  value: Array<string | number>;
  options: MultiSelectOption[];
  placeholder?: string;
  onChange: (value: Array<string | number>) => void;
}

export function MultiSelect({
  value,
  options,
  placeholder,
  onChange,
}: MultiSelectProps) {
  const [search, setSearch] = useState("");

  const normalized = useMemo(() => {
    if (!search) return options;
    const term = search.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, search]);

  return (
    <Stack spacing={3}>
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder ?? "Buscar"}
        size="sm"
      />
      <CheckboxGroup
        value={value.map(String)}
        onChange={(next) =>
          onChange(
            (next as string[]).map((item) => {
              const original = options.find(
                (option) => String(option.value) === item,
              );
              return original ? original.value : item;
            }),
          )
        }
      >
        <Stack spacing={2} maxH="160px" overflowY="auto">
          {normalized.length === 0 ? (
            <Text fontSize="sm" color="neutral.500">
              Sin opciones disponibles
            </Text>
          ) : (
            normalized.map((option) => (
              <Checkbox key={String(option.value)} value={String(option.value)}>
                {option.label}
              </Checkbox>
            ))
          )}
        </Stack>
      </CheckboxGroup>
    </Stack>
  );
}
