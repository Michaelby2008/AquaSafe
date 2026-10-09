# AquaSave

Plataforma web para reportar y gestionar fugas de agua potable con participación ciudadana.
Proyecto integrador full stack: Centro Educativo Técnico Laboral Kinal, Taller, 5to Perito Informática.
Autor: Michael Yohardi Aquino Arqueta (carné 2025436).

## Funcionalidades

**Ciudadano**
- Registro e inicio de sesión.
- Crear reportes de fugas con zona, tipo, gravedad, dirección, ubicación (opcional) y hasta 3 fotos.
- Ver, buscar, filtrar y paginar sus reportes; editar o eliminar los que siguen pendientes.
- Consultar el historial de estados y la cuadrilla asignada de cada reporte.
- Dashboard con el resumen de sus reportes y perfil editable.

**Administrador**
- Ve todos los reportes y un dashboard general (totales, urgentes, tiempo promedio de resolución, cuadrillas disponibles).
- Proceso principal en el detalle del reporte: asignar una cuadrilla y cambiar el estado (pendiente → en revisión → asignado → en reparación → resuelto, o rechazado con motivo).
- Administración de zonas, tipos de fuga y cuadrillas (crear, editar, eliminar).
- Administración de usuarios: cambiar rol y activar o desactivar el acceso.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 + TypeScript (pnpm), Vitest para las pruebas |
| Backend | Node.js + Express + TypeScript |
| Base de datos | MySQL 8 (elegida por su amplio soporte en hosting y su integridad referencial) |
| Autenticación | JWT, contraseñas con bcrypt |

## Estructura

```
backend/   API REST (src, db/schema.sql, db/seed.ts, tests)
frontend/  Aplicación Angular (core, shared, layout, features)
docs/      Manual de usuario, documentación técnica, plan de pruebas, evidencias y colección de Postman
```

## Requisitos

Node.js 20 o superior, MySQL 8, npm y pnpm.

## Instalación y ejecución

El proyecto se ejecuta en local: primero el backend y luego el frontend.

### Backend
```bash
cd backend
npm install
copy .env.example .env     # en Linux/Mac: cp .env.example .env
```
Completa el `.env` con tus valores (ver variables abajo) y luego:
```bash
npm run db:init   # crea la base de datos y las tablas desde cero
npm run seed      # usuarios, zonas, tipos de fuga y cuadrillas de demostración
npm run dev       # API en http://localhost:3000  (prueba: /health)
npm test          # pruebas automatizadas del backend
```

### Frontend
```bash
cd frontend
pnpm install
pnpm start        # http://localhost:4200
pnpm test         # pruebas automatizadas del frontend
pnpm build        # compilación de producción
```
La URL de la API se configura en `frontend/src/environments/` (en desarrollo apunta a `http://localhost:3000`).

## Variables de entorno (backend/.env)

| Variable | Descripción |
|---|---|
| PORT | Puerto de la API (3000) |
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Conexión a MySQL |
| JWT_SECRET | Clave para firmar los tokens (larga y aleatoria) |
| JWT_EXPIRES_IN | Duración del token (2h) |
| CORS_ORIGIN | Origen permitido del frontend (http://localhost:4200) |

El archivo `.env` nunca se sube a Git; se incluye `.env.example` sin valores reales.

## Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@aquasave.test | Demo1234! |
| Ciudadano | ciudadano@aquasave.test | Demo1234! |

## Pantallas principales

| Ruta | Quién | Descripción |
|---|---|---|
| `/login`, `/registro` | Visitante | Acceso y creación de cuenta |
| `/dashboard` | Todos | Resumen de reportes |
| `/reportes`, `/reportes/nuevo`, `/reportes/:id`, `/reportes/:id/editar` | Todos | Gestión de reportes; el panel de asignación y estado aparece solo al administrador |
| `/perfil` | Todos | Datos personales |
| `/admin/zonas`, `/admin/tipos-fuga`, `/admin/cuadrillas`, `/admin/usuarios` | Administrador | Administración |

## Despliegue

El proyecto se presenta y ejecuta en una máquina local, siguiendo los pasos de instalación de arriba. No hay despliegue en un servidor externo.

## Documentación

- Documentación técnica y de análisis (ER, diccionario de datos, endpoints, paleta): carpeta `docs/`.
- Manual de usuario: carpeta `docs/`.
- Plan de pruebas y evidencias: `docs/plan-de-pruebas.md` y `docs/evidencias/`.
- API: `docs/AquaSafe.postman_collection.json`.

## Limitaciones conocidas

- Las fotos se guardan en el disco del servidor.
- Un usuario desactivado conserva su token hasta que expire (2 horas).
- No hay recuperación de contraseña ni notificaciones por correo.
- Los listados de zonas y cuadrillas que se usan en los formularios muestran hasta 50 registros.
- Al editar, un teléfono o una descripción que se deja vacío se guarda como texto vacío.