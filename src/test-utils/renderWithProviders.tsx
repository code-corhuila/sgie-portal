import { ReactElement, ReactNode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { render, type RenderOptions } from "@testing-library/react";
import theme from "../theme";

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

type WrapperOptions = {
  route?: MemoryRouterProps["initialEntries"];
  withRouter?: boolean;
  queryClient?: QueryClient;
};

export const renderWithProviders = (
  ui: ReactElement,
  options: WrapperOptions & RenderOptions = {},
) => {
  const {
    route = ["/"],
    withRouter = true,
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options;

  const AllProviders = ({ children }: { children: ReactNode }) => {
    const content = withRouter ? (
      <MemoryRouter initialEntries={route}>{children}</MemoryRouter>
    ) : (
      children
    );

    return (
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
      </ChakraProvider>
    );
  };

  return {
    queryClient,
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  };
};
