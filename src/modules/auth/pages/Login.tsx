import { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiShield } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate("/");
      } else {
        setError("Credenciales inválidas. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex minH="100vh" bg="brand.50">
      <Flex
        flex={1}
        display={{ base: "none", lg: "flex" }}
        align="center"
        justify="center"
        bgGradient="linear(to-br, brand.700, navy.800)"
        color="white"
        p={12}
      >
        <Stack spacing={8} maxW="lg">
          <Icon as={FiShield} boxSize={12} color="mint.300" />
          <Stack spacing={4}>
            <Heading size="xl" fontWeight="bold">
              Sistema de Gestión de Infraestructura Educativa
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.800">
              Administra reservas, instalaciones, equipos y permisos en un panel
              unificado para toda la comunidad CORHUILA.
            </Text>
          </Stack>
          <Stack spacing={3} fontSize="sm" color="whiteAlpha.800">
            <Text>
              • Control en tiempo real de reservas y mantenimientos.
            </Text>
            <Text>
              • Gestión centralizada de usuarios, roles y permisos.
            </Text>
            <Text>
              • Disponibilidad segura gracias a sesiones autenticadas.
            </Text>
          </Stack>
        </Stack>
      </Flex>

      <Flex
        flex={1}
        align="center"
        justify="center"
        p={{ base: 6, md: 12 }}
      >
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          borderRadius="2xl"
          boxShadow="xl"
          borderWidth="1px"
          borderColor="neutral.100"
          p={{ base: 6, md: 10 }}
          w="full"
          maxW="420px"
        >
          <VStack spacing={6} align="stretch">
            <Stack spacing={1}>
              <Heading size="lg" color="neutral.900">
                Bienvenido
              </Heading>
              <Text fontSize="sm" color="neutral.500">
                Ingresa con tus credenciales institucionales para continuar
              </Text>
            </Stack>

            {error && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Correo institucional</FormLabel>
                <Input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario@corhuila.edu.co"
                  autoFocus
                />
                <FormHelperText color="neutral.500" mt={1}>
                  Usa el correo asignado por la institución.
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Contraseña</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                />
                <FormHelperText color="neutral.500" mt={1}>
                  Mínimo 8 caracteres, respeta mayúsculas y minúsculas.
                </FormHelperText>
              </FormControl>
            </Stack>

            <Stack spacing={2}>
              <Button
                type="submit"
                colorScheme="brand"
                rightIcon={<FiArrowRight />}
                isLoading={isSubmitting}
              >
                Iniciar sesión
              </Button>
              <Text fontSize="sm" color="neutral.500" textAlign="center">
                ¿Olvidaste tu contraseña? Comunícate con soporte TI CORHUILA.
              </Text>
            </Stack>
          </VStack>
        </Box>
      </Flex>
    </Flex>
  );
}

export default Login;

