import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiCpu,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/context/useAuth";

type NavItem = {
  path: string;
  label: string;
  roles?: string[];
  icon: typeof FiShield;
  onClick?: () => void;
};

const navItems: NavItem[] = [
  {
    path: "/dashboard",
    label: "Inicio",
    icon: FiHome,
  },
  {
    path: "/permisos",
    label: "Permisos",
    roles: ["ADMINISTRADOR"],
    icon: FiShield,
  },
  {
    path: "/persona",
    label: "Personas",
    roles: ["ADMINISTRADOR"],
    icon: FiUsers,
  },
  {
    path: "/ubicacion",
    label: "Ubicaciones",
    roles: ["ADMINISTRADOR", "ADMINISTRATIVO"],
    icon: FiMapPin,
  },
  {
    path: "/equipo",
    label: "Equipos",
    roles: ["ADMINISTRADOR", "ADMINISTRATIVO"],
    icon: FiCpu,
  },
  {
    path: "/reserva",
    label: "Reservas",
    roles: ["ADMINISTRADOR", "ADMINISTRATIVO"],
    icon: FiCalendar,
  },
  {
    path: "/reportes",
    label: "Reportes",
    roles: ["ADMINISTRADOR", "ADMINISTRATIVO"],
    icon: FiFileText,
  },
];

const DashboardLayout = () => {
  const { role, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const filteredMenu = useMemo(() => {
    const base = navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role ?? "");
    });
    const logoutItem: NavItem = {
      path: "__logout__",
      label: "Cerrar sesión",
      icon: FiLogOut,
      onClick: logout,
    };
    const reportesIndex = base.findIndex((item) => item.path === "/reportes");
    const reservaIndex = base.findIndex((item) => item.path === "/reserva");
    const insertIndex =
      reportesIndex !== -1
        ? reportesIndex + 1
        : reservaIndex !== -1
          ? reservaIndex + 1
          : base.length;
    const menuWithLogout = [...base];
    menuWithLogout.splice(
      insertIndex >= 0 ? insertIndex : menuWithLogout.length,
      0,
      logoutItem,
    );
    return menuWithLogout;
  }, [logout, role]);

  const activeItem = useMemo(() => {
    const current = filteredMenu.find(
      (item) =>
        item.path !== "__logout__" && location.pathname.startsWith(item.path),
    );
    if (current) return current;
    return (
      filteredMenu.find((item) => item.path !== "__logout__") ?? filteredMenu[0]
    );
  }, [filteredMenu, location.pathname]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return [{ label: "Inicio", path: "/" }];
    }
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      const item = navItems.find((nav) => nav.path === path);
      const label =
        item?.label ?? segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, path };
    });
  }, [location.pathname]);

  return (
    <Flex minH="100vh" bg="gray.100">
      {/* Sidebar */}
      <Box
        display={{ base: "none", md: "flex" }}
        flexDir="column"
        w={collapsed ? "110px" : "235px"}
        bgGradient="linear(to-b, brand.700, navy.800)"
        color="white"
        transition="width 0.2s ease"
        boxShadow="xl"
      >
        <Flex
          align="center"
          justify={collapsed ? "center" : "space-between"}
          px={5}
          py={6}
        >
          <Stack spacing={0} align={collapsed ? "center" : "flex-start"}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              letterSpacing="wide"
              color="mint.200"
            >
              CORHUILA
            </Text>
            {!collapsed && (
              <Text fontSize="lg" fontWeight="bold">
                Gestión SGIE
              </Text>
            )}
          </Stack>
          <IconButton
            aria-label="Colapsar menú"
            variant="ghost"
            color="white"
            icon={collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            onClick={() => setCollapsed((prev) => !prev)}
            _hover={{ bg: "whiteAlpha.200" }}
            size="sm"
          />
        </Flex>

        <Divider borderColor="whiteAlpha.300" />

        <Stack as="nav" spacing={2} px={3} py={6} flex="1" overflowY="auto">
          {filteredMenu.map((item) => {
            const isActive =
              item.path !== "__logout__" &&
              location.pathname.startsWith(item.path);
            const isLogout = item.path === "__logout__";

            if (isLogout) {
              return (
                <Button
                  key={item.path}
                  justifyContent={collapsed ? "center" : "flex-start"}
                  variant="ghost"
                  colorScheme="red"
                  color="white"
                  leftIcon={<Icon as={item.icon} />}
                  iconSpacing={collapsed ? 0 : 3}
                  size="md"
                  px={collapsed ? 0 : 4}
                  h="48px"
                  _hover={{ bg: "whiteAlpha.300" }}
                  onClick={item.onClick}
                >
                  {!collapsed && (
                    <Flex justify="space-between" align="center" flex="1">
                      <Text fontWeight="medium">{item.label}</Text>
                    </Flex>
                  )}
                </Button>
              );
            }

            return (
              <Button
                as={Link}
                to={item.path}
                key={item.path}
                justifyContent={collapsed ? "center" : "flex-start"}
                variant={isActive ? "solid" : "ghost"}
                colorScheme="brand"
                bg={isActive ? "mint.300" : "transparent"}
                color={isActive ? "navy.800" : "whiteAlpha.900"}
                leftIcon={<Icon as={item.icon} />}
                iconSpacing={collapsed ? 0 : 3}
                size="md"
                px={collapsed ? 0 : 4}
                h="48px"
                _hover={{
                  bg: isActive ? "mint.300" : "whiteAlpha.200",
                }}
              >
                {!collapsed && (
                  <Flex justify="space-between" align="center" flex="1">
                    <Text fontWeight={isActive ? "semibold" : "medium"}>
                      {item.label}
                    </Text>
                    {isActive && <Badge variant="success">Activo</Badge>}
                  </Flex>
                )}
              </Button>
            );
          })}
        </Stack>

        <Stack
          spacing={2}
          align={collapsed ? "center" : "flex-start"}
          px={collapsed ? 2 : 5}
          pb={6}
        >
          <Avatar
            size={collapsed ? "sm" : "md"}
            name={role ?? "Usuario"}
            bg="mint.300"
            color="navy.900"
          />
          {!collapsed && (
            <>
              <Text fontSize="sm" fontWeight="semibold">
                {role ?? "Usuario"}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700">
                Sesión activa
              </Text>
            </>
          )}
        </Stack>
      </Box>

      {/* Main content */}
      <Flex flex="1" direction="column" minW={0}>
        <Flex
          as="header"
          align="center"
          justify="space-between"
          bg="white"
          px={{ base: 4, md: 8 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="neutral.100"
          position="sticky"
          top={0}
          zIndex="overlay"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <IconButton
              aria-label="Abrir menú"
              icon={<FiMenu />}
              display={{ base: "inline-flex", md: "none" }}
              onClick={onOpen}
              variant="ghost"
            />
            <Stack spacing={1}>
              <Breadcrumb fontSize="xs" color="neutral.500">
                {breadcrumbs.map((crumb, idx) => (
                  <BreadcrumbItem
                    key={crumb.path}
                    isCurrentPage={idx === breadcrumbs.length - 1}
                  >
                    {idx === breadcrumbs.length - 1 ? (
                      <Text fontWeight="medium">{crumb.label}</Text>
                    ) : (
                      <BreadcrumbLink as={Link} to={crumb.path}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
              <Text fontSize="lg" fontWeight="semibold" color="neutral.900">
                {activeItem?.label ?? "Panel"}
              </Text>
            </Stack>
          </HStack>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiHelpCircle />}
              variant="ghost"
              colorScheme="brand"
              size="sm"
            >
              Ayuda
            </Button>
          </HStack>
        </Flex>

        {/* Drawer móvil */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody mt={16}>
              <Stack spacing={4}>
                {filteredMenu.map((item) => {
                  const isActive =
                    item.path !== "__logout__" &&
                    location.pathname.startsWith(item.path);
                  const isLogout = item.path === "__logout__";

                  if (isLogout) {
                    return (
                      <Button
                        key={item.path}
                        variant="ghost"
                        colorScheme="red"
                        justifyContent="flex-start"
                        leftIcon={<Icon as={item.icon} />}
                        onClick={() => {
                          item.onClick?.();
                          onClose();
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      as={Link}
                      to={item.path}
                      key={item.path}
                      variant={isActive ? "solid" : "ghost"}
                      colorScheme="brand"
                      justifyContent="flex-start"
                      leftIcon={<Icon as={item.icon} />}
                      onClick={onClose}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box
          as="main"
          flex="1"
          px={{ base: 4, md: 8 }}
          py={{ base: 6, md: 8 }}
          overflowY="auto"
        >
          <Box
            bg="white"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="neutral.100"
            boxShadow="md"
            p={{ base: 4, md: 6 }}
            minH="calc(100vh - 220px)"
          >
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default DashboardLayout;
