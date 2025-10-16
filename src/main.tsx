import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './modules/auth/context/AuthContext.tsx';
import AppRouter from './router/AppRouter.tsx';
import theme from './theme';
import { queryClient } from './lib/queryClient.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>,
);
