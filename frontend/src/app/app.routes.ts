import { Routes } from '@angular/router';
import { adminGuard, authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión | AquaSave',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    title: 'Crear cuenta | AquaSave',
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
  },
  {
    // Todo lo que requiere sesión vive dentro del shell (menú lateral y barra superior)
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Inicio | AquaSave',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'perfil',
        title: 'Mi perfil | AquaSave',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'reportes',
        title: 'Reportes | AquaSave',
        loadComponent: () => import('./features/reportes/reportes-lista/reportes-lista').then((m) => m.ReportesLista),
      },
      {
        path: 'reportes/nuevo',
        title: 'Nuevo reporte | AquaSave',
        loadComponent: () => import('./features/reportes/reporte-form/reporte-form').then((m) => m.ReporteForm),
      },
      {
        path: 'reportes/:id/editar',
        title: 'Editar reporte | AquaSave',
        loadComponent: () => import('./features/reportes/reporte-form/reporte-form').then((m) => m.ReporteForm),
      },
      {
        path: 'reportes/:id',
        title: 'Detalle del reporte | AquaSave',
        loadComponent: () => import('./features/reportes/reporte-detalle/reporte-detalle').then((m) => m.ReporteDetalle),
      },
      {
        // Un mismo componente para las cuatro pantallas; cada ruta indica cuál configuración usar.
        // Son rutas separadas a propósito: así Angular crea una instancia nueva al cambiar de pantalla.
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'zonas' },
          {
            path: 'zonas',
            title: 'Zonas | AquaSave',
            data: { crud: 'zonas' },
            loadComponent: () => import('./features/admin/admin-crud/admin-crud').then((m) => m.AdminCrud),
          },
          {
            path: 'tipos-fuga',
            title: 'Tipos de fuga | AquaSave',
            data: { crud: 'tipos-fuga' },
            loadComponent: () => import('./features/admin/admin-crud/admin-crud').then((m) => m.AdminCrud),
          },
          {
            path: 'cuadrillas',
            title: 'Cuadrillas | AquaSave',
            data: { crud: 'cuadrillas' },
            loadComponent: () => import('./features/admin/admin-crud/admin-crud').then((m) => m.AdminCrud),
          },
          {
            path: 'usuarios',
            title: 'Usuarios | AquaSave',
            data: { crud: 'usuarios' },
            loadComponent: () => import('./features/admin/admin-crud/admin-crud').then((m) => m.AdminCrud),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada | AquaSave',
    loadComponent: () => import('./shared/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
  },
];
