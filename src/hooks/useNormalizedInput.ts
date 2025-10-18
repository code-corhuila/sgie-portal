import { useCallback, useMemo } from "react";

export interface NormalizationSettings {
  toUpperCase?: boolean;
  trim?: boolean;
}

interface NormalizationConfig {
  change?: NormalizationSettings;
  submit?: NormalizationSettings;
}

const defaultChangeSettings: Required<NormalizationSettings> = {
  toUpperCase: true,
  trim: false,
};

const defaultSubmitSettings: Required<NormalizationSettings> = {
  toUpperCase: true,
  trim: true,
};

type NormalizationMode = "change" | "submit";

const mergeSettings = (
  base: Required<NormalizationSettings>,
  overrides?: NormalizationSettings,
) => ({
  ...base,
  ...(overrides ?? {}),
});

export const useNormalizedInput = (config?: NormalizationConfig) => {
  const resolvedConfig = useMemo(
    () => ({
      change: mergeSettings(defaultChangeSettings, config?.change),
      submit: mergeSettings(defaultSubmitSettings, config?.submit),
    }),
    [config],
  );

  const normalize = useCallback(
    (
      value: string,
      mode: NormalizationMode = "change",
      overrides?: NormalizationSettings,
    ) => {
      if (typeof value !== "string") {
        return value;
      }
      const settings = mergeSettings(resolvedConfig[mode], overrides);
      let result = value;
      if (settings.trim) {
        result = result.trim();
      }
      if (settings.toUpperCase) {
        result = result.toUpperCase();
      }
      return result;
    },
    [resolvedConfig],
  );

  return { normalize };
};

export type { NormalizationMode };
