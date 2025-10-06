import { useMemo, useState } from "react";
import {
  Box,
  Flex,
  VStack,
  Button,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  HStack,
} from "@chakra-ui/react";
import { HamburgerIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/context/AuthContext";

const DashboardLayout = () => {
  const { role, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: "/permisos", label: "Permisos", roles: ["ADMINISTRADOR", "OPERARIO"] },
    { path: "/persona", label: "Persona", roles: ["ADMINISTRADOR"] },
    { path: "/ubicacion", label: "Ubicación", roles: ["ADMINISTRADOR", "OPERARIO"] },
    { path: "/equipo", label: "Equipo", roles: ["ADMINISTRADOR", "OPERARIO"] },
    { path: "/reserva", label: "Reserva", roles: ["ADMINISTRADOR", "OPERARIO"] },
  ];

  const filteredMenu = useMemo(
  () => menuItems.filter((item) => item.roles.includes(role ?? "")),
  [role]
);

  return (
    <Flex minH="100vh" bg="gray.50" overflow="hidden">
      {/* Sidebar para escritorio */}
      <Box
        display={{ base: "none", md: "block" }}
        w={collapsed ? "60px" : "200px"}
        bg="gray.200"
        p={4}
        transition="width 0.2s"
        height="100vh"
      >
        <VStack align="stretch" spacing={2} height="100%">
          <IconButton
            aria-label="Colapsar menú"
            icon={collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            onClick={() => setCollapsed(!collapsed)}
            size="sm"
            alignSelf={collapsed ? "center" : "flex-end"}
          />
          {filteredMenu.map((item) => (
            <Button
              as={Link}
              to={item.path}
              variant={location.pathname === item.path ? "solid" : "ghost"}
              key={item.path}
              justifyContent={collapsed ? "center" : "flex-start"}
              fontSize="sm"
              px={collapsed ? 2 : 4}
            >
              {collapsed ? item.label.charAt(0) : item.label}
            </Button>
          ))}
        </VStack>
      </Box>

      {/* Contenido principal */}
      <Flex direction="column" flex="1">
        {/* Header */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          bg="white"
          px={4}
          py={3}
          shadow="sm"
          position="sticky"
          top="0"
          zIndex="banner"
        >
          <IconButton
            aria-label="Abrir menú"
            icon={<HamburgerIcon />}
            display={{ base: "inline-flex", md: "none" }}
            onClick={onOpen}
          />
          <Text fontWeight="bold">Mi Aplicación</Text>

          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost" size="sm">
              <HStack spacing={2}>
                <Avatar size="sm" name={role ?? "Usuario"} />
                <Text>{role}</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={logout}>Cerrar sesión</MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        {/* Drawer móvil */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody mt={10}>
              <VStack align="stretch" spacing={4}>
                {filteredMenu.map((item) => (
                  <Button
                    as={Link}
                    to={item.path}
                    variant={location.pathname === item.path ? "solid" : "ghost"}
                    key={item.path}
                    onClick={onClose}
                    justifyContent="flex-start"
                  >
                    {item.label}
                  </Button>
                ))}
                <Button 
                  variant="ghost"
                  colorScheme="red"
                  onClick={logout}>
                  Cerrar sesión
                </Button>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Contenido renderizado por rutas */}
        <Box flex="1" p={6} overflowY="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default DashboardLayout;
