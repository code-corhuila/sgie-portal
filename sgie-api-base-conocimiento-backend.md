# Corhuila SGIE API - Base de conocimiento tecnico

## Resumen ejecutivo
- **Objetivo**: Plataforma REST para administrar reservas, mantenimientos e inventario de instalaciones y equipos de la Universidad Corhuila, con control de usuarios, roles y permisos finos por entidad.
- **Dominio clave**: Personas (usuarios internos), ubicaciones (continente a instalacion), equipos, reservas (instalacion/equipo), mantenimientos y notificaciones.
- **Tecnologias base**: Spring Boot 3.5.5 (Java 17), Spring Data JPA, Spring Security con JWT, PostgreSQL, Spring Mail, SpringDoc OpenAPI.
- **Estilo de API**: REST JSON con prefijo `v1/api`, entidad enrrollada en `ApiResponseDto`. Autorizacion basada en JWT (cookie `token` o header `Authorization`) y verificacion de permisos `ENTIDAD:ACCION`.

## Stack y configuracion
- **Dependencias principales** (`pom.xml`):
  - Spring Boot starters (web, data-jpa, security, validation, mail, data-jdbc).
  - SpringDoc OpenAPI 2.5.0 (swagger UI en `/swagger-ui`).
  - JWT jjwt (api, impl, jackson) para firmas HS256.
  - MapStruct y Lombok (generacion de DTO y boilerplate).
  - Driver `org.postgresql:postgresql`.
- **Application properties** (`src/main/resources/application.properties`):
  - Conexion local a PostgreSQL `jdbc:postgresql://localhost:5432/sgie` (usuario `sebastianzambrano`).
  - `spring.jpa.hibernate.ddl-auto=update` y `spring.jpa.show-sql=true`.
  - Clave JWT y expiracion via variables `JWT_SECRET` y `JWT_EXPIRATION_MS` (fallback a valores de desarrollo).
  - Configuracion SMTP (Gmail) para envio de correos.
  - Logging detallado (`org.hibernate.SQL`, `BasicBinder`, `org.springframework.security` en DEBUG/TRACE).
  - CORS abierto para `http://localhost:5173`, cookies HTTP-only `same-site=Lax`.

## Arquitectura
- **Capas**:
  - **Controller**: expone endpoints REST. La mayoria extiende `BaseController<T,S>` para CRUD estandar y permisos dinamicos.
  - **Service**: logica de negocio; todos extienden `BaseService<T>` con hooks (`afterSave`) y metodos comunes (soft delete, cambio de estado).
  - **Repository**: interfaces `IBaseRepository<T,ID>` (Spring Data JPA) con queries JPQL o nativas (incluye proyecciones via interfaces DTO).
  - **Dominio**: entidades JPA agrupadas por contexto (`User`, `Site`, `Equipment`, `Booking`, `Maintenance`) que heredan de `Auditoria`.
  - **Common**: componentes compartidos (`ApiResponseDto`, `Auditoria`, `AuditoriaListener`, `PermissionEvaluator`, vistas Jackson).
- **Auditoria y estado**:
  - `Auditoria` agrega `state`, timestamps (`createdAt`, `updatedAt`, `deletedAt`) y usuarios de auditoria.
  - `AuditoriaListener` usa `SecurityContextHolder` para guardar `createdUser`, `updatedUser`, `deletedUser`.
  - Borrado logico: `delete(id)` marca `state=false` y setea `deletedAt`.
- **Seguridad**:
  - `SecurityConfig`: stateless, CORS, sin CSRF, rutas publicas `/v1/api/usuario/login`, `/v1/api/usuario/me`, swagger. Resto requiere autenticacion.
  - `JwtFilter`: extrae token desde cookie `token` (fallback header `Authorization: Bearer`), valida JWT, monta `UsernamePasswordAuthenticationToken` con authorities (rol + permisos).
  - `PermissionEvaluator`: revisa si el usuario posee el permiso `ENTIDAD:ACCION` exigido por `@PreAuthorize` en cada endpoint.
  - `CustomUserDetailsService`: arma authorities desde `Rol` (prefijo `ROLE_`) y `PermisoRolEntidad` (permiso dinamico por entidad).
- **Documentacion automatica**: `SwaggerConfig` registra esquema `bearerAuth` y metadata del API.
- **Notificaciones**: `NotificacionService` envia correos SMTP. `NotificacionDiariaService` ejecuta tarea programada (`@Scheduled 23:59 America/Bogota`) para recordar reservas abiertas del dia.

## Modelado de dominio (resumen por modulo)

### Common
- `Auditoria`: estado booleano, timestamps y usuarios de auditoria. Eventos `@PrePersist`/`@PreUpdate`.
- `ApiResponseDto<T>`: estructura de respuesta (`message`, `data`, `status`).
- `Views`: vistas Jackson (`Simple`, `Complete`) para respuestas personalizadas.

### User
- `Persona`: datos personales, relacion `Rol`, `Usuario`, reservas asociadas.
- `Usuario`: credenciales (`email`, `password` bcrypt), `Persona` asociada (1:1 obligatoria).
- `Rol`: nombre, descripcion.
- `Permiso`: nombre (acciones como `CONSULTAR`, `CREAR`, `ACTUALIZAR`, `ELIMINAR`), descripcion.
- `Entidad`: nombre logico de entidad protegida (ej. `EQUIPO`, `RESERVA`).
- `PermisoRolEntidad`: join `Rol` + `Permiso` + `Entidad`, determina privileges dinamicos.
- DTO proyectados:
  - `IPersonaUsuarioDTO`: mezcla persona-usuario-rol para consultas rapidas.
  - `IPermisoPorPersonaDTO`, `IPermisoRolEntidadDTO`: permisos activos por persona/rol.
  - `LoginRequest`: payload login email/password.

### Site
- Jerarquia geografica: `Continente`, `Pais`, `Departamento`, `Municipio`.
- `Campus`: pertenece a `Municipio`, agrupa `Instalacion`.
- `CategoriaInstalacion`: tipifica instalaciones.
- `Instalacion`: nombre, descripcion, `Campus`, `CategoriaInstalacion`. Asociacion con reservas y equipos.
- Proyeccion `IInstalacionCampusDTO`: retorna arbol completo de ubicacion y categoria.

### Equipment
- `CategoriaEquipo` -> `TipoEquipo` -> `Equipo` (relaciones n: n).
- `Equipo`: codigo unico, `Instalacion` fisica, `TipoEquipo`.
- DTO relevantes: `IEquipoInstalacionDTO` (equipos por campus), `EquipoDTO`, `HojaDeVidaEquipoDTO`, `ReservaEquipoHistorialDTO`, `MantenimientoEquipoHistorialDTO`.
- `HojaDeVidaEquipoService`: junta equipo, reservas historicas y mantenimientos para un reporte integral.

### Booking
- `TipoReserva`: define si requiere aprobacion.
- `Reserva`: fecha, rango horario (`horaInicio`, `horaFin`), descripcion, `TipoReserva`, `Persona`. Esta entidad se reutiliza para reservas y mantenimientos (uno a uno con mantenimiento).
- `DetalleReservaEquipo`: detalle por equipo, programa academico, estudiantes, instalacion destino.
- `DetalleReservaInstalacion`: detalle de instalacion, programa academico, numero de estudiantes.
- DTO proyecciones:
  - `HoraDisponibleDTO`: hora libre (string HH:mm:ss) entregada por funciones nativas de BD.
  - `IReservaEquipoDTO`, `IReservaInstalacionDTO`, `IReservaGeneralDTO`: vistas consolidadas para historial de persona.
  - Requests/responses para actualizacion/cierre de detalles (`ActualizarReservaDetalleEquipoRequestDTO`, `DetalleReservaEquipoResponseDTO`, etc.).

### Maintenance
- `CategoriaMantenimientoEquipo` y `CategoriaMantenimientoInstalacion`.
- `MantenimientoEquipo`: descripcion, resultado, fecha proxima, `Reserva` y `Equipo`.
- `MantenimientoInstalacion`: similar, asociado a `Instalacion`.
- DTOs: `IMantenimientoEquipoDTO`, `IMantenimientoInstalacionDTO`, requests/response para actualizar y cerrar mantenimientos.

### Notification
- `NotificacionService`: envio SMTP.
- `NotificacionDiariaService`: recordatorios diarios de reservas abiertas por persona.

## Convenciones de API
- **Prefijo global**: todos los endpoints estan bajo `/v1/api`.
- **Envelope de respuesta** (`ApiResponseDto`):
  ```json
  {
    "message": "Texto descriptivo",
    "data": { ... | [ ... ] | null },
    "status": true
  }
  ```
  - Los endpoints custom (p.ej. horas disponibles) pueden devolver directamente DTO sin envelope cuando retornan listas simples (`ResponseEntity<List<...>>`).
- **Soft delete y estado**:
  - Campo `state` indica registro activo (true) o inactivo (false).
  - `DELETE` marca `state=false`, `deletedAt` lleno; `PUT {id}/cambiar-estado` actualiza estado sin borrar.
- **CRUD generico disponible para cada controlador que extiende `BaseController`**:
  | Metodo | Ruta base                         | Descripcion | Permiso requerido |
  |--------|-----------------------------------|-------------|-------------------|
  | GET    | `/v1/api/{recurso}`               | Lista activos (`service.findByStateTrue()`) | `{ENTIDAD}:CONSULTAR` |
  | GET    | `/v1/api/{recurso}/{id}`          | Obtiene registro por id | `{ENTIDAD}:CONSULTAR` |
  | POST   | `/v1/api/{recurso}`               | Crea nuevo registro | `{ENTIDAD}:CREAR` |
  | PUT    | `/v1/api/{recurso}/{id}`          | Actualiza registro (ignora campos auditoria, password) | `{ENTIDAD}:ACTUALIZAR` |
  | PUT    | `/v1/api/{recurso}/{id}/cambiar-estado` | Cambia estado booleano | `{ENTIDAD}:ACTUALIZAR` |
  | DELETE | `/v1/api/{recurso}/{id}`          | Soft delete | `{ENTIDAD}:ELIMINAR` |

  > Nota: el nombre de entidad configurado en cada controlador (ej. `super(service, "EQUIPO")`) define el prefijo del permiso.

- **Formato de fechas y horas**:
  - Fechas: `yyyy-MM-dd`.
  - Horas: `HH:mm:ss` (segun `@JsonFormat` y funciones de BD).

## Autenticacion y autorizacion
- **Login** `POST /v1/api/usuario/login`
  - Body (`LoginRequest`):
    ```json
    {
      "email": "usuario@corhuila.edu.co",
      "password": "secreto"
    }
    ```
  - Flujo: `AuthenticationManager` valida credenciales, `JwtUtil.generateToken` emite JWT con claims `auth`, `idUsuario`, `email`.
  - Respuesta:
    ```json
    {
      "token": "<jwt>",
      "email": "usuario@corhuila.edu.co",
      "idUsuario": 12,
      "roles": ["ADMIN"],
      "permisos": ["EQUIPO:CONSULTAR", "RESERVA:CREAR", "..."]
    }
    ```
  - Se envia cookie `token` (`HttpOnly`, `SameSite=None` en login, `secure=false` en dev).
- **Perfil autenticado** `GET /v1/api/usuario/me`
  - Requiere JWT valido (cookie o header).
  - Respuesta sin envelope: `idUsuario`, `email`, `roles`, `permisos`.
- **Logout** `POST /v1/api/usuario/logout`
  - Limpia cookie `token` (`maxAge=0`).
- **Proteccion de endpoints**:
  - `@PreAuthorize("@permissionEvaluator.hasPermission(authentication, this.entityName, 'ACCION')")`.
  - Desde frontend se debe incluir cookie (modo `credentials: include`) o header `Authorization: Bearer <token>`.
  - `state` de entidades y permisos se valida en builder de authorities (solo `PermisoRolEntidad` con `state=true` se agregan).

## Endpoints por modulo

### Usuario y permisos
- **Rutas base (CRUD generico)**:
  - `Persona` `/v1/api/persona` (entidad `PERSONA`).
  - `Usuario` `/v1/api/usuario` (`USUARIO`).
  - `Rol` `/v1/api/rol`.
  - `Permiso` `/v1/api/permiso`.
  - `Entidad` `/v1/api/entidad`.
  - `PermisoRolEntidad` `/v1/api/permiso-rol-entidad`.
- **Extras**:
  - `GET /v1/api/persona/persona-usuario?numeroIdentificacion=...`
    - Retorna lista de `IPersonaUsuarioDTO`.
    - Ejemplo respuesta:
      ```json
      {
        "message": "Datos obtenidos",
        "data": [
          {
            "idPersona": 5,
            "idUsuario": 3,
            "tipoDocumento": "CC",
            "numeroIdentificacion": "123456789",
            "nombres": "Victoria",
            "apellidos": "Martinez",
            "email": "vmartinez@corhuila.edu.co",
            "rol": "DOCENTE",
            "telefonoMovil": "3200000000",
            "estado": true
          }
        ],
        "status": true
      }
      ```
  - `GET /v1/api/permiso-rol-entidad/persona-permisos-rol-entidad?numeroIdentificacion=...`
    - Lista permisos efectivos por persona (proyeccion `IPermisoPorPersonaDTO`).
  - `GET /v1/api/permiso-rol-entidad/todos-permisos-rol-entidad`
    - Proyeccion `IPermisoRolEntidadDTO`, util para matrices de roles x entidad.
- **Reglas al crear usuarios**:
  - `UsuarioService.save` valida que la persona exista y no tenga usuario previo.
  - Password se guarda encriptado (BCrypt). En update, password solo se actualiza si viene en request.

### Ubicaciones (Site)
- Controladores con CRUD generico: `Continente`, `Pais`, `Departamento`, `Municipio`, `Campus`, `CategoriaInstalacion`.
- **Endpoint custom**:
  - `GET /v1/api/instalacion/instalacion-campus?nombreInstalacion=...&nombreCampus=...`
    - Filtra instalaciones y devuelve estructura jerarquica completa via `IInstalacionCampusDTO`.
    - Campos clave: ids y nombres de continente/pais/departamento/municipio/campus/instalacion, categoria, estados.

### Equipos
- CRUD generico para `CategoriaEquipo`, `TipoEquipo`, `Equipo`.
- **Consultas especificas**:
  - `GET /v1/api/equipo/equipo-instalacion?codigoEquipo=...&nombreInstalacion=...`
    - Filtros opcionales, respuesta lista `IEquipoInstalacionDTO` con estado de equipo, instalacion y campus.
  - `GET /v1/api/equipo/hoja-vida-equipo/{idEquipo}`
    - Respuesta `HojaDeVidaEquipoDTO`:
      ```json
      {
        "equipo": {
          "id": 7,
          "codigo": "EQ-0007",
          "nombre": "Osciloscopio",
          "descripcion": "Equipo de medicion X",
          "instalacion": "Laboratorio Electronica",
          "categoria": "Laboratorio"
        },
        "reservas": [
          {
            "fechaReserva": "2024-11-20",
            "horaInicio": "08:00:00",
            "horaFin": "10:00:00",
            "nombreReserva": "Practica circuitos",
            "nombrePersona": "Luis Rojas",
            "instalacionDestino": "Bloque B Aula 103"
          }
        ],
        "mantenimientos": [
          {
            "fechaProximaMantenimiento": "2024-12-15",
            "descripcion": "Calibracion general",
            "resultadoMantenimiento": "OK",
            "tipoMantenimiento": "Preventivo"
          }
        ],
        "estadoActual": "Operativo"
      }
      ```

### Reservas
- **CRUD base**: `Reserva`, `TipoReserva`, `DetalleReservaEquipo`, `DetalleReservaInstalacion`.
- **Calculo de disponibilidad**:
  - `GET /v1/api/reserva/horas-disponibles-instalacion?fecha=2024-11-21&idInstalacion=5&idDetalle=10`
  - `GET /v1/api/reserva/horas-disponibles-equipo?fecha=2024-11-21&idEquipo=3&idDetalle=15`
    - Retorna lista simple `[{"hora":"08:00:00"}, ...]` segun funciones nativas `horas_disponibles_*`.
    - Parametro `idDetalle` opcional para excluir la misma reserva en actualizaciones.
- **Historial consolidado**:
  - `GET /v1/api/reserva/reservas-mantenimientos?numeroIdentificacion=...`
    - Resultado: lista `IReservaGeneralDTO` con combinacion de reservas y mantenimientos (ambos detalles).
    - Campo `tipoAsociado` permite distinguir si el registro proviene de detalle equipo, instalacion o mantenimiento.
- **Gestion de detalles de reserva** (`DetalleReservaEquipoController` / `DetalleReservaInstalacionController`):
  - `PUT /v1/api/detalle-reserva-equipo/{idDetalle}/cerrar-detalle-reserva-equipo`
    - Body: `{ "entregaEquipo": "Equipo devuelto sin novedades" }`
    - Marca detalle y, si aplica, la reserva como cerrada (`state=false`).
  - `PUT /v1/api/detalle-reserva-equipo/{idDetalle}/actualizar-detalle-reserva-equipo`
    - Body (`ActualizarReservaDetalleEquipoRequestDTO`) con campos opcionales para reserva y detalle.
    - Valida solapamiento consultando disponibilidad antes de aplicar cambios.
    - Respuesta `DetalleReservaEquipoResponseDTO`.
  - `GET /v1/api/detalle-reserva-equipo/reservas-equipos?numeroIdentificacion=...`
    - Proyeccion `IReservaEquipoDTO`.
  - Para instalaciones existe la misma triada de endpoints (`cerrar`, `actualizar`, `reservas-instalaciones`).
- **Hooks de notificacion**:
  - `afterSave` en `DetalleReservaEquipoService` y `DetalleReservaInstalacionService` envia correo de confirmacion al usuario asociado a la reserva via `NotificacionService`.

### Mantenimientos
- **CRUD base**: `CategoriaMantenimientoEquipo`, `CategoriaMantenimientoInstalacion`, `MantenimientoEquipo`, `MantenimientoInstalacion`.
- **Acciones especificas**:
  - `PUT /v1/api/mantenimiento-equipo/{id}/cerrar-mantenimiento-equipo`
    - Body (`CerrarMantenimientoEquipoDTO`): `{ "fechaProximaMantenimiento": "2025-01-15", "resultadoMantenimiento": "Reemplazo de piezas" }`.
    - Respuesta `CerrarMantenimientoEquipoResponseDTO`, tambien marca reserva asociada como cerrada.
  - `PUT /v1/api/mantenimiento-equipo/{id}/actualizar-mantenimiento-equipo`
    - Body (`ActualizarMantenimientoEquipoRequestDTO`), valida disponibilidad igual que reservas.
    - Respuesta `MantenimientoEquipoResponseDTO`.
  - `GET /v1/api/mantenimiento-equipo/mantenimientos-equipos?numeroIdentificacion=...`
    - Lista `IMantenimientoEquipoDTO`.
  - Identicos endpoints para instalaciones (`cerrar-mantenimiento-instalacion`, `actualizar-mantenimiento-instalacion`, `mantenimientos-instalaciones`).
- **Notificaciones**:
  - `afterSave` en servicios de mantenimiento envia correo de confirmacion.

### Notificaciones programadas
- Aunque no hay endpoint publico, `NotificacionDiariaService.enviarNotificacionReservasAbiertas()` se ejecuta a diario:
  1. Consulta reservas activas del dia (`IReservaRepository.findByFechaReservaAndStateTrue`).
  2. Agrupa por persona y envia correo con resumen de reservas pendientes.
  3. Usa direccion remitente `jszambrano@corhuila.edu.co`.

## Flujos de negocio clave
1. **Reserva de equipo**:
   1. Front consulta `GET /reserva/horas-disponibles-equipo`.
   2. Crea `Reserva` via `POST /reserva`.
   3. Crea vinculo especifico `POST /detalle-reserva-equipo` con equipo y programa.
   4. Usuario recibe correo de confirmacion.
   5. Al terminar, operador llama `PUT /detalle-reserva-equipo/{id}/cerrar...` para marcar devolucion; si todos los detalles se cierran, `Reserva` pasa a `state=false`.
2. **Reserva de instalacion para mantenimiento**:
   - Igual flujo pero usando `DetalleReservaInstalacion`.
   - Si se decide convertir a mantenimiento, se crea `MantenimientoEquipo` o `MantenimientoInstalacion` apuntando a la misma reserva (1:1). Al cerrarlo se programan proximas fechas.
3. **Permisos dinamicos**:
   - Administrador usa CRUD de `Permiso`, `Entidad`, `Rol`, `PermisoRolEntidad` para ajustar capacidades.
   - `CustomUserDetailsService` carga `ROLE_{rol}` y `ENTIDAD:PERMISO` (solo `state=true`).
   - Front revisa arreglo `roles` y `permisos` devuelto en login o `/me` para habilitar UI.
4. **Hoja de vida de equipo**:
   - Front solicita `GET /equipo/hoja-vida-equipo/{id}` para mostrar ficha con historial de prestamo y mantenimiento; la logica combina queries custom en repositorios de detalle y mantenimiento (`findHistorialReservasByEquipo`, `findHistorialMantenimientosByEquipo`).
5. **Recordatorios**:
   - Cron nocturno envia correo a cada persona con reservas abiertas el mismo dia; front puede complementar mostrando banner si hay reservas `state=true`.

## Consideraciones para frontend
- Siempre manejar `status` en `ApiResponseDto`. Una respuesta 200 con `status=false` implica error de negocio.
- Para endpoints que devuelven listas simples (sin envelope) verificar tipo esperado (p.ej. `HoraDisponibleDTO`).
- Incluir `credentials: 'include'` al hacer fetch para reutilizar cookie `token`. Alternativamente mandar header `Authorization`.
- Verificar permisos antes de mostrar acciones:
  - `CREAR` para mostrar formularios de alta.
  - `ACTUALIZAR` para botones de editar/cambiar estado/cierre.
  - `ELIMINAR` para soft delete.
  - `CONSULTAR` para listar.
- Manejar `state`:
  - Listas base (`GET /recurso`) solo traen activos (`findByStateTrue`). Para ver historicos usar endpoints custom (reservas-mantenimientos, hoja de vida) o extender API.
- Validar campos horarios en front (horas en bloques de 1h) para evitar errores de solapamiento que el backend detecta.
- Cuando se actualiza reserva o mantenimiento, backend valida disponibilidad generando `List<LocalTime>`; se recomienda replicar logica de preview en UI utilizando endpoints `horas-disponibles-*`.
- Gestion de palabras clave de permisos dinamicos (ejemplos):
  - `RESERVA:CREAR`, `DETALLE_RESERVA_EQUIPO:ACTUALIZAR`, `MANTENIMIENTO_EQUIPO:ACTUALIZAR`, `USUARIO:ELIMINAR`.
- Configurar swagger (via cookie) para pruebas: `Authorization` -> `Bearer <token>`.

## Puntos de extension y riesgos
- **Funciones nativas** `horas_disponibles_instalacion/equipo` deben existir en BD. Para ambientes nuevos documentar scripts de creacion.
- **Envio de correo**: credenciales Gmail en properties; para produccion migrar a variables de entorno y `secure=true`.
- **AuditoriaListener** espera que `Authentication.getDetails()` sea `Long idUsuario`; el JWT filter coloca este valor via `authToken.setDetails(idUsuario)`.
- **Mantenimiento de JWT**: la cookie expira a 1 hora (valor por defecto). Ajustar `jwt.expiration-ms`.
- **Soft delete**: no hay endpoints para listar registros `state=false`; si se requieren, crear endpoints admin con repositorios personalizados.
- **Programacion @Scheduled**: habilitar `@EnableScheduling` (asegurarse que este en configuracion principal o activar) al desplegar.

## Referencias rapidas de rutas

| Modulo | Recurso base | Endpoint custom clave |
|--------|--------------|-----------------------|
| Usuario | `/v1/api/usuario` | `/login`, `/me`, `/logout` |
| Persona | `/v1/api/persona` | `/persona-usuario` |
| Permisos | `/v1/api/permiso-rol-entidad` | `/persona-permisos-rol-entidad`, `/todos-permisos-rol-entidad` |
| Ubicaciones | `/v1/api/instalacion` | `/instalacion-campus` |
| Equipos | `/v1/api/equipo` | `/equipo-instalacion`, `/hoja-vida-equipo/{id}` |
| Reservas | `/v1/api/reserva` | `/horas-disponibles-*`, `/reservas-mantenimientos` |
| Detalle reserva equipo | `/v1/api/detalle-reserva-equipo` | `/cerrar-detalle-reserva-equipo`, `/actualizar-detalle-reserva-equipo`, `/reservas-equipos` |
| Detalle reserva instalacion | `/v1/api/detalle-reserva-instalacion` | `/cerrar-detalle-reserva-instalacion`, `/actualizar-detalle-reserva`, `/reservas-instalaciones` |
| Mantenimiento equipo | `/v1/api/mantenimiento-equipo` | `/cerrar-mantenimiento-equipo`, `/actualizar-mantenimiento-equipo`, `/mantenimientos-equipos` |
| Mantenimiento instalacion | `/v1/api/mantenimiento-instalacion` | `/cerrar-mantenimiento-instalacion`, `/actualizar-mantenimiento-instalacion`, `/mantenimientos-instalaciones` |

---

Este documento sirve como referencia integral para el equipo frontend: resume arquitectura, contratos REST y flujos de negocio vigentes, habilitando el consumo consistente de la API y planificacion de nuevas funcionalidades.
