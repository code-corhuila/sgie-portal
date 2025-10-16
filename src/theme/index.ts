import {
  extendTheme,
  type ThemeConfig,
  type ComponentStyleConfig,
} from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const focusRing = "0 0 0 3px rgba(0, 150, 64, 0.35)";

const buttonStyles: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: "lg",
    fontWeight: "semibold",
    _focusVisible: {
      boxShadow: focusRing,
    },
  },
  variants: {
    solid: {
      bg: "brand.600",
      color: "white",
      _hover: {
        bg: "brand.700",
      },
      _active: {
        bg: "brand.700",
      },
      _disabled: {
        bg: "brand.300",
        color: "white",
      },
    },
    outline: {
      borderColor: "brand.600",
      color: "brand.600",
      _hover: {
        bg: "brand.50",
      },
      _active: {
        bg: "brand.100",
      },
    },
    ghost: {
      color: "brand.600",
      _hover: {
        bg: "brand.50",
      },
      _active: {
        bg: "brand.100",
      },
    },
  },
  defaultProps: {
    colorScheme: "brand",
  },
};

const inputFieldBase = {
  borderColor: "neutral.300",
  bg: "white",
  transition: "all 0.2s ease-in-out",
  _placeholder: {
    color: "neutral.500",
  },
  _hover: {
    borderColor: "neutral.400",
  },
  _focus: {
    borderColor: "brand.600",
    boxShadow: focusRing,
  },
  _focusVisible: {
    borderColor: "brand.600",
    boxShadow: focusRing,
  },
};

const inputStyles: ComponentStyleConfig = {
  baseStyle: {
    field: {
      borderRadius: "lg",
    },
  },
  sizes: {
    md: {
      field: {
        fontSize: "sm",
        px: 4,
        py: 2,
      },
    },
  },
  variants: {
    outline: {
      field: inputFieldBase,
    },
    filled: {
      field: {
        ...inputFieldBase,
        bg: "brand.50",
      },
    },
  },
  defaultProps: {
    size: "md",
    variant: "outline",
  },
};

const selectStyles: ComponentStyleConfig = {
  baseStyle: {
    field: {
      borderRadius: "lg",
    },
  },
  variants: {
    outline: {
      field: {
        ...inputFieldBase,
      },
    },
  },
  defaultProps: {
    size: "md",
    variant: "outline",
  },
};

const textareaStyles: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: "lg",
  },
  variants: {
    outline: {
      ...inputFieldBase,
    },
  },
  defaultProps: {
    size: "md",
    variant: "outline",
  },
};

const badgeStyles: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: "md",
    textTransform: "none",
    fontWeight: "semibold",
    letterSpacing: "wide",
  },
  variants: {
    success: {
      bg: "brand.50",
      color: "brand.700",
    },
    warning: {
      bg: "lime.100",
      color: "lime.600",
    },
    info: {
      bg: "teal.100",
      color: "teal.700",
    },
    neutral: {
      bg: "neutral.100",
      color: "neutral.700",
    },
  },
};

const modalStyles: ComponentStyleConfig = {
  baseStyle: {
    dialog: {
      borderRadius: "2xl",
      bg: "white",
      boxShadow: "xl",
    },
    header: {
      fontWeight: "semibold",
      borderBottomWidth: "1px",
      borderColor: "neutral.100",
      px: { base: 6, md: 8 },
      py: 5,
    },
    closeButton: {
      borderRadius: "full",
    },
    body: {
      px: { base: 6, md: 8 },
      py: 6,
    },
    footer: {
      px: { base: 6, md: 8 },
      py: 5,
      borderTopWidth: "1px",
      borderColor: "neutral.100",
      bg: "white",
      position: "sticky",
      bottom: 0,
      zIndex: 1,
    },
  },
  sizes: {
    md: {
      dialog: {
        maxW: "640px",
      },
    },
    lg: {
      dialog: {
        maxW: "840px",
      },
    },
  },
};

const tabsStyles: ComponentStyleConfig = {
  variants: {
    "enclosed-colored": {
      tab: {
        fontWeight: "semibold",
        color: "neutral.600",
        borderRadius: "lg",
        _selected: {
          bg: "brand.50",
          color: "brand.700",
          borderBottom: "2px solid",
          borderColor: "brand.600",
        },
        _focusVisible: {
          boxShadow: focusRing,
        },
      },
      tablist: {
        gap: 2,
      },
      tabpanel: {
        px: 0,
      },
    },
  },
  defaultProps: {
    variant: "enclosed-colored",
  },
};

const tableStyles: ComponentStyleConfig = {
  baseStyle: {
    table: {
      borderCollapse: "separate",
      borderSpacing: 0,
    },
    th: {
      fontWeight: "semibold",
      letterSpacing: "wide",
      textTransform: "none",
      fontSize: "xs",
      color: "neutral.600",
      bg: "neutral.50",
    },
    td: {
      fontSize: "sm",
      color: "neutral.800",
    },
  },
};

const tooltipStyles: ComponentStyleConfig = {
  baseStyle: {
    bg: "neutral.900",
    color: "white",
    borderRadius: "md",
    px: 3,
    py: 2,
    boxShadow: "lg",
  },
};

const toastStyles = {
  baseStyle: {
    borderRadius: "lg",
    boxShadow: "lg",
  },
  variants: {
    subtle: (props: Record<string, any>) => ({
      bg:
        props?.status === "error"
          ? "red.50"
          : props?.status === "warning"
            ? "yellow.50"
            : "brand.50",
      color:
        props?.status === "error"
          ? "red.700"
          : props?.status === "warning"
            ? "yellow.800"
            : "brand.700",
    }),
  },
  defaultProps: {
    variant: "subtle",
    colorScheme: "brand",
  },
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#E6F5EC",
      100: "#C2E6D1",
      200: "#9DD6B6",
      300: "#79C799",
      400: "#4FBA7B",
      500: "#21AC5B",
      600: "#009640",
      700: "#017A35",
      800: "#015F2A",
      900: "#00441F",
    },
    neutral: {
      50: "#F1F5F4",
      100: "#E2E6E5",
      200: "#C9CFCD",
      300: "#AEB4B1",
      400: "#939A97",
      500: "#78817C",
      600: "#5D6662",
      700: "#2A2E33",
      800: "#171A1D",
      900: "#000000",
    },
    teal: {
      50: "#E3F5F9",
      100: "#B9E5EE",
      200: "#8ED4E3",
      300: "#63C3D7",
      400: "#39B3CD",
      500: "#1A9DB8",
      600: "#006983",
      700: "#00556A",
      800: "#004052",
      900: "#002B39",
    },
    navy: {
      50: "#E5ECF5",
      100: "#BDCCE3",
      200: "#95ACD1",
      300: "#6D8BBF",
      400: "#466BAE",
      500: "#2F5294",
      600: "#243F73",
      700: "#1A2C53",
      800: "#152E49",
      900: "#0D1A2D",
    },
    mint: {
      50: "#E0FFFA",
      100: "#B3FFF2",
      200: "#80FFEA",
      300: "#00FFA8",
      400: "#00D2C5",
      500: "#00B1A6",
      600: "#009388",
      700: "#00756A",
      800: "#00564D",
      900: "#00392F",
    },
    lime: {
      50: "#F7FDD9",
      100: "#EEFBB1",
      200: "#E4F888",
      300: "#D9F65F",
      400: "#D0F43A",
      500: "#CEEA00",
      600: "#A8C000",
      700: "#829700",
      800: "#5C6E00",
      900: "#364500",
    },
  },
  fonts: {
    heading: `'Inter', "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    body: `'Inter', "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    "2xl": "28px",
  },
  styles: {
    global: {
      "html, body": {
        bg: "#F7F9F8",
        color: "neutral.900",
        fontSize: "16px",
        lineHeight: "base",
      },
      body: {
        minHeight: "100vh",
      },
      a: {
        color: "brand.600",
        fontWeight: "medium",
        _hover: {
          color: "brand.700",
        },
      },
    },
  },
  components: {
    Button: buttonStyles,
    Input: inputStyles,
    Select: selectStyles,
    Textarea: textareaStyles,
    Badge: badgeStyles,
    Modal: modalStyles,
    Tabs: tabsStyles,
    Table: tableStyles,
    Tooltip: tooltipStyles,
    Toast: toastStyles as unknown as ComponentStyleConfig,
  },
  shadows: {
    sm: "0 2px 6px rgba(21, 46, 73, 0.08)",
    md: "0 8px 24px rgba(21, 46, 73, 0.12)",
    lg: "0 12px 32px rgba(21, 46, 73, 0.16)",
    xl: "0 20px 45px rgba(21, 46, 73, 0.18)",
  },
});

export default theme;
