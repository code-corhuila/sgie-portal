# CORHUILA SGIE – Frontend

Aplicación web para la gestión de reservas, equipos y permisos del Sistema de Gestión de Infraestructura Educativa (SGIE) de CORHUILA.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

```bash
npm install
```

## Scripts disponibles

- `npm run dev` – levanta el servidor de desarrollo en `http://localhost:5173`.
- `npm run build` – ejecuta la comprobación de tipos y genera el bundle de producción.
- `npm run preview` – sirve el bundle generado para validaciones manuales.
- `npm run lint` – ejecuta ESLint sobre el código fuente.

## Arquitectura

- **React + TypeScript** para la capa de presentación.
- **Chakra UI** como sistema de diseño y componentes accesibles.
- **React Router v6** para la navegación.
- **React Query** para manejo de caché y requests asíncronos.
- **Estructura**: la lógica de dominio se ubica en `src/modules/`, componentes compartidos en `src/components/`, utilidades en `src/utils/` y servicios HTTP en `src/api/`.

## Estándares de código

- TypeScript estricto (`tsconfig.app.json`).
- ESLint + Prettier según la configuración del proyecto.
- Componentes funcionales y hooks para la lógica reutilizable.
- Requests centralizados en `src/api` con manejo uniforme de errores (`ApiError`).

## Desarrollo

1. Levanta el servidor con `npm run dev`.
2. Inicia sesión desde `/login`.
3. Verifica los módulos desde el layout del dashboard.

## Generación de bundle

```bash
npm run build
npm run preview
```

## Soporte

Para dudas o incidencias, documenta el detalle en el repositorio o contacta al equipo responsable del SGIE.
