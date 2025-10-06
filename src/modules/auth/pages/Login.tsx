import { useState } from "react";
import {
  Flex,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Alert,
  AlertIcon,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const formWidth = useBreakpointValue({ base: "90vw", md: "400px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(username, password);
    if (success) {
      navigate("/");
    } else {
      setError("Credenciales inválidas");
    }
  };

  return (
    <Flex
      height="100vh"            // 🔑 asegura altura completa
      width="100vw"             // 🔑 ocupa todo el ancho
      align="center"
      justify="center"
      bg="gray.100"
      p={4}
    >
      <Box
        p={8}
        w={formWidth}
        borderWidth={1}
        borderRadius="lg"
        bg="white"
        boxShadow="lg"
      >
        <VStack as="form" spacing={4} onSubmit={handleSubmit}>
          <Heading size="lg" textAlign="center">
            Iniciar Sesión
          </Heading>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl>
            <FormLabel>Usuario</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              autoFocus
            />
          </FormControl>

          <FormControl>
            <FormLabel>Contraseña</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
            />
          </FormControl>

          <Button type="submit" colorScheme="blue" width="full">
            Entrar
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}

export default Login;